# CSS 实现视差滚动

## 零、参考
* [面试官：用css实现视差滚动效果😒，我：茴香豆的茴有三种写法🚀，面试官：?你说多少？😱](https://juejin.cn/post/7453676096662339634)

## 视差滚动
视差滚动是一种效果，能够使不同层次的元素以不同的速度进行滚动，从而产生了视觉上的深度感和动态效果

### 方案一： `background-attachment: fixed`
于是：(见 demo：[视差滚动](./background.html))

#### 不足
- 这种方法比较单一，适合要求不那么高的静态页面

### 方案二： `transform-style: preserve-3d && perspective`
于是：(见 demo：[视差滚动](./transform3D.html))

#### 一些说明
- ```perspective: perspective``` 这个属性定义我们眼睛看到的 3D 效果，这里定义 1px 表示景深；
- ```transform-style: preserve-3d``` 定义 3D 空间变换；
- ```transform: translateZ(-1px) scale(2.2)```，其中 ```translateZ(-1px)``` 表示改元素在 3D 转换中处于(离视口) -1px 的位置上，这个数值需要与**景深**成相反数；而因为改变了元素在 Z 轴上的位置，所以需要使用 ```scale``` 对元素进行缩放使得元素能显示合适的大小
- 子元素 ```section``` 上又使用了 ```transform-style: preserve-3d```，表示这里有自己的 3D 空间，避免父元素的 3D 效果影响
- 使用 ```::before``` 伪元素进行独立的背景设置和操作