# JS 零宽字符(Zero-Width Characters)

## 零、参考资料
- https://zhuanlan.zhihu.com/p/597252415

## 一、核心概念
什么是“零宽字符”？

在Unicode编码中，有一类奇怪的字符格式，它们不可见、不可打印(浏览器不进行渲染)，但是程序中却能正常解析，主要用于调整字符的显示格式

常见的零宽字符有：
> 注意：在 MD 文档中，需要用代码格式(```)将 HTML码 包裹一下，否则在预览中将不可视  

| 种类 | Unicode 码| HTML 码 |
|:--|:--|:--|
| 零宽空格 (Zero Width Space, ZWSP/ZWP) | U+200B | ```&#8203;``` |
| 零宽无断空格 (Zero Width No-Break Space, NBSP) | U+FEFF | ```&#65279;``` |
| 零宽非连接符 (Zero Width Non-Joiner, ZWNJ) | U+200C | ```&#8204;``` |
| 零宽连接符 (Zero Width Joiner, ZWJ) | U+200D | ```&#8205;``` |
| 零宽断行符 (Word Joiner) | U+2060 | ```&#8288;``` |
| 左至右符 (left-to-right mark) | U+200E | - |
| 右至左符 (right-to-left mark) | U+200F | - |

## 二、应用：隐形水印
在明白了概念之后，有哪些应用场景呢？

比如：将当前的登陆人的一些信息做成隐形水印，或者将一些版权信息做成隐形水印：
```js
// 自定义水印
let watermark = `版权信息`;

// 转换成二进制文本
function toBinary(str) {
  return str.split('').map(char => char.codePointAt(0).toString(2)).join(' ')
}

// 二进制文本转换成由零宽字符组成的不可视文本
function toHidden(binaryStr) {
  // 自定义规则
  const map = {
    0: '\u200b',
    1: '\u200c',
    default: '\u200d',
  }
  return binaryStr.split('').map(binary => {
    return map[binary] || map.default
  }).join('')
}

let binaryStr = toBinary(watermark);
let hiddenStr = toHidden(binaryStr);

console.log(binaryStr, binaryStr.length);
console.log(hiddenStr, hiddenStr.length) // 注意这里再控制台中的结果

// 将不可视文本加入到需要用的地方，
// 在浏览器中查看效果
// 也可以将页面上这里面的内容复制出来，在控制台或者其他文本编辑器中看看所复制的内容
const div = document.querySelector('#target');
div.innerHTML = `这是一段文本${hiddenStr}这是另外一段文本`;
```

## 三、其他应用
- 防爬虫隐藏联系方式：在页面上渲染出来的联系方式后面加上自定义的零宽字符，这样爬虫拿到的就是加入零宽字符后的字符串，当然弊端就是对一些默认的浏览器行为有所影响，比如自动跳转等
- 数据/代码加密
- 逃脱敏感词捕获
