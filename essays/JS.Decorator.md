# JS 装饰器 - Decorator(非标准化)

## 零、参考资料
- https://zhuanlan.zhihu.com/p/189960001

## 一、是什么
在 React 的一些中期版本(大约是 V16 ~ V18)中，我们如果想要使用 connect 函数将组件链接到 Redux 中，我们可以：
```js
class Page extends React.Component {}

export default connect(mapStateToProps, mapDispatchToProps)(Page);
```
而使装饰器的话，则可以：
```js
@connect(mapStateToProps, mapDispatchToProps)
class Index extends React.Component{ }
```
这种以 ```@ + 名称``` 的方式就是装饰器

那么装饰器究竟**是什么**？

- 更规范更官方的解释是：以其最简单的形式只是将一段代码与另一段代码包装在一起的一种方式 - “修饰”主代码。
- 如果结合上面的 React 的例子来理解，更通俗点的意思是功能的组合。
- 从举例子的角度来讲，想象你有一个礼物盒子（类或方法），装饰器就像是在这个盒子上系上丝带、贴上标签或加上其他装饰物，让盒子变得更漂亮或功能更多，但盒子本身并没有被改变
- 而如果从代码层面来看的话，通俗来讲就是调用一个函数来包装另外一个函数/类/属性，见下例：
```JS
function fn(name) {
  console.log(`Hello, ${name}!`);
}

function decorator(fn) {
  return function() {
    // ... some code
    console.log('Some inner code');

    const result = fn.apply(this, arguments);

    // ... other code
    console.log('Other inner code');

    return result;
  }
}

// usage
const newFn = decorator(fn);

fn('Dan');
newFn('Dan');
```
在这个 Demo 中，```fn``` 和 ```newFn``` 主要业务是一样的，不同之处是，```newFn``` 可以**额外地做一些事情**，这是基于这一想法，从而实现代码的服用

> 从代码的组织方式上看，和函数式中的柯里化很相似，但是最终实现的目的是不一样的，案例中的 ```newFn``` 的目标是做一些额外的事情，柯里化是是得入参单一化

## 二、类型
> 本节里只以常规模式的装饰器为例，工厂模式的装饰器见下章

### 类装饰器
将类修饰符一次性应用于整个类定义。简单理解，就是将这个类，作为装饰器的参数传递进去，在装饰器函数中，可以对这个类进行各种操作，如下例：

```JS
// 伪代码

// 装饰器 log
// 内部 this 暂未做处理
function log(Class) {
  return function (...args) {
    console.log(args);
    
    return new Class(...args);
  }
}

// usage
@log
Class Animal {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const cat = new Animal(`Dan`, 12);
// [`Dan`, 12]

console.log(cat.name);
// Dan
```

### 类成员装饰器
修饰类中成员(属性/方法/访问器(即 getter/setter))的装饰器。这种装饰器需要在定义的时候接受三个参数：
- target：要修改属性的对象(类的原型对象)。
- name：要修改的属性的名称。
- descriptor：要修改的属性描述符。
> 从本质上讲，这是应该传递给 Object.defineProperty 的对象

#### 属性装饰器
```js
// 伪代码
function readonly(target, name, descriptor) {
  descriptor.writable = false;

  return descriptor
}

// usage
class Animal {
  @readonly age = 2;
}

const cat = new Animal();
// { age: 2 }

// 当我们尝试修改 age 的时候，控制台会报错
```

#### 方法装饰器
```js
// 功能：打印一些日志信息
function log(target, name, descriptor) {
  const original = descriptor.value;

  if (typeof original === 'function') {
    descriptor.value = function(...args) {
      console.log(`log for args: ${args}`)
      try {
        return original.apply(this, args);
      } catch (e) {
        console.log(`Error: ${e}`);

        throw e;
      }
    }
  }

  return descriptor;
}

// usage
class Animal {
  constructor(name) {
    this.name = name;
  }

  @log
  sayHello(name) {
    console.log(`Hello ${name}, I'm ${this.name}`);
  }
}

const cat = new Animal('Hello kitty');
cat.sayHello('Jack');

// log for args: Jack
// Hello Jack, I'm Hello kitty
```

#### 访问器装饰器
> 相当于 方法装饰器的特化版本
```js
// 定义一个缓存结果的装饰器
function cache(target, name, descriptor) {
  const getter = descriptor.get;
  let cachedValue;

  descriptor.get = function() {
    if (cachedValue === undefined) cachedValue = getter.call(this);

    return cachedValue;
  }

  return descriptor;
}

class ExpensiveComputation {
  @cache
  get result() {
    console.log('计算中...');
    return 42; // 假设这是个耗时的计算
  }
}

// usage
const instance = new ExpensiveComputation();

console.log(instance.result); // 第一次会计算
console.log(instance.result); // 第二次直接从缓存读取
```

### 参数装饰器
这个装饰器，是用来修饰方法的参数的，其接受的参数和类成员装饰器略有不同：
- target：要修改属性的对象(类的原型对象)。
- name：要修改的属性的名称，在这里就是函数的名称
- index: 参数在函数参数列表中的索引

```JS
function log(target, name, index) {
  const originMethod = target[name];

  target[name] = function(...args) {
    console.log(`方法${propertyKey}的第${parameterIndex}个参数值为:`, args[parameterIndex]);
    
    return originalMethod.apply(this, args);
  }
}

// usage
class User {
  greet(@logParameter name) {
    return `Hello, ${name}!`;
  }
}

const user = new User();

console.log(user.greet('Alice'));
```

## 三、工厂模式
工厂模式更像是闭包应用中的提前确认参数的思路，在上面的所有代码中，都是非工厂模式(```@log```)，而工厂模式就是在后面继续加上```(xxx)```，最终代码类似```@log(xxx)``` 这样
当然，装饰器函数需要进行改造：

### 类装饰器的对比和改造
```js
// 伪代码

// 装饰器 log
// 内部 this 暂未做处理
function log(name) { // 提升未工厂函数
  return function (Class) { // 装饰器函数本体，即普通版本中的 log 函数
    return (...args) => {
      console.log(`log for ${name}: `, args);
      return new Class(...args)
    }
  }
}

// usage
@log('cat')
Class Animal {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
}

const cat = new Animal('Hello kitty', 2)
//  log for cat:  ["Hello kitty", 2]

console.log(cat.name)
// Hello kitty
```

TS 的版本
```ts
// 普通模式装饰器函数
function Init<T extends {new (...args: any[]): {}}>(constructor: T) {
  return class extends constructor {
    age = 21;
  }
}

// 工厂模式装饰器函数
function Init(sex: 'male' | 'female') {
  return function<T extends { new (...args: any[]): {}}>(target: T) {
    target.prototype.sex = sex;

    return target;
  }
}

// todo 待验证和上面的写法有什么不一样
// function Init(sex: 'male' | 'female') {
//   return function<T extends { new (...args: any[]): {}}>(constructor: T) {
//     return class extends constructor {
//       this.sex = sex;
//     }
//   }
// }
```

### 成员装饰器的对比和改造
以 方法装饰器 为例，其他的成员装饰器也一样
```js
// 功能：打印一些日志信息
function log(loggedValue) { // 提升为工厂函数
  return function(target, name, descriptor) { // 原来的装饰器函数
    const original = descriptor.value;

    if (typeof original === 'function') {
      descriptor.value = function(...args) {
        console.log(`log for ${loggedValue}: ${args}`);
        try {
          return original.apply(this, args);
        } catch (e) {
          console.log(`Error: ${e}`);

          throw e;
        }
      }
    }

    return descriptor;
  }
}

// usage
class Animal {
  constructor(name) {
    this.name = name;
  }

  @log('HHHHH')
  sayHello(name) {
    console.log(`Hello ${name}, I'm ${this.name}`);
  }
}

const cat = new Animal('Hello kitty');
cat.sayHello('Jack');
```

> 工厂模式通常应用于类、成员装饰器上，参数装饰器上似乎用的不多，不过就本质来看，参数装饰器其实和成员装饰器一致，只是没必要这样应用

### 小结
简单而言，工厂模式就是给非工厂模式的代码上包了一层函数，这样就可以自定义一些参数，因此，在编译后的代码上又细分为 '执行' 和 '应用' 两个阶段：
- 执行：跑一下外层包装的函数，求个值(结果通常是函数)
- 应用：将执行阶段跑出来的值作用于被装饰的目标上
而非工厂模式的装饰器，从阶段划分上对应于 '应用' 阶段，说白了就是少了 '执行' 阶段，只有 '应用' 阶段的工厂模式

## 四、其他注意点
### 装饰器的执行顺序

#### 非工厂模式
装饰器的执行总是从上到下，从外到内的
- 参数装饰器，最先执行
- 类成员装饰器，方法，属性，访问器装饰器
- 类装饰器，最后执行
> 其中类成员装饰器是根据定义的顺序进行的，越早定义，越早执行，即"从上到下"  
> 如果构造函数中的参数也使用了装饰器，那么这个参数装饰器的执行不会遵守通用规则，只会在类装饰器之前执行，即在所有普通参数装饰器 & 类成员装饰器都执行完成以后，类装饰器执行之前执行

#### 工厂模式
大体规则和非工厂模式差不多，需要注意的是：
1. 类和构造函数的参数装饰器的执行-应用顺序
2. 方法与内部参数装饰器的执行-应用顺序

```ts
function TestFn(info: string): any {
  console.log(`${info} 执行`)

  return function() {
    console.log(`${info} 应用`)
  }
}

@TestFn('类')
class Person {
  constructor(@TestFn('构造函数参数') name: string) { }

  @TestFn('成员-属性')
  props?: number;

  @TestFn('成员-方法')
  handler(@TestFn('成员-方法参数') args: any): void { }
}

// log 顺序
[LOG]: "成员-属性 执行" 
[LOG]: "成员-属性 应用" 
[LOG]: "成员-方法 执行" 
[LOG]: "成员-方法参数 执行" 
[LOG]: "成员-方法参数 应用" 
[LOG]: "成员-方法 应用" 
[LOG]: "类 执行" 
[LOG]: "构造函数参数 执行" 
[LOG]: "构造函数参数 应用" 
[LOG]: "类 应用" 
```

#### 多个同类型装饰器
(TS)总体规则是：
1. 由上至下依次对装饰器表达式求值(工厂模式特有的步骤)
2. 求值的结果会被当作函数，由下至上依次调用(非工厂 & 工厂模式)

```TS
function Test1(): any {
  console.log(`test1执行`);
  return function () {
    console.log(`test1应用`);
  };
}

function Test2(): any {
  console.log(`test2执行`);
  return function () {
    console.log(`test2应用`);
  };
}

function Test3(): any{
  console.log(`test3应用`);
}


function Test4(): any {
  console.log(`test4执行`);
  return function () {
    console.log(`test4应用`);
  };
}

function Test5(): any {
  console.log(`test5应用`);
}

class Person {
  constructor(name: string) {}

  prop?: number;
  @Test1()
  @Test2()
  @Test5
  @Test3
  @Test4()
  handler(args: any) {}
}

// log 顺序
[LOG]: "test1执行" 
[LOG]: "test2执行" 
[LOG]: "test4执行" 
[LOG]: "test4应用" 
[LOG]: "test3应用"  // 非工厂模式
[LOG]: "test5应用"  // 非工厂模式
[LOG]: "test2应用" 
[LOG]: "test1应用" 
```

## 五、总结
- 装饰器通常应用于 OOP 编程泛式中，FP 中通常不会应用
- 本质上是闭包

## 六、一些疑点
- 装饰器函数的 return 的影响
