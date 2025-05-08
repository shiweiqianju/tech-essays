# TS Decorator 装饰器

## 零、参考资料
* [前端冷知识-装饰器](https://juejin.cn/post/6965428382284644388)

## 一、基本概念
装饰器这个概念，来源于 ```java```，简单而言，就是一个函数，提供了某种特定的功能，用于描述 ```类```，```方法```，```属性```，```参数```，为其添加其他功能，同时不影响原有逻辑(解耦)，是 AOP 变成模式的一种实现  
因此，对于 ```Angular```、 ```nest``` 的使用者来说，不算一个新概念  
当然，如果是 ```Redux``` 的使用者，也不会太陌生，比如：（虽然比较老了）
```js
@connect(mapStateToProps, mapDispatchToProps)

class Index extends React.Component{ }
```

## 二、使用
两个方法
* ```babel``` 插件
* ```Typescript``` 直接使用

总之，在 ```Typescript``` 环境中这是一个正常的语法，可以根据需要使用，而且非 ```Typescript``` 环境中则不建议

### 普通模式与工厂模式
装饰器工厂，就是用来组装某些值以及要装饰的东西的  
与普通的装饰器函数相比，它多了一层调用，用于传递要组装的数据，因此工厂模式与普通模式的装饰器最大的差别就是它的自定义参数

### 类装饰器
类装饰器，声明在 ```class``` 关键字上方  
简单理解，就是将这个类，作为装饰器的参数传递进去，在装饰器函数中，可以对这个类进行各种操作  

```ts
@Init
class Index {
  public age = 12;
}

function Init<T extends {new (...args: any[]): {}}>(constructor: T) {
  return class extends constructor {
    age = 21;
  }
}

console.log(new Index()); // Index { age: 21 }
```

#### 类装饰器的工厂模式
```ts
function InjectSex(sex: 'male' | 'female') {
  return function<T extends { new (...args: any[]): {}}>(target: T) {
    target.prototype.sex = sex;

    return target;
  }
}


@InjectSex('male')
class Two { }

console.log(Reflect.getPrototypeOf(new Two())) // { sex: '男' }
```

### 方法装饰器
方法装饰器是用于修饰方法的，与类装饰器只有一个target参数不同，方法装饰器共接收三个参数，分别是
* ```target``` 类的实例
* ```key``` 方法的名称
* ```descriptor``` 用于描述这个方法的描述符，也就是 ```Object.defineProperty``` 中的 ```value```、```writable```、```enumerable```、 ```configurable```

```ts
class Fun {
  @AddOne
  log(x: number) {
    console.log(x);
  }
}

function AddOne(target: any, key: any, descriptor: any) {
  console.log('target value', target)
  console.log('key value', key)
  console.log('descriptor value', descriptor)

  const val = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    return val(args[0] + 1);
  };

  return descriptor;
}

const fun = new Fun();
fun.log(1) // 2
```

我们通过 ```descriptor``` 中的 ```value``` 属性，劫持到原有的方法，并进行重新改写，这样就可以以最小的切入面修改一个现有的方法了

#### 方法装饰器的工厂模式
```ts
class FunTwo {
  @InjectPrefix('prefix-')
  log(x: string) {
    console.log(x);
  }
}

function InjectPrefix(prefix: string) {
  return function(target: any, key: any, descriptor: any) {
    const val = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return val(prefix + args[0])
    }

    return descriptor;
  }
}

const fun = new FunTwo();
fun.log('name') // prefix-name
```

### 属性装饰器
属性装饰器一般用于属性的劫持，它接收两个参数，分别是 ```target``` 和当前属性的名称，我们可以通过装饰器工厂来向被装饰的属性添加值

#### 属性装饰器的工厂模式
```ts
class Prop {
  @init(16)
  age: number
}

function init(age: number) {
  return function(target, key) {
    target[key] = age;

    return target;
  }
}

const prop = new Prop();

console.log(prop.age); // 16
```

### 参数装饰器
参数装饰器接收三个参数，分别是 ```target```、```key```(当前方法)和 ```index```(当前参数的下标)

```ts
class Param {
  log(@require name: string, @require age: number) {
    console.log(name, age)
  }
}

function require(target, key, index) {
  console.log(target, key, index)
  return target;
}

const param = new Param();
param.log('张三', 18)

// { log: [Function (anonymous)] } log 1
// { log: [Function (anonymous)] } log 0
// 张三 18
```

不过一般都使用方法装饰器来配合其使用，例如

```ts
class Param {
  @Validate
  log(@require name?: string, @require age?: number) {
    console.log(name, age)
  }
}

function Validate(target, key, descriptor) {
  const val = descriptor.value;
  const required = val.required;

  console.log(required) // [0, 1]

  descriptor.value = function(...args) {
    required.forEach(index => {
      if (!args[index]) {
        throw new Error('缺少参数')
      }
    })
    return val(...args)
  }
  return descriptor
}

function require(target, key, index) {
  target[key].required = [index, ...(target[key].required || [])]

  return target
}

const param = new Param()
param.log()

// /xxx/decorator/params-decorator.ts:13
//    required.forEach(index => {
             ^
// Error: 缺少参数
```

通过 ```require``` 参数装饰器，向 ```target[key]``` 方法中添加 ```required``` 的参数，然后通过 ```Validate``` 进行校验。
