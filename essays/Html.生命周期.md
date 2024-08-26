# Html 生命周期

## 零、序言
* [页面生命周期](https://segmentfault.com/a/1190000011468675)
* [HTML，javascript，image等加载,DOM解析，js执行生命周期](https://www.cnblogs.com/kidsitcn/p/5424433.html)

## 一、页面周期
1. ```DOMContentLoaded``` - 浏览器已经加载了 Html, DOM 树已经构建完毕，但是 img 和外部样式表等资源可能还没有下载完毕
2. ```load``` - 浏览器已经完全加载了所有资源
3. ```beforeunload``` - 用户即将离开页面
4. ```unload``` - 用户离开页面

## 二、DOMContentLoaded
```DOMContentLoaded``` 事件由 ```document``` 对象触发，我们可以使用 ```addEventListener``` 来触发

正如前文所说，在这个事件触发的时候，我们如果获取某些 ```img``` 的宽度和高度的话，得到的可能是 0

当然这里是有陷阱的，如与脚本 ```<script />``` 的整合：  

首先有一点，浏览器的 UI 渲染线程和 JS 引擎是互斥的，当 JS 引擎执行时 UI 线程会被挂起。因此，当浏览器在解析 HTML 时遇到 ```<script />``` 时，将不会继续构建 ```DOM``` 树，转而取解析、执行脚本，所以 ```DOMContentLoaded``` 有可能在所有脚本执行完毕之后触发。

外部脚本(通过 ```src``` 引入)的加载和解析和自带的一样会暂停 ```DOM``` 树的构建，这里 ```DOMContentLoaded``` 会等待。

不过有两个特殊的情况，如果外部脚本上带有 ```async``` 或者 ```defer``` 属性，那么浏览器会继续执行 ```DOM``` 解析而不需要等待脚本的完全执行，所以这一直时外部脚本的优化方案之一。（```async``` 和 ```defer``` 属性仅对外部脚本起作用， 当 ```src``` 不存在的时候会被自动忽略）

关于 ```async``` 和 ```defer``` 与 ```DOM``` 的解析顺序如下图所示：

![](./../assets/images/html-lifecycle.png)

既然提到了 ```async``` 和 ```defer```, 也顺带整理一下他们的异同：

|  | async | defer |
| :---- | :---- | :---- |
| 顺序 | 带有 ```async``` 的脚本是优先执行先加载完的脚本，即他们在页面中的顺序并不保证他们的执行顺序 | 带有 ```defer``` 的脚本时按照他们在页面中出现的顺序依次执行 |
| ```DOMContentLoaded``` | 带有 ```async``` 的脚本也许会在页面没有完全下载完之前就加载，这种情况会在脚本很小或本缓存，并且页面很大的情况下发生 | 带有 ```defer``` 的脚本会在页面加载和解析完毕后执行，刚好在 ```DOMContentLoaded``` 之前执行 |

所以 async 用在完全没有依赖和被依赖的脚本上

## 三、load
```load``` 事件是在 ```window``` 对象上的，这与 ```DOMContentLoaded``` 不同。该事件在所有文件包括样式表，图片和其他资源下载完毕后触发。既然这样规定，自然该干啥干啥，没什么明显的陷阱

## 四、beforeunload
如果用户即将离开页面或关闭窗口时，```beforeunload``` 事件将会被触发以进行额外的确认。举个例子：
```js
window.onbeforeunload = function() {
  return "There are unsaved changes. Leave now?";
};
```
当然，如果在 chrome 和 firefox 浏览器中会忽略返回的自定义的字符串，这是出于安全考虑的  

另外，F5 刷新是会触发这个事件的

## 五、unload
```unload``` 事件与 ```load``` 事件一样，是在 ```window``` 对象上的，触发时间为用户关闭该页面的时候，我们可以做一些不存在延时的任务，比如关闭弹层等等  

MDN 已经不推荐使用这个事件，需要注意这一点

## 六、readyState
```document.readyState``` 这个只读属性可以告诉程序当前文档加载到哪一个步骤，它有三个值：
* ```loading``` - 加载，```document``` 仍在加载中
* ```interactive``` - 可交互，文档已经完成加载，文档已被解析，但是诸如图像，样式表和框架之类的子资源仍在加载
* ```complete``` - 文档和所有子资源已完成加载。状态表示 ```load``` 事件即将被触发

而这个属性的每次改变同样有一个事件可以监听：
```js
document.addEventListener('readystatechange', () => console.log(document.readyState));
```

不过这个 ```change``` 事件很少会被用到，可能出现的地方在某些第三方类库中判断一些依赖关系等地方。不详述，具体可移步文首的文章或者 MDN
