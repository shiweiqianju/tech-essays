# CSS 原生变量及应用

## 零、序言
前两天在逛 blog 的时候看见一些内联样式新奇的写法时很纳闷，虽然说不上多么熟练，但是从来没见过 ```--color: brown``` 这样的写法，百度一番之后仍然没啥头绪，今天偶然看到一篇文章之后才知道这是 CSS 变量，不禁感叹现代浏览器花样越来越多。经过翻查总结(也没啥总结的，翻过文档之后挺简单的)，记录如下

## 一、基本用法
### 变量声明：
变量声明的时候，变量名之前加上两根连词线（--）即可。例如：
```css
a {
  --foo：#f1f2f5;
  --bar: red;

  color: var(--foo);
  text-decoration-color: var(--bar);
}
```

var() 函数有第二个参数，表示变量的默认值，如果该变量不存在(第一个参数)，那么就使用这个默认值。并且，第一个参数后面的全部算第二个参数，不管有多少个逗号，比如：

```css
var(--font-stack, "Roboto", "Helvetica");
var(--pad, 10px 15px 20px);
```

另外， var() 函数也可作为其他变量的值，但也仅作为其他变量的值使用：
```css
:root {
  --primary-color: red;
  --logo-text: var(--primary-color);

  /* 无效 */  
  var(--primary-color): green;  
}
```

### 作用域：
同一个 CSS 变量，可以在多个选择器内声明。读取的时候，优先级最高的声明生效。这与 CSS 的”层叠”（cascade）规则是一致的。

```html
<style>
  :root { --color: blue; } /* 这个选择器等价于 html {} */
  div { --color: green; }
  #alert { --color: red; }
  * { color: var(--color); }
</style>

<p>猜我的颜色是什么</p>     <!-- blue -->
<div>猜我的颜色是什么</div>  <!-- green -->
<div id="alert">猜我的颜色是什么</div> <!-- red -->
```

## 二、能帮助我们干什么？
我个人的感觉就像是一个先行性方案，潜力很大，能用的地方很多，轮子慢慢造，目前我碰到的用处有：
1. 方便维护；（这样说感觉很笼统）
2. 响应式布局；（稍微减少了点代码量）
3. 配合 calc() 函数，完成计算；
4. ...

## 三、JS 的联动
js 中对于 css 的变量操作如下：
```js
// 设置变量
document.body.style.setProperty('--primary', '#7F583F’);
// 读取变量
document.body.style.getPropertyValue('--primary').trim();  // '#7F583F'
// 删除变量
document.body.style.removeProperty('--primary');
```

语法：
```js
element.style.setProperty('--xxxx', xxxx, priority);
element.style.getPropertyValue('--xxxx');
element.body.style.removeProperty('--xxxx');
```
