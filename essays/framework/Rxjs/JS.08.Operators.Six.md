# Rxjs Operators - Six

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs - for Higher Order Observable
### concatAll
详见 [Rxjs Operators - One](./JS.05.Operators.Three.md)

### switchAll
这个 operator 也是扁平化高阶的 Observable，但是功能是抛弃前面的源 Observable，只关注最新的源 Observable，以下面的 demo 为例：
```js
const clicks = fromEvent(document, 'click').pipe(tap(() => console.log('click')));
const source = clicks.pipe(map(() => interval(1000)));
const result = source.pipe(switchAll());

result
  .subscribe(x => console.log(x));
```

虽然代码上是这样写的，需要结合操作才能明白整体功能，操作如下：
* 激发一次 ```click```，称之为 ```c1```，总时间轴开始计时
* 在 ```c1``` 之后的 1s 内激发 ```c2```（比如 500ms，即总时间轴上的第 0.5s，这是关键的一步）
* ```c2``` 激发之后，过 3s（其实只需要 1s，为了更好的理解，最好 >= 2s）后激发 ```c3```
* 观察控制台打印结果

分析过程：
* 激发 ```c1```，会产生一个子 Observable，```----0----1----2----3----...```(即 1s 后开始依序打印)，我们命名为 ```c1-OB```
* 在 500ms 时激发 ```c2```，```c2``` 也产生了一个 ```c2-OB``` 的子 Observable，这意味着此时 ```c1-OB``` 中的首位还没开始输出，而经过 ```switchAll``` 这个 operator，输出流就会抛弃(退订)掉 ```c1-OB```，并以 ```c2-OB``` 为最新流执行后续的代码，所以，从总时间线来看，第 1s 后并不会输出 '0'
* 在总时间轴的第 1.5s(500ms + 1000ms)，输出 '0'，这是 ```c2-OB``` 的首位元素，之后间隔 1s，输出 '1'，再间隔 1s，输出 '2'
* 在总时间轴的第 3.5s(500ms + 3000ms)，激发 ```c3```，产生 ```c3-OB``` 的子 Observable，此时输出流抛弃掉(退订) ```c2-OB```，并以 ```c3-OB``` 为最新流执行后续的代码
* 于是，在总时间轴的第 4.5s，控制台输出 ```----0----1----2----3----4----...```

### mergeAll
功能上和 merge 这个 operator 一致，不同的是调用对象，mergeAll 的使用方法是 ```higherObservable.mergeAll()``` 这样，而 merge 则是 ```merge(ob1, ob2, ob3, ...)``` 这样
```js
const clicks = fromEvent(document, 'click');
const higherOrder = clicks.pipe(map(() => interval(1000)));
const firstOrder = higherOrder.pipe(mergeAll());

firstOrder.subscribe(x => console.log(x));
```

这个 operator 入的参数，表示同时处理的子 Observable 的数量(子 Observable 池)，只有当当前处理的子 Observable 数量小于该参数的时候，才会开始处理下一个(即取一个新的子 Observable 来订阅)

### mergeMap
功能上其实就是 merge 和 map 的结合体  
和 map 不同的是，map 是**一对一**的关系，即：源 Observable 上的**一个值**只会对应 镜像(最终的) Observable 上的**一个**值  
而 mergeMap 是**一对多**的关系，即：源 Observable 上的**一个值**会对应产生**一组值**，这一组值相当于是一个新的 子 Observable，然后，将所有的这些 子 Observable merge 一下，形成最终的镜像(输出) Observable
```js
const letters = of('a', 'b', 'c');
const result = letters.pipe(
  mergeMap(x => interval(1000).pipe(map(i => x + i)), 2)
);
 
result.subscribe(x => console.log(x));

// Results in the following:
// a0
// b0
// c0

// a1
// b1
// c1

// a2
// b2
// c2

// a3
// b3
// c4

// continues to list a, b, c every second with respective ascending integers
```

还能入一个参数 ```concurrent```，也很好理解，同时处理的流的数量

### concatMap
理解了 mergeMap，concatMap 也就容易很多，就是把并发参数(```concurrent```)设置为 1

### switchMap
这个 operator，从试验下来的结果来看，就是先跑一下 map ，然后再跑一下 switchAll，官网上翻译下来的结果也差不多：
> Maps each value to an Observable, then flattens all of these inner Observables using switchAll.

```js
const switched = of(1, 2, 3).pipe(
  switchMap(x => of(x, x ** 2, x ** 3))
);
switched.subscribe(x => console.log(x));

// 等价于
// const switched = of(1,2,3).pipe(
//   map(x => of(x, x ** 2, x ** 3)),
//   switchAll(),
// )
// switched.subscribe(console.log);

// another demo
const clicks = fromEvent(document, 'click').pipe(tap(() => console.log('click')));
const source = clicks.pipe(map(() => interval(1000)));
const result = source.pipe(switchAll());

result
  .subscribe(x => console.log(x));

// 等价于
// const clicks = fromEvent(document, 'click').pipe(tap(() => console.log('click')));
// const result = source.pipe(switchMap(() => interval(1000)));

// result
//   .subscribe(x => console.log(x));
```

## 二、简易 autocomplete 的 demo
需求：一个搜索框，100ms 内没有输入则请求数据，并将搜索结果显示；点击某一个数据后，将该数据显示在搜索框中

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
      background-color: white;
      padding: 0;
      margin: 0;
    }

    .autocomplete {
      position: relative;
      display: inline-block;
      margin: 20px;
    }

    .input {
      width: 200px;
      border: none;
      border-bottom: 1px solid black;
      
      padding: 0;
      line-height: 24px;
      font-size: 16px;
      &:focus {
        outline: none;
        border-bottom-color: blue;
      }
    }

    .suggest {
      width: 200px;
      list-style: none;
      padding: 0;
      margin: 0;
      -webkit-box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      li {
        cursor: pointer;
        padding: 5px;
        &:hover {
          background-color: lightblue;
        }
      }
    }
  </style>
</head>
<body>
  <div class="autocomplete">
    <input type="search" class="input" id="search" autocomplete="off" />

    <ul id="suggest-list" class="suggest"></ul>
  </div>

  <script>
    const { 
      tap, pipe,
      fromEvent, of,
      map, debounceTime, 

      switchMap, filter,
    } = rxjs;

    // dom
    const searchInput = document.querySelector('#search');
    const suggestList = document.querySelector('#suggest-list');

    // Observable
    const keywordInput$ = fromEvent(searchInput, 'input');
    const selectItem$ = fromEvent(suggestList, 'click');

    keywordInput$.pipe(
      debounceTime(100),
      switchMap(ev => {
        const keyword = ev.target.value;

        return getSuggestList(keyword);
      })
    ).subscribe({
      next: value => {
        const htmlTemplate = value.reduce((total, current) => `${total}<li>${current.value}</li>`, '')

        suggestList.innerHTML = htmlTemplate;
      },
    });

    // 
    selectItem$.pipe(
      filter(ev => { return ev.target.matches('li'); }),
      map(ev => ev.target.innerText),
    ).subscribe({
      next: text => {
        searchInput.value = text;
      },
    });

    // utils
    function getSuggestList(keyword) {
      return mockFetch()
    }

    function mockFetch() {
      const mockList = [
        { id: '1', value: '输入建议1', },
        { id: '2', value: '输入建议2', },
        { id: '3', value: '输入建议3', },
        { id: '4', value: '输入建议4', },
        { id: '5', value: '输入建议5', },
      ];

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(mockList);
        }, 3000);
      })
    }

  </script>
</body>
</html>
```

当然，这里只是一个简单的示例，仍有很多细节未体现：
* 我们使用 ```setTimeout``` 来模拟请求，使用 ```switchMap``` 确实可以放弃上一个请求，但是这里的放弃只是忽视了上一个请求的返回值，而不是真正的取消上一个请求
* 如果在通信过程中发生中断等情况，可以进行重试，那么 ```retry``` 操作符应该加在哪个位置上
