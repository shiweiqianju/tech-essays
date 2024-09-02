# Jquery 源码学习之 jQuery.fn.extend 和 jQuery.extend

## 零、前言
参考资料：[深入浅出jQuery】源码浅析--整体架构](https://blog.csdn.net/qq_33706382/article/details/78178459) - [github](https://github.com/chokcoco/jQuery-/blob/master/jquery-1.10.2__read.js)

### 结论与伪代码
extend 方法在 jQuery 中是一个很重要的方法。jQuery 内部用它来拓展静态方法或者实例方法，也是开发 jQuery 插件必须要用到的方法。但是，在内部，是存在 jQuery.fn.extend 与 jQuery.extend 两个 extend 方法的，而区分这两个方法是理解 jQuery 的很关键的一部分。先看结论：
* ```jQuery.extend(object)``` 为拓展 jQuery 类本身，为类添加新的静态方法；
* ```jQuery.fn.extend(object)``` 给 jQuery 实例添加方法，即通过 extend 添加的新方法，实例化的jQuery 对象都可以使用，因为这是挂载在 ```jQuery.fn``` 上的方法（前一篇提到，```jQuery.fn = jQuery.prototype```）  

即：
* ```jQuery.extend()``` 拓展的静态方法，我们可以直接通过 ```$.xxx()``` 来调用，比如 ```$.each()``` 用来遍历数组
* 而 ```jQuery.fn.extend()``` 拓展的方法，需要使用 ```$('xxx').yyy()``` 调用

下面是源码：
```js
// 扩展合并函数
// 合并两个或更多对象的属性到第一个对象中，jQuery 后续的大部分功能都通过该函数扩展
// 虽然实现方式一样，但是要注意区分用法的不一样，那么为什么两个方法指向同一个函数实现，但是却实现不同的功能呢,
// 阅读源码就能发现这归功于 this 的强大力量
// 如果传入两个或多个对象，所有对象的属性会被添加到第一个对象 target
// 如果只传入一个对象，则将对象的属性添加到 jQuery 对象中，也就是添加静态方法
// 用这种方式，我们可以为 jQuery 命名空间增加新的方法，可以用于编写 jQuery 插件
// 如果不想改变传入的对象，可以传入一个空对象：$.extend({}, object1, object2);
// 默认合并操作是不迭代的，即便 target 的某个属性是对象或属性，也会被完全覆盖而不是合并
// 如果第一个参数是 true，则是深拷贝
// 从 object 原型继承的属性会被拷贝，值为 undefined 的属性不会被拷贝
// 因为性能原因，JavaScript 自带类型的属性不会合并

jQuery.extend = jQuery.fn.extend = function () {
  var src, copyIsArray, copy, name, options, clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false;

  // Handle a deep copy situation
  // target 是传入的第一个参数
  // 如果第一个参数是布尔类型，则表示是否要深递归，
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    // 如果传了类型为 boolean 的第一个参数，i 则从 2 开始
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  // 如果传入的第一个参数是 字符串或者其他
  if (typeof target !== "object" && !jQuery.isFunction(target)) {
    target = {};
  }

  // extend jQuery itself if only one argument is passed
  // 如果参数的长度为 1 ，表示是 jQuery 静态方法
  if (length === i) {
    //此时的this：如果外部调用的是jQuery.extend方法，则this指jQuery类，扩展到jQuery类上
    //而如果是jQuery.fn.extend方法则this指jQuery原型,扩展到jQuery的原型上
    target = this;
    --i;
  }

  // 可以传入多个复制源
  // i 是从 1或2 开始的
  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    // 将每个源的属性全部复制到 target 上
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        // src 是源（即本身）的值
        // copy 是即将要复制过去的值
        src = target[name];
        copy = options[name];

        // Prevent never-ending loop
        // 防止有环，例如 extend(true, target, {'target':target});
        if (target === copy)  continue;

        // Recurse if we're merging plain objects or arrays
        // 这里是递归调用，最终都会到下面的 else if 分支
        // jQuery.isPlainObject 用于测试是否为纯粹的对象
        // 纯粹的对象指的是 通过 "{}" 或者 "new Object" 创建的
        // 如果是深复制
        if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
          // 数组
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : [];
          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }

          // Never move original objects, clone them
          // 递归
          target[name] = jQuery.extend(deep, clone, copy);

          // Don't bring in undefined values
          // 最终都会到这条分支
          // 简单的值覆盖
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  // 返回新的 target
  // 如果 i < length ，是直接返回没经过处理的 target，也就是 arguments[0]
  // 也就是如果不传需要覆盖的源，调用 $.extend 其实是增加 jQuery 的静态方法
  return target;
};
```
