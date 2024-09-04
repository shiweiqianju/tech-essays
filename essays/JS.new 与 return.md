# JS 中的 this

## 零、写在前面
* 默认情况下，函数的返回值是 ```undefined``` (即没有定义返回值)

## 一、new 操作符
js 中的 ```new``` 操作符，可以是我们像 java 一样，获得一个新的对象，例如：
```js
function Person() {
  this.heart = 'red';
}
 
let per = new Person();

console.log(per.heart);  // red
```
那么，在 ```new``` 的时候，内部发生了什么呢？

我们用伪代码模拟一下：
```js
// new Person():
{
  var obj = {};

  obj.__proto__ = Person.prototype;

  var result = Person.call(obj);

  return typeof result === 'object' ? result : obj;
}
```
* 创建一个空对象 ```obj```
* 设置 ```obj``` 的原型链：```obj -> Person.prototype -> Object.prototype -> null```
* 在 ```obj``` 的执行环境中调用(执行) ```Person``` 函数；（或者说改变 this 的指向）
* 考察第三步的返回值，无返回值或者返回一个非对象值，则将 ```obj``` 返回作为新的对象，否则将返回值作为新的对象返回

以上就是 ```new``` 操作符的运行机制简略版

## 二、与 return 的化学反应
在大致理解了 ```new``` 的运行机制之后，答案就呼之欲出了：
* 如果我们的构造函数 ```return``` 的是简单的基本数据类型(undefined、数字、字符串、布尔)，依旧能够正确 new 出想要的对象
* 如果构造函数 ```return``` 的是对象(包括基本数据类型的包装对象，如：```Object('OK')``` 等)，那么我们 ```new``` 的时候就得不到想的对象

下面贴一个实例：
```js
// 示例引自：https://www.jianshu.com/p/ed692646ee7c
function User( name, age){
  this.name = name;
  this.age = age;
 
  // return;                              // 返回 this
  // return null;                         // 返回 this
  // return this;                         // 返回 this
  // return false;                        // 返回 this
  // return 'hello world';                // 返回 this
  // return 2;                            // 返回 this
  
  // return [];                            // 返回 新建的 [], user.name = undefined
  // return function(){};                  // 返回 新建的 function，抛弃 this, user.name = undefined
  // return new Boolean( false);           // 返回 新建的 boolean，抛弃 this, user.name = undefined
  // return new String( 'hello world');    // 返回 新建的 string，抛弃 this, user.name = undefined
  // return new Number( 32);               // 返回 新的 number，抛弃 this, user.name = undefined
}
var user = new User("小白", 20);

console.log(user);
```
