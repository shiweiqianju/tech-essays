# Zustand 核心源码分析
Zustand 是一个基于 React 的状态管理库。源于德语，本义就是"状态"的意思。因为其小巧、简单、快捷、高性能等特点，非常适用于中小型项目

## 零、参考资料
* [zustand 从原理到实践 - 原理篇)](https://juejin.cn/post/7579167622106218496)
* [Zustand：全局状态管理的利器](https://juejin.cn/post/7446221029255774249)

## 一、源码结构
```bash
zustand/
├── src/
│   ├── index.ts                    # 默认入口：导出 create（React 版）
│   ├── vanilla.ts                  # 框架无关核心：createStore
│   ├── react.ts                    # React 绑定：useSyncExternalStore 封装
│   ├── traditional.ts              # React 16/17 兼容入口（自动垫片）
│   ├── middleware/
│   │   ├── combine.ts
│   │   ├── devtools.ts
│   │   ├── immer.ts
│   │   ├── persist/
│   │   │   ├── index.ts
│   │   │   └── storage.ts
│   │   ├── redux.ts
│   │   └── subscribeWithSelector.ts
│   ├── vanilla/
│   │   ├── shallow.ts              # 浅比较函数（供 vanilla 用户）
│   ├── react/
│   │   ├── shallow.ts              # useShallow Hook
│   └── types.d.ts                    # 全局 TypeScript 类型定义
```
本文只研究 ```vanilla.ts``` 中核心源码的实现，兼顾一点对 React 的桥接，中间件暂时忽略  

## 二、使用方法以及源码
> 以下代码均在 React 环境中
### 在代码中的使用
```jsx
// store.js
import { create } from 'zustand';

export const useBearStore = create(set => ({
  bears: 0,
  increasePopulation: () => set(state => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: newBears => set({ bears: newBears }),
}));
```

```jsx
// component.jsx
import { useBearStore } from './store.js';

// 组件中使用
function BearCounter() {
  const bears = useBearStore((state) => state.bears);

  return <h1>{ bears } bears around here...</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation);

  return <button onClick={increasePopulation}>one up</button>
}
```

### vanilla 层的核心实现
```js
function createStoreImpl(createState) {
  let state;
  const listeners = new Set();

  const getState = () => state;
  const setState = (partial, replace) => {
    const nextState = typeof partial === 'function' ? partial(state): partial;

    if (!Object.is(nextState, state)) { // 浅比较两者是不是一致，如不一致，则执行
      const previousState = state;
      
      state = (
        replace != null 
          ? replace 
          : typeof nextState !== 'object' || nextState === null
      )
        ? nextState
        : Object.assign({}, state, nextState);
      listeners.forEach(listener => listener(state, previousState));
    }
  }
  const getInitialState = () => initialState;
  const subscribe = listener => {
    listeners.add(listener);

    return () => listeners.delete(listener);
  }

  const api = { getState, setState, getInitialState, subscribe };
  const initialState = (state = createState(setState, getState, api));

  return api;
}

export function createStore(createState) {
  return createState ? createStoreImpl(createState) : createStoreImpl;
}
```

### 与 react 的桥接层的简单实现
```js
function useStore(api, selector) {
  // 利用 react: useSyncExternalStore 触发渲染
  const getState = () => selector(api.getState());

  return useSyncExternalStore(api.subscribe, getState);
}

function createImpl(createState){
  const api = createStore(createState);
  const useBoundStore = selector => useStore(api, selector);

  Object.assign(useBoundStore, api);

  return useBoundStore;
}

function create(createState) {
  return createState ? createImpl(createState) : createImpl;
}
```

## 三、分析
### 初始化：store.js
首先需要定义一个状态(初始化)，我们看 ```store.js``` 这个文件，这里需要注意的是：
- 首行引入的 ```create``` 的方法是与 react 桥接层的方法
- ```create``` 函数又以一个函数为参数，在上面的代码中，通过调用链我们可以看到，这个参数函数最终会赋值给 vanilla 层中的 ```createState``` 变量，而我们在 vanilla 层中会发现(```const initialState = (state = createState(setState, getState, api));```)，这个参数函数的入参其实有所省略，如果补全的话应该是```create((set, get, api) => ({...}))``` 这样，但是因为本篇暂时只研究核心实现，所以就暂时忽略补全版本的写法

### 初始化：桥接层的执行分析
1. 执行 ```import { useBearStore } from './store.js';```
2. 去 ```store.js``` 里执行 ```create(...)``` 函数，从这里就正式进入桥接层了。这里我们就传入了一个入参函数，暂时命名为 ```initialFunc```，这个初始化函数返回一个对象，这个对象就相当于是状态机了
3. ```create``` 函数只是一层兼容性包装，核心是 ```createImpl``` 这个函数。这个函数干了三件事：
  - ```const api = createStore(createState);``` 创建核心 ```store```(状态机)，并将操作这个 ```store``` 的一些关键方法作为返回值暴露出来(当然，并不是给使用者直接使用的)
  - ```const useBoundStore = selector => useStore(api, selector);``` 将上一步暴露出来的方法与 react 桥接
  - ```Object.assign(useBoundStore, api);``` 这个是另外一个优点，据说在非 React 能使用 Zustand 就是这一行实现的，暂时不再本文的探讨范围之内，故可暂时省略
4. ```createStore``` 初始化状态机、维护订阅者等等，核心是 ```const initialState = (state = createState(setState, getState, api));``` 这一句，这个 ```createState``` 变量，就是第二步中的 ```initialFunc``` 函数，即： ```createState = set => ({ bears: 0, increasePopulation: () => set(state => ({ bears: state.bears + 1 })), ... })```，当然，```initialFunc``` 函数不是有个返回值嘛，就是**状态机最初状态**。当然 ```createStore``` 这个函数也有返回值，其中包括**订阅(```subscribe```)、获取状态机(```getState```)、设置状态机(```setState```)等一系列方法**
> 这一步，区分好 ```createStore(createStoreImpl)``` 和 ```createState``` 这两个函数的返回值就基本没什么问题了
5. ```const useBoundStore = selector => useStore(api, selector);``` 这里利用了闭包的特性，定义了一个函数，这个函数简单点理解和 React Hook 很像。我们在具体使用的时候再分析，只需要留意 ```selector``` 这个变量，其值将会是另一个函数。功能上这一句真正地把 Zustand 和 React 桥接起来
> 当然，在这个阶段，只是定义了 ```useBoundStore``` 这么个函数，还被没有真正执行
6. 将 ```useBoundStore``` 暴露出去给代码使用者使用

### 使用：组件
- 组件中使用的时候，是直接使用 ```useBearStore``` 的，如 ```BearCounter``` 组件中的 ```useBearStore((state) => state.bears)``` 这句，参数函数对应的是 桥接层 中```selector``` 这个变量，在执行 ```useBearStore(...)``` 的时候，```selector``` 被赋值成 ```(state) => state.bears```，此时 ```createImpl``` 中 ```selector => useStore(api, selector)``` 这个才真正执行，调用 ```useStore(api, (state) => state.bears)```，而在 ```useStore``` 函数中，我们又定义了一个 ```getState``` 的内部函数，这个内部函数最终将作为一个订阅者被放入到状态机的 ``` listeners``` 队列中去

> 被放入 ``` listeners``` 并不是使用者在 ```useBearStore((state) => state.bears)``` 中自定义的 ```(state) => state.bear``` ，而是在 ```useStore``` 内部的 ```getState``` 函数，然后在这个内部函数中调用使用者自定义 ```(state) => state.bear```

## 四、其他
- 在上文的例子中，```store.js``` 中调用了 ```create``` 函数，这就创建了一个**全局共享**的 ```store```。所以，如果想要做到多例模式，还需要借助其他的一些 hack 手段，当然，这似乎违背了"状态"管理这个核心概念。因此，如何取舍，最终还是需要根据具体情况决定
