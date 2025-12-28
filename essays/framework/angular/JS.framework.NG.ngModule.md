# Angular 模块 - NgModule
> 注1：本篇中如无特殊说明，'模块'均指 Angular 中的模块系统，并非指代 ES6 中的模块，二者是不一样的概念  
> 注2：自 Angular 14 引入 Standalone Component 后，模块概念逐渐弱化，官方也强烈推荐使用 Standalone 而非 模块

## 零、参考资料
- https://angular.dev/guide/ngmodules/overview
- https://juejin.cn/post/7124664273355145229

## 一、核心概念
Angular 的模块系统算是整个 Angular 应用的基石，React & Vue 中没有这样的概念，所以，模块可谓是 Angular 特有的概念。那么 Angular 中的模块是什么？

如果简单理解的话，模块接近于 **作用域/命名空间/范围** 等等这样的概念，在 Angular 2+ 中，组件(component)/指令(directives)/管道(pipes) 均需要挂在某一个**模块**中，而如果想在某个其他的组件/指令/管道中使用这些，需要先在元数据(类似 @Component({...}))中导入该**模块**，其次才能使用。在 Angular 中，一切均可以组织成模块。

## 二、模块的结构
我们使用装饰器 ```@Component({ ... })``` 来修饰一个 ```class```，那么这个 ```class``` 就被定义成一个**组件**，同样地如果使用装饰器 ```@NgModule({ ... })``` 来修饰，那么这个 ```class``` 就被定义成一个**模块**。所以，如果从 OOP 的角度上来说，**组件**和**模块**之间并无区别，但是从使用角度(Angular 的整体架构)上来说，两者是不同的东西

一个基础的模块结构：
```ts
@NgModule({
  providers?: (Provider | EnvironmentProviders)[] | undefined;
  declarations?: (any[] | Type<any>)[] | undefined;
  imports?: (any[] | Type<any> | ModuleWithProviders<{}>)[] | undefined;
  exports?: (any[] | Type<any>)[] | undefined;
  bootstrap?: (any[] | Type<any>)[] | undefined;
  schemas?: (any[] | SchemaMetadata)[] | undefined;
  id?: string | undefined;
  jit?: true | undefined;
})

// 模块中一般不会有什么代码
class xxModule {}
```

### declarations
在 declarations 数组中，我们定义着所有的组件，指令和管道，我们可以在这个模块内使用。如果一个组件（或者指令或者管道）你并没有添加到 declarations 中，但是你又在模块或者应用中使用了，angular 应用在运行时报错。此外，**一个组件（或者指令或者管道）只能在一个模块中声明**。如果你想在多个模块中使用你的组件，你需要将改组件捆绑到一个单独的模块中，并将其导入到模块中

```ts
import { AComponent } from './a-component';
import { BComponent } from './b-component';
import { CDirective } from './c-directive';

@NgModule({
  /* ... */
  // This NgModule declares all of components, directives, and pipes
  declarations: [AComponent, BComponent, CDirective],
})
export class xxModule {}
```

### imports
和 declarations 类似，但是 declarations 中添加的是组件/指令/管道，而 imports 中添加的则多了个**模块**。

按照官方的说明，模块下的组件或许会依赖其他的组件/指令/管道，那么这些依赖就需要被添加在 imports 中：
```ts
@NgModule({
  /* ... */
  // CustomMenu and CustomMenuItem depend on the PopupTrigger and SelectorIndicator components.
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],
})
export class CustomMenuModule {}
```

### exports
当 B 模块中需要使用 A 模块的东西的时候，需要在 A 模块中将其导出，这样在 B 模块中才能使用

```ts
@NgModule({
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem],

  // Also make PopupTrigger available to any component or NgModule that imports CustomMenuModule.
  exports: [CustomMenu, CustomMenuItem, PopupTrigger],
})
export class CustomMenuModule {}
```

当然，也能导出**子模块**

### bootstrap
定义应用程序的根组件。仅在 AppModule(相当于入口) 中使用它

### providers
这里定义模块所需的任何的 @Injectable。然后，任何子组件或者模块都可以通过依赖注入获得该 @Injectable 相同的实例。结合官网 demo：
```ts
// a module
@NgModule({
  imports: [PopupTrigger, SelectionIndicator],
  declarations: [CustomMenu, CustomMenuItem], // 旗下的子组件

  // Provide the OverlayManager service
  providers: [OverlayManager],
  /* ... */
})
export class CustomMenuModule {}

// another module
@NgModule({
  imports: [CustomMenuModule],  // 引入 CustomMenuModule
  declarations: [UserProfile], // 旗下的子组件
  providers: [UserDataClient],
})
export class UserProfileModule {}
```
因为 ```CustomMenuModule``` 中提供了服务 ```OverlayManager```，那么：
- 在 ```CustomMenuModule``` 的子模块/组件/指令/管道 中， ```OverlayManager``` 都可以注入同一个 ```OverlayManager``` 实例
- 组件 ```UserProfile```(属于 ```UserProfileModule``` 模块) 也可以注入同一个 ```OverlayManager``` 实例
- 服务 ```UserDataClient``` 可以注入同一个 ```OverlayManager``` 实例
> 服务 ```OverlayManager``` 中能否使用 ```UserDataClient``` 实例？

### schemas
指定模块允许的非标准 HTML 元素和属性

### id
指定模块的唯一标识符。通常用于懒加载模块。

## 三、模块示例
### 内置模块
Angular 内置了许多模块，比如 Form、Router 等模块，我们如果想要使用内部的功能的话，需要在相应的组件中先引入(imports)模块，这里可以自行参考 Angular 的文档

### 自定义模块
比如，我们需要自定义一个登录相关的模块，其中包括登录和注册页面，或许也包含一个帮助的页面。每个页面以组件的方式呈现。
```js
// component
LoginComponent
RegisterComponent
HelpComponent
```
这些页面是完全独立的，并且与应用程序的内容页面无关。所以，我们可以将其统一放在一个单独的模块中，我们称之为 ```AuthenticationModule```：
```ts
// src/app/authentication/authentication.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HelpComponent } from './help/help.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';

@NgModule({
  imports: [CommonModule],
  declarations: [LoginComponent, RegisterComponent, HelpComponent],
  exports: [LoginComponent, RegisterComponent, HelpComponent],
})
export class AuthenticationModule {}
```

在 AppModule 中导入后，就可以在其(AppModule)旗下的组件中使用：
```ts
// src/app/app.module.ts

import { AuthenticationModule } from './authentication/authentication.module'
import { BrowserModule } from '@angular/platform-browser'
import { NgModule } from '@angular/core'

import { AppComponent } from './app.component'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AuthenticationModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## 四、Standalone 
虽然说 NgModule 是 Angular 的基石，但是开发团队也逐渐意识到，模块的划分也产生了很多不需要的中间代码，比如，一些需要复用的组件/指令/管道都要挂在一个 sharedModule 中才能实现复用，于是，开发者需要专门定义一个这样的 shareModule.module.ts 文件，里面仅仅是通过 @NgModule 来 imports 和 exports 需要复用的东西，其他什么也不干。所以在 V14 的时候，引入了 Standalone 概念，这个概念标志着如果组件/指令/管道被标记成 ```standalone: true```，那么这个组件/指令/管道就不用再挂到某一个具体的模块下面，而要使用这种组件/指令/管道，只需要在自己的组件装饰器的 imports 中直接添加即可。

> 而从 Angular 19 开始，组件/指令/管道默认  ```standalone: true```，即 14 ~ 19 的版本中，```standalone``` 默认为 false，需要手动开启

Standalone 的出现，使得开发体验大大提升。但并不意味着 NgModule 概念的消失。相反，一定程度的模块范围划分能很好地进行项目的组织和管理