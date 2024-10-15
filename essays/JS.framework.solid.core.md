# solid.js 的响应核心分析

## 零、参考资料
* [SolidJS 是如何实现响应式的？](https://juejin.cn/post/7206667711077761085)

## 一、双剑之 createSignal
#### 用法：
```jsx
// js
const [value, setValue] = createSignal(1);

// html-template
<div>值：{ value() }</div>
```

从语法格式上来看，非常像 ```React```，但是和 ```React``` 不同的是，```value``` 并不是一个具体的值，而是一个 ```getter``` 函数，所以在写模版的时候，需要加个 **括号** 来完成函数的调用，从而获取到具体值

#### 简单实现：
```js
const createSignal = (value) => {
  const getter = () => {
    return value;
  };
  const setter = (newValue) => {
    value = newValue;
  };

  return [getter, setter];
};
```

就是这么简单，但是还没有达到能够实现响应式的程度，需要与另外一剑 ```createEffect``` 来互相配合才能实现

## 二、双剑之 createEffect
#### 用法：
```jsx
// js
const [getValue, setValue] = createSignal(1);

createEffect(() => {
  console.log('effect 执行了', getValue());
})
```
从语法格式上来看，这里又像 VUE 3 了

#### 简单实现：
大致实现，包括对 ```createSignal``` 的改造：

```js
// 缓存桥变量
const observers = [];

const getCurrentObserver = () => observers[observers.length - 1];

const createSignal = (value) => {
  const subscribers = []; // 注意，这里目前用的是 数组

  const getter = () => {
    const currentObserver = getCurrentObserver();

    currentObserver && subscribers.push(currentObserver);

    return value;
  };

  const setter = (newValue) => {
    value = newValue;

    subscribers.forEach(subscriber => subscriber());
  };

  return [getter, setter];
};

const createEffect = (effect) => {
  const execute = () => {
    observers.push(effect);
  
    try {
      effect();
    } finally {
      observers.pop();
    }
  }

  execute();
}
```
最核心的是 ```effect()``` 这句。在这一句执行之前，我们已经把自定义的要执行的 ```effect``` 函数缓存进了 ```observers``` 数组(此时还没有执行到 ```observers.pop();```，因此 ```observers``` 数组长度至少为一)，接着执行 ```effect()``` 这句，而在这行这个函数的过程中，会触发 ```getValue()``` 这个 ```getter``` 函数的执行，所以 ```effect``` 这个函数会被放入函数的执行栈，优先执行 ```getter``` 函数，在 ```getter``` 函数中就能拿到被放入 ```observers``` 数组中的 ```effect``` 函数，这样就能将 ```effect``` 函数放入当前 ```signal``` 的订阅者队伍(```subscribers```)中去，一旦执行 ```setValue()```，就能通知所有订阅者(依赖此变量的所有函数)去执行相应逻辑，从而完整实现了响应式(当然，这是之后的逻辑执行)。而在 ```getter``` 函数执行完毕之后，从函数的执行栈中接着执行 ```effect()``` 这句之后的逻辑，即 ```finally { observers.pop(); }```，清理缓存桥中的缓存，并最终完成当前其他任务的执行

## 三、派生之 createMemo
#### 用法：
```jsx
const [count, setCount] = createSignal(10);
const double = () => count() * 2;
```
从代码上看，```double``` 是一个 ```signal``` 的派生值，页面上只要有一个地方用到了 ```double```，那么就要执行一遍过程计算函数 ```() => count() * 2```，如果页面上有多个地方都用到了 ```double```，那么是不是要执行多遍呢？回答：是的。所以就引入了 ```createMemo``` 
这个函数，这个函数的功能和 ```vue``` 的 ```computed``` 一致，缓存计算结果，只要依赖不变，那么过程计算函数只执行一遍，其他的都是直接取缓存值就行

#### 简单实现：
```js
const createMemo = (memo) => {
  const [_value, _setValue] = createSignal();

  createEffect(() => {
    _setValue(memo());
  });

  return _value;
}
```
对，没错，就是这么简单。  

当然也有不完美的地方：在实际运行中会发现一个问题：即使 ```signal``` 的 ```value``` 没有任何变化，仅仅只是调用了 ```setter``` ， ```Memos``` 也会重新执行一次。显然，这个行为是不符合预期的，所以我们可以对 ```setter``` 进行进一步的优化：
```js
const setter = (newValue) => {
  if (value === newValue) return; // 就加了这一句

  value = newValue;

  subscribers.forEach(subscriber => subscriber());
};
```

## 四、总结
核心的实现和 Vue 3 的实现基本没什么差别，只不过在创建响应式数据的时候，V3 选择的是使用 Proxy 对象，而 solid 选择的是闭包缓存数据

### 全部代码：
```js
const observers = [];

const getCurrentObserver = () => observers[observers.length - 1];

const createSignal = (value) => {
  const subscribers = new Set(); // 注意，这里要用 Set

  // 获取 Signal value
  const getter = () => {
    const currentObserver = getCurrentObserver();

    currentObserver && subscribers.add(currentObserver);

    return value;
  };

  // 修改 Signal value
  const setter = (newValue) => {
    if (value === newValue) return;

    value = newValue;

    subscribers.forEach(subscriber => subscriber());
  };

  return [getter, setter];
};

const createEffect = (effect) => {
  const execute = () => {
    observers.push(effect);
  
    try {
      effect();
    } finally {
      observers.pop();
    }
  }

  execute();
}

const createMemo = (memo) => {
  const [_value, _setValue] = createSignal();

  createEffect(() => {
    _setValue(memo());
  });

  return _value;
}
```

值得注意的是，我们在创建 ```subscribers``` 的时候用的是 ```Set``` 结构，而 ```observers``` 则是普通的数组，为什么呢？
因为在每次执行 ```setter``` 时，我们会循环通知 ```subscribers``` 里面的所有订阅者函数(在示例中就是 ```() => {console.log('effect 执行了', getValue());}```)的执行，那么订阅者函数执行的过程又会触发一遍 ```getter``` 函数的执行，在 ```getter``` 中很可能又会添加一个相同的订阅者函数至 ```subscribers``` 中，所以 ```subscribers``` 需要用 ```Set``` 结构去进行去重，防止不必要的影响
