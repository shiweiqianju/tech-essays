# Rxjs Operators - Two

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs
### skip
略过一定的数据开始取值。
```js
let source = interval(1000);
let newSource = source.pipe(skip(3));

newSource.subscribe(console.log)
// source:    -----0-----1-----2-----3-----4-----....
// newSource: -----------------------3-----4-----....
```

### takeLast
take 的反转版本，从末尾开始取对应数量的值
> 需要注意的是，```takeLast``` 需要等到 Observable 完成以后才能进行，否则怎么能知道 Observable 的末尾在哪里呢。而且，这个 operator 的输出是**同步**的
```js
let source = interval(1000).pipe(take(5));
let newSource = source.pipe(takeLast(2));

newSource.subscribe(console.log)
// source:    -----0-----1-----2-----3-----4 |
// newSource: ------------------------------(34) |
```

### last
takeLast 的特化版本，取最后一位的值

```js
let source = interval(1000).pipe(take(5));
let newSource = source.pipe(last());

newSource.subscribe(console.log)
// source:    -----0-----1-----2-----3-----4 |
// newSource: ------------------------------(4) |
```

### startWith
在 Observable 流的首部同步塞一个数据。
> 通常用作初始化

```js
let source = interval(1000).pipe(take(5));
let newSource = source.pipe(startWith(-1));

newSource.subscribe(console.log)
// source:    -----0-----1-----2-----3-----4 |
// newSource: (-1)-----0-----1-----2-----3-----4 |
```

### merge
合并多个 Observable，功能上和 concat 类似，但是行为上却是不一样的：
* 会考察每个 Observable 中的每个元素，并按照 时序 将所有元素串联起来
* 如果两个或者多个元素在 时序 上是一致的，那么会同步输出所有结果，顺序是按照流在 merge 时候的入参顺序
* 如果最后一个值是 number，表示同时运行的合并的流的数量(相当于建了一个流量池，一个执行完了，加入一个新的并开始执行)
* 如果最后一个值是 SchedulerLike，则表示对流进行调度(暂无案例)

```js
const timer1 = interval(1000).pipe(take(10));
const timer2 = interval(2000).pipe(take(6));
const timer3 = interval(500).pipe(take(10));
 
const concurrent = 2; // the limit argument
const merged = merge(timer1, timer2, timer3, concurrent);
merged.subscribe(x => console.log(x));
 
// Results in the following:
// - First timer1 and timer2 will run concurrently
// - timer1 will emit a value every 1000ms for 10 iterations
// - timer2 will emit a value every 2000ms for 6 iterations
// - after timer1 hits its max iteration, timer2 will continue, and timer3 will start to run concurrently with timer2
// - when timer2 hits its max iteration it terminates, and timer3 will continue to emit a value every 500ms until it is complete
```

### combineLatest
这个 operator 的理解上稍微有点复杂，先上 demo：
```js
const timer1 = interval(500).pipe(take(3));
const timer2 = interval(300).pipe(take(6));

const result = combineLatest(timer1, timer2); // 等价于 const result = combineLatest([timer1, timer2]);
result.subscribe(x => console.log(x));

// console.log
// [0, 0]  // after 500ms 
// [0, 1]  // after 800ms (500 + 300)
// [0, 2]  // after 900ms (300 + 300 + 300)
// [1, 2]  // after 1000ms (500 + 500)
// [1, 3]  // after 1200ms (300 + 300 + 300 + 300)

// [2, 3]  // after 1500ms (500 + 500 + 500，先结算 timer1)
// [2, 4]  // after 1500ms (300 + 300 + 300 + 300 + 300，后结算 timer2)

// [2, 5]  // after 1800ms (300 + 300 + 300 + 300 + 300 + 300)
```

combineLatest 组合多个 Observable，其输出根据每个输入的 Observable 的最新值进行计算，其注意点是：
* 只有当所有的 入参 Observable 都有了第一个输出，才会进行首次结算，这也是为什么上面的 demo 中首次输出是在 timer1 的 500ms 时而不是在 timer2 的 300ms 时
* 首次结算之后，只要有任一 入参 Observable 输出了新值，均会进行结算，取的是当前时序点上各个 Observable 的最后一个值
* 如果多个(n 个) 入参 Observable 在同一个时序点上均输出了新值，那么会以同步的方式结算多次(即 n 次)，结算顺序依然遵行 入参 Observable 的顺序进行，当然如果一个 入参 Observable(如 ob10) 排在后面，前面的所有结算取的均不是该 入参 Observable(如 ob10) 的最新值，而是上一个值，这也是为什么上面的 demo 中在 1500ms 时会同时输入两次，且第一次 timer2 的值是 3，第二次 timer2 的值才是 4
* 入参形式有很多种，返回结果会根据入参形式变化，具体移步官网

### withLatestFrom
这个 operator 是一个特殊的 combineLatest，但是有优先(主副)关系，只有主要的 Observable 发出新值的时候，才会进行结算。注意使用方式也和 combineLatest 有点不一样：
```js
const clicks = fromEvent(document, 'click');
const timer = interval(1000);
const result = clicks.pipe(withLatestFrom(timer));

result.subscribe(x => console.log(x));

// output
// ...
```

### zip
zip 这个 operator，可以算是特殊的 combineLatest，只是核心功能不一样，取的是每一个入参 Observable 的同一个位置(index)上的的元素(数据)，demo 如下：
```js
const age$ = of(27, 25, 29);
const name$ = of('Foo', 'Bar', 'Beer');
const isDev$ = of(true, true, false);
 
zip(age$, name$, isDev$)
.pipe(
  map(([age, name, isDev]) => ({ age, name, isDev }))
)
.subscribe(x => console.log(x));

// Outputs
// { age: 27, name: 'Foo', isDev: true }
// { age: 25, name: 'Bar', isDev: true }
// { age: 29, name: 'Beer', isDev: false }
```

所以，zip 这个 operator，内部其实就是缓存各个位置的数据，然后同位置的拼凑在一起输出，这是优点也是缺点

## 二、一个稍复杂的拖拽 demo
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js"></script>

  <style>
    * {
      -webkit-box-sizing: border-box;
      -moz-box-sizing: border-box;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 2000px;
      /* background-color: tomato; */
    }

    #anchor {
      height: 360px;
      width: 100%;
      background-color: #F0F0F0;
    }

    .video {
      width: 640px;
      height: 360px;
      margin: 0 auto;
      background-color: black;
      &.video-fixed {
        position: fixed;
        top: 10px;
        left: 10px;
        width: 320px;
        height: 150px;
        cursor: all-scroll;
      .masker {
          display: none;
        }
        &:hover {
          .masker {
            display: block;
            position: absolute;
            width: 100%;
            height: 180px;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 2;
          }
        }
      }
    }
  </style>
</head>
<body>
  <div id="anchor">
    <div class="video" id="video">
      <div class="masker"></div>
      <video width="100%" controls>
        <source src="http://download.blender.org/peach/bigbuckbunny_movies/big_buck_bunny_480p_stereo.ogg" type="video/ogg" />
        Your browser does not support HTML5 video.
      </video>
    </div>
  </div>

  <script>
    const { fromEvent, map, concatAll, takeUntil, filter, withLatestFrom, pipe, } = rxjs;

    // 滚动的相关逻辑
    const video = document.querySelector('#video');
    const anchor = document.querySelector('#anchor');
    const scroller$ = fromEvent(document, 'scroll');

    scroller$
      .pipe(map(e => anchor.getBoundingClientRect().bottom < 0))
      .subscribe(canFixed => {
        video.classList.toggle('video-fixed', canFixed);
      });

    // 拖拽的相关逻辑
    const mouseDown$ = fromEvent(video, 'mousedown');
    const mouseUp$ = fromEvent(document, 'mouseup');
    const mouseMove$ = fromEvent(document, 'mousemove');

    mouseDown$
      .pipe(
        filter(e => video.classList.contains('video-fixed')),
        map(e => mouseMove$.pipe(takeUntil(mouseUp$))),
        concatAll(),
        withLatestFrom(mouseDown$, (move, down) => {
          const { clientX, clientY } = move;
          const { offsetX, offsetY } = down;
          const { innerWidth, innerHeight } = window;

          return { 
            x: validValue(clientX - offsetX, innerWidth - 320, 0),
            y: validValue(clientY - offsetY, innerHeight - 180, 0),
          }
        })
      )
      .subscribe(pos => {
        const { x, y } = pos;

        video.style.left = `${x}px`;
        video.style.top = `${y}px`;
      })

    // util 函数
    function validValue(value, max, min) {
      return Math.min(Math.max(value, min), max);
    }
  </script>
</body>
</html>
```
 