# JS 一道关于 函数、变量 的面试题
## 零、参考资料
* [记录一个面试题目](https://www.cnblogs.com/shapeY/p/10400763.html)
* [一道常被人轻视的前端JS面试题](https://www.cnblogs.com/xxcanghai/p/5189353.html)

## 题目与答案
### 题目
```js
function Foo() {
  getName = function () { alert(1); };

  return this;
}
Foo.getName = function () { alert(2); };
Foo.prototype.getName = function () { alert(3); };
var getName = function () { alert(4); };
function getName() { alert(5); };
 
//请写出以下输出结果：
Foo.getName();
getName();
Foo().getName();
getName();
new Foo.getName();
new Foo().getName();
new new Foo().getName();
```

### 答案
```2 4 1 1 2 3 3```

## 解析
先看上半部的一系列声名和赋值，首先定义了一个叫 ```Foo``` 的函数，之后为 ```Foo``` 创建了一个叫 ```getName``` 的**静态属性**存储了一个匿名函数，之后为 ```Foo``` 的**原型对象**新创建了一个叫 ```getName``` 的函数。之后又通过函数变量表达式创建了一个 ```getName``` 的函数，最后再声明一个叫 ```getName``` 函数

### 第一问:
这一问应该没啥好说的，访问 ```Foo``` 的静态属性 ```getName```，结果是 2

### 第二问:
直接调用 ```getName``` 函数。既然是直接调用，自然是在当前上下文中的叫 ```getName``` 的函数，这就跟 123 没关系。那为什么是 4 呢？此处有两个坑，一是变量声明提升，二是函数表达式。

```var getName``` 和 ```function getName``` 都是 **声明** 语句，但两者是区别在于 ```var getName``` 是 **函数表达式（变量声明）**，```function getName``` 是 **函数声明**

**函数表达式**最大的问题，是会将代码拆成两段分别执行。例如：
```js
console.log(x); //输出：function x(){}
var x = 1;
function x() {}
```
在 js 的引擎中，是按照如下的顺序执行的：
```js
var x;
function x(){}
console.log(x); // 输出：function x(){}
x = 1;
```
实际执行的代码为，先将 ```var x = 1``` 拆分成 ```var x``` 和 ```x = 1``` 两个部分，然后依次进行提升，于是函数声明的 ```x``` 先覆盖了变量声明的 ```x``` ，接着执行 ```console```，然后被赋值为 1

因此，上面的问题的执行顺序是：
```js
function Foo() {
  getName = function () { alert(1); };

  return this;
}
var getName;         //只提升变量声明
function getName() { alert(5);}  //提升函数声明，覆盖var的声明
 
Foo.getName = function () { alert(2);};
Foo.prototype.getName = function () { alert(3);};
getName = function () { alert(4);};  //最终的赋值再次覆盖function getName声明
 
getName();  //最终输出4
```

> 函数声明会"被提前"到外部脚本或者外部函数的顶部，所以这种方式声明的函数，可以在它被定义之前的代码中所调用  

函数表达式，就和声明变量一样了，变量声明会提前到顶部，但是赋值会在执行到原位置的时候才进行。4 会变量提升，但是并没有赋值，然后 5 函数提升（在 4 赋值之前调用下```getName()```，输出的是 5 ），而代码执行 4 的位置时，会赋值并覆盖了 5 。所以第二个会输出 4

### 第三问：
第三问的 ```Foo().getName()```， 先执行了 ```Foo``` 函数，然后调用 ```Foo``` 函数的返回值对象的 ```getName``` 属性函数。这一问首先明确 ```Foo``` 的返回值 ```this``` 指向 ```window``` 对象，其次在于 ```getName = function () { alert(1); }``` 这一句。根据其写法，这一句是赋值语句，但是并没有 ```var``` 声明，那么就是在 ```Foo``` 的作用域内找 ```getName``` 这个变量，没有就去上一层作用域寻找(作用域链)。经过 第二问 过程分析中的执行，```getName``` 变量被赋值为 ```function () { alert(4); }``` 这个函数，但是执行的并不是它

在 ```Foo``` 这个函数内部，```getName``` 这个变量被赋值为函数 ```function () { alert(1); };```，但是由于 ```getName``` 变量是在 ```Foo``` 函数外被声明的，故最终 ```Foo().getName``` 变成 ```window.getName```，执行后结果即为 1

此处两个知识点，一个是变量作用域问题，一个是this指向问题

### 第四问：
直接调用 ```getName```，相当于 ```window.getName()```，经过第三问的调用，故结果同第三问，1


### 第五-第七问：
这里都是运算符优先级的问题，详情移步页首 原文2

#### 第五问：
简单而言，```.``` 的优先级高于 ```new```，所以此问可以看成 ```new (Foo.getName)()``` ，故结果为 2

#### 第六问：
可以看成 ```(new Foo()).getName();```，结果为 3

这个其实是这样的：
```js
var foo = new Foo();

foo.getName();
```

#### 第七问：
可以看成 ```new ((new Foo()).getName)();```，结果是 3

#### 第五 - 第七问的一些个人理解：
当我们在使用 ```new``` 关键字的时候，后面的 **函数/类** 通常都带有一对括号，这其实来源于 java。因为 java 中每个类都必须有至少一个和类名一样名字的构造函数。当使用 ```new``` 的时候，调用这个构造函数来生成对象，所以在 java 中这对括号必不可少。因此就形成了一个 ```new``` 必须要有一对括号与之配对的格式。因此第七问在语义上可以借鉴这一点进行理解，但是如果能在原理层面进行直接理解，也是必须的
