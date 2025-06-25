# Rxjs Operators - Seven

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs
### window
将一个一维的 Observable 转换成 Higher Order Observable。有点类似 buffer，只是最后输出的结果不一样
```js
// 注意，这个 demo 的意义是：
// 以 sec 为切割条件，即每 1s 切出来一个窗口
// 在这个窗口中，最多取 2 个 click 事件
const clicks = fromEvent(document, 'click');
const sec = interval(1000)

clicks.pipe( // 源 Observable
  WR(sec), // 以 sec 为切割条件，形成子 Observable
  map(ev => ev.pipe(take(2))), // 每个子 Observable 最多取前 2 个
  mergeAll(), // 合并 Higher Order Observable
).subscribe(console.log) // 打印看一下
```

### windowToggle
比 window 更灵活，可以指定切割的起点和终点
```js
// 功能：每隔一秒钟, 发出接下来 500ms 的点击事件
const clicks = fromEvent(document, 'click');
const openings = interval(1000);

clicks.pipe(
  windowToggle(
    openings, // 每个窗口的开始，切割起点
    i => { // 切割终点 callback，这个 i，从打印结果来看，对应的是 openings 上时序点的值
      return i % 2 ? interval(500) : EMPTY;
    }
  ),
  mergeAll(), // 如果调用 mergeAll，这里的打印结果有点看不明白
  // switchAll(), // 如果调用 switchAll，在 subscribe 中看到最新的窗口中的 click
).subscribe(x => console.log(x));

// another demo
const source = interval(1000);
const mouseDown = fromEvent(document, 'mousedown');
const mouseUp = fromEvent(document, 'mouseup');

source.pipe(
  windowToggle(
    mouseDown,
    x => {
      console.log(x)
      return mouseUp;
    }
  ),
  // switchAll(),
  mergeAll(),
).subscribe(v => console.log(v))
```

### groupBy
按条件分组
```js
const mock = [
  {name: 'Anna', score: 100, subject: 'English'},
  {name: 'Anna', score: 90, subject: 'Math'},
  {name: 'Anna', score: 96, subject: 'Chinese' }, 
  {name: 'Jerry', score: 80, subject: 'English'},
  {name: 'Jerry', score: 100, subject: 'Math'},
  {name: 'Jerry', score: 90, subject: 'Chinese' }, 
  {name: 'Frank', score: 90, subject: 'Chinese' }, 
];

const source = from(mock);
source.pipe(
  groupBy(p => p.name),
  mergeMap(group$ => {
    return group$.pipe(
      reduce((acc, cur) => {
        return [...acc, cur];
      }, [])
    )
  })
).subscribe(v => console.log(v))
```
