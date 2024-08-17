# CSS BFC

## 零、参考
* [[布局概念] 关于CSS-BFC深入理解](https://juejin.cn/post/6844903476774830094)
* [深入理解BFC](https://www.cnblogs.com/xiaohuochai/p/5248536.html)
  
## BFC的概念以及通俗理解
通俗理解：BFC就是css布局的一个概念，是一块区域，一个环境。可以简单的理解为某个元素的一个 CSS 属性，只不过这个属性不能被开发者显式的修改，拥有这个属性的元素对内部元素和外部元素会表现出一些特性，这就是 BFC

较官方概念：块级格式化上下文。它是一个独立的渲染区域，只有 Block-level box 参与（在下面有解释）， 它规定了内部的 Block-level Box 如何布局，并且与这个区域外部毫不相干。

我们常说的文档流其实分为定位流、浮动流和普通流三种。而普通流其实就是指 BFC 中的 FC - formatting 。是页面中的一块渲染区域，有一套渲染规则，决定了其子元素如何布局，以及和其他元素之间的关系和作用。

常见的 FC 有 BFC、IFC（行级格式化上下文）、GFC（网格布局格式化上下文）和FFC（自适应格式化上下文）

## BFC 的触发条件：
1. 根元素，即 HTML 元素
2. float 的值不为 none
3. overflow 的值不为 visible
4. display 的值为 inline-block、table-cell、table-caption
5. position 的值为 absolute 或 fixed 

## BFC 触发后的布局规则：
1. 内部的 Box 会在垂直方向，一个接一个地放置
2. Box 垂直方向的距离由 margin 决定。属于同一个 BFC 的两个相邻 Box 的 margin 会发生重叠
3. 每个元素的 margin box 的左边，与包含块 border box 的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此
4. BFC 的区域不会与 float box 重叠
5. BFC 就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此
6. 计算 BFC 的高度时，浮动元素也参与计算

## 对 BFC 布局的解释和常见应用：
#### 规则1：就是我们平常 ```div``` 一行一行块级放置的样式，不多说；

#### 规则2：同一个 ```BFC```的两个相邻 ```Box``` 的 ```margin``` 会发生重叠，见下例：
```html
<!-- html -->
<div class="aside"></div>
<div class="main">
  <div class="text"></div>
</div>
       
<!-- css -->
<style>
.aside {
  margin-bottom: 100px;
  width: 100px;
  height: 150px;
  background-color: #f66;
}
 
.main {
  overflow: hidden;
}
.text {
  background-color: #fcc;
  margin-top: 100px;
  height: 200px;
}
</style>
```

![](./../assets/images/CSS.BFC.rule-02.gif)  

按照如上写法， ```.aside``` 与 ```.text``` 之间的空白区域高度是 ```200px```(因为不属于同一个 ```BFC```)，而把 ```.text``` 的样式注释掉，空白区域变成 ```100px```(两者同属于根元素的 BFC)，见下图：

#### 规则3：左浮是 ```子 div``` 的左边接触 ```父 div``` 的 ```border box``` 的左边，右浮是```子 div``` 接触 ```父 div``` 的 ```border box``` 右边，除非设置 ```margin``` 来撑开距离，否则一直是这个规则。见下例：
```html
<!-- html -->
<div class="par">
  <div class="child"></div>
  <div class="child"></div>
</div>
 
<!-- css -->
<style>
.par {
  width: 300px;
  border: 10px solid #fcc;
  overflow: hidden;
}

.child {
  float: left;
  width: 100px;
  height: 100px;
  border: 10px solid #f66;
}
</style>
```

![](./../assets/images/CSS.BFC.rule-03.gif)    

因此，通常使用的 ```overflow: hidden;``` 方法来清除浮动就是利用的 ```BFC``` 的触发条件 3 来实现的。

#### 规则4：```BFC``` 的区域不会与 ```float box``` 重叠：首先看下例子 - 自适应两栏布局：
```html
<!-- html -->
<div class="aside"></div>
<div class="main">
  <div class="text"></div>
</div>

<!-- css -->
<style>
.aside {
  width: 100px;
  height: 150px;
  float: left;
  background: #f66;
}
 
.main {
  width: 500px;
  background: lightblue;
}
.text {
  height: 200px;
  overflow: hidden; /* 触发 .text 盒子的 BFC 规则 */
  background: #fcc;
}
</style>
```

![](./../assets/images/CSS.BFC.rule-04.gif)    

上面盒子 ```.aside``` 左浮动(同时覆盖部分 ```.main``` 盒子)，因此 ```.text``` 盒子在没有触发 ```BFC``` 的情况下会被覆盖。而后来 ```.text``` 盒子触发 ```BFC``` ，根据规则 4 ，就会显示成两栏布局的样子
