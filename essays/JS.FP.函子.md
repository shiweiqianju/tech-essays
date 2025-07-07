# JS 中的函数式 - 函子

## 零、参考资料
* [函数式编程入门教程](https://ruanyifeng.com/blog/2017/02/fp-tutorial.html)

## 一、基本概念
### 范畴
要明白函子的概念，我们得先了解下范畴这个概念，当然我们不必抽象到数学上的那种程度，只需要理解：范畴是一个集合，这个集合内的成员与成员之间存在着某种关系(箭头)，理论上我们可以通过一个成员计算出其他所有成员

### 与容器的关系
再简化一点，我们可以把范畴类比成一个容器，里面包含两个元素：
* 成员，或者值 value
* 值与值之间的关系，即箭头，如果放在代码中，即使我们的函数

以下面的代码为例：
```js
class Category {
  constructor(val) { 
    this.val = val; 
  }

  addOne(x) {
    return x + 1;
  }
}
```

其中 ```Category``` 是一个类，其中包含了一个值 ```this.value``` 和一种变形关系 ```addOne```，因此，```Category``` 这个类就可以说是一个容器，亦是一个范畴，下文中，所有'容器'均是'范畴'

### 函子
函子是函数式编程里面最重要的数据类型，也是基本的运算单位和功能单位。它首先是一种范畴，也就是说，是一个容器，包含了值和变形关系。比较特殊的是，它的变形关系可以依次作用于每一个值，将当前容器变形成另一个容器。 - 这是概念级别的意义

结合代码：
```js
class Functor {
  constructor(val) { 
    this.val = val; 
  }

  map(f) {
    return new Functor(f(this.val));
  }
}
```
这段代码中：```Functor``` 就是一个函子，也是容器，我们亦可以称之为一种数据结构，其具有一个**特定方法** ```map```，接收一个参数，即变形关系函数，调用这个方法后，返回一个新的函子，只不过这个新的函子里面存储的是经过变形计算后的新数据，于是**一般约定，函子的标志就是容器具有 ```map``` 方法。该方法将容器里面的每一个值，映射到另一个容器**

> **任何具有```map```方法的数据结构，都可以当作函子的实现**

函数式编程里面的运算，都是通过函子完成，即运算不直接针对值，而是针对这个值的容器----函子。所以，函数式编程，实际上就是学习函子的各种运算。由于可以把运算方法封装在函子里面，所以又衍生出各种不同类型的函子，有多少种运算，就有多少种函子。函数式编程就变成了运用不同的函子，解决实际问题。

### 函子的起点 - of 方法
上面的 ```Functor``` 函子，如果我们要使用的话，就会是：
```js
new Functor(123).map(...)
```
这样，因为 ```new```这样子的写法是面向对象的写法，不太符合函数式的风格，所以我们对 ```Functor``` 稍微扩展一下：
```js
class Functor {
  constructor(val) { 
    this.val = val; 
  }

  static of(val) {
    return new Functor(val);
  }

  map(f) {
    return new Functor(f(this.val));
  }
}
```

于是，我们就可以愉快地 FP 了： ```Functor.of(2).map(n => n + 2)```

## 二、FP 的一些基本函子
### Maybe 函子
函子接受各种函数，处理容器内部的值。这里就有一个问题，容器内部的值可能是一个空值（比如null），而外部函数未必有处理空值的机制，如果传入空值，很可能就会出错，比如：```Functor.of(null).map(str => str.toUpperCase())```，于是就诞生了 ```Maybe``` 函子，简单实现如下：

```js
class Maybe extends Functor {
  map(f) {
    return this.val ? Maybe.of(f(this.val)) : Maybe.of(null);
  }
}

Maybe.of(null).map(str => str.toUpperCase());
// Maybe(null);
```

### Either 函子
在面向对象的代码中，我们使用 ```if...else``` 来进行常见运算，而在函数式编程中，我们使用 ```Either``` 函子表达。  
内部有两个值：```Left & Right```。```Right``` 通常情况下为正常使用的值，```Left``` 则为 ```Right``` 不存在的时候使用的值。

```js
// 结构
class Either extends Functor {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }

  static of(left, right) {
    return new Either(left, right);
  }

  map(f) {
    return this.right ?
      Either.of(this.left, f(this.right)) :
      Either.of(f(this.left), this.right);
  }
}

// 用法
const addOne = function(x) { return x + 1 };

Either.of(5, 6).map(addOne); // Either(5, 7)
Either.of(1, null).map(addOne); // Either(2, null);
```

于是，其具体用法有：
* 提供默认值：
```js
Either.of(
  { address: 'xxx' }, // default will be used if don't provide currentUser.address 
  currentUser.address
).map(updateInfo)
```
* 代替 ```try...catch...```：在这种用法中，左值表示错误
```js
function parseJSON(json) {
  try {
    return Either.of(null, JSON.parse(json));
  } catch (err) {
    return Either.of(err, null);
  }
}
```

### AP 函子
ap，application 的缩写。凡是具有了 ```ap``` 方法的函子，就是 ```ap``` 函子  
那么何为 ```ap``` 函子？先看一段代码：
```js
function addTwo(x) { return x + 2 };

const A = Functor.of(2);
const B = Functor.of(addTwo);
```
在这段代码中，```A``` 函子的内部值是 ```2```，```B``` 函子的内部值是函数 ```addTwo```。此时，我们想让 ```B``` 函子内部的函数，可以使用 ```A``` 函子的内部值进行运算，就需要实现一个 ```ap``` 方法，于是：
```js
class AP extends Functor {
  ap(F) { // 注意，这里的入参是一个 函子
    return AP.of(this.val(F.val));
  }
}
```
于是，示例代码可以改写成：
```js
AP.of(addTwo).ap(Functor.of(2));
```

```AP``` 函子的意义在于，对于多参数的函数，就可以从多个容器中取值，实现函子的链式操作，比如:
```js
function add(x) {
  return function(y) {
    return x + y;
  }
}

AP.of(add).ap(Maybe.of(2)).ap(Maybe.of(3));

// 进一步可以写成
AP.of(add(2)).ap(Maybe.of(3));
```

### Monad 函子
函子是一个容器，可以包含任何值。函子之中再包含一个函子，也是完全合法的。但是，这样就会出现多层嵌套的函子，比如：
```js
Maybe.of(
  Maybe.of(
    Maybe.of({ name: 'Mulburry', number: 8402 })
  )
)
```
那么，如果想要取值，就需要经过三次 ```this.val```，如果嵌套结构继续复杂下去，那么取值会越来越麻烦。为了解决这个问题，就诞生了 ```Monad``` 函子，作用就是永远返回一个单层的函子，其实现了一个 ```flatMap``` 方法，与 ```map``` 方法相同，唯一的区别是如果生成了一个嵌套函子，它会取出后者内部的值，保证返回的永远是一个单层的容器，不会出现嵌套的情况，具体实现如下：
```js
class Monad extends Functor {
  join() {
    return this.val;
  }
  flatMap(f) {
    return this.map(f).join(); // 调用 join 保证返回值永远是一个单层的函子
  }
}
```

这个函子的最重要的应用，就是实现 I/O 操作。我们知道，I/O 是不纯的，普通函数式编程没法做，于是就需要通过 ```Monad``` 函子来完成，比如：
```js
const fs = require('fs');

const readFile = function(filename) {
  return new IO(function() {
    return fs.readFileSync(filename, 'utf-8');
  })
}

const print = function (x) {
  return new IO(function() {
    console.log(x);
    return x;
  })
}
```
在这段代码中，读取和打印本身都是不纯的操作，但是 ```readFile``` 和 ```print``` 却是纯函数，因为它们总是返回 ```IO``` 函子，而如果 ```IO``` 函子是一个 ```Monad```，具有 ```flatMap``` 方法，那么我们就可以这样调用这两个函数：```readFile('./user.txt').flatMap(print)```  
另外，由于 ```Monad``` 返回值也是一个函子，就能实现链式操作，因此，在大多数的库中，```flatMap``` 方法又叫 ```chain```
