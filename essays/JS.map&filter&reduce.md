# JS Array 中的 map, filter 和 reduce
## 零、参考资料
原文中部分源码来源于：[JS Array.reduce 实现 Array.map 和 Array.filter](https://juejin.cn/post/6844903733860499463)

## 一、map - 映射
```js
var newArr = array.map((currentValue, index, array) => { return ... }, thisValue);
```

* currentValue，必须，当前的元素值
* index，可选，当前元素值的索引
* array，可选，原数组
* thisValue，可选，对象作为该执行回调时使用，传递给函数，用作 "this" 的值
* return 新数组

例子：
```js
var array1 = [1, 4, 9, 16];
var map1 = array1.map(x => x * 2);
 
console.log(array1);  // [1,4,9,16]
console.log(map1);  // [2,8,18,32]
```

注意：
* ```map``` 不会对空数组进行检测

## 二、filter - 筛选
```js
var newArr = array.filter((currentValue, index, array) => { return ... }, thisValue);
```

* currentValue，必须，当前的元素值
* index，可选，当前元素值的索引
* array，可选，原数组
* thisValue，可选，对象作为该执行回调时使用，传递给函数，用作 "this" 的值
* return 新数组

例子：过滤空值
```js
var arr = [20, 30, 50, 96, 50];
var newArr = arr.filter(item => item > 40) 
 
console.log(arr)  // [20, 30, 50, 96, 50]
console.log(newArr)  // [50, 96, 50]
```

高频用途：
* 上例中的过滤不符合项
* 去掉数组中的 空字符串、0、undefined、null
  ```js
    var arr = ['1', '2', null, '3.jpg', null, 0];
    var newArr = arr.filter(item => item);
    // 也可以写成
    // var newArr = arr.filter(Boolean);
    console.log(newArr) // ["1", "2", "3.jpg"]
  ```
* 数组去重

注意：
* ```filter``` 不会对空数组进行检测

## 三、reduce - 累计
```js
var result = array.reduce((total, currentValue, currentIndex, array) => { return ... }, initialValue);
```
* total，必须，初始值，第一次循环之后是计算后的返回值
* currentValue，必须，当前的元素值
* currentIndex，可选，当前元素值的索引
* array，可选，原数组
* initialValue，可选，传递给函数的初始值，即此值会在第一次循环之前赋值给 total
* return 经过处理过的 total

例子：统计字符串中每个字符出现的次数
```js
const str = '9kFZTQLbUWOjurz9IKRdeg28rYxULHWDUrIHxCY6tnHleoJ';
const obj = {};

Array.from(str).reduce((accumulator, current) => {
  current in accumulator ? accumulator[current]++ : accumulator[current] = 1;

  return accumulator;
}, obj);
```

当然，非 reduce 的写法是：
```js
const str = '9kFZTQLbUWOjurz9IKRdeg28rYxULHWDUrIHxCY6tnHleoJ';
const obj = {};

str.split('').forEach(item => {
  obj[item] ? obj[item]++ : obj[item] = 1
});
```
reduce 的用途很广泛，可以说，js 中有关数组循环的模块都可以使用 reduce 来实现，这里不一一列举，详见 [reduce-MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#%E4%BE%8B%E5%AD%90)

## 四、js 实现 map
### 原生实现
```js
Array.prototype.myMap = function(fn, context = window) {
  if (typeof fn !== 'function') return;

  let newArr = [];

  for(let i = 0, len = this.length; i < len; i++) {
    newArr.push(fn.call(context, this[i], i, this))
  }
  return newArr;
}
 
// 使用
[1, 2, 3].myMap(function(v, i, arr) {
  console.log(v, i, arr);

  return v * 2;
})
```
> 有一点奇怪的是，需要先在 Array 上挂 myMap() 这个方法，然后回车后才能使用，如果将上述代码全部复制进浏览器控制台，回车运行会报错，这是为什么？

### 使用 reduce 实现
```js
Array.prototype.reduceMap = function(fn, context = window) {
  if (typeof fn !== 'function') return;
  // or if (typeof fn !== 'function') throw new TypeError(fn + 'is not a function');

  let _this = this;
  let newArr = _this.reduce(function(total, cV, cI, _this) {
    console.log(_this, this)
    return total.concat([fn.call(context, cV, cI, _this)]);
  }, []);

  return newArr;
}
```

上面的示例是挂载在 Array 上的，下面这个示例是函数式编程示例：
```js
let fpReduceMap = (fn, context = window) => {
  return targetArr => {
    if (typeof fn !== 'function') throw new TypeError(fn + 'is not a function')
    if (!Array.isArray(targetArr)) throw new TypeError('targetArr must be a Array')
    if (targetArr.length == 0) return [];

    return targetArr.reduce((total, cV, cI, targetArr) => {
      return total.concat([fn.call(context, cV, cI, targetArr)])
    }, [])
  }
}
// 使用
fpReduceMap(function(v) {
  console.log(this);

  return v + 1;
}, {msg: 'mapping'})([1,2,3]);
```
