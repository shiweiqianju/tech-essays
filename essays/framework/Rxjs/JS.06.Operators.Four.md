# Rxjs Operators - Four

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs
### debounce
和常用的 debounce 概念一致，延时发送源 Observable 发出的值，但如果源 Observable 发出了新值 的话，它会丢弃掉前一个等待中的延迟发送。demo 如下：
```js
const clicks = fromEvent(document, 'click');
const result = clicks.pipe(
  scan(i => ++i, 1),
  debounce(i => {
    const duration = 1000 * i;

    return interval(duration)
  })
);
result.subscribe(x => console.log(x));
```

因为这个 operator 的入参是一个函数，所以这里和 delayWhen 一样，是针对 源 Observable 的每一个时序点调用入参函数并产生一个防抖条件，如果在这个防抖条件之内，有新值(位于新时序点上)产生，则不会调用 subscribe 并继续对该时序点调用入参函数，知道达到调用 subscribe 的条件

### debounceTime
debounce 的固定时间特化版本，demo 如下：
```js
const clicks = fromEvent(document, 'click');
const result = clicks.pipe(debounceTime(1000));

result.subscribe(x => console.log(x));
// 1000ms 内如果没有再次触发 click 事件，则输出最后一次 click 事件
```

### throttleTime
从源 Observable 中发出一个值，然后在一定时间内忽略随后发出的源值(沉默时间)，之后重复此过程，demo 如下：
```js
const clicks = fromEvent(document, 'click');
const result = clicks.pipe(throttleTime(1000));

result.subscribe(x => console.log(x));
```

### throttle
throttleTime 的拓展版，接收一个入参函数，demo 如下：
```js
const source = interval(300)
const result = source.pipe(throttle((x) => {
  const duration = x * 1000;

  console.log(x, duration);

  return interval(duration)
}));

result.subscribe(x => console.log(x));
```

需要注意的是：
* ```subscribe``` 的 ```next``` 中的 ```console``` 会早于同期的 入参函数 ```durationSelector``` 中的 ```console```
* 入参函数 ```durationSelector``` 的调用并不是对每个时序点进行的，对沉默时间内出现的时序点是跳过的(结合上一条)，这和其他 operator 中的 ```selector``` 是不一样的

### distinct
去重(按时序)，demo 如下：
```js
of(1, 1, 2, 2, 2, 1, 2, 3, 4, 3, 2, 1)
  .pipe(distinct())
  .subscribe(x => console.log(x));

// Outputs
// 1
// 2
// 3
// 4

// 入参函数 - 指定筛选字段
of(
  { age: 4, name: 'Foo'},
  { age: 7, name: 'Bar'},
  { age: 5, name: 'Foo'}
)
.pipe(distinct(({ name }) => name))
.subscribe(x => console.log(x));
 
// Outputs
// { age: 4, name: 'Foo' }
// { age: 7, name: 'Bar' }

// 入参 - 按照时区进行去重
// 通常不这样用，而是使用 distinctUntilChanged
interval(1000).pipe(
  map(x => x % 2),
  distinct(undefined, interval(5000))
).subscribe(console.log);
```

### distinctUntilChanged
distinct 是把当前时序点上的值与之前的所有元素进行比对去重，distinctUntilChanged 则是把当前时序点上的值与上一个时序点进行比对去重

```js
of(1, 1, 1, 2, 2, 2, 1, 1, 3, 3)
  .pipe(distinctUntilChanged())
  .subscribe(console.log);
// Logs: 1, 2, 1, 3
```

其余的入参和 distance 大差不差，没啥特别注意的
