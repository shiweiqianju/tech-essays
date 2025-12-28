# Typescript Practice

https://juejin.cn/post/7533826195352829988

## 一.模块与工程化

### 1.模块系统

#### 1.1 ES Module vs CommonJS 类型声明
```ts
// ES Module（推荐）
import { func } from './module'; // 编译时类型检查
export const value = 42;

// CommonJS（需类型声明）
const _ = require('lodash'); // 无类型
import _ from 'lodash';      // 需安装 @type/lodash

// 类型声明示例（module.d.ts）
declare module 'my-legacy-lib' {
  export function oldFunc(): void();
}
```

#### 1.2 import type 类型隔离
```ts
// 仅导入类型（编译后移出）
import type { User } from './types';

// 混合导入
import { fetchUser, type User } from './api';

// 常见场景：避免循环依赖
// types.ts
export type User = { id: number; name: string };

// utils.ts
export const formatName = { user: User } => user.name.toUpperCase();
```

#### 1.3 命名空间（namespace）
适用场景
- 兼容旧版全局变量脚本
- 组织内部模块避免命名冲突

```ts
namespace MyLib {
  export interface Config { timeout: number }
  export class Service { /*...*/}
}

// 使用
const config: MyLib.Config = { timeout: 1000 };
const service = new MyLib.Service();

// 现代替代方案：模块化导出
export interface Config { timeout: number }
export class Service { /*...*/ }
```

### 2.配置与编译

#### 2.1 tsconfig.json 
| 配置项​ | ​作用​ | 推荐值 |
| :-- | :-- | :-- |
| target | 编译目标 JS 版本 | ES2020/ESNext |
| module | 模块系统 | ESNext(Web) / CommonJS(Node) |
| moduleResolution | 模块解析策略 | node(类 Node.js 解析逻辑) |
| strict | 启用所有严格检查 | true(新项目必开) |
| noImplicitAny | 禁止隐式 any类型 | true |
| strictNullChecks | 强制空值检查 | true |
| declaration | 生成 .d.ts类型声明文件 | true(库开发必备) |
| sourceMap | 生成源码映射文件 | true(调试必备) |
| outDir | 	输出目录 | "dist" |
| esModuleInterop | 改善 CommonJS/ESM 互操作性 | true |
| skipLibCheck | 跳过库类型检查 (提升编译速度) | true(大型项目) |

核心配置：
```ts
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "outDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

#### 2.2 严格模式（strict）详情
开启后包含以下子选项：
- noImplicitAny：禁止隐式any
```ts
function fn(s) {
  return s;
} // ❌ 参数's'隐式any
```
- strictNullChecks：空值安全检查
```ts
const el: HTMLElement | null = document.getElementById('root');

el.innerHTML = ''； // ❌ 可能为null
```
- strictFunctionTypes：函数参数逆变检查
- strictBindCallApply：严格绑定函数参数
- strictPropertyInitialization：类属性初始化检查

#### 2.3 项目引用
解决痛点
- 大型项目代码分割
- 增量编译加速
- 多项目类型依赖管理 配置示例

```ts
// tsconfig.ts（主项目）
{
  'references': [
    { 'path': '../core' },   // 引用子项目
    { 'path': '../utils' }
  ],
  'compilerOptions': {
    'composite': true,      // 启用复合项目
    'incremental': true     // 增量编译
  }
}

// core/tsconfig.json
{
  'compilerOptions': {
    'composite': true
    'outDir': '../../dist/core'
  }
}
```

工作流
```bash
# 构建依赖项目
tsc -b core utils --verbose

# 增量编译主项目（仅修改部分）
tsc -b --force
```

### 3. 工程化实践

#### 3.1 类型声明分发
库开发发布方案：
```json
// package.json
"name": "my-lib",
"main": "dist/index.js",     // JS入口
"types": "dist/index.d.ts"   // 类型入口
"files": ["dist"]            // 发布目录
```

#### 3.2 编译加速方案
| 方案​ | 原理​ | 效果​ |
| :-- | :-- | :-- |
| incremental+ 持久化缓存 | 保存上次编译信息 | 增量编译快 50%+ |
| Project References | 只编译修改的模块 | 大型项目提速 70%+ |
| fork-ts-checker | 独立进程类型检查 | 不阻塞 Webpack 构建 |
| ts-loader+ transpileOnly | 仅转译不类型检查 | 热更新速度提升 3x |

### 4.一些面试题

#### 4.1 项目引用（references）解决了什么问题？
主要有以下四点：

- 编译类型；子项目独立配置
- 增量构建：仅编译变更部分
- 类型隔离：避免全局命名冲突
- 依赖管理：显式声明项目间依赖关系

#### 4.2 如何为无类型的第三方库添加类型支持？
主要有以下三点：

- 方案1：安装社区类型包@types/xxx
- 方案2: 项目内声明 declare module 'lib'
- 方案3: 创建vendor.d.ts扩展类型：
```ts
declare module 'legacy-lib' {
  export function oldModule(): void;
  const version: string;
}
```

## 二.工程实践与高级特性

### 1.声明文件（.d.ts）
为无类型代码提供类型安全支持

#### 1.1 为第三方库编写类型声明
```ts
// my-lib.d.ts
declare module 'untyped-lib' {
  export function calculate(a: number, b: number): number;
  export const version: string;
}

// 使用
import { calculate } from 'untyped-lib';

const result = calculate(10, 20);  // ✅ 类型安全
```

#### 1.2 模块扩充（declare module）
扩展已有模块的类型定义
```ts
// 扩展express Request对象
declare module 'express' {
  interface Request {
    user?: { id: string; role: string };
  }
}

// 使用中间件
app.use((req, res, next)) => {
  req.user = { id: '123', role: 'admin' }; // ✅ 类型安全
  next();
}
```

#### 1.3 全局类型声明（declare global）
添加全局可访问的类型/变量
```ts
// 扩展window接口
declare global {
  interface Window {
    __APP_CONFIG__: {
      apiBase: string;
      debug: boolean;
    }
  }
  
  // 声明全局函数
  function trackEvent(event: string): void;
}

// 使用
window.__APP_CONFIG__.apiBase; // ✅
trackEvent('page_load'); // ✅
```

### 2.异步与并发

#### 2.1 Promise<T> 类型
精确描述异步操作结果
```ts
// 基本用法
function fetchData(): Promise<{ data: string }> {
  return fetch('/api').then(res => res.json());
}

// 错误处理
async function getUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/user/${id}`);

    if (!response.ok) throw new Error('Not Found');

    return response.json();
  } catch (error) {
    // error 类型为 unknown
    if (error instanceof Error) {
      console.error(error.message);
    }

    throw error;
  }
}
```

#### 2.2 async/await 类型推断
自动推断异步类型返回
```ts
// 返回 Promise<string>
async function fetchText(url: string): string {
  const response = await fetch(url);

  return response.text();
}

// 更复杂的类型推断
async function processData() {
  const user = await getUser(1); // User 类型
  const posts = await getPosts(user.id); // Post[] 类型

  return { user, posts }; // 推断为 Promise<{ user: User; posts: Post[] }>
}
```

### 3.实用技巧

#### 3.1 keyof 与索引访问类型（T[K]）
动态访问对象类型
```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// 获取所有键的联合类型
type UserKeys = keyof User; // 'id' | 'name' | 'email'

// 动态属性访问
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user:User = { id: 1, name: 'Alice', email: 'alice@example.com' };
const name = getProperty(user, 'name'); // string 类型
```

#### 3.2 this 类型与链式调用
支持流畅接口类型
```ts
class Calculator {
  value: number;
  
  constructor(value = 0) {
    this.value = value;
  }
  
  add(n: number): this {
    this.value += n;
    return this; // 返回自身实例
  }
  
  multiply(n: number): this {
    this.value *= n;
    return this;
  }
}

// 链式调用
const result = new Calculator(10)
  .add(5)      // Calculator
  .multiply(2) // Calculator
  .value       // 30
```

#### 3.3 satisfies 操作符（TS 4.9+）
```ts
// 不改变类型推断
const colors = {
  red: '#FF0000';
  green: '#00FF00';
  blue: '#0000FF';
} satisfies Record<string, string>;

// 保留字面量类型
const theme = {
  primary: 'blue';
  secondary: 'green';
} satisfies { primary: keyof typeof colors; secondary?: string };

// 错误检测
const invalid = {
  red: true // ❌ 必须满足 Record<string, string>
} satisfies Record<string, string>
```

#### 3.4 const 泛型参数（TS 5.0+）
```ts
// 之前：类型为 string[]
const names = ['Alice', 'Tom', 'Lucy'];

// TS 5.0+：使用 const 泛型参数
const namesConst = ['Alice', 'Tom', 'Lucy'] as const; // 类型为 readonly ['Alice', 'Tom', 'Lucy']

// 函数中使用
function getFirstElement<const T extends readonly any[]>(any: T): T[0] {
  return arr[0]
}

const first = getFirstElement(namesCount); // 类型为 'Alice' （字面量类型）
```

### 4.一些面试题

#### 4.1 keyof typeof组合使用有什么价值？
动态获取对象的键类型：
```ts
const colors = { red: 1, green: 2 };

type ColorKey = keyof typeof colors; // 'red' | 'green'
```

#### 4.2 satisfies 和 as 断言有什么区别？
- as：强制类型转换（可能掩盖错误）
- satisfies：验证类型兼容性（不改变类型推断）

```ts
// as 可能隐藏错误
const data = { value: 42 } as { value: string }; // ✅ 编译通过，但运行错误
// satisfies 会捕获错误
const data = { value: 42 } satisfies { value: string }; // ❌ 类型错误
```

#### 4.3 const泛型参数解决了什么问题？
解决泛型中过度推断为宽泛类型的问题：
```ts
// TS 5.0 前
declare function fn<T>(t: T): T;
const result = fn(['a', 1]); // 类型推断为（string | number）[]

// S 5.0+
declare function fn<const T>(t: T): T;
const result = fn(['a', 1]); // T 推断为 readonly [string, number]
```

## 三.框架集成

### 1. React + TS

#### 1.1 组件类型定义
- 函数组件：使用React.FC (FunctionComponent)类型
```ts
interface Props {
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}    

const Button: React.FC<Props> = ({ title, disabled = false, children }) => {
  return (
    <button disabled={disabled}>
      {title} - {children}
    </button>
  )
}
```

- 类组件
```ts
interface State {
  count: number;    
} 

class Counter extends React.Component<{}, State> {
  state: State = { count: 0 };
      
  increment = () => this.setState({ count: this.state.count + 1 });
    
  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;  
  }
}
```

#### 1.2 Hooks类型
- useState:
```ts
const [count, setCount] = useState<number>(0); // 显式类型
const [user, setUser] = useState<User | null>(null); // 联合类型
```

- useRef:
```ts
// DOM 引用
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => inputRef.current?.focus(), []);

// 可变值（不会触发渲染）
const timerRef = useRef<number | null>(null);
useEffect(() => {
  timerRef.current = setTimeout(() => {}, 1000);

  return () => clearTimeout(timerRef.current!);
}, []);
```

- useReducer:
```ts
type State = { count: number };
type Action = { type: 'increment' } | { type: 'decrement'; payload: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - action.payload };
    default: return false;
  }
};
    
const [state, action] = useReducer(reducer, { count: 0 });
```

#### 1.3 高阶组件（HOC）类型设计
```ts
// 基础 HOC
const withLogging = <P extends object>(
  WrappedComponent: React.ComponentType<P>    
) => {
  return (props: P) => {
    useEffect(() => console.log('Component mounted'), []);
    return <WrappedComponent {...props} />;
  }    
}
    
// 增强 Props 的 HOC
const withUser = <P extends { userId: string }> (
  WrappedComponent: React.ComponentType<P>   
) => {
  return (props: Omit<P, 'userId'>) => {
    const [user] = useUser();
    return <WrappedComponent {...props as P} userId={user.id} />
  }
}
```

### 2. Vue + TS

#### 2.1 Composition API 类型

- defineComponent
```ts
import { defineComponent, ref, reactive } from 'vue';

interface User {
  id: number;
  name: string;
}

export default defineComponent({
  props: {
    initialCount: { type: Number, default: 0 }  
  },
  setup(props) {
    const count = ref<number>(props.initialCount);
    const user = reactive<User>({ id: 1, name: 'Alice' });

    return { count, user };
  }
})
```

- 类型化 ref/reactive:
```ts
const count = ref(0); // 自动推断为 Ref<number>
const user = ref<User | null>(null); // 显式类型
const state = reactive({
  items: [] as Item[], // 类型断言
  loading: false
});
```

#### 2.2 组件 Props 类型推导
- 运行时声明：
```ts
defineComponent({
  props: {
    title: { type: String, required: true },
    count: Number, // 可选
    items: Array as PropType<Item[]> // 复杂类型
  }    
});
```

- 基于泛型的声明（Vue 3.3+）
```ts
// <script setup> 语法
defineProps<{
  id: string;
  name?: string;
  items: Item[];
}>();

// 带默认值
withDefaults(defineProps<{
  size?: 'small' | 'medium' | 'large'                           
}>(), {
  size: 'medium'    
});
```

#### 2.3 类型化Emit事件
```ts
// 选项式
defineComponent({
  emits: {
    submit: (payload: { email: string }) => true // 验证函数  
  }    
});

// Composition API
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', payload: FormData): void
}>();

// 使用
emit('submit', formData);
```

### 3. 通用最佳实践

#### 3.1 Props 设计原理
- 使用interface定义复杂类型Props
- 可选属性用 ?
- 只读属性用readonly

```ts
interface CardProps {
  readonly id: string;
  title: string;
  description?: string;
}
```

#### 3.2 事件处理类型
- React:
```ts
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);    
}
```

- Vue:
```ts
const handleClick = (e: MouseEvent) => {
  const target = e.target as HTMLButtonElement;
  console.log(target.value);
}
```

#### 3.3 表单处理
- React受控组件:
```ts
const [value, setValue] = useState('');

<input
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>;
```

- Vue v-model:
```vue
<script setup>
  const value = ref('');
</script>

<template>
  <input type='text' v-model='value' />    
</template>
```

### 4. 常见问题解决方案

#### 4.1 React组件如何类型化传递ref？
```ts
// 子组件
const Input = forwardRef<HTMLInputElement>((props, ref) => (
  <input ref={ref} {...props} /> 
));  

// 父组件
const parentRef = useRef<HTMLInputElement>(null);

<Input ref={parentRef} />;
```

#### 4.2 Vue中如何类型化provide/inject
```ts
// 提供者
const theme = Symbol() as InjectionKey<string>;

provide(theme, 'dark');
// 消费者
const themeValue = inject('theme'); // string | undefined
```

#### 4.3 如何类型化React Context？
```ts
interface ContextValue {
  user: User | null;
  login: (user: User) => void;
} 

const AuthContext = createContext<ContextValue>({
  user: null;
  login: () => {},
});
// 使用
const { user } = useContext(AuthContext);
```

#### 4.4 React HOC如何传递ref？
使用forwardRef + 泛型
```ts
const withLogging = <P, R>(Component: React.ForwardRefRenderFunction<R, P>) => {
  return forwardRef<R, P>((props, ref) => {
    return <Component ref={ref} {...props} />;    
  });   
};
```

## 四.原理和性能

### 1.类型系统设计

#### 1.1 结构化类型 vs 标称类型
- 核心区别：
  - 结构化类型：基于类型结构匹配（鸭子类型）
  - 标称类型：基于类型名称标识（如Java/C#）

- TS实现机制：
```ts
// 结构化类型示例
interface Vector2D { x: number; y: number }
interface Point { x: number; y: number }
const v: Vector2D = { x:1, y: 2 };
const p: Point = v; // ✅ 结构相同，允许赋值

// 模拟标称类型（使用品牌标记）
type Brand<K, T> = K & { __brand: T };
type UserID = Brand<string, 'UserID'>
type OrderID = Brand<string, 'OrderID'>
const userId: UserID = 'user_123' as UserID;
const orderId: OrderID = 'order_456' as OrderID;

userId === orderId; // ❌ 类型错误！防止ID混用
```

- 应用场景对比：
| 场景​ | 结构化类型优势 | 标称类型适用场景​ |
| :-- | :-- | :-- |
| 接口兼容性 | 自动适配相似结构 | 需严格区分语义相同的基础类型 |
| 第三方库集成 | 无需显式声明即可匹配 | 防止意外类型穿透 |
| 增量类型迁移 | 渐进式适配友好 | 需要强类型约束的核心领域模型 |

#### 1.2 条件类型的分布式特性
- 触发条件：条件类型作用于联合类型时自动分发
```ts
type ToArray<T> = T extends any ? T[] : never;
type Test = ToArray<string | number>;

// 等价于
(string extends any ? string[] : never) | (number extends any ? number[] : never)
// 结果：string[] | number[]
```

- 禁用分发：用元组包裹避免分发
```ts
type ToArray<T> = [T] extends [any] ? T[] : never;
type Test = ToArray<string | number>; // (string | number)[]
```

- 实战应用：
```ts
// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
// 过滤特定类型
type FilterStrings<T> = T extends string ? T : never;
type Result = FilterStrings<'a' | 1 | 'b'>; // 'a' | 'b'
```

### 2.类型系统涉及

#### 2.1 tsc 增量编译
- 原理：
  - 首次编译生成.tsbuildinfo文件记录类型检查
  - 后续编译仅处理变更文件及其依赖

- 配置
```ts
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true, // 启用增量编译
    "tsBuildInfoFile": "./.tsBuildcache" // 自定义换成路径
  }    
}
```

- 性能收益：
| 项目规模​ | 冷启动时间 | ​​增量构建时间​ | ​​提升比例​ |
| :-- | :-- | :-- | :-- |
| 小型（<100文件） | 1.2s | 0.3s | 75% |
| 中型（~500文件） | 8.5s | 1.1s | 87% |
| 大型（>2000文件） | 42s | 3.4s | 92% |

#### 2.2 项目引用加速构建
- 架构设计：
```text
monorepo/
├── tsconfig.base.json
├── core/                # 核心库
│   ├── src/
│   └── tsconfig.json    # { "composite": true }
├── web-app/             # 主应用
│   ├── src/
│   └── tsconfig.json    # { "references": [{ "path": "../core" }] }
└── scripts/
    └── build.ts          # 协调编译 
```
- 编译命令优化：
```bash
# 仅构建变更项目
tsc -b --force web-app
# 监控模式增量编译
tsc -b --watch
```

- 性能关键点：
  1. 依赖拓扑排序：自动按依赖顺序编译项目
  2. 增量缓存复用：跨项目共享 .tsbuildinfo
  3. 并行编译：独立项目可并行处理（需工具链支持）

### 3.深度性能优化技巧

#### 3.1 类型检查加速方案
| 技术 | 实现方式​ | ​​适用场景​ |
| :-- | :-- | :-- | :-- |
| skipLibCheck | 跳过声明文件类型检查 | 使用稳定第三方库时 |
| isolatedModules | 确保文件独立编译（兼容Babel） | 与Babel配合的混合构建 |
| ​​内存缓存池​ | 复用TS语言服务实例 | 开发服务器热更新 |

### 4.一些面试题

#### 4.1 如何定位TS编译性能瓶颈？
- 诊断工具链
  1. tsc --extendedDiagnostics 输出详细编译指标
  2. tsc --listFiles分析文件数量
  3. tsc --generateTrace生成时间线分析
- 关键指标：
  1. Parse Time：文件解析耗时
  2. Bind Time：符号绑定耗时
  3. Check Time：类型检查耗时


## 五.调试与错误处理

### 1.类型错误解读技巧

#### 1.1 错误信息结构拆解
TS错误通常包含以下核心部分：
```text
// 经典错误格式：
Type 'X' is not assignable to type 'Y'.
Property 'z' is missing in type 'X' but required in type 'Y'.
```
- 错误类型：Type ... is not assignable to type ... （类型不匹配）
- 错误根源：定位到具体方法/属性（Property 'z' is missing）
- 上下文链：多层嵌套类型会显示完整路径

#### 1.2 实战调试策略
- 策略1：逐层展开复杂类型
```ts
// 原始错误：
Type 'string | number' is not assignable to type 'number'

// 解决方案：添加类型防守
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();  
  }
  return value.toFixed(2); // value 被收窄为 number
}
```

- 策略2：使用临时类型别名
```ts
// 复杂错误：
Type 'Promise<Response<{ data: User }>>' is not assignable to type 'Promise<ApiResponse>'
// 添加临时类别别名分析
type Temp = Promise<Response<{ data: User }>>;
type Expected = Promise<ApiResponse>;
```

- 策略3：优先解决第一个错误
TS错误通常具有传染性，首个错误修复后后续错误可能自动消失

### 2.@ts-expect-error VS @ts-ignore 的使用规范

#### 2.1 使用规范对比
| 特性​ | @ts-expect-error | ​@ts-ignore​ |
| :-- | :-- | :-- | :-- |
| 语义 | 预期此处应有错误 | 强制忽略错误 |
| ​​错误消失时 | 报告未使用的错误抑制	 | 静默通过 |
| 适用场景 | 测试类型边界/临时兼容	 | 紧急修复/遗留代码 |
| 推荐指数​ | ★★★★★ (安全可控) | ★☆☆☆☆ (风险高) |

#### 2.2 正确使用示例
```ts
// ✅ @ts-expect-error 预期错误
// @ts-expect-error：故意传递错误类型测试
const result: number = 'hello';
// ❌ @ts-ignore 暴力忽略
// @ts-ignore：临时绕过第三方库类型问题
import untypedLib from 'untyped-lib';
// 危险用法（避免！）
// @ts-ignore：忽略所有后续错误
function dangerous() {
  // ...    
}
```

#### 2.3 最佳实践原则
1. 最小作用域：仅注释单行而非整个文件
2. 添加解释注释：说明忽略原因和后续处理计划
3. 定期清理：通过tsc --noEmit检测未使用的@ts-expect-error
4. 替代方案优先：
  - 使用any临时断言替代@ts-ignore
  - 通过.d.ts文件补充类型声明


### 3.类型断言的安全性边界

#### 3.1 断言形式对比
| 语法​ | 示例​ | 安全性​​ |
| :-- | :-- | :-- | :-- |
| as 断言 | el as HTMLInputElement | 中（需开发者保证） |
| ​! 非空断言 | element!.focus()	 | 低（易空指针） |
| 双重断言 | val as any as T	 | 极低（绕过检查） |

#### 3.2 安全使用准则
- 准则1：双重确认机制
```ts
// 不安全 ❌
const value = data as number;
// 安全：断言前加类型守卫 ✅
if (typeof data === 'number') {
  const value = data; // 自动收窄    
} else {
  throw new Error('Invalid type');    
}
```

- 准则2：范围最小化
```ts
// 不安全：整个对象断言 ❌
const user = response.data as User;

// 安全：局部属性断言 ✅
interface ApiResponse {
  data: unknown;    
}
const response: ApiResponse = fetchData();
const user = response.data as User; // 风险仍在 ❌

// 更安全：运行时验证 ✅
import { is } from 'typescript-is';
if (is<User>(response.data)) {
  // 安全使用 ✅
}
```

- 准则3：DOM元素特殊处理
```ts
// 不安全 ❌
const input = document.getElementById('name') as HTMLInputElement;
input.value = 'test'; // 可能为null

// 安全：可选链 + 断言 ✅
const input = document.getElementById('name');
input?.setAttribute('value', 'test'); // 不依赖断言
// 或空值检查 
if (input instanceof HTMLInputElement) {
  input.value = 'test';    
}
```