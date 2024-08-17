# JS 中的 this

## 零、序言
* 本篇是《你不知道的 javascript（上）》读书笔记
* V1 版本写得比较乱，[传送门](./JS中的this.md)
* 注意：如无特殊标注，本篇中的 this 指的是 es5 & 非严格模式下的 this

## 一、总结
在 js 中， this 的值需要到<strong>函数的调用</strong>时才能明确，因此完全取决于函数的调用位置（执行 fn(...) 的时候）

## 二、绑定规则
### (一)、默认绑定
这种情况最简单最常用，函数作为独立函数被调用，函数体中的 this 指向 window。同时这条规则也是其他规则不适合时的默认规则

```js
function fn() {
  console.log(this.a);
}

var a = 'global';

fn();  //  global
```
注意，如果在 fn 函数体中使用了严格模式，那么 fn 中的 this 会被绑定成 undefined

```js
function fn() {
  'use strict';
  console.log(this); // undefined
}
```

### (二)、隐式绑定
“另一条需要考虑的规则是调用位置是否有上下文对象，或者说是否被某个对象拥有或者包含，不过这种说法可能会造成一些误导。”  
这条规则说穿了也很简单，就是当函数作为对象的一个属性，并被这个对象调用时，那么函数体中的 this 会指向这个对象
```js
// 正常的 demo
function foo() {
  console.log( this.a );
}
var obj = {
  a: 2,
  foo: foo
};

obj.foo(); // 2
```

接下来是一个特殊的例子：
```js
function foo() {
  console.log( this.a );
}
var obj = {
  a: 2,
  foo: foo
};

var bar = obj.foo; // 函数别名！
var a = "oops, global"; // a 是全局对象的属性

bar(); // "oops, global"
```

```var bar = obj.foo``` 这句，本质上是把函数```foo```的内存地址传递给变量```bar```，并不是真正地执行了函数```foo```，真正的函数执行时```bar()```这一句，因此，在正函数执行的时候，是以独立函数的规则运行的，所以这里实际上是走的默认绑定的规则  


因此，在所有的类似这种仅仅传递函数的内存地址而不是执行函数的场景，都要注意存在的隐式丢失的问题。同时列举常见的需要注意的场景：
* setTimeout( obj.foo, 100 );
* function func( fn ) { fn() }; func( obj.foo );

### (三)、显式绑定
相对于隐式绑定，显式绑定时我们可以自主操控的，这就给了大牛们提供了黑操作的控件。也叫硬绑定  

js 中原生绑定的形式只有三个， call/apply/bind，其中 bind 是在 es5 中新加入的函数  

除了我们自己使用上面的函数进行显式绑定，js 中的某些内置 api 也会实现显式绑定，例如 forEach:
```js
function fn(el) {
  console.log(el, this.id);
}
 
var obj = {
  id: 'awesome',
}
 
// 调用
[1, 2, 3].forEach(foo, obj);
// 1 awesome
// 2 awesome
// 3 awesome
```

### (四)、new 绑定
js 中 new 操作符的操作列在其下：
* 创建（或者说构造）一个全新的对象；
* 这个新对象会被执行 [[ Prototype ]] 链；
* 这个新对象会绑定到函数调用的 this；
* 如果函数没有返回其他对象，那么 new 表达式中的函数调用会自动返回这个新对象；


当然，真实的实现会更复杂，有兴趣的可自行查找资料。

## 三、注意事项
1. 显式绑定中， ```call/apply```绑定后会执行下函数，```bind```绑定后会返回一个新的函数，该函数内部的```this```会指向被绑定的对象
2. 一般而言，显式绑定（```call/apply/bind```）之后的```this```不能够再次被修改或者绑定（特殊情况见第 4 节）
3. ```new``` 和 ```apply/call``` 不可同时使用
4. ```new``` 和 ```bind``` 可以同时使用，bind 的源码在实现的时候会在内部判断有没有与 ```new``` 一起使用，如果是的话就会使用新创建的 ```this``` 替换硬绑定的 ```this```

## 四、例外
规则总有例外

### (一)、被忽略的 this
null(undefined) 作为一个特殊的 object，也是被允许使用在显式绑定中的。显式绑定在遇到这两个特殊的对象的时候，这些值的调用会被忽略，实际应用的是默认的绑定规则
```js
function foo(a,b) {
  console.log( a, b, this );
}
 
foo.apply( null, [2, 3] ); // 2 3 window
 
var bar = foo.bind(null, 2);
bar(3);  // 2 3 window
```

当然，使用 null 来忽略 ```this``` 的绑定也具有一定的副作用。如果某个函数确实使用了 ```this``` (比如第三方库中的一个函数)，那默认绑定规则会把 ```this``` 绑定到全局对象（```window``` 等，当然，严格模式下会指向 ```undefined```）， 这将导致不可预见的后果(比如修改全局对象)  
因此我们可以使用如下的代码来防止这个副作用
```js
function foo(a,b) {
  console.log(a, b, this);
}
// 我们自定义的空对象
var ø = Object.create( null );
 
foo.apply( ø, [2, 3] ); // 2, 3, {}
 
var bar = foo.bind( ø, 2 )
bar(3); // 2, 3, {}
```

### (二)、间接引用
```js
function foo() {
  console.log( this.a );
}
 
var a = 2;
var o = { a: 3, foo: foo };
var p = { a: 4 };

o.foo(); // 3
(p.foo = o.foo)(); // 2
```
放上这段代码的原因在于最后一句，一开始没懂，后来看了下执行过程，最后一句代码前半段是个赋值语句，整体等价于
```js
// 这是一句赋值语句，这个语句其实是有返回值的，返回值就是 = 号右边的值
// 所以这一句的结果(返回值)其实是一个(匿名)函数，在浏览器控制台打印一下就可以观察出来
p.foo = o.foo; 

(function foo() {
  console.log( this.a );
})(); // IIFE
```

### (三)、es 6 箭头函数
* 箭头函数不会创建自己的 ```this```，箭头函数不使用 ```this``` 的四种标准规则，而是根据外层（函数或全局）作用域来决定 this。
* 另外，箭头函数不能作为构造器，与 ```new``` 一起使用会抛出错误

## 五、其他研究资料
* [对阮一峰《ES6 入门》中箭头函数 this 描述的探究](https://juejin.cn/post/6844904133409914894)
