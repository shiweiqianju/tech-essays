# Vue 的使用小结
## 一、v-bind 中使用函数(v 2.0)
```js
:attr="num"
```
如上面的例子，通常 num 是 vue 实例中 data 的值，或者是 computed 对象中的值，我们可以在具体函数中计算，改变相应的变量，以达到更改效果

但是，在组件中，data 和 computed 中的变量都是（组件内）全局共享，某一处改变，其他依赖这个数据的地方也会改变，这对于需要独立作用的地方相当不友好

但是有一个问题，在 ```v-for``` 中每层循环中单独计算某个属性的绑定值，首先想到的是 ```:class="{...}"``` 和 ```:style="{...}"```  。这两个属性的绑定值是一个对象，对象的 ```value``` 可以是某个函数的返回值，这样就可以在 ```methods``` 中定义计算函数了。但是很遗憾，```vue``` 只对 ```class``` 和 ```style``` 做了特化，其他属性均不支持

后来，文档中翻到了 filter 这个 api，项目中真的基本没用到过，可行。下附官方 demo:
```js
<!-- 在双花括号中 -->
{{ message | capitalize }}
 
<!-- 在 `v-bind` 中 -->
<div v-bind:id="rawId | capitalize"></div>
 
filters: {
  capitalize: function (value) {
    // code
    return ...
  }
}
```

如果一个函数被限制了参数个数，那显然不是一个可复用的函数，当然，filter 中函数也支持多参数，官方文档摘录如下：
```
{{ message | filterA('arg1', arg2) }}
 
这里，filterA 被定义为接收三个参数的过滤器函数。
 
message 参数不写在调用的地方；
普通字符串 'arg1' 作为第二个参数；
表达式 arg2 的值作为第三个参数。
```

## 二、$emit 中的传参的写法(v 2.0)
在子组件中，可以通过 ```this.$emit('flag', xxx)```  把数据传递给父组件，如果在父组件中绑定回调函数时需要传入父组件中的参数时该如何处理呢？代码如下：
```js
// 子组件
this.$emit('test',1,2);
 
// 父组件 可以有两种写法
// 必须写成 arguments , $emit 中提交的参数数量随意
@test='testFather(arguments, 888, 999)';
 
或者
 
// 使用 $event 的话，只接受提交的第一个参数
@test='testFather($event, 888, 999)';
 
testFather(val, fatherParams01, fatherParams02) {
  ...
}
```
