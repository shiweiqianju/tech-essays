# Vue 中的 slot
## 零、序言
这篇随笔是关于 vue slot 的用法随笔，挺简单的，便于用作后面复习的材料

当初看文档的时候没怎么看得明白，随后工作中自己开始封装组件又很少用得到，所以这块基本上属于一个盲区。最近在尝试写 vue-jsx，el-table 中频频需要用到，所以就翻了翻资料写了点 demo

## 一、插槽的含义
我的理解是：对于封装好的组件，开放内部的部分空间(内容)，允许用于进行自定义，而不需要去改动封装好的组件源代码。

用代码形式表现为：
1. your-component 组件内部的结构：
```jsx
<template>
  <div class="container">
    ...

    <!-- 最终会用自由发挥的代码块把 <slot/> 替换掉 -->
    <slot />

    ...
  </div>
</template>
```

2. 调用的地方：
```jsx
<div class="outer-wrapper">
  <your-component>
    <!-- 这里可以自由发挥的空间, 如： -->
    <span>outer 内容一</span>
  </your-component>
</div>
```

3. 最终会被编译成：
```jsx
<div class="outer-wrapper">
  <div class="container">
    ...

    <!-- <slot /> 替换成自由发挥的代码块 -->
    <span>outer 内容一</span>

    ...
  </div>
</div>
```

## 二、具名插槽
以 vue-cli 创建时自带的 App、HelloWorld 两个组件为基础改造：

```html
<!-- App.vue -->
<div id="app">
  <HelloWorld>
    <template v-slot:header>
        <h1>header slot</h1>
    </template>

    <p>this will appear in main body</p>
    <p>and another one</p>
      
    <template v-slot:footer>
    <!-- <template #footer> -->

      <h2>footer slot</h2>
    </template>

    <p>this paragraph will appear in default slot(main body).</p>
  </HelloWorld>
</div>
```
注: Vue 2.6.0+ 之后 (v-slot:) 可以简写成 (#)。如：v-slot:header 可以被写成 #header

```html
<!-- HelloWorld.vue -->
<template>
  <div class="hello">
    <!-- 具名插槽 -->
    <header>
      <slot name="header"></slot>
    </header>
    <main>
      <!-- 这里的 slot 没有显式带上 name 属性，vue 会默认其 name="default" -->
      <slot></slot>
    </main>
    <footer>
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```
具名插槽的使用有一些注意事项，详见第四大条

## 三、作用域插槽
有时在自由发挥的时候想对只存在于子组件中的数据进行修改，那么该如何访问到子组件内的数据呢？这时就要用到作用域插槽了。

我的理解是，形式上通过 v-bind 把数据绑定提供给父组件使用，原理上仍符合单向数据流动的原则。

同样以 vue-cli 创建时自带的 App、HelloWorld 两个组件为基础改造：
```html
<!-- App.vue -->
<div id="app">
  <HelloWorld >
    <!-- 作用域插槽 -->
    <!-- slotprops 这个变量名可以自定义 -->
    <!-- yourDefine 需要是跟着子组件来的 -->
    <template #default="slotProps">
        {{ slotProps.yourDefine.firstName }}
    </template>
  </HelloWorld>
</div>
```

```jsx
<div class="hello">
  <slot v-bind:yourDefine="data">{{ data.lastName }}</slot>
</div>

data() {
  return {
    data: {
      firstName: 'inner-firstName',
      lastName: 'inner-lastName',
    }
  }
}
```
这样，最终页面即显示 'inner-firstName' 字符串。

作用域插槽在编写多层级复杂组件的时候将会发挥巨大作用。(参考 el-table-item)

## 四、注意事项
1. v-slot (指令)是 vue 2.6.0 之后对 slot & slotScope 这两个已废弃但未被移除的 attribute 的替代。详情可以移步官网文档。
2. v-slot 均需要使用在 ```<template />``` 上面。只有一种情况是允许被直接使用在组件上的：自由发挥的代码块中只有默认插槽。例如：
唯一例外 demo:
```jsx
<HelloWorld v-slot:default="slotProps">
  {{ slotProps.yourDefine.firstName }}
</HelloWorld>
```
这种方式又叫独占默认插槽的缩写语法，<strong>注意一定不能和具名插槽混用，因为它会导致作用域不明确。</strong>
错误示例：
```jsx
// 无效 & 触发警告
<HelloWorld v-slot:default="slotProps">
  {{ slotProps.yourDefine.firstName }}
  <template #header>
    <h1>header slot</h1>
  </template>
</HelloWorld>
```
因此，只要出现多个插槽，一定要为所有的插槽使用完整的基于 ```<template />``` 的语法
