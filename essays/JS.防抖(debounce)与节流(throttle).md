# JS 防抖(debounce)与节流(throttle)
## 零、写在前面
### 参考资料
* [函数防抖和节流](https://juejin.cn/post/6844903651278848014)
  
### 背景
我们在平时开发的时候，会有很多场景会频繁触发事件，比如说搜索框实时发请求，```onmousemove```, ```resize```, ```onscroll```等等，有些时候，我们并不能或者不想频繁触发事件，咋办呢？这时候就应该用到函数防抖和函数节流了！

### 材料
```html
<div id="content" style="height:150px;line-height:150px;text-align:center; color: #fff;background-color:#ccc;font-size:80px;"></div>
 
<script>
  let num = 1;
  let content = document.getElementById('content');

  function count() {
    content.innerHTML = num++;
  };
  content.onmousemove = count;
</script>
```

这段代码，在灰色区域内鼠标随便移动，就会持续触发 ```count()``` 函数，导致的效果如下
![](./../assets/images/func.thinning.gif)  

接下来我们通过防抖和节流限制频繁操作

## 一、函数防抖（debounce）
短时间内多次触发同一事件，只执行最后一次，或者只执行最开始的一次，中间的不执行

### 非立即执行版
```js
function debounce(func, wait) {
  let timer;

  return function() {
    let context = this; // 注意 this 指向
    let args = arguments; // arguments中存着 event
        
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}
```
我们是这样使用的：```content.onmousemove = debounce(count,1000);```

非立即执行版的意思是触发事件后函数不会立即执行，而是在 n 秒后执行，如果在 n 秒内又触发了事件，则会重新计算函数执行时间。效果如下：
![](./../assets/images/func.thinning.debounce.ending.gif)  

### 立即执行版
```js
function debounce(func, wait) {
  let timer;
  return function() {
    let context = this; // 猜猜这边的 this 指向谁?
    let args = arguments; // arguments中存着e

    if (timer) clearTimeout(timer);

    let callNow = !timer;

    timer = setTimeout(() => {
      timer = null;
    }, wait)

    if (callNow) func.apply(context, args);
  }
}
```
立即执行版的意思是触发事件后函数会立即执行，然后 n 秒内不触发事件才能继续执行函数的效果。用法同上，效果如下：
![](./../assets/images/func.thinning.debounce.starting.gif)

### 合成版
```js
/**
   * @desc 函数防抖
   * @param func 目标函数
   * @param wait 延迟执行毫秒数
   * @param immediate true - 立即执行， false - 延迟执行
   */
function debounce(func, wait, immediate) {
  let timer;

  return function() {
    let context = this, args = arguments;
          
    if (timer) clearTimeout(timer);
    if (immediate) {
      let callNow = !timer;

      timer = setTimeout(() => {
        timer = null;
      }, wait);

      if (callNow) func.apply(context, args);
    } else {
      timer = setTimeout(() => {
        func.apply(context, args);
      }, wait)
    }
  }
}
```

## 二、节流(throttle)
指连续触发事件但是在 n 秒中只执行一次函数。即 2n 秒内执行 2 次... 。节流如字面意思，会稀释函数的执行频率

### 时间戳版
```js
function throttle(func, wait) {
  let previous = 0;

  return function() {
    let now = Date.now();
    let context = this;
    let args = arguments;

    if (now - previous > wait) {
      func.apply(context, args);
      previous = now;
    }
  }
}
```

使用方式如下： ```content.onmousemove = throttle(count, 1000);```

效果如下：
![](./../assets/images/func.thinning.throttle.timestamp.gif)

可以看到，在持续触发事件的过程中，函数会立即执行，并且每 1s 执行一次

### 定时器版
```js
function throttle(func, wait) {
  let timeout;

  return function() {
    let context = this;
    let args = arguments;

    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args)
      }, wait);
    }
  }
}
```

用法同上，效果如下：
![](./../assets/images/func.thinning.throttle.timestamp.gif)

可以看到，在持续触发事件的过程中，函数不会立即执行，并且每 1s 执行一次，在停止触发事件后，函数还会再执行一次。

我们应该可以很容易的发现，其实时间戳版和定时器版的节流函数的区别就是，时间戳版的函数触发是在时间段内开始的时候，而定时器版的函数触发是在时间段内结束的时候

### 合成版
```js
/**
 * @desc 函数节流
 * @param func 函数
 * @param wait 延迟执行毫秒数
 * @param type 1 表时间戳版，2 表定时器版
 */
function throttle(func, wait, type) {
  let previous = 0;
  let timeout = null;

  return function() {
    let context = this;
    let args = arguments;

    if (type === 1) {
        let now = Date.now();
 
        if (now - previous > wait) {
          func.apply(context, args);
          previous = now;
        }
    } else if (type === 2) {
      if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          func.apply(context, args)
        }, wait);
      }
    }
  }
}
```

## 附录 - 关于节流/防抖函数中 context（this） 的指向解析
首先，在执行 ```throttle(count, 1000)``` 这行代码的时候，会有一个返回值，这个返回值是一个新的匿名函数，因此 ```content.onmousemove = throttle(count, 1000);``` 这句话最终可以这样理解：
```js
content.onmousemove = function() {
  let now = Date.now();
  let context = this;
  let args = arguments;
  ...
  console.log(this)
}
```
到这边为止，只是绑定了事件函数，还没有真正执行，而 this 的具体指向需要到真正运行时才能够确定下来。所以这个时候如果我们把前面的 ```content.onmousemove``` 替换成 ```var fn```  并执行 ```fn()```，此时内部的 ```this``` 打印出来就会是 ```window``` 对象

其次，当我们触发 ```onmousemove``` 事件的时候，才真正执行了上述的匿名函数，即 ```content.onmousemove()```。此时，上述的匿名函数的执行是通过 ```对象.函数名()``` 来完成的，那么函数内部的 ```this``` 自然指向 ```对象(content)```

最后，匿名函数内部的 ```func``` 的调用方式如果是最普通的直接执行 ```func()```，那么 ```func``` 内部的 ```this``` 必然指向 ```window```，虽然在代码简单的情况下看不出什么异常（结果表现和正常一样），但是这将会是一个隐藏 bug，不得不注意啊！所以，我们通过匿名函数捕获 ```this```，然后通过 ```func.apply()``` 的方式，来达到 ```content.onmousemove = func``` 这样的效果。

**可以说，高阶函数内部都要注意 this 的绑定**
