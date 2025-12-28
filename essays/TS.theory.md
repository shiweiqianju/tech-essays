# Typescript Theory

https://juejin.cn/post/7530179511728930856

## 一.类型系统

### 1.基础类型

#### 1.1 原始类型
```ts
let name: string = 'Tom';
let age: number = 10;
let isActive: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let uniqueKey: symbol = Symbol('id');
```

#### 1.2 数组与元组
```ts
// 数组
let numbers: number[] = [1, 2, 3];
let strings: string[] = ['Tom', 'Merry'];

// 元组(固定长度和类型)
let person: [string, number] = ['Tom', 20];
person[0] = 'Jerry'; // ✅
person[1] = '24';  //  ❌ 类型错误
```

#### 1.3 特殊类型
| 类型 | 特点 | 使用场景 |
|:--|:--|:--|
| any | 禁用类型检查，与原生 JS 行为一致 | 迁移 JS 项目、快速原型设计 |
| ​​unknown​​ | 类型安全的 any，使用前必须断言或类型检查 | 接收第三方库数据、API 响应处理 |
| never | 表示永远不会发生的值 | 函数抛出异常、穷尽检查 |
| void | 函数无返回值（与 undefined兼容但不等价） | 函数副作用操作 |

```ts
// any vs unknown
let anyValue: any = 'hello';
anyValue.toFixed(2); // ❌ 运行时错误

let unknownValue: unknown = 'hello';
if (typeof unknownValue === 'string') {
  unknownValue.toUpperCase();  // ✅ 优先类型检查
}

// never 使用示例
function throwError(message: string) {
  throw new Error(message);
}

// void 函数
function logMessage(msg: string) {
  console.log(msg);
  // 等价于 undefined，但 null 会报错
}
```

#### 1.4 void 与 undefined
```ts
// void 表示函数没有返回值
type VoidFunc = () => void;
const fn: VoidFunc = () => true; // ✅ 兼容但返回类型仍为 void

// undefined 必须显式返回
const requireUndefined = (): undefined => {
  return undefined; // ✅
  // return;       // ❌ 缺少返回值
}
```

### 2.类型推断与断言

#### 2.1 类型推断
```ts
// 自动推断变量类型
let x = 10;  // 推断为 number

// 函数返回类型推断
function add(a: number, b: number) {
  return a + b; // 推断返回 number
}
```

#### 2.2 类型断言
```ts
// as 断言（推荐）
const element = document.getElementById('root') as HTMLDivElement;

// 非空断言（!）
const user!: { name: string }; // 强制认为非空（危险！）
const el = document.querySelector('.btn')!;

// const 断言（值不可变）
let arr = [1, 2] as const; // 类型变为 readonly [1, 2]
arr.push(3); // ❌ 编译错误
```

#### 2.3 双重断言的风险
```ts
const input = document.querySelector('input[type="text"]');

// 双重断言绕过类型检查（慎用！）
const value = (input as any) as string;

// 安全替代方案：类型守卫
if (input instanceof HTMLInputElement) {
  const safeValue = input.value;  // ✅ 类型安全
}
```

### 3. 类型兼容性

#### 3.1 结构化类型（鸭子类型）
```ts
interface Person {
  name: string;
  age: number;
}

let Tom = { name: 'Tom', age: 20, gender: 'M' };
const Bob: Person = Tom; // ✅ 额外属性不破坏兼容性
```

#### 3.2 函数类型兼容
```ts
type Handler = (data: string) => void;

// ✅ 参数兼容：目标类型参数 < 源类型参数
const handleEvent: Handler = (data: string | number) => console.log(data);

// ❌ 错误示例：源类型参数 < 目标类型参数
const handler: (data: string | number) => void = (data: string) => console.log(data);
```

#### 3.3 逆变与协变

开启strictFunctionTypes后：

- 参数类型：逆变（接收更具体的类型）
- 返回类型：协变（返回更宽泛的类型）

```ts
// 逆变演示（参数兼容）
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

let animalFunc: AnimalHandler = (a: Animal) => {};
let dogFunc: DogHandler = (d: Dog) => {};

dogFunc = animalFunc; // ✅ 安全（目标函数能处理更多类型）
animalFunc = dogFunc; // ❌ 危险（关闭strictFunctionTypes时允许）

// 协变示例（返回值兼容）
type AnimalCreator = () => Animal;
type DogCreator = () => Dog;

let createAnimal: AnimalCreator = () => new Animal();
let createDog: DogCreator = () => new Dog();

createAnimal = createDog; // ✅ 安全（返回值更具体）
createDog = createAnimal; // ❌ 错误（可能返回非Dog对象）
```

## 二.高级类型系统

### 1.泛型

#### 1.1 泛型函数/类/接口
```ts
// 泛型函数
function identity<T>(arg: T): T {
  return args;
}

const num = identity<number>(42); // 显式指定
const str = identity('hello'); // 自动推断

// 泛型接口
interface KeyValuePair<K, V> {
  key: K;
  value: V;
}
const pair: KeyValuePair<number, string> = { key: 1, value: 'A' };

// 泛型类
class DataWrapper<T> {
  constructor(public value: T) {
    this.value: T = value;
  }
  getValue(): T { return this.value; }
}
const wrapper = new DataWrapper<boolean>(true);
```

#### 1.2 泛型约束与默认类型
```ts
interface LengthWise { length: number };

function logLength<T extends LengthWise>(obj: T): void {
  console.log(obj.length)
};

logLength([1, 2]);  // ✅
logLength(3);       // ❌ 类型‘number’不满足约束


// 默认类型参数
interface Pagination<T = string> {
  data: T[];
  page: number;
}
const pagination: Pagination = { data: ['a', 'b'], page: 1; } // T默认string
```

#### 1.3 类型参数推导（infer）
在条件类型中提取嵌套类型，当需要在条件类型中捕获嵌套类型时使用，如提取函数返回类型、数组元素类型、Promise结果等无法直接访问的内部类型。

```ts
// 获取函数返回类型
type ReturnType<T> = T extends (...args: any) => infer R ? R : never;

// 获取数组元素类型
type ArrayElement<T> = T extends (infer U)[] ? U : never;
type StrElement = ArrayElement<string[]>; // string
```

### 2.工具类型与类型编程

#### 2.1 内置工具类型
| 工具类型 | 作用 | 等价写法 |
|:--|:--|:--|
| Partial<T> | 所有属性变为可选 | { [P in keyof T]?: T[P] } |
| Required<T> | 所有属性变为必填 | { [P in keyof T]-?: T[P] } |
| Readonly<T> | 所有属性变为只读 | { readonly [P in keyof T]: T[P] } |
| Pick<T, K> | 选取T中指定属性K | { [P in K]: T[P] } |
| Omit<T, K> | 排除T中指定属性K | Pick<T, Exclude<keyof T, K>> |
| Record<K, T> | 创建键为K类型，值为T类型的对象 | { [P in K]: T } |
| Exclude<T, U>	 | 从联合类型T中排除U类型 | T extends U ? never : T |
| Extract<T, U> | 从联合类型T中提取U类型 | T extends U ? T : never |

demos:
```ts
type User = {
  id: number;
  name: string;
  email: string;
}

// 创建用户更新类型（所有属性可选）
type UserUpdate = Partial<User>;
// 只选取ID和名称
type UserPreview = Pick<User, 'id' | 'name'>;
// 排除email创建核心类型
type CoreUser = Omit<User, 'email'>;
// 创建权限映射
type PermissionLevel = 'read' | 'write' | 'admin';
const permissions: Record<PermissionLevel, boolean> = {
  read: true;
  write: false;
  admin: true;
};
```

#### 2.2 映射类型
通过遍历修改已有类型的属性
```ts
type Getters<T> = {
  [K in keyof T as `get&{Capitalize<string & K>}`]: () => T[K]
}

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// 等价于
{
  getName: () => string;
  getAge: () => number;
}
```

#### 2.3 条件类型
实现类型逻辑分支
```ts
// 处理Promise返回值
type AsyncResult<T> = T extends Promise<infer U> ? U : T;
// 深度可选
type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T
```

#### 2.4 模型字面量类型
创建组合字符串类型
```ts
type HttpMethod = 'GET' | 'POST' | 'PUT';
type ApiRoute = `/api/${string}`;

type ApiEndpoint = `${HttpMethod} ${ApiRoute}`;
const endpoint: ApiEndpoint = 'GET /api/users';

// 结合映射类型创建事件系统
type Event = 'click' | 'scroll';
type HandlerType = `${Event}Handler`;
// 'clickHandler' | 'scrollHandler'
```

### 3. 类型守卫与类型收窄
缩小变量在特定作用域的类型范围

#### 3.1 内置守卫
创建组合字符串类型
```ts
// typeof
function padLeft(value: string, padding: string | number) {
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + value; // padding: number
  }

  return padding + value; // padding: string
}

// instanceof
class Animal {}
class Bird extends Animal { fly() {} }
function move(animal: Animal) {
  if(animal instanceof Bird){
    animal.fly(); // animal: Bird
  }
}

// in 操作符
interface Fish { swim(): void }
interface Dog { run(): void }
function action(pet: Fish | Dog) {
  if ('swim' in pet) {
    pet.swim(); // pet: Fish
  }
}
```

#### 3.2 自定义类型守卫
创建组合字符串类型
```ts
// 类型谓词语法： args is Type
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(input: string | number) {
  if(isString(input)) {
    input.toUppercase(); // input: string
  }
}
```

#### 3.3 可辨识联合
通过公共字面量字段区分类型
```ts
type Shape = 
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

function getArea(shape: Shape) {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2; // shape: Circle
    case 'square':
      return shape.side ** 2; // shape: Square
  }
}
```

## 三.面向对象与设计

### 1.类与继承

#### 1.1 访问修饰符
| 修饰符 | 类内部 | 子类 | 实例 | 不可重新赋值 |
|:--|:--:|:--:|:--:|:--:|
| public | ✓ | ✓ | ✓ | ✗ |
| protected | ✓ | ✓ | ✗ | ✗ |
| private | ✓ | ✗ | ✗ | ✗ |
| readonly | ✓ | ✓ | ✓ | ✓ |

```ts
class Animal {
  public name: string;      // 公开访问
  protected age: number;    // 仅类及子类可访问
  private id: string;       // 仅类内部访问
  readonly species: string; // 初始化后不可修改
  
  constructor(name: string) {
    this.name = name;
    this.id = genderateUUID();
    this.species = 'Animal';
  }
}

class Dog extends Animal {
  constructor(name: string) {
    super(name);
    console.log(this.age);  // ✅ 子类可访问protected
    console.log(this.id);   // ❌ private成员不可访问
  }
}

const dog = new Dog('Nice');

dog.name = 'Bad'; // ✅
dog.species = 'Taidy'; // ❌ readonly属性
```

#### 1.2 抽象类与抽象方法
定义规范而不实现细节，强制子类实现约定
```ts
abstract class Shape {
  abstract getArea(): number;  // 抽象方法无实现
  
  // 抽象类可包含具体方法
  printArea() {
    console.log(`Area: ${this.getArea()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }
  
  // 必须实现抽象方法
  getArea() {
    return Math.PI * this.radius ** 2;
  }
}

const shape = new Shape(); // ❌ 抽象类不能实例化
const circle = new Circle(5);

circle.printArea(); // 输出：Area: 78.54
```

#### 1.3 静态成员与静态块
定义规范而不实现细节，强制子类实现约定
```ts
class Config {
  static apiUrl: string;
  static env: 'dev' | 'prod';
    
  // 静态初始化块 （TypeScript 4.4+）
  static {
    this.env = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    this.apiUrl = this.env === 'prod' ? 'https://api.example.com' : 'http://localhost:3000';
  }
    
  static logConfig() {
    console.log(`Environment: ${this.env}, API: ${this.apiUrl}`);
  }
}

// 无需实例化直接访问
Config.logConfig();
```

### 2. 接口 vs 类型别名

#### 2.1 声明合并
```ts
// 接口自动合并
interface User {
  name: string;
}

interface User {
  age: number;
}

const user: User = {
  name: 'Tom',
  age: 30,
};

// 类型别名不可重复
type Person = { name: string };
type Person = { age: number }; // ❌ 重复标识符
```

#### 2.2 扩展方式
```ts
// 接口扩展
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// 类型别名扩展
type Cat = Animal & {
  color: string
}

// 接口扩展类型别名
interface Bird extends Animal {
  wingspan: number;
}
```

#### 2.3 适用场景对比
| ​​特性 | 接口(interface)​ | 类型别名(type)​ |
|:--|:--:|:--:|
| 声明合并	 | ✓ | ✗ |
| 扩展方式 | extend | &(交叉类型) |
| 实现类 | ✓(implements) | ✗ |
| 联合/元组等复杂类型 | ✗ | ✓(type T = A) |
| 映射类型 | ✗ | ✓(type Readonly<T> = { ... }) |

最佳实践：
- 定义对象形状优先用接口
- 复杂类型组合（联合、元组）用类型别名
- 库类型定义优先用接口（支持使用者扩展）

如何选择interface和type？
- 需要声明合并或 implements 时用 interface
- 需要联合类型时、元组或映射类型时用type 其他场景根据团队规范保持一致即可

### 3. 装饰器

#### 3.1 装饰器类型
```ts
// 类装饰器
@sealed
class Person {}

function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

// 方法装饰器
class MathOps {
  @log
  add(a: number, b: number) {
    return a + b;
  }
}

function log(target: any, key: string, desc: PropertyDescriptor) {
  const original = desc.value;

  desc.value = function (..args: any[]) {
    console.log(`Calling ${key} with`, args);
    return original.apply(this, args);
  }
}

// 属性装饰器
class User {
  @format('Hello, %s')
  name: string;
}

function format(template: string) {
  return (target: any, key: string) => {
    let value = target[key];
  
    Object.defineProperty(target, key, {
      get: () => value;
      set: (v) => { value = template.replace('%s', v) },
    });
  };
}

// 参数装饰器
class Validator {
  validate(@required name: string) {}
}

function required(target: any, key: string, index: number) {
  // 存储元数据用于后续验证
}
```

#### 3.2 装饰器工厂与执行顺序
```ts
// 装饰器工厂（返回装饰器函数）
function decoratorFactory(options: any){
  return function (target: any) {
    // 使用options配置
  }
}

@decoratorFactory({ level: 'high' })
class Example {}

// 执行顺序
// 1. 参数装饰器
// 2. 方法/属性装饰器
// 3. 类装饰器
// 多个同类型装饰器时，从上到下执行
```