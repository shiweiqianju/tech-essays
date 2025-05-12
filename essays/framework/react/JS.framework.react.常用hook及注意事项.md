# React 常用 hook 及注意事项
## 零、参考
* [React 常用 Hook 基本用法以及注意事项](https://juejin.cn/post/7448291240625684531)

## 一、useState
这个 hook 是 React Hook 家族中最基础且使用频率极高的成员之一，它在函数组件里扮演着引入和管理状态的重要角色
```jsx
import React, { useState } from 'react';

const Counter = () => {
  // 定义一个名为 count 的状态变量，初始值被设定为 0。这里的 useState 函数接受初始状态值作为参数，并返回一个包含两个元素的数组。
  const [count, setCount] = useState(0);

  const increment = () => {
    // 更新 count 状态，每次点击按钮时，通过调用 setCount 函数并传入新的状态值（这里是 count 加 1）来触发组件的重新渲染。
    setCount(count + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

export default Counter;
```

### 注意事项
1. 不能直接修改 ```state```，而应该调用同时返回的 ```setter``` 函数去修改，否则不会触发视图的重新渲染
2. 如果新值依赖旧值，推荐使用回调函数的形式给 ```setter``` 传参，比如 ```setCount(prevCount => prevCount + 1)```。这样可以确保在异步操作或者连续多次更新时，获取到的最新状态值，避免出现意外结果

## 二、useEffect
使用频率极高的成员之二，专门处理组件的可能存在的各种副作用。这个函数覆盖了 React 组件的生命周期的特定阶段，包括挂载、更新或卸载时，执行某些回调。当然，无论是数据的获取、对外部事件的订阅，亦或者对 DOM 进行操作，均通过这个函数实现。
```jsx
import React, { useState, useEffect } from 'react';

const DataFetchingComponent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // 模拟数据获取的异步操作。在这里，使用了 async/await 语法来使代码更加简洁和易读。
    const fetchData = async () => {
      const response = await fetch('https://api.example.com/data');
      const jsonData = await response.json();

      setData(jsonData);
    };

    fetchData();

    // 返回一个清理函数，这个清理函数会在组件卸载时被执行。它的作用类似于类组件中的 componentWillUnmount 生命周期方法，用于清理在组件挂载或更新过程中创建的一些资源，比如取消订阅、清除定时器等。
    return () => {
      console.log('Component unmounted, clean up');
    };
  }, []); // 空数组表示只在组件挂载时执行一次。如果这里传入了依赖项数组，那么当依赖项中的任何一个值发生变化时，useEffect 就会再次执行。

  return (
    <div>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default DataFetchingComponent;
```

### 注意事项
1. 确保正确设置依赖项数组。这一点非常影响性能，也是 bug 最容易产生的地方，同时也是使用 React 的心智成本最高的地方
2. 清理函数必须正确且有效的清理操作。即如果进行了某些订阅，那么必须在这里正确的取消，否则极大概率会导致内存泄漏或者其他意外行为

## 三、useRef
```useRef``` 就像一个容器，返回一个可变的 ```ref``` 对象。其中 ```.current``` 属性被初始化为传入的参数，这个特性使得其在获取 DOM 元素或者保存一个需要跨越多个渲染周期的值时，发挥着不可替代的作用

```jsx
import React, { useRef, useEffect } from 'react';

const InputFocusComponent = () => {
  const inputRef = useRef(null);

  useEffect(() => {
    // 在组件挂载后，通过 inputRef.current 精准地获取到输入框的 DOM 元素，并调用 focus 方法将焦点设置到该输入框上。这一步操作依赖于组件已经挂载完成，所以放在 useEffect 中，并确保依赖项数组为空，只在挂载时执行一次。
    inputRef.current.focus();
  }, []);

  return (
    <div>
      <input type="text" ref={inputRef} />
    </div>
  );
};

export default InputFocusComponent;
```
### 注意事项
1. ```useRef``` 的值在组件的整个生命周期内是持久化的。这意味着它不会因为组件的重新渲染而被重置。在使用过程中，要特别注意不要对其进行过度的修改，以免影响组件的其他逻辑或者导致难以理解的行为。
2. 不建议使用该 hook 进行常规的状态管理

## 四、useReducer
```userReducer``` 是 ```useState``` 的强化版本，其作用是解决复杂场景下的状态贡献和更新。其接受一个 ```reducer``` 函数和一个初始状态作为参数，并返回当前状态以及一个 ```dispatch``` 函数，通过这个 ```dispatch``` 函数去触发状态的更新，遵循着一种类似于 Redux 的状态管理模式

```jsx
import React, { useReducer } from 'react';

// 定义 reducer 函数，这是整个状态管理的核心逻辑所在。它根据传入的 action 类型来精确地更新状态，就像是一个状态处理的调度中心，决定了不同操作对状态的具体影响。
const reducer = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
};

const ReducerComponent = () => {
  const initialState = { count: 0 };
  const [state, dispatch] = useReducer(reducer, initialState);

  const increment = () => {
    dispatch({ type: 'INCREMENT' });
  };

  const decrement = () => {
    dispatch({ type: 'DECREMENT' });
  };

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
};

export default ReducerComponent;
```

### 注意事项：
1. ```reducer``` 函数必须是纯函数。这意味着它不能产生任何副作用，不能修改外部变量，并且对于相同的输入（即相同的 ```state``` 和 ```action```），必须始终返回相同的结果。否则，可能会导致状态管理的混乱和不可预测性
2. 确保在 ```dispatch``` 操作时传递正确的 ```action``` 对象。```action``` 对象的结构和内容应该与 ```reducer``` 函数中的处理逻辑相匹配，否则可能会导致状态更新失败或者出现意外的状态值

## 五、useCallback
这个 hook 主要的功能是缓存函数，可以有效避免在组件重新渲染时不必要地重新创建函数。因此，如果这个函数被当成属性传递给子组件时，那么就能避免子组件进行无效地重新渲染，从而优化了性能

```jsx
import React, { useState, useCallback } from 'react';

const ParentComponent = () => {
  const [count, setCount] = useState(0);
  const [age, setAge] = useState(18);

 /**
  * 使用 useCallback 缓存 increment 函数。只有当依赖项数组中的值（这里是 count）发生变化时，才会重新创建 increment 函数。否则，将返回之前缓存的函数实例。
  * 即：当点击的是 change 按钮时，ParentComponent 需要重新渲染，而 ChildComponent 无需重新渲染，但是在 ParentComponent 重新渲染的过程中，如果不使用 useCallback，那么 increment 函数会被重新创建，这必然会引起 ChildComponent 的重新渲染(执行)，引起不必要的性能开销
  */
  const increment = useCallback(() => {
    setCount(count + 1);
  }, [count]);

  const change = () => {
    setAge(prev => prev * 2);
  }

  return (
    <div>
      <p>Age: {age}</p>
      <button onClick={change}>Change</button>

      <p>Count: {count}</p>
      <ChildComponent increment={increment} />
    </div>
  );
};

const ChildComponent = ({ increment }) => {
  return (
    <button onClick={increment}>Increment in Child</button>
  );
};

export default ParentComponent;
```

### 注意事项：
1. 正确设置依赖项数组。如果依赖项数组设置不准确，可能会导致缓存的函数没有按照预期进行更新或者重新创建，从而影响组件的逻辑正确性和性能。例如，如果依赖项数组中遗漏了某个在函数内部使用的变量，那么在该变量发生变化时，函数不会重新创建，可能导致使用旧的变量值进行操作。
2. 不要过度使用 ```useCallback```。虽然它可以优化性能，但在一些简单的场景中，如果函数的创建成本并不高，过度使用可能会增加代码的复杂性，反而不利于维护。

## 六、useMemo
```useMemo``` 恰似一个高效的计算缓存助手，它专注于缓存计算结果。只有当依赖项发生变化时，才会重新触发计算过程，从而避免了在不必要的情况下重复进行昂贵的计算操作，大大提升了组件的性能表现

```jsx
import React, { useState, useMemo } from 'react';

const ExpensiveCalculationComponent = () => {
  const [number, setNumber] = useState(5);

  // 使用 useMemo 缓存计算结果。只有当 number 这个依赖项发生变化时，才会重新执行 expensiveCalculation 函数并更新缓存的结果。
  const result = useMemo(() => {
    console.log('Calculating...');
    return expensiveCalculation(number);
  }, [number]);

  const increment = () => {
    setNumber(number + 1);
  };

  return (
    <div>
      <p>Result: {result}</p>
      <button onClick={increment}>Increment Number</button>
    </div>
  );
};

// 模拟一个昂贵的计算函数，这里通过一个复杂的循环来模拟计算成本较高的操作。
const expensiveCalculation = num => {
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i * num;
  }
  return sum;
};

export default ExpensiveCalculationComponent;
```

### 注意事项：
1. 依赖项的变化检测是基于引用相等性的。对于基本数据类型（如数字、字符串、布尔值），值的变化会导致引用的变化，从而触发 ```useMemo``` 的重新计算。但对于对象或数组等引用数据类型，如果只是内部属性的变化而对象的引用不变，```useMemo``` 不会重新计算。在这种情况下，可能需要对数据进行深拷贝或者采用其他方式来确保依赖项的正确更新检测
2. 如同 ```useCallback```，不要盲目使用 ```useMemo```。只有在计算成本较高且结果会被频繁使用的情况下，使用 ```useMemo``` 才有较大的性能提升意义。否则，可能会因为过度优化而使代码变得复杂难懂

## 七、useContext
```useContext```，专门用于在组件树中高效地共享数据。它巧妙地避免了传统方式中层层传递 props 的繁琐过程，使得数据能够在组件树的不同层级之间畅通无阻地流动。通常和 ```useReducer``` 一起使用

```jsx
import React, { createContext, useContext, useState } from 'react';

// 创建一个 Context，这就像是构建了一个数据共享的通道，所有连接到这个通道的组件都可以获取和使用其中的数据。
const ThemeContext = createContext('light');

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const Button = () => {
  // 使用 useContext 获取主题。通过连接到 ThemeContext 这个数据通道，Button 组件可以直接获取到当前的主题值，而无需从父组件一层一层地接收主题 props。
  const theme = useContext(ThemeContext);

  return (
    <button style={{ backgroundColor: theme === 'light'? 'white' : 'black', color: theme === 'light'? 'black' : 'white' }}>
      Button with Theme
    </button>
  )
};

const App = () => {
  return (
    <ThemeProvider>
      <Button />
    </ThemeProvider>
  );
};

export default App;
```

### 注意事项：
1. ```useContext``` 的使用应该谨慎。过度使用可能会导致组件之间的耦合度增加，使得组件的复用性降低。因为一个组件如果过多地依赖于 ```context``` 中的数据，那么它在不同的 ```context``` 环境下可能无法正常工作。
2. 当 ```context``` 的值发生变化时，所有依赖该 ```context``` 的组件都会重新渲染。所以在使用 ```useContext``` 时，要考虑到可能引发的性能问题。
