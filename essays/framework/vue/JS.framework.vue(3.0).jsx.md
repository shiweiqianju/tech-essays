# Vue 3 中的 jsx 实践
## 一、起因
* template 的写法不太灵活，数据和模版都放在一起，不能拼接；
* 如果拆太碎，每个碎片组件都得写一堆 props/emit 才能确保通信的完整性，太麻烦；
* 如果写在一个文件中，模版上的判断逻辑 (v-if) 又得一堆；

## 二、codes
* 碎片组件 1:
```jsx
{/* <script lang="jsx"> */}
import { defineComponent } from 'vue';

export const useHook = () => {
  const field1 = ref();
  const field2 = ref();
  ...

  return [field1, field2, ...];
}

export const renderTemplate = (field1, field2, field3...) => {
  return () => (
    <>
      <van-field
        v-model={field1.value}
        label="内容:"
        placeholder="请输入内容"
        label-align="top"
        autosize
        type="textarea"
      />

      <van-field
        label="图像:"
        label-align="top"
      >
        {{
          input: () => (
            <van-uploader
              v-model={field2.value}
              after-read={field3}
            />
          ),
          default: () => (
            <></>
          )
        }}
      </van-field>
    </>
  )
};

export default defineComponent({
  setup() {
    const [field1, field2, ...]; = useHook();

    return renderTemplate(field1, field2, ...);
  }
});
// </script>
```

* 碎片组件 2:
```jsx
{/* <script lang="jsx"> */}
import { defineComponent } from 'vue';

export const useHook = () => {
  const checked = ref(-1);

  return [checked];
}

export const renderTemplate = (checked) => {
  return () => (
    <>
      <van-field name="radio" label="结果:">
        {{
          input: () => (
            <van-radio-group v-model={checked.value} direction="horizontal">
              <van-radio name={1}>truth</van-radio>
              <van-radio name={0}>falsehood</van-radio>
            </van-radio-group>
          )
        }}
      </van-field>
    </>
  )
};

export default defineComponent({
  setup() {
    const [checked] = useResultRadio();

    return renderTemplate(checked);
  }
});
</script><script lang="jsx">
import { defineComponent } from 'vue';

export const useHook = () => {
  const checked = ref(-1);

  return [checked];
}

export const renderTemplate = (checked) => {
  return () => (
    <>
      <van-field name="radio" label="结果:">
        {{
          input: () => (
            <van-radio-group v-model={checked.value} direction="horizontal">
              <van-radio name={1}>truth</van-radio>
              <van-radio name={0}>falsehood</van-radio>
            </van-radio-group>
          )
        }}
      </van-field>
    </>
  )
};

export default defineComponent({
  setup() {
    const [checked] = useResultRadio();

    return renderTemplate(checked);
  }
});
// </script>
```
* 组合组件
```jsx
import { defineComponent, computed } from 'vue';
import { useHook as useHook1, renderTemplate as templateRender1 } from '碎片组件 1';
import { useHook as useHook2, renderTemplate as templateRender2 } from '碎片组件 2';

export default defineComponent({
  emits: [...],
  props: {...},
  setup(props, ctx) {
    const { emit } = ctx;
    const [field1, field2, ...] = useHook1();
    const [checked] = useHook2();

    const renders = [
      templateRender1(field1, field2, ...),
    ];

    if (xxx) {
      renders.push(templateRender2(checked));
    }

    return () => {
      return (
        {
          //  html 模版
          renders.map(r => r())
        }
      )
    }
  }
});
```

## 三、解决的问题
* 根据业务需要随时组合组件，并且如同上面显示的那样，组合出来的表单基本不会暴露无关项目
* 即使是碎片组件，也可以单独拿出来使用

## 四、可能存在的问题
* 数据变化时 diff 算法以及对视图的更新，所以上面的 demo 还是 vue 的响应式写法，不知道能不能完全做到像 react 中 jsx 的写法 - 即不依赖响应式写法。不过想想 vue 的 h 函数的实现，感觉可能性不大；
* 碎片组件单独使用时与外界的通信 - 不过已经使用了 Hook, 基本上数据已经通过 Hook 暴露了出去，应该不存在通信问题

## 五、需要注意的地方
* slot 的写法，与 vue 2 中似乎也不一样

## 六、其他
在网上看了一篇文章：Vue3 项目中优雅处理重复渲染代码的技巧(原文已删)，用的是 ```slot``` 的形式实现模版的复用，应该也是 ```VueUse``` 中 ```createReusableTemplate``` 的思路，将其转录于下：

源码：
```js
import { defineComponent, shallowRef } from 'vue';
import { camelCase } from 'lodash';
import type { Slot } from 'vue';
//将横线命名转大小驼峰
function keysToCamelKebabCase(obj: Record<string, any>) {
  const newObj: typeof obj = {};
  for (const key in obj) newObj[camelCase(key)] = obj[key];
  return newObj;
}

export const useTemplate = () => {
  const render = shallowRef<Slot | undefined>();
  const define = defineComponent({
    setup(_, { slots }) {
      return () => {
        //将复用模板的渲染函数内容保存起来
        render.value = slots.default;
      };
    },
  });
  const reuse = defineComponent({
    setup(_, { attrs, slots }) {
      return () => {
        // 还没定义复用模板，则抛出错误
        if (!render.value) {
          throw new Error('你还没定义复用模板呢!');
        }
        // 执行渲染函数，传入 attrs、slots
        const vnode = render.value({ ...keysToCamelKebabCase(attrs), $slots: slots });
        return vnode.length === 1 ? vnode[0] : vnode;
      }
    },
  });
  return [define, reuse];
}
```

使用：
```html
<template>
  <div>
    <!-- 在本组件中定义一个复用模板 -->
    <DefineTemplate v-slot="{ age, name }">
      <div>
      <span>{{ name }}</span>
      <span>今年已经 </span>
      <span>{{ age }}</span>
      <span>岁啦</span>
      </div>
    </DefineTemplate>
    <!-- 可多次使用复用模板 -->
    <ReuseTemplate v-for="item in data" :key="item.age" :age="item.age" :name="item.name" />
    <ReuseTemplate v-for="item in data" :key="item.age" :age="item.age" :name="item.name" />
    <ReuseTemplate v-for="item in data" :key="item.age" :age="item.age" :name="item.name" />
  </div>
</template>
  
<script setup>
  import { useTemplate } from '../../hooks/useTemplate';

  const [DefineTemplate, ReuseTemplate] = useTemplate();
</script>
```

TS 版本：
```js
import { defineComponent, shallowRef } from 'vue';
import { camelCase } from 'lodash';
import type { DefineComponent, Slot } from 'vue';

// 将横线命名转换为驼峰命名
function keysToCamelKebabCase(obj: Record<string, any>) {
  const newObj: typeof obj = {};
  for (const key in obj) newObj[camelCase(key)] = obj[key];
  return newObj;
}

// 定义 DefineTemplateComponent 类型，该类型表示定义模板的组件
export type DefineTemplateComponent<
  Bindings extends object,
  Slots extends Record<string, Slot | undefined>,
> = DefineComponent<object> & {
  new (): { $slots: { default(_: Bindings & { $slots: Slots }): any } };
};

// 定义 ReuseTemplateComponent 类型，该类型表示复用模板的组件
export type ReuseTemplateComponent<
  Bindings extends object,
  Slots extends Record<string, Slot | undefined>,
> = DefineComponent<Bindings> & {
  new (): { $slots: Slots };
};

// 定义 ReusableTemplatePair 类型，表示一个定义模板和复用模板的组件对
export type ReusableTemplatePair<
  Bindings extends object,
  Slots extends Record<string, Slot | undefined>,
> = [DefineTemplateComponent<Bindings, Slots>, ReuseTemplateComponent<Bindings, Slots>];

// useTemplate 函数，返回一个定义模板和复用模板的组件对
export const useTemplate = <
  Bindings extends object,
  Slots extends Record<string, Slot | undefined> = Record<string, Slot | undefined>,
>(): ReusableTemplatePair<Bindings, Slots> => {
  const render = shallowRef<Slot | undefined>();

  // 定义 DefineTemplateComponent 组件
  const define = defineComponent({
    setup(_, { slots }) {
      return () => {
        // 将复用模板的渲染函数内容保存起来
        render.value = slots.default;
      };
    },
  }) as DefineTemplateComponent<Bindings, Slots>;

  // 定义 ReuseTemplateComponent 组件
  const reuse = defineComponent({
    setup(_, { attrs, slots }) {
      return () => {
        // 还没定义复用模板，则抛出错误
        if (!render.value) {
          throw new Error('你还没定义复用模板呢！');
        }
        // 执行渲染函数，传入 attrs、slots
        const vnode = render.value({ ...keysToCamelKebabCase(attrs), $slots: slots });
        return vnode.length === 1 ? vnode[0] : vnode;
      };
    },
  }) as ReuseTemplateComponent<Bindings, Slots>;

  return [define, reuse];
};
```