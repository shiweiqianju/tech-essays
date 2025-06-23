# Rxjs Operators - Five

## 零、参考
* [30 天精通 RxJS](https://blog.jerry-hong.com/series/rxjs)

## 一、APIs
### catchError
捕获源 Observable 中的错误，并根据需要进行后续的操作
```js

// 返回一个新的 Observable
of(1, 2, 3, 4, 5)
  .pipe(
    map(n => {
      if (n === 4)  throw 'four!';

      return n;
    }),
    catchError(err => of('I', 'II', 'III', 'IV', 'V'))
  )
  .subscribe(x => console.log(x));
// 1, 2, 3, I, II, III, IV, V

// 返回源 Observable
of(1, 2, 3, 4, 5)
  .pipe(
    map(n => {
      if (n === 4)  throw 'four!';

      return n;
    }),
    catchError((err, origin) => origin),
    take(10)
  )
  .subscribe(x => console.log(x));
// 1, 2, 3, 1, 2, 3, 1, 2, 3, 1 |

// 以错误结束并抛出来
of(1, 2, 3, 4, 5)
  .pipe(
    map(n => {
      if (n === 4)  throw 'four!';

      return n;
    }),
    catchError((err, origin) => {
      throw `err in origin, details: ${err}`;
    }),
    take(10)
  )
  .subscribe(
    x => console.log(x),
    err => console.log(err)
  );
// 1, 2, 3, 'err in origin, details: four!'
```

### retry
在发生错误时从头开始重试，可以指定重试次数，完成最后一次后，抛出错误。如不指定，则为无限次，并不抛出错误。demo 如下：
```js
of(1, 2, 3, 4, 5)
  .pipe(
    map(n => {
      if (n === 4)  throw 'four!';

      return n;
    }),
    retry()
  )
  .subscribe(
    x => console.log(x),
    err => console.log(err)
  );
```

### retryWhen
retryWhen 的概念比较简单，麻烦的是其入参函数：
* 这个入参函数本身是需要有返回值的，虽然返回值也是一个 Observable，根据官网的描述，这个返回值应该是可以终止的(```complete``` 或者 ```error```) ，如果不是可终止的(比如 interval 这种)，最终的输出流表现就很诡异
* 入参函数本身有个入参，类型也是一个 Observable，其值就是把 源 Observable 中抛出的错误
  
具体的一些 情况 暂列如下：
```js

const source = interval(1000);
const result = source.pipe(
  map(value => {
    if (value > 5) throw value;

    return value;
  }),
  retryWhen(errors => {
    /**
     * 如果是不能终止的，则最终的输出相当诡异
     */
    // return interval(2000);

    /**
     * 如果是已经 complete 的，则不会进行 retry，并调用 subscribe 中的 complete
     */
    // return of(10000)

    /**
     * 如果直接返回 入参，似乎会无限 retry
     */
    // return errors
  
    /**
     * 如果对入参进行操作，则会进行相应的计算
     */
    return errors.pipe(
      delayWhen(value => {  // 这个 value, 就是上面 map 中 throw 出来的 value
        return timer(value * 1000);
      })
      // interval(5000) // 这种写法直接报错
    )
  })
);
 
result.subscribe(
  value => console.log(value),
  err => console.log('err', err),
  complete => console.log('complete', complete),
);
```

### repeat
和 retry 基本一致，retry 满足条件才进行重复，而 repeat 则是源 Observable ```complete``` 之后执行
```js
const source = interval(1000).pipe(take(3))
const result = source.pipe(
  repeat(3)
)

result.subscribe(
  console.log,
  console.error,
  () => console.log('complete'),
)
```
