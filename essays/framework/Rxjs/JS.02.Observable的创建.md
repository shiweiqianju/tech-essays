# Rxjs Observable 的创建

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、Observable 的基本 create 方法
这是 Rxjs 中创建 Observable 的基本方法，通过传入一个函数，来定义 Observable 的执行流，返回一个 Observable 对象。
```js
import { create } from "rxjs";

// 构造 Observable
const stream$ = create(observer => {
  observer.next(1);
  observer.next(2);
  observer.next(3);
  observer.complete();
  observer.next('not work');
});

// 观察者
const observer = {
  next: value => console.log(value),
  error: err => console.log(err),
  complete: () => console.log('complete')
}

// 建立订阅关系
const subscription = stream$.subscribe(observer);

// output
// 1
// 2
// 3
// complete
```

#### 抛出错误
```Observer.error``` 和 ```Observer.complete``` 有着相似的功能，都会停止对后续的 ```Observer.next``` 的调用，但是无法停止构造函数中其他代码的执行。
```js
import { create } from "rxjs";

// 构造 Observable
const stream$ = create(observer => {
  observer.next(1);
  observer.next(2);

  try {
    throw new Error('error');
  } catch (err) {
    observer.error(err);
  }

  observer.next(4);
  setTimeout(() => {
    console.log('timeout');
  }, 1000);
});

// 观察者
const observer = {
  next: value => console.log(value),
  error: err => console.log(err),
  complete: () => console.log('complete')
}

// 建立订阅关系
const subscription = stream$.subscribe(observer);

// output:
// 1
// 2
// Error: error
// timeout  // 1s 后输出
```

#### 同/异步
1. 构造函数中的异步任务(注意与 ```observable.next``` 区分)
```js
import { create } from "rxjs";

// 构造 Observable
const stream$ = create(observer => {
  observer.next(1);
  setTimeout(() => {
    observer.next(2);
  }, 1000);
  observer.next(3);
  observer.complete();
});

// 观察者
const observer = {
  next: value => console.log(value),
  error: err => console.log(err),
  complete: () => console.log('complete')
}

// 建立订阅关系
const subscription = stream$.subscribe(observer);

// output:
// 1
// 3
// complete

// 如果不执行 observer.complete();
// output:
// 1
// 3
// 2  // 1s 后输出
```

2. 构造函数外的同步任务
```js
import { create } from "rxjs";

// 构造 Observable
const stream$ = create(observer => {
  observer.next(1);
  observer.next(3);
  observer.complete();
});

// 观察者
const observer = {
  next: value => console.log(value),
  error: err => console.log(err),
  complete: () => console.log('complete')
}

console.log('start');

// 建立订阅关系
const subscription = stream$.subscribe(observer);

console.log('end');

// output:
// start
// 1
// 2
// complete
// end
```

## 二、其他创建方法(操作符)
### 1. of
```js
import { of } from "rxjs";

const stream$ = of(1, 2, 3);
// or
// const stream$ = of([1, 2, 3]);

// ...
```
 
```of``` 操作符就是简化版的 ```create``` 方法，它会将传入的参数依次作为 ```Observer.next``` 的参数，并且会自动调用 ```Observer.complete```。

### 2. from
这个操作符的入参支持的数据类型比较广泛，根据官网，它支持的类型如下：
* 字符串
* 数组
* 类数组对象(Array-Like Object)
* 可迭代对象(Iterable)
* Promise
* Observable-Like Object

```js
import { from } from "rxjs";

const stream$ = from([1, 2, 3, 4, 5]);

// Promise, 等价于 fromPromise 操作符
const stream$ = from(Promise.resolve(100));

// Iterable
function* generateDoubles(seed) {
  let i = seed;

  while (i <= 100) {
    yield i;
    i = 2 * i; // double it
  }
}
 
const iterator = generateDoubles(3);
const stream$ = from(iterator);

stream$.subscribe({
  next: (data) => console.log(data),
  error: (err) => console.log(err),
  complete: () => console.log('complete'),
})
```

和 ```of``` 一样，会自动调用 ```Observer.complete```。

### 2. fromEvent & fromEventPattern
#### fromEvent
```js
import { fromEvent } from "rxjs";

const stream$ = fromEvent(document, 'click');

stream$.subscribe({
  next: event => {
    console.log('next', event);
  },
  complete: () => {
    console.log('complete')
  },
  error: () => {
    console.log('error')  
  }
})
```

当然，具体的入参数量和类型可以参考官网。

#### fromEventPattern
```fromEventPattern``` 更像是 ```fromEvent``` 的升级版，它可以自定义添加和移除事件的方法。我们以常用的 ```EventEmitter``` 为例：

```js
import { fromEventPattern } from "rxjs";
import EventEmitter from "events";

const emitter = new EventEmitter();

// nextHandler 参数可以理解为观察者对象中的 next 方法
const addHandler = (nextHandler) => {
  // 监听事件源中的 msg 事件，每次触发事件执行 next 方法
  emitter.addListener("msg", nextHandler);
};

const removeHandler = (nextHandler) => {
  // 与上面相反，会移除 msg 事件上面的 next 方法
  emitter.removeListener("msg", nextHandler);
};

const source$ = fromEventPattern(addHandler, removeHandler);

const subscription = source$.subscribe( // 这是 Observer 的一种简化写法，但是得注意入参顺序
  event => console.log("next", event),
  (error) => console.log("catch", error),
  () => console.log("complete")
);

emitter.emit("msg", "hello");
emitter.emit("msg", "world");

// 取消订阅，触发 removeHandler， emitter 上面监听的事件被取消掉，
subscription.unsubscribe();

// 由于此时已经取消了 Observable 的订阅，所以不会再触发 Observer.next 绑定的函数
// 但是，如果在其他代码中通过普通方式(emitter.addListener("msg", callback);) 绑定的回调，估计仍然是会执行的
emitter.emit("msg", "end");

// output:
// next hello
// next world
// complete
```

需要注意的是：
* ```fromEventPattern``` 的前两个入参均是函数，而这个函数的入参会由 ```RxJS``` 自动注入，其目的是为了和 ```Observer.next``` 产生关联，从而接受 ```RxJS``` 管理。
* ```fromEventPattern``` 的第二个参数是可选的，用于取消事件监听，其触发是与 ```subscription.unsubscribe()``` 关联的。

#### 总结
* ```fromEvent``` & ```fromEventPattern``` 和我们常用的 ```addEventListener``` 设计上不太一样。```addEventListener``` 是在事件源上绑定事件名和事件回调，而 ```fromEvent``` & ```fromEventPattern``` 的思想则是把事件源和事件名作为参数，先生成一个流，然后将事件回调作为 ```Observer.next``` 从而参与流的管理。

### 3. interval & timer
#### interval
```js
import { interval } from "rxjs";

const stream$ = interval(1000);

// 相当于
const stream$ = new Observable((subscriber) => {
  let i = 0;

  setInterval(() => {
    subscriber.next(i++);
  }, 1000);
});
```

#### timer
```timer``` 的功能更为强大，具体可以移步官方文档。

```js
import { timer } from "rxjs";

// 如果是一个参数，则表示到了这个时间点，执行一下 ```Observer.next```, 然后执行 ```Observer.complete```
const stream$ = timer(1000);

// 如果是两个参数，第一个参数表示到了这个时间点，首次执行一下 ```Observer.next```, 然后每隔第二个参数的时间执行一下 ```Observer.next```，并且永远不会执行 ```Observer.complete```(当然，这也需要考虑 ```Observer.next``` 中是否有终止的逻辑)
const stream$ = timer(1000, 2000);
```

### 4. empty & throwError
#### empty
```empty``` 会给我们一个空的 ```Observable```，并且会立即执行 ```Observer.complete```。这种行为和 ```Promise.resolve``` & ```Promise.reject``` 类似。

#### throwError
```throwError``` 会给我们一个 ```Observable```，并且会立即执行 ```Observer.error```。
