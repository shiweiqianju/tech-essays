# JS call & apply & bind
## 零、写在前面
我们知道，每个函数在调用的时候会产生一个执行上下文环境，而这个执行上下文环境中包含了诸如 ```this``` 等等信息。即当我们调用函数的时候，内部的 ```this``` 已经明确地隐式绑定到了某一个对象上。如果我们希望更换 ```this``` 的指向，我们该如何更改？

```call/apply/bind``` 这三个函数能够满足我们的需要

demo:
```js
var common = 'common';
var name = 'global';
var obj = {
  name: 'obj'
}
 
function fn(params) {
  console.log(params + ' ' + this.name);
}
 
fn(common) // common global
fn.call(obj, common) // common obj
```
我们可以看到，通过 ```call()```，函数内部的 ```this``` 指向了 ```obj``` 对象

## 一、call/apply/bind
### call & apply
```js
// 素材函数
var func = function(arg1, arg2) { };
```

具体如下：
```js
func.call(yourObj, arg1, arg2);
func.apply(yourObj, [arg1, arg2]);
```
所以我们可以看出，```apply``` 和 ```call``` 在功能上完全一致，仅仅是传参方式不一致，这样的好处是在传参个数不一定时，可以使用 ```apply```。比如：
```js
function log(){
  console.log.apply(console, arguments);
};
log(1);    //1
log(1, 2);    //1 2
```

当然，在使用 ```call/apply``` 的时候，语句是立即执行的

### bind
```func.bind(yourObj, xxx, xxx)``` 执行之后会返回一个新函数，是 ```func``` 函数的副本，不同的是新函数内部 ```this``` 永远指向 ```yourObj```，当然这意味着在调用 ```bind``` 完成绑定之后，需要手动执行一下这个新函数

其它用法/功能大致与 ```call``` 一致，不过在参数传递上有些许不一致：
```js
function fn(a, b, c) {
  console.log(a, b, c);
}
var newFn = fn.bind(null, 'Dot');
 
fn('A', 'B', 'C');            // A B C
newFn('A', 'B', 'C');           // Dot A B
newFn('B', 'C');              // Dot B C
```
可以看到，我们在 ```bind()``` 的时候传入了一个参数，新方法的实参都是在 ```bind``` 中参数的基础上在往后排

## 二、手动实现 call / apply / bind
> 2019-05-16 更新
### call 的实现
```js
Function.prototype.myCall = function(context = window) { // context, 上下文环境，其实就是传进来的作用域(对象)
  // 1. this 的指向
  //   我们是通过 fun.call(...) 这种形式调用 call 函数，即点调用，故 call 内部的 this 将指向 fun 这个目标函数；
  // 2. context.fn
  //   因为 context 就是我们传进来的作用域对象，而 context.fn 其实就是在 context 上添加一个 fn 属性；
  // 3. 故这句话完成的任务是：
  //   在 context 对象上添加一个函数，这个函数就是我们的目标函数
  context.fn = this;

  let args = [...arguments].slice(1);
  let result = context.fn(...args);
  // 删除 context 手动添加的目标函数，必须
  delete context.fn;

  return result;
}
```

### apply 的实现
这个的实现和 ```myCall``` 没啥其他区别，多了参数处理这一步
```js
Function.prototype.myApply = function(context = window) {
  context.fn = this;

  let args = arguments[1];
  let result = args ? context.fn(...args) : context.fn();

  delete context.fn;

  return result;
}
```

### bind 的实现：
这里面需要注意的是 ```bind()``` 返回值是一个函数，并且这个函数的内部 ```this``` 指向永久改变。另外，因为返回值是函数，故这个函数可以被当成构造函数，如果是构造函数的话，```this``` 应该指向构造出来的实例
```js
Function.prototype.myBind = function(context) {
  if (typeof this !== 'function') {
    throw new TypeError('Error')
  }

  let _this = this;
  let args = [...arguments].slice(1);

  return function F() {
    // 判断是否被当做构造函数使用
    if (this instanceof F) {
      return _this.apply(this, args.concat([...arguments]))
    }
  
    return _this.apply(context, args.concat([...arguments]))
  }
}
```
