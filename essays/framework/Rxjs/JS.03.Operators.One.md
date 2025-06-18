# Rxjs Operators - One

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 零五式、特别注意
* <strong><font color=red>不同版本的 Operators 的返回值略有差异，这导致了返回值以及入参的方法有变动，具体查看各个版本的文档</font></strong>
* * <strong><font color=red>高版本的 Rxjs 需要使用 ```pipe``` 进行链式操作，这和以前的版本的使用方式是不一样的</font></strong>

## 一、基本概念
这个基本上对应于 Array 中的一些高阶 API，均是纯函数。

## 二、APIs
### map
和 Array 的 map 方法使用上大差不差，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let newSource = source.pipe(map(x => x + 2));

newSource.subscribe(console.log)
// 2 --> 3 --> 4 --> ...
```

### mapTo
和 map 过程一致，只不过返回值是固定值，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let newSource = source.pipe(mapTo(2));

newSource.subscribe(console.log)
// 2 --> 2 --> 2 --> ...
```

### filter
和 Array 的 map 方法使用上大差不差，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let newSource = source.pipe(filter(x => x % 2 === 0));

newSource.subscribe(console.log)
// source's marble diagrams:    -----0-----1-----2-----3-----4-----....
// newSource's marble diagrams: -----0-----------2-----------4-----....
```

### take
一个简单的 operator，取前面几位元素后结束，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let newSource = source.pipe(take(3));

newSource.subscribe(console.log)
// newSource's marble diagrams: -----0-----1-----2 |
```

### first
一个简单的 operator，take 的特化版，取第 1 位元素后结束，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let newSource = source.first();

newSource.subscribe(console.log)
// newSource's marble diagrams: -----0 |
```

### takeUntil
一个常用的 operator，表示一直取值，直到某一个节点发生(notifier，这也是一个 Observable)，demo 如下：
```js
let source = Rx.Observable.interval(1000);
let clicks = Rx.Observable.fromEvent(document, 'click'); // notifier，takeUtil 的入参
let newSource = source.pipe(takeUntil(clicks));

newSource.subscribe(console.log)
// source:    -----0-----1-----2-----3-----4-----....
// clicks:    --------------------------click----....
// newSource: -----0-----1-----2-----3-- |
```

### concat
一个常用的 operator，将多个 Observable 依照入参顺序连接起来，demo 如下：
> 细节是，只有上一个 源 Observable 结束了才会切入到下一个 源 Observable
```js
const { 
  pipe, range, take, concat,
} = rxjs;

let inter = interval(1000).pipe(take(4));
let sequence = range(1, 10);
let result = concat(inter, sequence);
result.subscribe(x => console.log(x));

// marble diagrams 移步官网
```

### concatAll
将一个高阶的 Observable 扁平化，demo 如下：  
clicks 是一个 Observable 流，里面可以触发多次 click 事件，而每次触发，都会输出另外一个 子 Observable 流。concatAll 的作用就是将所有的子流串联在一起，形成一个新的 Observable 流
```js
const clicks = fromEvent(document, 'click');
const higherOrder = clicks.pipe(
  map(() => interval(1000).pipe(take(4)))
);
const firstOrder = higherOrder.pipe(concatAll());
firstOrder.subscribe(x => console.log(x));
 
// Results in the following:
// (results are not concurrent)
// For every click on the "document" it will emit values 0 to 3 spaced
// on a 1000ms interval
// one click = 1000ms-> 0 -1000ms-> 1 -1000ms-> 2 -1000ms-> 3

// marble diagrams 移步官网
```

## 三、一个简易的拖拽 demo
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js"></script>

  <style>
    html, body {
      height: 100%;
      /* background-color: tomato; */
      position: relative;
    }

    #drag {
      position: absolute;
      display: inline-block;
      background-color: tomato;
      width: 100px;
      height: 100px;
      /* background-color: #fff; */
      cursor: all-scroll;
    }
  </style>
</head>
<body>
  <div id="drag"></div>

  <script>
    const { 
      fromEvent, map, interval, take, concatAll, takeUntil
    } = rxjs;
    
    const dragDom = document.querySelector('#drag');
    const body = document.body;

    const mouseDown = fromEvent(dragDom, 'mousedown');
    const mouseUp = fromEvent(body, 'mouseup');
    const mouseMove = fromEvent(body, 'mousemove');

    mouseDown
      .pipe(
        map(event => mouseMove.pipe(takeUntil(mouseUp))),
        concatAll(),
        map(event => {
          const { clientX: x, clientY: y } = event;

          return { x, y };
        })
      ).subscribe(pos => {
        const { x, y } = pos;

        dragDom.style.left = `${x}px`;
        dragDom.style.top = `${y}px`;
      });

  </script>
</body>
</html>
```
