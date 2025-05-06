# JS SSE 方案

## 零、参考资料
* [EventSource](https://developer.mozilla.org/zh-CN/docs/Web/API/EventSource)
* [告别轮询，SSE 流式传输可太香了](https://juejin.cn/post/7355666189475954725)
* [ChatGPT Stream 流式处理网络请求](https://juejin.cn/post/7249286903207641146)
* [一文读懂即时更新方案：SSE](https://juejin.cn/post/7221125237500330039)

## 一、背景以及相关基础

### 背景
ChatGPT 出世很久，在使用时，发现输入 prompt 后，页面是逐步给出回复的，起初以为使用了 WebSockets 持久化连接协议，查看其网络请求，发现这个接口的通信方式并非传统的 http 接口或者 WebSockets，而是基于 EventStream 的事件流，像打字机一样，一段一段的返回答案

### 概述
Server-Sent Events 服务器推送事件，简称 SSE，是一种服务端实时主动向浏览器推送消息的技术，这一点上和 websocket 具有一定的相似性，不同的是，SSE 是单向推送(S => C)，且 SSE 是基于 HTTP 协议的，websocket 则是基于 TCP 协议的，还有其他的不同，详见下表

| 特性 | SSE | WebSockets |
| :---- | :---- | :---- |
| 协议 | 基于 HTTP，使用标准 HTTP 链接 | 单独的协议(ws://xxxx 或者 wss://xxxx) |
| 通信模式 | 单向(服务器 => 客户端) | 全双工 |
| 数据格式 | 文本 | 文本或二进制 |
| 重连机制 | 浏览器自动重连 | 手动实现 |
| 实时性 | 高(适合频繁更新的场景) | 非常高(适合高度交互的实时应用) |
| 浏览器支持 | 良好 | 非常好|
| 适用场景 | 实时通知、新闻feed、股票价格等需要从服务器推送到客户端的场景 | 在线游戏、聊天应用、实时交互应用 |
| 复杂性 | 较低，易于实现和维护 | 较高，需要处理连接的建立、维护和断开 |
| 兼容性和可用性 | 基于HTTP，更容易通过各种中间件和防火墙 | 可能需要配置服务器和网络设备以支持 |
| 服务器负载 | 适合较低频率的数据更新 | 适合高频率消息和高度交互的场景 |

所以，本质上，SSE 技术依然是 HTTP 技术，但是和传统的 HTTP 即时返回全量结果不同，SSE 是以数据流的形式返回的结果，所以处理 SSE 的返回值实际上是对数据流的处理。当然，这里又可以细分成两种处理方式：EventSource 和 Fetch 方案

## 二、EventSource 方案
EventSource 方案是 H5 标准化的方案，内部采用统一的事件模型进行封装，使用也非常简单，具体可参考 MDN 文档和下面的案例

```js
// Server 端简易代码
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  const url = req.url;

  if (url === '/' || url === 'index.html') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading');
      } else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(data);
      }
    })
  } else if (url.includes('/sse')) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*', // 允许跨域
    });

    let id = 0;
    const intervalId = setInterval(() => {
      const params = url.split('?')[1]
      const data = { id, time: new Date().toISOString(), params }

      res.write(`event: customEvent\n`);
      res.write(`id: ${id}\n`);
      res.write(`retry: 30000\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      id++;

      if (id >= 10) {
        clearInterval(intervalId);
        res.end();
      };
    }, 1000);

    // 当客户端关闭链接时停止发送信息
    req.on('close', () => {
      clearInterval(intervalId);
      id = 0;
      res.end();
    });
  } else {
    // 如果请求的路径无效，返回 404 状态码
    res.writeHead(404);
    res.end();
  }
}).listen(9522);

console.log('Server listening on port 9522');
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSE Demo</title>
</head>
<body>
  <h1>SSE Demo</h1>
  <button onclick="connectSSE()">建立 SSE 连接</button>  
  <button onclick="closeSSE()">断开 SSE 连接</button>
  <br />
  <br />
  <div id="message"></div>

  <script>
    const messageElement = document.querySelector('#message');
    let eventSource = null;

    const connectSSE = () => {
      eventSource = new EventSource('http://127.0.0.1:9522/sse?content=xxx');

      // 监听消息事件, 自定义事件
      eventSource.addEventListener('customEvent', (event) => {
        const data = JSON.parse(event.data);
        messageElement.innerHTML += `${data.id} --- ${data.time} --- params参数：${JSON.stringify(data.params)}` + '<br />';
      })

      eventSource.onopen = () => {
        messageElement.innerHTML += `SSE 连接成功，状态${eventSource.readyState}<br />`;
      }

      eventSource.onerror = () => {
        messageElement.innerHTML += `SSE 连接错误，状态${eventSource.readyState}<br />`;
      }
    }

    // 断开 SSE 连接
    const closeSSE = () => {
      eventSource.close();
      messageElement.innerHTML += `SSE 连接关闭，状态${eventSource.readyState}<br />`;
    }
  </script>
</body>
</html>
```

## 三、Fetch 方案
Fetch 方案其实就是利用原生 XHR 或者 fetch API 发起网络请求(而不是通过 EventSource API)，然后服务器在响应这个请求的时候，响应的 Content-Type 是 text/event-stream，通知浏览器这将会是一个 stream。所以 FE 的代码需要用到对流进行处理的 API。代码详见下例：

```js
const http = require('http');
const fs = require('fs');

http.createServer((req, res) => {
  const url = req.url;

  if (url === '/' || url === 'index.html') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading');
      } else {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(data);
      }
    })
  } else if (url.includes('/fetch-sse')) {
    let body = '';

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*', // 允许跨域
    });

    req.on('data', chunk => {
      body += chunk;
    });

    // 每隔 1 秒发送一条消息
    let id = 0
    const callback = () => {
      const data = { id, time: new Date().toISOString(), body, };

      res.write(JSON.stringify(data))
      id++
      if (id >= 10) {
        clearInterval(intervalId)
        res.end()
      }
    }
    const intervalId = setInterval(callback, 1000);

    // 注意：这里不需要监听 req 的 close 事件
  } else {
    // 如果请求的路径无效，返回 404 状态码
    res.writeHead(404);
    res.end();
  }
}).listen(9523);

console.log('Server listening on port 9523');
```

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSE Demo</title>
</head>
<body>
  <button onclick="connectFetchSSE()">建立 SSE 连接</button>  
  <button onclick="closeFetchSSE()">断开 SSE 连接</button>
  <br />
  <br />
  <div id="message"></div>

  <script>
    const messageElement = document.querySelector('#message');
    let controller = null;

    const fetchEventSource = (url, options) => {
      fetch(url, options)
        .then(response => {
          if (response.status === 200) {
            options.onopen && options.onopen();

            return response.body;
          }
        })
        .then(rb => {
          const reader = rb.getReader();
          const push = () => {
            // done 为数据流是否接收完成，boolean
            // value 为返回数据，Uint8Array
            return reader.read().then(({done, value}) => {
              if (done) {
                options.onclose && options.onclose();

                return;
              }

              options.onmessage && options.onmessage(new TextDecoder().decode(value));
              // 持续读取流信息
              return push();
            })
          }
          // 开始读取流信息
          return push();
        })
        .catch((e) => {
          options.error && options.error(e);
        })
    }

    const connectFetchSSE = () => {
      controller = new AbortController();

      fetchEventSource('http://localhost:9523/fetch-sse', {
        method: 'POST',
        body: JSON.stringify({ content: 'xxx', }),
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        onopen: () => {
          messageElement.innerHTML += `FETCH 连接成功<br />`
        },
        onclose: () => {
          messageElement.innerHTML += `FETCH 连接关闭<br />`
        },
        onmessage: (event) => {
          const data = JSON.parse(event);

          messageElement.innerHTML += `${data.id} --- ${data.time} --- body参数：${JSON.stringify(data.body)}` + '<br />';
        },
        onerror: (e) => {
          console.log(e);
        }
      })
    }

    // 断开 FETCH-SSE 连接
    const closeFetchSSE = () => {
      if (controller) {
        controller.abort();
        controller = null;
        messageElement.innerHTML += `FETCH 连接关闭<br />`;
      }
    }
  </script>
</body>
</html>
```

## 四、一些总结
采用 Fetch 方案主要是规避了 EventSource 方案中数据只能是文本格式，无法自定义请求头等诸多缺点，在实践过程中可根据实际需要决定使用哪种方案
