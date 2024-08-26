# JS 中的函数式 - 常用概念

## 一、柯里化 - currying
柯里化的意思是将一个多元函数，转换成一个依次调用的单元函数，用表达式表示：```f(a,b,c) → f(a)(b)(c)```

#### 核心代码实现：
```js
export function curry(fn) {
  let len = fn.length; // 收集目标函数的参数个数(总)

  return function curriedFn(...params) {
    // 说明当前收集到的参数还没有达到目标函数需要接收到的，需要返回一个新的函数继续去收集
    if (params.length < len) {
      return function () {
        // 一个关键是下面这个 arguments 是属于当前这个匿名函数的
        // 另外一个关键是 params.concat(...), 这里其实应用了尾调用优化
        return curriedFn.apply(
          null,
          params.concat([].slice.call(arguments))
        )
      }
    }

    return fn.apply(null, params);
  }
}
```
理解难点在于 ```curriedFn``` 中的逻辑判断为何需要返回一个匿名函数(以 ```anonymousFn``` 来指代)

比如 ```sum(1, 2, 3)``` 这种函数，经过柯里化后并调用的形式是 ```curry(sum)(1)(2)(3)``` 这样:  
当然这种形式可以分解成四句：
```js
let curriedSum = curry(sum); // curriedSum 是一个函数
let tmpA = curriedSum(1); // tmpA 是一个函数
let tmpB = tmpA(2); // tmpB 是一个函数
let tmpC = tmpB(3); // tmpC 则是最终的运算结果，就是原函数 sum(1, 2, 3) 的运算结果，即不是一个函数
```

接下来逐句分析：
* 执行第一句，```curry``` 函数执行并形成闭包(暂时命名成 ```curry-[fn]```)，```len``` 记录为 ```3```，返回 ```curriedFn```，即 ```curriedSum```  就是 ```curriedFn```
* 执行第二句，其实执行的是 ```curriedFn(1)```，此时 ```params = [1]```，进入逻辑判断，```curriedFn``` 形成一层闭包(暂时命名成 ```curriedFn-[1]```)，返回匿名函数，即 ```tmpA``` 就是这个匿名函数
* 执行第三句，运行这个匿名函数，用伪代码表示如下，这句有两个关键点：
  ```js
  let tmpA = function () {
    return curriedFn.call(null, params.concat([].slice.call(arguments)))
  }

  tmpA(2);
  ```
  1. 首先是 ```arguments```，这个变量属于这个匿名函数，而在此时变量的值就是 ```[2]``` (传入的变量就是 ```2```，如果是 ```tmpA(2, 3)``` 这种，那么 ```arguments = [2, 3]```)
  2. 其次 ```params.concat([].slice.call(arguments))```，这个结合缓存的结果就是 ```[1].concat([2])```，即 ```[1, 2]``` ，然后将这个值作为参数进行递归 ```curriedFn([1, 2])```，所以说这里其实应用了尾递归优化
  3. 所以经过运算，最终 ```tmpB``` 也是那个匿名函数，而第二句中不是形成了一个 ```curriedFn-[1]``` 的闭包嘛，此时也被释放，而随着 ```curriedFn([1, 2])``` 的执行，形成一个新的闭包(暂时命名成 ```curriedFn-[1, 2]```)，在这个新的闭包中，```params = [1, 2]``` 
* 执行第四句，走的是 ```curriedFn``` 中 ```return fn.apply(null, params);``` 这句，得出最终的运算结果，这里就不详叙述

#### 其他
当然，柯里化的含义比较严格，只有 ```f(a,b,c) => f(a)(b)(c)``` 这样的形式才能叫真正的柯里化
而 ```f(a, b, c) => f(a)(b, c)``` 或者 ```f(a, b, c) => f(a, b)(c)``` 这种其实叫部分函数应用
即<strong>柯里化可以实现部分函数应用，但是柯里化不等于部分函数应用</strong>

#### 参考文档
* [彻底弄懂函数柯里化彻底弄懂函数柯里化](https://juejin.cn/post/6844903882208837645)

## 组合 - compose
组合指的是将多个函数组合成一个函数，这样一个函数的输出就可以作为另一个函数的输入，从而实现多个函数的链式调用

组合```compose```可以提高代码的可读性和可维护性，减少重复代码的出现，更加便捷的实现函数的复用

用表达式表示：```compose(f, g, t) => x => f(g(t(x)))```，进一步结合柯里化则是 ```compose(f)(g)(t) => x => f(g(t(x)))``` 
概念上，```compose``` 函数像是 ```curry``` 的逆运算，把多个函数链接起来依次调用，不用过于关注其中的执行过程，直接得到最终结果，这样最直观的好处是节省了一堆临时变量

#### 核心代码实现：
```js
// 普通版
export const compose = (...fns) =>
  (...args) => fns.reduceRight((val, fn) => fn.apply(null, [].concat(val)), args);

// 异步版 
export const compose = (...fns) =>
  (input) => fns.reduceRight((chain, fn) => chain.then(fn), Promise.resolve(input));

// 普通版支持链接后多参数入参，而异步版则只支持单参数(更符合函数式编程思想)
```

## 三、管道 - pipe
管道其实是组合的另外一个版本，组合是从右向左依次调用处理函数，使用的是 ```reduceRight```，而管道则是从左向右依次调用处理函数，使用的是 ```reduce``` 函数

## 四、实践经验
### 一、柯里化中把要操作的数据放到最后
从 柯里化 的代码中可以看出，除开需要柯里化的函数(简称目标函数)，最先输入(固定)的参数是变更次数最少的，所以这条的意义其实是按照变更频率从小到大的顺序来编写目标函数，如：
```js
// 推荐
const target = (x, str) => str.split(x);

// 不推荐
const target = (str, x) => str.split(x);
```

### 二、函数组合中函数要求单输入
函数组合有个使用要点，就是中间的函数一定是单输入的，这个很好理解，因为函数的输出都是单个的（数组也只是一个元素），同时，这也是最符合函数式编程思想的定义函数的方式  
即：传给 ```compose``` 函数的参数，最好是经过 ```curry``` 化的函数

### 三、函数组合的 Debug
```js
// debugger 函数，其中 x 是 reverse 这个函数的计算值
const trace = curry((tip, x) => { console.log(tip, x); return x; });

const fn = compose(toUpperCase, head, trace('after reverse'), reverse);
```

### 四、多多参考 Ramda.js
