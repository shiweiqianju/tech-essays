# Vue 自定义指令的使用案例(v 2.0)
v-loading，是 element-ui 组件库中的一个用于数据加载过程中的过渡动画指令，项目中也很少需要自己去写自定以指令。碰巧这段时间自己练习了编写组件，完成看看能不能实现一个自定义的这样一个指令。话不多说，上代码：
```js
<div class="table" v-loadAnimation="loading">
    ...
</div>
 
<script>
export default {
  data() {
    return {
      ...
    }
  },
  directives: {
    loadAnimation: {
      bind: (el, binding) => {
        // console.log('bind', el, binding)
        // 遮罩层
        const modal = document.createElement('div');
        modal.className = 'modal-loading';
        // 遮罩层动画
        const animation = document.createElement('div');
        animation.className = 'modal-loading-animation';
        modal.appendChild(animation);
        // 自定义的 loadingElement 属性/其他, 下面钩子函数可以使用;
        el.loadingElement = modal;

        const curStyle = window.getComputedStyle(el);
        const position = curStyle.position;
          
        if (position === 'absolute' || position === 'relative') {
          el.style.position = position;
        } else {
          el.style.position = 'relative';
        }

        if (binding.value) {
          el.appendChild(modal)
        }
      },
      update: (el, binding) => {
        // console.log('update', el, binding)
        if (binding.value) {
          if (el.loadingElement.parentNode === null) {
            el.appendChild(el.loadingElement);
          }
        } else {
          if (el === el.loadingElement.parentNode) {
            el.removeChild(el.loadingElement);
          }
        }
      },
      unbind: (el) => {
        if (el.loadingElement.parentNode === el) {
          el.removeChild(el.loadingElement);
        }

        el.loadingElement = null;
      }
    }
  },
  methods: {
    ...
  }
}
</script>
 
<style>
/* for loading animation */
.modal-loading {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  background-color: rgba(255, 255, 255, 0.95);
  overflow: hidden;
}
.modal-loading .modal-loading-animation {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 4px solid #1a7dff;
  border-left-color: transparent;
  animation: modal-loading-rotate 1s linear infinite;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}
@keyframes modal-loading-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
```

注意：
1. 这个示例中，v-loadAnimation 是以局部指令的方式注册的，在写相关 css 的时候，style 标签中不能加入 scoped 字样，否则不会触发效果；
2. 关于指令的钩子函数以及相关参数，具体移步官方文档；
