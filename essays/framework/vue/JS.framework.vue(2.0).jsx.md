# Vue 中的 jsx
## 零、序言
6 月的时候冒出了用 jsx 的来写 vue 项目的念头，以回忆回忆放下好长一段时间的 jsx，奈何项目时间卡得很紧，一些简单的页面的还可以写写，遇到一些资料少的问题时就很头疼，所以复杂页面仍然采用  ```<template />``` 的形式写了过去。7 月时间没那么紧张，于是就把原来的一个中等复杂度的子项目(jquery) 用 vue-jsx 重写了遍。

此文记录在 vue 中写 jsx 的几处头疼地方的处理

参考资料：
* 学Vue，就要学会 vue JSX 系列：[一](https://www.jianshu.com/p/f0beceac5344)、[二](https://www.jianshu.com/p/0cbbaa13c759)、[三](https://www.jianshu.com/p/84b708c80598)、[四](https://www.jianshu.com/p/e53536004d13) && [作者主页](https://www.jianshu.com/u/b748e459ec1a);

## 一、v-model 的替换
根据官网资料，```v-model="variable"``` 这种形式是(官方提供)一种简写，因此，在 jsx 中我们就不能使用了(不过好像有 babel 插件支持)，那么还原成一般的写法就是：
```jsx
<el-input
  value={this.oldPassword.value}  // value - props
  onInput={e => this.handleInput(e)} // onInput - this.$emit
  ...
></el-input>

// 需要注意的是，我这里直接用的 element-ui 组件，因此 e 就是输入事件中的值，如果用的是原生的 input 标签， 这个 e 会是整个输入事件(对象)，诸位可以在 handleInput 中打印看看。
```

## 二、自定指令
当初最大的拦路虎就是这个自定指令如何插入到具体代码中去

在 jsx 中，对于 ElementUI 中的 ```v-loading``` 指令，我们可以这样操作：
```jsx
data() {
  loading: false,
}
 
render(h) {
  /**
   * 一个组件上面可以使用多个指令，所以是一个数组
   * name 对应指令的名称， 需要去掉 v- 前缀
   * value 对应 `v-loading="value"`中的 value
   */
  const directives = [{ name: 'loading', value: this.loading }];

  return (
    <div {...{ directives }}></div>
  )
}
 
// 如果需要修饰符，则
render(h) {
  /**
   * modifiers指定修饰符，如果使用某一个修饰符，则指定这个修饰符的值为 true
   * 不使用可以设置为false或者直接删掉
   */
  const directives = [
    {
      name: 'loading',
      value: this.loading,
      modifiers: { fullscreen: true, lock: false }
    }
  ]
  return (
    <div {...{ directives }}></div>
  )
}
```

## 三、事件
#### 1. 常规(原生)事件：
如第一条中的 ```input``` 事件， 在 jsx 中一般需要写成 ```onEvent``` 的形式，并采用驼峰命名规则，如 ```onChange``` 等， 或者写成 ```on-event``` 的形式
#### 2. 自定义的(组件)事件：
我们自定的组件，在内部通过 ```this.$emit``` 来向上提交事件及参数，在 ```<template />``` 中，只需要加上  ```@``` 即可，而在 jsx 中，则建议写成 ```on-event``` 这样的形式
#### 3. 事件修饰符：详请移步官网文档 
这里记录下 ```.sync``` 这个修饰符的调整。其实明白原理之后也挺简单的，只是在原文档之前加个小小转化： ```.sync``` (```.sync``` 修饰符) 是一种简写，一个语法糖。内部实现是：```this.$emit('update:yourProp', yourValue)``` ，外部使用是：```:yourProp.sync="prop01"```，外部的原始形式是： ```v-on:update:yourProp="prop01"```。在了解了这层的关系之后，我们就可以处理了，最终，在 jsx 中的写法：
```jsx
<your-component
  ... // 这里是其他的绑定
  { ...{ on: { 'update:yourProp': () => { ... } }} }
></your-component>
```

## 四、属性的绑定
#### 1. 常规属性
大部分属性的绑定由原来的 ```:key="false"``` 这种形式变成了 ```key={false}``` 这样。

#### 2. 传递函数
有时，我们也会通过 ```props``` 传递一些自定的函数以在子组件的某个运行期间执行某些操作，大多数时候，函数的传递和常规属性的传递一样，没啥需要注意的，但是当遇到以 ```on``` 开头的函数属性时，我们就不能采用 ```key={this.onEvent}``` 这种形式，原因可在参考资料的那篇文章中找到

因此，我们应该采用下面的形式（以 ElementUI 中的 Upload 为例 ）：
```jsx
<el-upload
  action={this.upLoadUrl}
  data={this.uploadData}
  show-file-list={false}
     
  // 因为是以 before 开头的而非以 on 开头的属性，故编译时会当成 props 处理
  before-upload={ this.beforeUpload }

  // 这里是重点
  {...{ props: { onSuccess: this.handleSuccess, onError: this.handleError } }}
>
  ...
</el-upload>
 
/**
*  on-success && on-error 是 ElementUI 文档中提供的 Attribute，
*  在 <template /> 形式中， 我们只需要按照 :on-success="handleSuccess" 这样的形式来处理即可，
*  而在 render(h) {...} 这种方法下， 我们必须以上面代码中所示的那样，指明其是作为 props 属性传递的，避免被解析成自定义的事件。
*/
```

## 五、关于 slot
忘了还有个 ```slot``` 的处理，补上。常规的 ```slot``` 还请移步官网[渲染函数与 jsx](https://v2.cn.vuejs.org/v2/guide/render-function.html) 。

在 ```render(h) { ... }``` 这种形式下，以 ```ElementUI``` 中 ```el-table``` 为例:
```jsx
...
<el-table-column prop="prop01" label="标签1"  width="100" align="center"></el-table-column>
<el-table-column prop="prop02" label="标签2" align="center"></el-table-column>
{
  <el-table-column label="标签3" align="center" width="100" scopedSlots={{
    default: props => {
      return (
        <span>
          {
            // do your operation
            props.row.props03
          }
        </span>
      )
    }
  }}></el-table-column>
}
<el-table-column prop="prop04" label="标签4" align="center"></el-table-column>
...
```

## 最后
参考资料中的一些点没有完全涉及到，如有兴趣，请移步至相应文章。

零零散散的资料与实践，如有错误，望斧正。
