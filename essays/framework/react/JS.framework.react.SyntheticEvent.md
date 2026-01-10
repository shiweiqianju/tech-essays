# React SyntheticEvent 合成事件

## 零、参考资料
- [React的事件处理机制：合成事件/废弃的事件池](https://juejin.cn/post/7541303825929650222)
- [重学React —— React事件机制 vs 浏览器事件机制](https://juejin.cn/post/7559398187578064905)
- [React 合成事件系统：架构设计的优雅解决方案](https://juejin.cn/post/7576487832090001423)
- [React合成事件机制](https://juejin.cn/post/7576155969605009443)

## 一、核心概念
React 并不是将事件直接绑定在真实的 DOM 节点上，而是通过重新抽象了一个中间层来处理，这个中间层就是合成事件（SyntheticEvent）。比如：当在 JSX 中写 onClick={handleClick} 时，React 在编译的时候并不是通过 addEventListener 的方式将 handleClick 处理函数绑定在目标元素上的

### 优势
- 通过**事件委托**机制，进行性能优化
- 统一浏览器的差异
- 更好的跨端能力
- 使用池化技术，渐少内存消耗，进一步优化性能(V17 后渐渐不再使用)

## 二、事件流
- 事件注册：编译阶段将所有事件委托给根容器(V17 以前是 document，V17 以后是根容器，如 #root)
- 事件触发：执行原生事件流，被 React 捕获(通常是在原生事件流的冒泡阶段)
- 形成合成事件：新建/从事件池中取出一个 SyntheticEvent 实例，并将原生事件的各个属性赋值给该实例
- 事件分发：在 React 的组件树种模拟事件冒泡，触发对应的事件处理函数
- 事件回收：事件处理函数执行完毕后，将 SyntheticEvent 实例的各个属性重置，并将该实例放回事件池中（V 17 以后渐渐不再使用池化技术）

### 合成事件与原生事件的关系
- 合成事件是对原生事件的封装
  - SyntheticEvent 内部持有一个 nativeEvent 属性，指向浏览器原生的事件对象
  - 可以通过 e.nativeEvent 来访问原生事件的所有属性和方法
- 事件冒泡的区别
  - 合成事件的冒泡是 React 模拟的，只在 React 组件树中生效。
  - 如果在原生事件中调用 e.stopPropagation()，会阻止事件冒泡到 React 的顶层容器，从而导致合成事件无法触发。
  - 反之，在合成事件中调用 e.stopPropagation()，只会阻止 React 组件树内部的事件冒泡，不会影响原生事件的冒泡。

### 混合使用的坑：原生事件与合成事件
如果在同一个组件中既用了 onClick（合成），又用了 window.addEventListener('click')（原生）：
- 执行顺序：原生事件先执行，合成事件后执行。

## 三、SyntheticEvent 类型
```ts
interface SyntheticEvent<T = Element, E = Event> {
  bubbles: boolean;                    // 是否冒泡
  cancelable: boolean;                 // 是否可取消
  currentTarget: EventTarget & T;      // 当前事件处理程序附加到的元素
  defaultPrevented: boolean;           // 是否已调用 preventDefault
  eventPhase: number;                  // 事件阶段
  isTrusted: boolean;                  // 是否为用户触发
  nativeEvent: E;                      // 原生事件对象
  target: EventTarget;                 // 触发事件的元素
  timeStamp: number;                   // 时间戳
  type: string;                        // 事件类型
  
  preventDefault(): void;              // 阻止默认行为
  stopPropagation(): void;             // 阻止冒泡
  // persist(): void;                     // 持久化事件对象, V17 后不再使用
}
```

