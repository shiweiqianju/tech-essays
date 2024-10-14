# 位运算符在JS中的运用

## 零、参考
* [JavaScript 中的位运算和权限设计](https://juejin.cn/post/6844903988945485837)
* [javascript位运算技巧](https://zhuanlan.zhihu.com/p/339012370)
* [巧用JS位运算](https://zhuanlan.zhihu.com/p/34294099)
* [JavaScript位运算及其妙用](https://zhuanlan.zhihu.com/p/686753949)
* [聊聊JavaScript中的二进制数](https://zhuanlan.zhihu.com/p/22297104)

## 一、权限
在权限设计时，每一个基础权限单元都是二进制数形式，有且只有一位值是 1，其余全部是 0，即权限码是 ```2^n```

所以，在这套设计中：
* ```|``` 可以用来赋予权限
* ```&``` 可以用来校验权限

比如：Linux 的文件权限分为读、写和执行，有字母和数字等多种表现形式：
| 权限 | 字典表示 | 数字表示 | 二进制 |
| :---- | :----: | :----: | :----: |
| 读 | r | 4 | 0b100 |
| 写 | w | 2 | 0b010 |
| 执行 | x | 1 | 0b001 |

#### 权限的添加
```js
let r = 0b100
let w = 0b010
let x = 0b001

// 给用户赋全部权限（使用前面讲的 | 操作）
let user = r | w | x;

console.log(user) // 7
console.log(user.toString(2)) // 111

// r = 0b100
// w = 0b010
// r = 0b001
// r|w|x = 0b111
```

#### 权限的校验
```js
let r = 0b100
let w = 0b010
let x = 0b001

// 给用户赋 r w 两个权限
let user = r | w
// user = 6
// user = 0b110 (二进制)

console.log((user & r) === r) // true 有 r 权限
console.log((user & w) === w) // true 有 w 权限
console.log((user & x) === x) // false 没有 x 权限
```

#### 权限的删除
删除权限的本质其实是将指定位置上的 1 重置为 0。如何操作？

* 使用 异或
  ```js
  let r    = 0b100
  let w    = 0b010
  let x    = 0b001
  let user = 0b110 // 有 r w 两个权限

  // 执行异或操作，删除 r 权限
  user = user ^ r

  console.log((user & r) === r) // false 没有 r 权限
  console.log((user & w) === w) // true  有 w 权限
  console.log((user & x) === x) // false 没有 x 权限

  console.log(user.toString(2)) // 现在 user 是 0b010

  // 再执行一次异或操作
  user = user ^ r

  console.log((user & r) === r) // true  有 r 权限
  console.log((user & w) === w) // true  有 w 权限
  console.log((user & x) === x) // false 没有 x 权限

  console.log(user.toString(2)) // 现在 user 又变回 0b110
  ```
  但是，异或实际上执行的是 toggle 操作，即有则删除、无则添加，并不是纯粹的删除操作
* 联合使用 取反 & 与 操作
  ```js
  let r    = 0b100
  let w    = 0b010
  let x    = 0b001
  let user = 0b110 // 有 r w 两个权限

  // 删除 r 权限
  user = user & (~r)

  console.log((user & r) === r) // false 没有 r 权限
  console.log((user & w) === w) // true  有 w 权限
  console.log((user & x) === x) // false 没有 x 权限

  console.log(user.toString(2)) // 现在 user 是 0b010

  // 再执行一次
  user = user & (~r)

  console.log((user & r) === r) // false 没有 r 权限
  console.log((user & w) === w) // true  有 w 权限
  console.log((user & x) === x) // false 没有 x 权限

  console.log(user.toString(2)) // 现在 user 还是 0b010，并不会新增
  ```

#### 局限
这种方式的局限在于权限单元的是有数量上限的，即  ```1, 2, 4, 8,...,1024,...``` ，不过在 Javascript 中很难用尽就是了，问题倒是也不算大

## 二、属性集的构建
这样的例子比较多，比如在 [巧用JS位运算](https://zhuanlan.zhihu.com/p/34294099) 文章中作者就用来判断弹窗与视口的重叠情况：
```js
// 边界判断，总共有3种超出情况：右、上、左，并且可能会叠加，如鼠标在左上角的时候会导致左边和上面同时超出。需要记录超出的情况进行调整，用001表示右边超出，010表示上方超出，100表示左边超出，如下代码计算:
let postFlag = 0;

if(pos.right < maxLen) posFlag |= 1; // 右边超出
if(pos.top < maxLen) posFlag |= 2; //上面超出
if(pos.left < maxLeftLen) posFlag |= 4; // 左边超出

//对超出的情况进行处理，代码略
switch(posFlag){
  case 1: //右
  case 2: //上
  case 3: //右上
  case 4: //左
  case 6: //左上
}
```
VUE3 中对 vNode 的类型的设置，也是运用的这套思路

## 三、奇偶性判断
* 偶数 & 1 = 0
* 奇数 & 1 = 1

## 四、取整
```js
~~11.71 // 11
11.71 >> 0 // 11
11.71 << 0 // 11
11.71 | 0 // 11
11.71 >>> 0 // 11
```

#### 注意
* 对正数使用位运算符，效果等同于 Math.floor，对负数，效果则等同于 Math.ceil
* ```>>>``` 不可对负数取整


## 五、代替 Math.round()
* 对于正数： A + 0.5 | 0 
* 对于负数： A - 0.5 | 0

## 六、检查数字是否不相等(取个反就是相等判断)
```js
if (a !== 1171) {...};
// 等价于
if (a ^ 1171) {...};

// 取反进行相等判断
if (!(a ^ 1171)) { ... }
```
