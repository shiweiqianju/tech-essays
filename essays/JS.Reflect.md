# JS Reflect

## 零、参考资料
- https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect
- https://juejin.cn/post/7523112544564215827

## 一、核心概念
官方解释是 ES6 新增的一个"内置操作 API 集"，一个"工具类"，它把 JavaScript 引擎内部对对象执行的各种默认操作统一成了一套方法。通常与 Proxy 配套使用。

一些需要知道的背景知识：
JS 通常运行在 浏览器 / Node 等环境中，我们在语法层面上编写写的 JS 代码通常要经过引擎编译才能成为机器能理解的机器码并执行，这个编译过程对我们来说就相当于是一个黑盒过程。当然在本篇中我们不深究整个编译过程，只是粗浅的了解一下 Reflect 的作用阶段，从而更好的理解 Reflect 是什么

拿以下代码来说：
```js
const obj = { a: 1 };

obj.a; // 语法层面的代码
```
```obj.a``` 这一句中我们可以读取 obj 对象中 a 属性的值，从 JS 语法层面上只是一行代码(触发内部的 getter/setter)，但是对于引擎来说，可就不止一行了，用伪代码模拟一下，大概就是：
```js
function [[Get]]() {
  // some code

  // 读取 obj 对象中的 a 属性的值

  // some code

  // 返回读取到的值
}
```

Reflect 则是将 第二步 中对 obj 对象的操作单独抽象并暴露出来的 API，换句话说：
1. Reflect 是接近底层的 API，语法层面的代码背后也是通过 Reflect 来实现的
2. 使用 Reflect，可以绕过引擎实现的一些过程，即上面模拟代码中的两个 some code 阶段

当然，Reflect 的实际定义不止于此，具体可以查阅相关资料

## 二、实用场景
### 统一对象操作方法
将分散的操作符（如delete、in）和Object的方法统一到Reflect中
```js
// 传统方式 vs Reflect方式

// 删除属性
delete obj.name; // 传统方式，无返回值
Reflect.deleteProperty(obj, 'name'); // Reflect方式，返回布尔值

// 检查属性
'name' in obj; // 传统方式
Reflect.has(obj, 'name'); // Reflect方式
```

### 更合理、安全的返回值
Reflect 方法返回布尔值而不是抛出异常，使错误处理更优雅：
```js
// 传统方式可能抛出异常
try {
  Object.defineProperty(obj, 'name', { value: 'Alice' });
} catch (e) {
  console.error('定义属性失败');
}

// Reflect方式更安全
const success = Reflect.defineProperty(obj, 'name', { value: 'Alice' });

if (!success) {
  console.error('定义属性失败');
}
```

### 元编程能力
提供了强大的元编程能力，可以在运行时检查和修改程序结构：
```js
// 动态调用构造函数
function createInstance(Constructor, args) {
  return Reflect.construct(Constructor, args);
}

class Person {
  constructor(name) {
    this.name = name;
  }
}

const p = createInstance(Person, ['Alice']);
console.log(p.name); // "Alice"
```

### 与 Proxy 配合，规避 Proxy 使用时的一些问题
> 换句话说，确保代码的运行过程中一直拿到符合期待的值
首先看一下下面的代码
```js
// with Proxy code 1

// original obj
const obj = {
  a: 1,
  get value() {
    console.log(this === obj); // true
    console.log(this === proxyObj); // false

    return this.a;
  }
};

// proxy handler
const handler = {
  get: function(obj, prop, receiver) {
    // console.log(this === handler); // true
    return obj[prop];
  },
}

const proxyObj = new Proxy(obj, handler);

proxyObj.value; // 1
```
这段代码中的 value 的值和预期值是一致的，但是 this 的指向存在问题(按理，应该首先指向 proxyObj，接着再运行 handler，去取 obj 中的 a 属性)，又如下面这段代码

```js
// with Proxy code 2

// original obj
const parent = {
  a: 1,
  get value() {
    console.log(this === child); // false

    return this.a;
  }
};

// proxy handler
const handler = {
  get: function(obj, prop, receiver) {
    // console.log(this === handler); // true
    return obj[prop];
  },
}

const proxyObj = new Proxy(parent, handler);
const child = Object.setPrototypeOf({ a: 2 }, proxyObj); // 把 child 的原型链修改至 proxyObj 上

child.value; // 1，期待值是 2
```

这下最终的 value 的值也出问题了。如何修改，使用 Reflect API：
```js
// with Proxy & Reflect code 3

// original obj
const parent = {
  a: 1,
  get value() {
    console.log(this === child); // true

    return this.a;
  }
};

// proxy handler
const handler = {
  get: function(obj, prop, receiver) {
    // console.log(obj);
    this instanceof

    return Reflect.get(obj, prop, receiver);  // 针对性改造
    // return obj[prop];
  },
}

const proxyObj = new Proxy(parent, handler);
const child = Object.setPrototypeOf({ a: 2 }, proxyObj); // 把 child 的原型链修改至 proxyObj 上

child.value; // 2
```

这里就通过 ```receiver``` 修正了 ```this``` 的指向

```receiver```，其实有点执行上下文的意思在里面，既不一定指代理对象，也不一定指原对象。通俗的来讲，就是在运行的时候，**谁来调用的，就指向谁**，比如上例子中，在运行 ```child.value``` 时，```receiver``` 就指向 ```child```，而运行 ```proxyObj.value``` 时候，```receiver``` 就指向 ```proxyObj```，所以如果打印对应的 this 的话:
```js
const parent = {
  a: 1,
  get value() {
    console.log(this);

    return this.a;
  }
};

// proxy handler
const handler = {
  get: function(obj, prop, receiver) {
    return Reflect.get(obj, prop, receiver);
  },
}

const proxyObj = new Proxy(parent, handler);
const child = Object.setPrototypeOf({ a: 2 }, proxyObj); 

child.value;
proxyObj.value;
parent.value;

// [Log] 记录
// { a: 2 } - 即新定义的 { a: 2 }
// Proxy(Object) { a: 1 } - 即 proxyObj
// { a: 1 } - 即 parent
```
> 需要注意的是，在代码中，receiver 只能作为参数进行传递，甚至于用 console.log 也无法将其打印出来
 