# JS Promise 中关于 catch 的执行顺序

## 起因
* [Promise—关于catch（你真的了解catch的执行顺序吗）](https://zhuanlan.zhihu.com/p/575439996)
冲浪的时候看到一个面试题，问下面代码的执行顺序
```js
Promise.all([
  new Promise(res => res(0)), 
  new Promise((res, rej) => rej(1))
]).then(v => {
  console.log('then 1 ====== ', v)    
}).catch(e => {
  console.log('catch 1 ====== ', e)
})

Promise.all([
  new Promise(res => res(0)), 
  new Promise(res => res(1)),
  new Promise(res => res(2)), 
  new Promise(res => res(3))
]).then(v => {
  console.log('then 2 ====== ', v)    
}).catch(e => {
  console.log('catch 2 ====== ', e)
})
```
没细想，以为答案是 ```catch 1 => then 2```，然后果断翻大车，实际结果是反过来的，故而有了本篇

## 简化与分析

### 简化与补全
首先是先把关联性不大的简化掉，比如前后两个 ```Promise.all``` 可以简化成下面这样：
```js
// 第一个链式调用
Promise.reject().then(v => {
  console.log('then 1 ====== ', v)    
}).catch(e => {
  console.log('catch 1 ====== ', e)
})

// 第二个链式调用
Promise.resolve().then(v => {
  console.log('then 2 ====== ', v)    
}).catch(e => {
  console.log('catch 2 ====== ', e)
})
```

接着，根据[JS.Promise 的完全实现](./JS.Promise%20的完全实现.md)这篇文章中 ```catch``` 源码的实现可以知道，内部其实也是调用了 ```then``` 函数，这里我们把相关的进行替换
```js
// 第一个链式调用
// Promise.reject().then(v => {
//   console.log('then 1 ====== ', v)    
// }).catch(e => {
//   console.log('catch 1 ====== ', e)
// })

// 第二个链式调用
// Promise.resolve().then(v => {
//   console.log('then 2 ====== ', v)    
// }).catch(e => {
//   console.log('catch 2 ====== ', e)
// })

// 第一个链式调用
Promise.reject().then(v => {
  console.log('then 1 ====== ', v)    
}).then(undefined, e => {
  console.log('catch 1 ====== ', e)
})

// 第二个链式调用
Promise.resolve().then(v => {
  console.log('then 2 ====== ', v)    
}).then(undefined, e => {
  console.log('catch 2 ====== ', e)
})
```

最后，```then``` 函数的入参标准来看的话应该是两个， ```onFulfilled, onRejected```, 分别处理 调用 ```then``` 的那个 ```promise``` 的两种状态变化，但是这两个参数的话均可为空，当然，在 ```then``` 函数内部对空值进行了兼容处理(当然细节可能略有不同，这里仍然是伪代码)：
* 如果 ```onFulfilled``` 为空值，则默认赋值为 ```x => x```;
* 如果 ```onRejected``` 为空值，则默认赋值为 ```() => throw Error()```;

所以，最终简化与补全的代码如下：
```js
// 第一个链式调用
Promise.reject().then(
  v => { // onFulfilled
    console.log('then 1 ====== ', v)    
  },
  () => { // onRejected
    throw Error(); // then 1 的 第一个 onRejected
  }
).then(
  undefined, // onFulfilled
  e => { // onRejected
    console.log('catch 1 ====== ', e)
  }
)

// 第二个链式调用
Promise.resolve().then(
  v => { // onFulfilled
    console.log('then 2 ====== ', v)    
  },
  () => { // then 2 的 第一个 onRejected
    throw Error();
  }
).then(
  undefined, // onFulfilled
  e => { // onRejected
    console.log('catch 2 ====== ', e)
  }
)
```

### 执行顺序分析
首先依次执行的同步任务 ```Promise.reject().then()```，现在假设这句话的返回值是 ```p1```，到这里为止，微任务队列里被塞入了一个任务，即
```js
() => { // onRejected
  throw Error(); // then 1 的 第一个 onRejected
}
```
这个任务，但是还有同步任务，这个任务只能在微任务队列先保存着，等接下来的调度。
接着执行的语句是
```js
p1.then(
  undefined, // onFulfilled
  e => { // onRejected
    console.log('catch 1 ====== ', e)
  }
)
```
这一句，但是由于此时 ```p1``` 的状态是未兑现(```pending```)，所以此时只是将 ```then```(补全后的第二个，换算过来就是 ```catch``` 的入参)中的入参缓存在内部，即没有推至微队伍中去，
至此，同步任务中第一个链式调用结束，微任务队列中仅有一个任务，即：
```js
() => { // onRejected
  throw Error(); // then 1 的 第一个 onRejected
}
```

接下来执行同步任务中的第二个链式调用，过程与第一个链式调用差不多，只不过被推入微任务队列中的是下面的函数：
```js
v => { // onFulfilled
  console.log('then 2 ====== ', v)    
},
```

至此，第一轮全部同步任务执行结束，用伪代码来模拟微任务队列如下：
```js
[
  () => { // onRejected
    throw Error(); // then 1 的 第一个 onRejected
  },
  v => { // onFulfilled
    console.log('then 2 ====== ', v)    
  },
]
```

接下来，浏览器回头依次执行微任务队列，回调函数
```js
() => { // onRejected
  throw Error(); // then 1 的 第一个 onRejected
},
```
被执行，此时 ```p1``` 被兑付，此时 ```p1.then``` 的入参才真正地被放入微任务队列中，即此时的微任务队列如下：
```js
[
  v => { // onFulfilled
    console.log('then 2 ====== ', v)    
  },
  e => { // onRejected
    console.log('catch 1 ====== ', e)
  }
]
```
然后就是顺次执行，最终控制台的打印结果就是 ```then 2 => catch 1```  

上面的执行分析可能有点啰嗦，核心是链式调用中 ```then``` 函数的执行以及 ```then``` 函数的入参函数的缓存与执行，这其实也是整个 ```Promises/A+``` 规范的重难点

## 拓展
那么，如何想按照 ```catch 1 => then 2``` 这个输出顺序，我们该如何改造代码？  
改造如下：
```js
// 第一个链式调用
// 这里，省略掉一个 then
Promise.reject().catch(e => {
  console.log('catch 1 ====== ', e)
})

// 第二个链式调用
Promise.resolve().then(v => {
  console.log('then 2 ====== ', v)    
}).catch(e => {
  console.log('catch 2 ====== ', e)
})
```
