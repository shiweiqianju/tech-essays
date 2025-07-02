# Rxjs Scheduler

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)
* [Rxjs源码解析（四）Scheduler](https://juejin.cn/post/7044034028416008206)

## 一、基础概念
按照官网的说法：Scheduler 控制着何时启动 subscription 和何时发送通知，
* 是一种数据结构，它知道如何根据优先级或其他标准来存储任务和将任务进行排序。
* 是一个执行上下文，表示在何时何地执行任务(举例来说，立即的，或另一种回调函数机制(比如 setTimeout 或 process.nextTick)，或动画帧)。
* 有一个虚拟的始终，在具体的事务安排上会遵循这个时钟的时序

简而言之，Scheduler 会影响 Observable 开始执行以及元素发射的时机

**当然，尽管这是 Rxjs 系统中一个占据重要地位的概念，在实际开发过程中，几乎不会用到**

一个具体的 demo：
```js
const observable$ = new Observable(observer => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.next(4);
  observer.complete();
}).pipe(
  observeOn(asyncScheduler)
)

console.log('just before subscribe');
observable$.subscribe({
  next(x) {
    console.log('got value ' + x);
  },
  error(err) {
    console.error('something wrong occurred: ' + err);
  },
  complete() {
    console.log('done');
  },
});
console.log('just after subscribe');

// output:

// just before subscribe
// just after subscribe
// got value 1
// got value 2
// got value 3
// done
```

而如果不使用 ```asyncScheduler```，输出结果会是
```js
// just before subscribe
// got value 1
// got value 2
// got value 3
// done
// just after subscribe
```

根据官网上的解释，```asyncScheduler``` 其实就相当于是给最终的 Observer 加上了一层代理，用伪代码可以这样写：
```js
const observable$ = new Observable(proxyObserver => { // 代理 Observer
  proxyObserver.next(1);
  proxyObserver.next(2);
  proxyObserver.next(3);
  proxyObserver.next(4);
  proxyObserver.complete();
}).pipe(
  observeOn(asyncScheduler)
);

const finalObserver = { // 最终的 Observer
  next(x) {
    console.log('got value ' + x);
  },
  error(err) {
    console.error('something wrong occurred: ' + err);
  },
  complete() {
    console.log('done');
  },
}

console.log('just before subscribe');
observable$.subscribe(finalObserver);
console.log('just after subscribe');

// observeOn(asyncScheduler) 的代理过程
const proxyObserver = {
  next(val) {
    asyncScheduler.schedule(
      x => finalObserver.next(x),
      0, /* delay, in this case, is 0 */
      val, /* will be the x for the function above */
    )
  }
}
```

## 二、具体的 Scheduler
各个 Scheduler 的行为有点像事件循环，可以参照着事件循环中的概念辅助理解

### asyncScheduler
这个最简单，就是把同步任务变成异步的，基础概念中的 demo 即见

```js
/**
 * demo:
 * Use async scheduler to repeat task in intervals
 * 
 * And 
 * If we annotate the statement `this.schedule(state + 1, 1000)` in Action(task),
 * this program will perform as setTimeout
 */

let scheduler;

// Action
function task(state) {
  console.log(state, scheduler === this);

  // `this` references currently executing Action, which we reschedule with new state and delay
  // so, you will see `scheduler === this` if you console it
  this.schedule(state + 1, 1000);
}

// start a async scheduler
console.log('before asyncScheduler')
scheduler = asyncScheduler.schedule(
  task, // action function
  2000, // delay or duration
  -1, // optional, initial value for action function
);
console.log('after asyncScheduler')

// outputs

// before asyncScheduler
// after asyncScheduler
// -1
// 0
// 1
// ....
```

一些注意事项：
* ```asyncScheduler.schedule(...)``` 这句表示根据参数启动一个 ```asyncScheduler```
* 如果在 ```action function``` 中使用到了 ```this```，那么 ```action function``` 一定不能声明成箭头函数，且这个 ```this``` 就是 ```asyncScheduler.schedule(...)``` 启动的 ```scheduler```

### asapScheduler
尽管 ```asapScheduler``` 从概念上也是一个把同步变成异步，但是更接近于 ```microtask```，于是：
```js
console.log('before Scheduler');
asyncScheduler.schedule(() => console.log('async')); // scheduling 'async' first...
asapScheduler.schedule(() => console.log('asap'));
console.log('after Scheduler');

// outputs

// before Scheduler
// after Scheduler
// asap
// async
```

### queueScheduler
```queueScheduler``` 的大部分行为和 ```asyncScheduler``` 完全一致，就比如我们以官网给出的案例：
```js
queueScheduler.schedule(function(state) {
  if (state !== 0) {
    console.log('before reschedule', state);
    this.schedule(state - 1);
    console.log('after reschedule', state);
  }
}, 0, 3);

// outputs

// 'before reschedule', 3
// 'after reschedule', 3
// 'before reschedule', 2
// 'after reschedule', 2
// 'before reschedule', 1
// 'after reschedule', 1
```

如果我们把 ```queueScheduler``` 换成 ```asyncScheduler```，那么输出是一样的。  
那么 ```queueScheduler``` 和 ```asyncScheduler``` 的差异在哪里呢？我们在上面的 demo 中加两个 ```console``

```js
console.log('queueScheduler - before'); // new statement
queueScheduler.schedule(function(state) {
  if (state !== 0) {
    console.log('before reschedule', state);
    this.schedule(state - 1);
    console.log('after reschedule', state);
  }
}, 0, 3);
console.log('queueScheduler - after'); // new statement

// outputs

// 'queueScheduler - before'
// 'before reschedule', 3
// 'after reschedule', 3
// 'before reschedule', 2
// 'after reschedule', 2
// 'before reschedule', 1
// 'after reschedule', 1
// 'queueScheduler - after'
```
可以看到，结果是以一种同步的方式输出的，这就是和 ```asyncScheduler``` 本质上的区别，具体细节可以查看源码或者参考上方的资料  

#### 注意
在 ```queueScheduler``` 换成 ```asyncScheduler``` 对比的示例中，我们说，结果是以一种同步的方式输出的，并没有说 ```queueScheduler``` 是同步执行的，因为这里涉及到的细节是：假如 ```queueScheduler``` 是同步执行的，那么输出的结果应该是：
```js
// outputs

// 'queueScheduler - before'

// 'before reschedule', 3
// 'before reschedule', 2
// 'before reschedule', 1

// 'after reschedule', 3
// 'after reschedule', 2
// 'after reschedule', 1

// 'queueScheduler - after'
```

所以，这就是我们并没有说**同步执行**的原因

### animationFrameScheduler
这个最简单，其表现形式基本等同于 ```window.requestAnimationFrame```。但是，如果使用了 ```delay``` 参数，则其表现会变成 ```asyncScheduler```
