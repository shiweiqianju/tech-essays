# 仿 ELEMENT-UI 实现一个简单的 Form 表单(V 2.0)
## 一、目标
ElementUI 中 Form 组件主要有以下 功能 / 模块：

* Form
* FormItem
* Input
* 单验证

在这套组件中，有 3 层嵌套，这里面使用的是 ```slot``` 插槽，我们在接下来的代码中也需要运用到它。

## 二、组件设计(分层)
* e-form 全局校验，并提供插槽；
* e-form-items 单一项校验和显示错误信息，并提供插槽；
* e-input 负责数据的双向绑定；

## 三、开始
#### e-input
```jsx
<template>
  <div>
    <!-- 1.绑定 value 2.响应 input 事件 -->
    <input type="text" :value="valueInInput" @input="handleInput">
  </div>
</template>
 
<script>
export default {
  name: 'EInput',
  props: {
    value: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      valueInInput: this.value // 确保数据流的单向传递
    }
  },
  methods: {
    handleInput(e) {
      this.valueInInput = e.target.value;
      this.$emit('input', this.valueInInput); // 此处提交的事件名必须是 ‘input’
 
      // 数据变了，定向通知 formItem 进行校验
      this.dispatch('EFormItem', 'validate', this.valueInInput);
    },
 
    dispatch(componentName, eventName, params) { // 查找指定 name 的组件，
      let parent = this.$parent || this.$root;
      let name = parent.$options.name
 
      while(parent && (!name || name !== componentName)) {
        parent = parent.$parent;
        if (parent) {
          name = parent.$options.name;
        }
      }
      if (parent) {
        // 这里，我们不能用 this.$emit 直接派发事件，因为在 FormItem 组件中，Input 组件的位置只是一个插槽，无法做事件监听，
        // 所以此时我们让 FormItem 自己派发事件，并自己监听。修改 FormItem 组件，在 created 中监听该事件。
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    }
  }
}
</script>
```

#### FormItem 的设计
```jsx
<template>
  <div>
    <label v-if="label">{{ label }}</label>
    <div>
      <!-- 拓展槽 -->
      <slot></slot>
      <!-- 验证提示信息 -->
      <p v-if="validateState === 'error'" class="error">{{ validateMessage }}</p>
    </div>
  </div>
</template>
 
<script>
import AsyncValidator from 'async-validator';
 
export default {
  name: 'EFormItem',
  props: {
    label: { type: String, default: '' },  // 表单项的名称
    prop: { type: String, default: '' } // 表单项的自定义 prop
  },
  inject: ['eForm'], // provide/inject,vue 跨层级通信
  data() {
    return {
      validateState: '',
      validateMessage: ''
    }
  },
  methods: {
    validate() {
      return new Promise(resolve => {
        const descriptor = {}; // async-validator 建议用法；
        descriptor[this.prop] = this.eForm.rules[this.prop];
        // 校验器
        const validator = new AsyncValidator(descriptor);
        const model = {};
        model[this.prop] = this.eForm.model[this.prop];
        // 异步校验
        validator.validate(model, errors => {
          if (errors) {
            this.validateState = 'error';
            this.validateMessage = errors[0].message;
            resolve(false);
          } else {
            this.validateState = '';
            this.validateMessage = '';
            resolve(true);
          }
        })
      })
    },
    dispatch(componentName, eventName, params) { // 查找上级指定 name 的组件
      var parent = this.$parent || this.$root;
      var name = parent.$options.name;
 
      while (parent && (!name || name !== componentName)) {
        parent = parent.$parent;
 
        if (parent) {
          name = parent.$options.name;
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    }
  },
  created() {
    // 'validate' 事件由 e-input 组件通知，在 e-form-item 组件接收到后自行触发对应方法
    this.$on('validate', this.validate); 
  },
  // 因为我们需要在 Form 组件中校验所有的 FormItem ，
  // 所以当 FormItem 挂载完成后，需要派发一个事件告诉 Form：你可以校验我了。
  mounted() {
    // 当 FormItem 中有 prop 属性的时候才校验，
    // 没有的时候不校验。比如提交按钮就不需要校验。
    if (this.prop) {
      this.dispatch('EForm', 'addFiled', this);
    }
  }
}
</script>
 
<style scoped>
.error {
  color: red;
}
</style>
```
其中，methods 中的方法均是辅助方法，validate() 是异步校验的方法

#### Form 的设计
```jsx
<template>
  <form>
    <slot></slot>
  </form>
</template>
 
<script>
export default {
  name: 'EForm',
  props: {
    model: {
      type: Object,
      required: true
    },
    rules: {
      type: Object
    }
  },
  provide() { // provide/inject,vue 跨层级通信
    return {
      eForm: this // form 组件实例, 在其他组件中可以通过 this.xxx 来获取属性/方法
    }
  },
  data() {
    return {
      fields: [] // 需要校验的 e-form-item 组件数组
    }
  },
  methods: {
    async validate(cb) {
      const eachFiledResultArray = this.fields.map(filed => filed.validate());
 
      const results = await Promise.all(eachFiledResultArray);
      let ret = true;
      results.forEach(valid => {
        if (!valid) {
          ret = false;
        }
      });
      cb(ret);
    }
  },
  created() {
    // 缓存需要检验的组件
    // 下面的代码只能写在 created 的生命周期内
    this.fields = [];
    this.$on('addFiled', filed => this.fields.push(filed))
  }
}
</script>
```
