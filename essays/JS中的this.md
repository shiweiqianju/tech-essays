# JS 中的 this

## 零、核心规则
* <font color=red>ES 5 标准下，函数中 this 到底取何值，是在函数真正被调用执行的时候确定的，而不是在函数被定义的时候</font>
* <font color=red>ES 6 标准下，箭头函数捕获定义函数时所处环境的 this 作为自己的 this</font>

## 一般函数中 this 的指向规则
### 一、构造函数
构造函数，其实就是 用来 ```new``` 对象的函数（首字母大写的那个函数）。例如 ```Object```、```Array```、```Function```等。当然，并非所有的函数都要用来作为构造函数
```js
function Foo() {
  this.name = 'ADS';
  this.year = 1998;

  console.log(this);
}
 
var f1 = new Foo();
 
console.log(f1.name);
console.log(f1.year);

// 打印结果 - 按顺序：
// Foo {name:"ADS",year:1998}
// ADS
// 1998
```
以上代码中，如果函数是作为构造函数来使用的话，那么 this 就指向这个即将 new 出来的对象（即 f1）

需要注意的是，如果不是按照上面的例子使用 new Foo() ，而是直接调用 Foo() ，this 将指向 Window 对象
```js
function Foo() {
  this.name = 'ADS';
  this.year = 1998;

  console.log(this);
}
 
Foo();
 
// Window {...}
```

### 二、函数作为对象的一个属性
如果函数作为对象的一个属性时，并且作为对象的一个属性被调用时，函数中的 this 指向该对象。

```js
var obj = {
  x: 10,
  fn: function() {
    console.log(this);
    console.log(this.x);
  }
}
 
obj.fn();
 
// object { x:10, fn:() }
// 10
```

需要注意的是：
1. 如果 ```fn``` 按照 es6 的箭头函数的写法，最终会打印出 Window 对象
2. 如果 ```fn``` 函数不作为 obj 的属性被调用，最终也会打印出 Window 对象。见下例：
```js
var obj = {
  x: 10,
  fn: function() {
    console.log(this);
    console.log(this.x);
  }
}
 
var f1 = obj.fn;
f1();
 
// Window {...}
// undefined
```

### 三、函数用 call 或者 apply 调用
当一个函数被call和apply调用时，this 的值就取传入的对象的值(call 和 apply 两个方法，是每一个函数都包含的、非继承的，作用是在特定的作用域中调用函数，等于设置函数体内 this 的指向，以扩充函数赖以运行的作用域。)
```js
var obj = {
  x: 10
}
 
var fn =  function() {
  console.log(this);
  console.log(this.x);
}
 
fn.call(obj);
 
// object { x: 10 }
// 10
```

### 四、全局 & 调用普通函数
1. 在全局环境中，this 永远指向 window
2. 在普通函数调用时，其中的 this 也指向 window。如下例：
```js
var x = 10;
var fn = function() {
    console.log(this);
    console.log(this.x);
}
fn();
 
// window { ... }
// 10
```

另外，如果在对象内部定义了一个属性，该属性对应一个函数，在这个函数内又定义了一个函数，那么内部的 this 也是指向 Window 的

```js
var obj = {
  x: 10,
  fn: function() {
    function f() {
      console.log(this);
    }

    f();
  }
}
 
obj.fn();
 
// window { ... }
```

## 总结： 
只有在 new Foo() 、作为对象属性直接调用、函数使用 call 或者 apply 时，this 会指向想让其指向的对象，其他情况均指向 Window 对象

## ES 6 箭头函数的 this
### 一、在其他函数内部函数形式调用
```js
// arrow function
function Person() {
  this.age = 0;

  setTimeout(() => {
    console.log(this)
  });
}

let p = new Person();

// Person { age: 0 }
```

```js
// normal function
function Person() {
  this.age = 0;

  setTimeout(function () {
    console.log(this)
  });
}

let p = new Person();

// Window {...}
```

### 二、以某一个对象的属性的形式被调用
```js
var obj = {
  i: 10,
  b: () => console.log(this.i, this),
  c: function() {
    console.log(this.i, this)
  }
}

obj.b();  // undefined window{...}
obj.c();  // 10 Object {...}
```

### 三、与 call/apply/bind 的结合
* call/apply/bind 的使用，不会影响到箭头函数的捕获规则，即这三个队使用对箭头函数没影响
