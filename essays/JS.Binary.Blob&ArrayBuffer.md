# JS 中的二进制 - Blob 与 ArrayBuffer
## 零、参考资料
* [《图解 + 实战》File、Blob、TypedArray、DataView ](https://juejin.cn/post/7284513473316667453)
* [JavaScript也有操作二进制的一天：聊ArrayBuffer和Blob ](https://juejin.cn/post/6905180333151354887)
* [聊聊JS的二进制家族：Blob、ArrayBuffer和Buffer](https://zhuanlan.zhihu.com/p/97768916)

## 一、定义
* 宏观：Blob - 表示一个不可变、原始数据的类文件对象，可读不可写
* 微观：ArrayBuffer - 表示通用的原始二进制数据缓冲区，可读不可写

## 二、Blob
这个对象被设计出来就是为了方便进行文件的操作，所以看定义，是一个"原始数据"、"类文件"对象。
 
Blob 对象"不可变"，其中的数据可以按照文本或者二进制格式进行读取；但是我们可以转换成 ReadableStream 去进行数据操作(进行操作的对象和原对象基本没啥关系了)。
 
Blob 对象一个重要的 slice 方法，其作用是将一个大 Blob 分割为多个小 Blob，这也是 FE 能实现分段上传文件的核心 API。
 
File 对象则是一个特殊的 Blob 对象，是基于用户的操作系统拓展的 Blob，使用户可以通过浏览器安全的访问系统的本地文件。

## 三、ArrayBuffer、TypedArray 和 DataView
### （一）由来
为了充分利用 3D 图形 API 和 GPU 加速在 canvas 上渲染复杂图形，出现了WebGL(Web Graphics Library)。但因为 JavaScript 运行时中的数组并不存在类型，所以当WebGL底层与 JavaScript 之间传递数据时，需要为目标环境分配新数组，并以当前格式迭代，这将花费很多时间。

为了解决这个问题，则出现了定型数组(TypeArray)。通过定型数组 JavaScript 可以分配、读取、写入数组，并直接传给底层图形驱动程序，也可直接从底层获取。

既然定型数组赋予 JavaScript 跟底层进行数据交换的能力，那么就同样会出现与其他设备/网络进行二进制数据的交流，应对更复杂的场景，DataView 也应运而生。

他们以数组的语法处理二进制数据，所以统称为二进制数组，TypedArray 和 DataView 可以像C语言一样通过修改下标的方式直接操作内存

### （二）ArrayBuffer
ArrayBuffer对象用来表示通用的、固定长度的原始数据缓冲区，是一个普通的 JavaScript 构造函数，可用于内存中分配特定数量的字节空间。ArrayBuffer 存储原始的二进制数据，本身是可读不可写的，只是一个数据容器，所以才有了 TypedArray 与 DataView 去完成写入工作。
```js
const buf = new ArrayBuffer(16) // 在内存中分配16字节

console.log(buf.byteLength) // 16
```
ArrayBuffer 和 JavaScript 数组在使用上是完全不同的，有三个区别：
* ArrayBuffer 初始化后是固定大小的，并且可读不可写；
* 数组里面可以放数字、字符串、布尔值以及对象和数组等，ArrayBuffer 放0和1组成的二进制数据；
* ArrayBuffer 放在栈中，而 Array 放在堆中；

### （三）TypedArray
ypeArray是一个统称，实际使用的是特定元素类型的类型化数组构造函数：[类型化数组 - TypedArray](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)。
 
常用于音视频、canvas、录音，处理网络中接收到的二进制数据，web work 中的大量数据处理场景。

### （四）DataView
专为文件 I/O 和网络 I/O 设计，对缓冲数据有高度的控制，但比其他视图性能差一点。跟 TypeArray 不同，DataView 视图中允许存在多种类型。

常用于构建二进制文件或格式化文件。

## 四、总结
### （一）Blob 和 ArrayBuffer
* Blob实际上就是针对文件设计出来的对象，而 ArrayBuffer 针对需要传输的数据本身；
* Blob主要解决媒体类型（MIME）的问题，ArrayBuffer 解决的是数据类型问题；
* Blob是浏览器的api，ArrayBuffer 则是 JavaScript 中的标准，ArrayBuffer 是更底层的API，可以直接操作内存；

### （二）二进制数组操作场景
* 与底层显卡/外部设备进行二进制数据交互
* 利用 SharedArrayBuffer 在不同 worker 间共享内存
* ...

## 五、其他
### （一）FileReader
FileReader 对象允许 Web 应用程序异步读取存储在用户计算机上的文件（或原始数据缓冲区）的内容，就 3 个主要方法，完成 Blob/File 到其他不同数据(二进制/string/base64)的转换:
* readAsArrayBuffer(blob) -> Blob 转换成 ArrayBuffer
* readAsDataURL(blob) -> Blob 转换成 base64
* readAsText(blob) -> Blob 转换成 string
