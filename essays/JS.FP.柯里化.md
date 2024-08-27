# JS 函数的柯里化(Currying)

## 零、参考资料
* [详解JS函数柯里化](https://www.jianshu.com/p/2975c25e4d71)
* [函数式编的JS: curry](https://zhuanlan.zhihu.com/p/36643937)

## 一、基础概念
维基百科上说道：柯里化，英语：```Currying```(果然是满满的英译中的既视感)，是把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）的函数，并且返回接受余下的参数而且返回结果的新函数的技术

举例：
```js
// 普通的add函数
function multiply(x, y) {
  return x * y
}
 
// Currying 前的调用
multiply(3, 4)      // 12
multiply(3, 5)      // 15
multiply(3, 6)      // 16
 
// 经过 Currying(伪) 后
function multiply(x) {
  return function(y) {
    return x * y
  }
}
 
multiply(3)(4) // 12
```

实际上就是把 ```add```函数的 ```x```，```y```两个参数变成了先用一个函数接收 ```x``` 然后返回一个函数去处理 ```y``` 参数。现在思路应该就比较清晰了，就是只传递给函数一部分参数来调用它，让它返回一个函数去处理剩下的参数

## 二、优点
这里的优点以及代码基本搬运自资料 1 中内容

1. 参数复用
```js
// 正则验证字符串 reg.test(txt);
// 很符合我们写业务代码的习惯
function check(reg, txt) {
  return reg.test(txt);
}
 
check(/\d+/g, 'test')       //false
check(/[a-z]+/g, 'test')    //true

// curry 后
function curringCheck(reg) {
  return function(txt) {
    return reg.test(txt)
  }
}
 
// 中间函数， 预先设定规则
var hasNumber = curryingCheck(/\d+/g)
var hasLetter = curryingCheck(/[a-z]+/g)
 
// 这样，想做哪种检测，直接调用中间函数即可，不需要每次都传入规则
hasNumber('test1')      // true
hasNumber('testtest')   // false
hasLetter('21212')      // false
 
// es 6 的简便写法, 这里先用稍微用下下面的内容
// 其中， fn 是待 Currying 的函数， curry 是工具函数
let curry = (fn) => (fArg) => (sArg) => fn(fArg, sArg);
```

2. 提前确认（这一条更多的是用到了闭包）
```js
// 原代码
var on = function(element, event, handler) {
  if (document.addEventListener) {
    if (element && event && handler) {
      element.addEventListener(event, handler, false);
    }
  } else {
    if (element && event && handler) {
      element.attachEvent('on' + event, handler);
    }
  }
}
 
// 自执行函数形成闭包
var on = (function () {
  if (document.addEventListener) {
    return function(element, event, handler) {
      if (element && event && handler) {
        element.addEventListener(event, handler, false);
      }
    }
  } else {
    return function(element, event, handler) {
      if (element && event && handler) {
        element.attachEvent('on' + event, handler);
      }
    }
  }
})();
 
// 换一种写法可能比较好理解一点，上面就是把isSupport这个参数给先确定下来了
var on = function(isSupport, element, event, handler) {
  isSupport = isSupport || documnet.addEventListener;

  if (isSupport) {
    return element.addEventListener(event, handler, false);
  } else {
    return element.attachEvent('on' + event, handler);
  }
}
```

3. 延迟运行(感觉也是闭包啊)
```js
Function.prototype.bind = function(context) {
  var _this = this;
  var args = Array.prototype.slice.call(arguments, 1);

  return function() {
    return _this.apply(context, args)
  }
}
```

## 三、统一封装
1. 单层
```js
var currying = function(fn) {
  // 获取第一个方法内的全部参数
  var args = Array.prototype.slice.call(arguments, 1);

  return function() {
    // 将后面方法里的全部参数和 args 拼起来
    var newArgs = args.concat(Array.prototype.slice.call(arguments));

    return fn.apply(this, newArgs);
  }
}
```

2. 多层（递归，适合 fn(.)(.)(.)(.)... 的形式）
```js
/**
 * 三(多)层写法核心思路是一致的
 */

// 写法 1, 支持多参数传递
function currying(fn, args) {
  var _this = this;
  var len = fn.length;
  var args = args || [];
 
  return function() {
    var _args = Array.prototype.slice.call(arguments);

    Array.prototype.push.apply(args, _args);

    // 如果参数个数小于最初的fn.length，则递归调用，继续收集参数
    if (_args.length < len) {
        return currying.call(_this, fn, _args);
    }

    return fn.apply(this, _args);
  }
}
 
// 写法 2
let currying = (fn, type = []) => {
  let len = fn.length;

  return function(...args) {
    let concatValue = [...type, ...args];

    if (concatValue.length < len) {
        return currying(fn, concatValue);
    } else {
        return fn(...concatValue);
    }
  }
}
 
// 写法 3
// 多了层匿名函数， 用来搜集传入的参数
let curry = fn => {
  let len = fn.length;

  return function curriedFn(...args) {
    if (args.length < len) {
      return function () {
        return curriedFn.apply(null, args.concat([].slice.call(arguments)));
      }
    }

    return fn.apply(null, args);
  }
}
```

## 四、缺陷
主要在性能上：

1. 由于使用了闭包， 闭包该有的问题一个不落地全部继承；
2. （如果有） 存取 ```arguments``` 对象通常要比存取命名参数要慢一点；
3. （如果有） 一些老版本的浏览器在 ```arguments.length``` 的实现上是相当地慢；
4. （如果有） 使用 ```fn.apply(...)``` 和 ```fn.call(...)``` 通常比直接调用 ```fn (...)``` 稍微慢一点；

不过相对于频繁的 ```DOM``` 操作， ```currying``` 带来的性能消耗可以忽略不计

## 五、拓展与总结
```currying``` 函数在设计上第一次调用必须传入一个函数，这是它的使用原则

另外，如果原函数的参数 > 2 （```fn(x, y, z, m, n, ...) ```）的话，多层写法中的 2 & 3 是支持 ```curry(fn)(x)(y, z)(m)(n)(...)``` 这种写法的

下面这条题目作为拓展：
```js
// 实现一个add方法，使计算结果能够满足如下预期：
add(1)(2)(3) = 6;
add(1, 2, 3)(4) = 10;
add(1)(2)(3)(4)(5) = 15;
 
function add() {
  // 第一次执行时，定义一个数组专门用来存储所有的参数
  var _args = Array.prototype.slice.call(arguments);

  // 在内部声明一个函数，利用闭包的特性保存_args并收集所有的参数值
  var _adder = function() {
    _args.push(...arguments);

    return _adder;
  };
 
  // 利用toString隐式转换的特性，当最后执行时隐式转换，并计算最终的值返回
  _adder.toString = function () {
    return _args.reduce(function (a, b) {
      return a + b;
    });
  }
  return _adder;
}
 
add(1)(2)(3)                // 6
add(1, 2, 3)(4)             // 10
add(1)(2)(3)(4)(5)          // 15
add(2, 6)(1)                // 9
```
