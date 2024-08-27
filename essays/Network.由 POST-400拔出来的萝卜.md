# JS 中的 this

## 零、缘起
前段时间遇到扫描问题，好不容易拿到了扫描出来的数据，结果调用接口时弹了个 ```400(Bad request)``` 给我，匆匆找了点资料修补上线后，忐忑的心也可以安分点。然后，顺着这个 ```400``` 的萝卜，拔出了一大堆的坑

## 一、400(Bad Request)
```400``` 错误的原因很简单，请求头部信息与请求体中的数据格式不匹配，或者 前 -> 后 的数据中字段类型不一致。在有效沟通的前提下，类型不一致的概率很小，那么这个问题就主要集中在头部信息与请求体数据格式不一致上面了

先看一个正确的请求：
```js
$.ajax({
  url: "http://localhost:8080/xxx/xxxx",
  type: "POST",
  contentType: "application/json;charset=utf-8",
  data: JSON.stringify({ name, passwd }), //  { name, passwd } es6 的一个语法
  success: function(result) {
    // ...
  },
  error: function(msg){
    // ...
  }
})
```

目前都是前后端分离的开发模式，两端通信全靠 ```json```，所以，在发送 ```post``` 请求时必须得约定并设置请求头 ```contentType: "application/json;charset=utf-8"```。如果不设置的话，这个请求的 ```contentType``` 默认 ```application/x-www-form-urlencoded```，一个 415 + 大红叉 顶给你

接着，需要设置 ```data```。在发送请求时，如果写成：```data: { name, pwd }``` 的话，服务器还是会返回 400 错误。其实理由也很简单，```http``` 通信过程中，要么就是字符串，要么就是二进制流 ，而 ```{ name, pwd }``` 是一个对象，必须先转化成字符串或者流，才能传输。于是在请求中，首先得用 ```JSON.stringify``` 将 ```json``` 对象转换成字符串，这样，服务器才能正确理解请求并拿到数据  

综上，在 ```post``` 请求中，一定要对这两个属性进行设置和处理

## 二、JSON.parse 和 JSON.stringify
这两个 api 在前端的应用频率也是相当高的，不过，因为某些原因，对 JSON.stringify 这个 api 理解上有些误差。直到最近在查资料时才有了不一样的领悟

```JSON.parse``` 将一个 ```json``` 字符串转换成 ```json``` 对象，它有个名字是 <strong>反序列化</strong>

```JSON.stringify``` 作用与 ```JSON.parse``` 相反，将对象转化成字符串，所以它也有个名字是 <strong>序列化</strong>

> 序列化 (Serialization)是将对象的状态信息转换为可以 存储 或 传输 的形式的过程。在序列化期间，对象将其当前状态写入到临时或持久性存储区。以后，可以通过从存储区中读取或反序列化对象的状态，重新创建该对象

尤想起，当年写 class 的时候，序列化与反序列化齐飞，直至今日才明白官方定义...溜了溜了..

## 三、POST 常见的数据提交类型 - Content-Type
### application/x-www-form-urlencoded
最常见的 ```POST``` 提交数据的方式，原生 ```form``` 表单默认的提交方式，同时，如果在 ```ajax``` 中不设置的话，同样以这种方式提交

这种方式提交的数据会转换成键值对并按照 ```key1=val1&key2=val2``` 的方式进行编码，```key``` 和 ```val``` 都会进行 ```url``` 编码。如：
```http
POST http://www.example.com HTTP/1.1
Content-Type: application/x-www-form-urlencoded;charset=utf-8
 
name=test&val1=1&val2=%E6%B5%8B%E8%AF%95&val3%5B%5D=2
```

### multipart/form-data
常用于多文件上传。这种方式将表单数据处理成一条消息，以标签为单元，用分隔符(常见的是 ```boundary```)分开。因为这种方式将数据分割为多个部分，所以它既可以上传键值对，也可以上传文件、多文件。当上传的字段是文件时，会有 ```Content - Type``` 来说明文件类型；```Content-disposition```，用来说明字段的一些信息。每部分以 ```-boundary``` 开始，紧接着是内容描述信息，然后是回车，最后是字段具体内容(字段、文本或二进制等)。如果传输的是文件，还要包含文件名和文件类型信息。消息主体最后以 ```-boundary-``` 标识结束

如：(没太看明白)
```http
POST http://www.example.com HTTP/1.1
Content-Type:multipart/form-data; boundary=----WebKitFormBoundaryrGKCBY7qhFd3TrwA
 
------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="text"
 
title
------WebKitFormBoundaryrGKCBY7qhFd3TrwA
Content-Disposition: form-data; name="file"; filename="chrome.png"
Content-Type: image/png
 
PNG ... content of chrome.png ...
------WebKitFormBoundaryrGKCBY7qhFd3TrwA--
```

### application/json
这个头应该会很熟悉，这也是日常用的比较多的请求/响应头。这个消息头的作用是告诉服务端消息主体是序列化后的 ```JSON``` 字符串

顺手也贴一个：
```http
POST http://www.example.com HTTP/1.1
Content-Type: application/json;charset=utf-8
 
{"title":"test","sub":[1,2,3]}
```

### text/plain
这个消息类型是文件已被设置为纯文本形式，浏览器、服务器收到这种类型的数据不会进行进一步的处理，开发者需要自行判断处理。也支持发送 JSON 字符串

这个类型意味着消息自由性变大

### text/xml 和 application/xml
这两消息类型年代久远...至少在 web 前端领域做实际项目的时候完全没有碰到过。以 ```xml``` 文档的形式发送数据。不过因为 ```xml``` 严谨结构，对 web 前端来说，这会产生更多的流量，基本被弃用

然后这两者的区别是前者默认使用 ```us-ascii``` 字符集编解码，后者默认 ```utf-8``` 字符集编解码；前者只能在消息头 ```content-type``` 中设置编解码格式才有效，后者在消息头或者在文档内部中设置均可以
