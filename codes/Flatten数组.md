# Flatten 数组

## # Reduce 实现
```js
const flatten = (target = [], level = Infinity) => target.reduce((total, current) => (
  total.concat(
    (!Array.isArray(current) || level === 0) ? current : flatten(current, level - 1)
  )
), [])
```

## # Generator 实现
```js
// Generator 版本
const flatten = (arr, level = Infinity) => {
  let result = [];
  const loop = function*(arr, level) {
    for (let item of arr) {
      if (!Array.isArray(item) || level === 0) {
        yield item;
      } else {
        yield* loop(item, level - 1);
      }
    }
  }

  for (let val of loop(arr, level)) {
    result.push(val);
  }

  return result;
}
```
