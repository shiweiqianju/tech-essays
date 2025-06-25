# Rxjs Operators - Three

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs
### reduce
Observable 版本的 reduce，但是返回值永远是 Observable，示例如下：
```js
const clicksInFiveSeconds = fromEvent(document, 'click')
  .pipe(takeUntil(interval(5000)));

const ones = clicksInFiveSeconds.pipe(map(() => 1));
const seed = 0;
const count = ones.pipe(reduce((acc, one) => acc + one, seed));

count.subscribe(x => console.log(x));
```

### scan
加强版的 reduce，与 reduce 不同的是，reduce 的输出流只有一个时序点(元素)，scan 则是一一对应式地生成时序点(元素)，具体可对比两者的弹珠图，demo 如下：
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js"></script>

</head>
<body>
  <button id="addButton">Add</button>
  <button id="minusButton">Minus</button>
  <h1 id="state"></h1>

  <script>
    const { 
      pipe, merge,
      of, fromEvent,
      mapTo, scan
    } = rxjs;

    const addBtn = document.querySelector('#addButton');
    const minusBtn = document.querySelector('#minusButton');
    const state = document.querySelector('#state');

    const addClick$ = fromEvent(addBtn, 'click').pipe(mapTo(1));
    const minusClick$ = fromEvent(minusBtn, 'click').pipe(mapTo(-1));

    merge(of(0), addClick$, minusClick$)
      .pipe(
        scan((origin, next) => origin + next, 0)
      )
      .subscribe(value => state.innerHTML = value)

  </script>
</body>
</html>
```

### buffer
先看下面的 demo：
```js
const source = interval(300);
const anotherSource = interval(1000);
const buffered = source.pipe(buffer(anotherSource));

buffered.subscribe(x => console.log(x));

// outputs
// [0, 1, 2] // 1000ms
// [3, 4, 5] // 2000ms
// [6, 7, 8, 9] // 3000ms
// [10, 11, 12] // 4000ms
// ...
```

以 buffer 的入参 Observable 流上的每个数据为时序节点，周期性地输出 目标 Observable 流上的数据，当然，这里的输出并不是从头开始的数据，而是各个时序节点之间的数据

### bufferTime
针对时间特化版本的 buffer，比如上面的示例，使用 bufferTime 改写如下：
```js
const source = interval(300);
const buffered = source.pipe(bufferTime(1000));

buffered.subscribe(x => console.log(x));

// outputs
// [0, 1, 2] // 1000ms
// [3, 4, 5] // 2000ms
// [6, 7, 8, 9] // 3000ms
// [10, 11, 12] // 4000ms
// ...
```

### bufferCount
针对 数量 特化版本的 buffer，demo 以及输出如下：
```js
const source = interval(300);
const buffered = source.pipe(bufferCount(2));

buffered.subscribe(x => console.log(x));

// outputs
// [0, 1] // 600ms
// [2, 3] // 1200ms
// [4, 5] // 1800ms
// [6, 7] // 2400ms
// ...
```

### delay
延迟启动时序点(当然不影响源 observable 的启动时序点)
```js
const source = interval(300).pipe(take(5));
const example = source.pipe(delay(500));

example.subscribe(x => console.log(x));

// outputs
// after 500ms
// -----0---1---2---3---4 |
```

### delayWhen
这个 operator 光看其弹珠图比较容易蒙，结合实例进行解释：
```js
const source = interval(300).pipe(take(5));
const example = source.pipe(delayWhen(x => {
  const duration = Math.random() * 5000;

  // console.log(duration, x)
  
  return interval(duration);
}));

example.subscribe(x => console.log(x));

// outputs
// 因为使用了 interval，每次的结果是不一样的，需要具体运行，但是有一点，输出结果的时序和想象中的大不一致，具体看下面的分析
```

分析如下：
* 首先我们有一个 ```source``` 的 Observable，如果我们启动了这个 Observable，那么弹珠图应该是 ```---0---1---2---3---4 |```，记住这个弹珠图
* 接着我们使用 delayWhen，这个 operator，入参是一个函数，根据官网的描述，是对 ```source``` 上的每一个时序点都执行下这个函数，生成该时序点的延迟时间
> 到这里的注意点是：delayWhen 的入参函数(delayCallback)针对每个时序点都会运行一次，而不是在整个执行过程中只运行唯一一次。因为我们这里的示例中使用了 interval，所以意味着 ```source``` 上每个时序点的延迟时间是不固定的
* 之后，我们随机跑一下(可以先猜一下输出顺序)，比如
  * ```0``` 值的延迟时间是 ```2212ms```
  * ```1``` 值的延迟时间是 ```4727ms```
  * ```2``` 值的延迟时间是 ```1265ms```
  * ```3``` 值的延迟时间是 ```311ms```
  * ```4``` 值的延迟时间是 ```2486ms```
* 结果是 ```3 -> 2 -> 0 -> 4 -> 1```，一个乱序的输出
* 核心是 delayWhen 这个 operator 的延迟是以 源 Observable 中该时序点本身的时序为基础进行延迟的，即：
  * 源 ```source``` 中，```0``` 值应该在启动后的 ```300ms``` 输出，那么在 ```example``` 中，其输出时间点是启动后的 ```300 + 2212 = 2512ms```
  * 源 ```source``` 中，```1``` 值应该在启动后的 ```600ms``` 输出，那么在 ```example``` 中，其输出时间点是启动后的 ```600 + 4727 = 5327ms```
  * 源 ```source``` 中，```2``` 值应该在启动后的 ```900ms``` 输出，那么在 ```example``` 中，其输出时间点是启动后的 ```900 + 1265 = 2165ms```
  * 源 ```source``` 中，```3``` 值应该在启动后的 ```1200ms``` 输出，那么在 ```example``` 中，其输出时间点是启动后的 ```1200 + 311 = 1511ms```
  * 源 ```source``` 中，```4``` 值应该在启动后的 ```1500ms``` 输出，那么在 ```example``` 中，其输出时间点是启动后的 ```1500 + 2486 = 3986ms```
* 最后根据运算结果打印在控制台中
* 意料之外，情理之中

当然还有很多细节，比如：
* 在入参函数(```delayCallback```)中加入 ```console```，会发现```delayCallback```并不是一次性执行的，而是随着 源 ```source``` 的输出而执行的(同/异步)，于是结合上面的案例，就可能出现这样的情况：因为 ```example``` 中某些时序点(比如排在前面的一些时序点)达到了输出条件，就会调用 ```subscribe``` 中的 ```next```，而一些时序点可能还没有进行延迟运算(未调用 ```delayCallback```)，所以会看到 ```delayCallback``` 的 ```console``` 穿插着一些 ```next``` 的 ```console```
* 入参函数(```delayCallback```)的 ```x``` 入参，对应的是 源 ```source``` 每个时序点上的 ```value```

## 二、跟随移动的 demo
六张图片跟随鼠标移动，但是每张图片有个时间间隔

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js"></script>

  <style>
    img{
      position: absolute;
      border-radius: 50%;
      border: 3px white solid;
      transform: translate3d(0,0,0);
    }
  </style>

</head>
<body>
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover6.jpg" alt="">
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover5.jpg" alt="">
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover4.jpg" alt="">
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover3.jpg" alt="">
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover2.jpg" alt="">
  <img src="https://res.cloudinary.com/dohtkyi84/image/upload/c_scale,w_50/v1483019072/head-cover1.jpg" alt="">

  <script>
    const { 
      pipe, merge,
      of, fromEvent,
      delay,
    } = rxjs;

    const imgs = document.querySelectorAll('img');
    const move$ = fromEvent(document, 'mousemove');

    function followMouse(dom) {
      const basicDelay = 600;

      dom.forEach((item, index) => {
        move$.pipe(
          delay(basicDelay * (Math.pow(0.65, index) + Math.cos(index / 4)) / 2)
        )
        .subscribe(function (ev){
          item.style.transform = 'translate3d(' + ev.x + 'px, ' + ev.y + 'px, 0)';
        });
      });
    }

    followMouse(Array.from(imgs));
  </script>
</body>
</html>
```
