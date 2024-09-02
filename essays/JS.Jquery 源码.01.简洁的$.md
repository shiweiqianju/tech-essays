# Jquery 源码学习之 简洁的 $ 

## 零、前言
参考资料：[深入浅出jQuery】源码浅析--整体架构](https://blog.csdn.net/qq_33706382/article/details/78178459) - [github](https://github.com/chokcoco/jQuery-/blob/master/jquery-1.10.2__read.js)

jQuery 库，js 开发的一个里程碑，它的出现，让网页开发者们告别荒蛮的上古时代，初步解放生产力，正式进入黄铜时代。

虽然如今 Angular/React/Vue 三驾马车驰骋畋猎，jQuery的时代渐行渐远，但是它的思想它的设计都有着里程碑式的作用

## 一、自执行函数
```js
(function(params) {
  // ...
})(Variable)
```

好处很多，就不介绍，感兴趣的请移步 google/baidu

## 二、为什么没有 new ?
js 与 java 很像，都是面向对象的语言，因此，这意味这在 js 中我们需要通过 new 运算符来新建一个对象。当年面试的时候有一个问题是 jQuery 对象与普通的 dom 对象有什么不同，jQuery 对象不需要显式地 new 出来也是一个答案。

为什么不需要 new 呢？
```js
var jQuery = function(selector, context) {
  // 这里是为什么使用时无须 new 的原因
  return new jQuery.fn.init(selector, context, rootjQuery);
}
```
因为在内部已经帮我们 new 了

我们通常是 ```$('xxx')``` 来获取一个 ```jQuery``` 对象，其实内部执行的就是 ```jQuery()``` 函数，这个函数返回一个对象，即 ```new jQuery.fn.init(selector, context, rootjQuery)```
```js
var jQuery.fn = jQuery.prototype = {
  // 实例化方法，也是所有 jQuery 对象的构造器
  init: function(selector, context, rootjQuery) {
    // ....
  }
}
```

这一句，手动指定 jQuery 的 prototype（关于 js 函数的 prototype，请移步 google/baidu， 或者移步 [JS.原型](./JS.原型.md)），同时，声明一个jQuery.fn 对象，缓存也好，定义也好，以待后用  
```jQuery.fn.init.prototype = jQuery.fn;```  
这一句很关键，也很重要，作用是传递原型，确保 jQuery 对象中的 this 指向正确。接下来一步一步分析思想。

在分析之前我们先进行一下扩写，方便理解：```jQuery.fn.init.prototype = jQuery.fn = jQuery.prototype;```

这里手动指定 ```jQuery.fn.init``` 函数的原型是 ```jQuery.fn```，而因为上一句 ```jQuery.fn = jQuery.prototype``` ，所以，就确保了 ```jQuery.fn.init``` 函数的原型就是 jQuery 的原型，这意味着，```jQuery.fn.init``` 与 ```jQuery``` 是等价的，因此，先不管具体实现，通过 ```new jQuery.fn.init(selector, context, rootjQuery)``` 出来的对象本质上就是 ```jQuery``` 对象，这样，就能够通过 ```this``` 访问到 ```jQuery.fn```（或者 ```jQuery``` 原型）上的所有方法和属性

套用大佬的总结：
* 首先要明确，使用 ```$('xxx')``` 这种实例化方式，其内部调用的是 ```return new jQuery.fn.init(selector, context, rootjQuery)``` 这一句话，也就是构造实例是交给了 ```jQuery.fn.init()``` 方法去完成
* 将 ```jQuery.fn.init 的 prototype``` 属性设置为 ```jQuery.fn```，那么使用 ```new jQuery.fn.init()``` 生成的对象的原型对象就是 ```jQuery.fn``` ，所以挂载到 ```jQuery.fn``` 上面的函数就相当于挂载到 ```jQuery.fn.init()``` 生成的 ```jQuery``` 对象上，所有使用 ```new jQuery.fn.init()``` 生成的对象也能够访问到 ```jQuery.fn``` 上的所有原型方法
* 也就是实例化方法存在这么一个关系链：```jQuery.fn.init.prototype = jQuery.fn = jQuery.prototype;```，即：
  * ```new jQuery.fn.init()``` 相当于 ```new jQuery()```;
  * ```jQuery()``` 返回的是 ```new jQuery.fn.init()```，而 ```var obj = new jQuery()```，所以这 2 者是相当的，所以我们可以无 new 实例化 jQuery 对象

### 一个具体的实现
```js
(function(window, undefined) {
  var jQuery = function() {
    return new jQuery.fn.init();
  }
  jQuery.fn = jQuery.prototype = {
    init: function() { console.log('init', this); return this;},
    add: function() { console.log('add'); },
    remove: function() { console.log('remove'); }
  }
  jQuery.fn.init.prototype = jQuery.prototype;
 
  window.jQuery = window.$ = jQuery;
 
})(window)
```
　　