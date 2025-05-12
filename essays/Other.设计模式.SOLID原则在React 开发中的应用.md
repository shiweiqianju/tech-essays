# SOLID 原则在 React 开发中的应用

## 零、序言
* [SOLID 原则在 React 开发中的应用](https://juejin.cn/post/7165203743753912327)

## 一、S.O.L.I.D
在程序设计领域，S.O.L.I.D 指的是由罗伯特·C·马丁所引入的首字母缩写，指代了 OOP（面向对象编程）和 OOD（面向对象设计）的五个原则，当这些原则被一起应用时，使程序员更可能开发出一个容易进行维护和扩展的系统

| 简写 | 原则 | 概念 |
| :---- | :---- |
| S | 单一职责原则 | 认为“类应该有且只有一种职责”的概念 | 
| O | 开闭原则 | 认为“软件应该是对于扩展开放的，但是对于修改封闭的”的概念 |
| L | 里氏替换原则 | 认为“程序中的对象应该是可以在不改变程序正确性的前提下被它的子类所替换的”的概念 | 
| I | 接口隔离原则 | 认为“多个特定客户端接口要好于一个宽泛用途的接口”的概念 |
| D | 依赖反转原则 | 认为一个方法应该遵从“依赖于抽象而不是一个实例”的概念 |

SOLID 原则的构思和概述是以 OOP 语言为基础的，这些原则及其解释在很大程度上，依赖于 class 和 interface 的概念。尽管 React 在编程风格上更符合函数式编程范式，但是像 SOLID 这样的软件设计原则是与语言无关的，并且具有很高的抽象水平，这意味我们稍加变通，并在解释方面有一点点的自由性，我们就能够将它应用到我们的 React 代码中

# 单一职责原则 Single responsibility principle (SRP)
这个原则最初的定义是“每个类应该有且只有一种职责”，也就是只做一件事。我们可以简单地将定义推断为“每个函数/模块/组件应该只做一件事”，但要理解“一件事”的含义是什么，我们需要从内部（意味组件在内部做什么）和外部（这个组件如何被其他组件使用）两个不同的视角来检查我们的组件。  
我们从内部开始，为了确保我们的组件在内部只做一件事，我们可以：

- 把过大组件分解成更小的组件
- 将与组件主要功能无关的代码提取到单独的工具函数中
- 将与组件相关联的功能封装到自定义 hook 中

现在我们通过下面这个例子，来看看如何去应用这个原则：
```ts
const ActiveUsersList = () => {
  const [users, setUsers] = useState([]);
  const weekAgo = new Date();

  useEffect(() => {
    const loadUsers = async () => {
      const response = await fetch("/some-api");
      const data = await response.json();
      setUsers(data);
    };

    loadUsers();
  }, []);

  weekAgo.setDate(weekAgo.getDate() - 7);

  return (
    <ul>
      {users
        .filter((user) => !user.isBanned && user.lastActivityAt >= weekAgo)
        .map((user) => (
          <li key={user.id}>
            <img src={user.avatarUrl} />
            <p>{user.fullName}</p>
            <small>{user.role}</small>
          </li>
        ))}
    </ul>
  );
};
```
尽管这个组件现在相对较短，但是它还是做了太多的事情——它获取数据，过滤数据，渲染组件本身以及单个列表项，现在看看我们怎么去拆分它。  
首先，只要我们使用了 useState 和 useEffect hook，就是将它们提取到自定义 hook 中的好时机：

```ts
const useUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const response = await fetch("/some-api");
      const data = await response.json();

      setUsers(data);
    };

    loadUsers();
  }, []);

  return { users };
};

const ActiveUsersList = () => {
  const { users } = useUsers();
  const weekAgo = new Date();

  weekAgo.setDate(weekAgo.getDate() - 7);

  return (
    <ul>
      {users
        .filter((user) => !user.isBanned && user.lastActivityAt >= weekAgo)
        .map((user) => (
          <li key={user.id}>
            <img src={user.avatarUrl} />
            <p>{user.fullName}</p>
            <small>{user.role}</small>
          </li>
        ))}
    </ul>
  );
};
```

现在我们的 useUsers hook 只关心一件事了--从 API 获取用户，他还让我们的主组件更加可读，不仅是因为它变短了，还因为我们用一个明确的领域概念解释了这个 hook 的用途。  
接下来我们看下用于主组件渲染的 JSX，每当我们在一个数组上循环渲染列表项时，我们需要注意一下每个列表项所使用的 JSX 的复杂性。如果它简单的只用一行就可以写下，没有任何的事件处理，保持它內联是完全可以的。但是对于更复杂的情况，将它提取到一个单独的组件中会是个比较好的处理方式：  

```ts
const useUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
      const response = await fetch("/some-api");
      const data = await response.json();

      setUsers(data);
    };

    loadUsers();
  }, []);

  return { users };
};

const UserItem = ({ user }) => {
  return (
    <li>
      <img src={user.avatarUrl} />
      <p>{user.fullName}</p>
      <small>{user.role}</small>
    </li>
  );
};

const ActiveUsersList = () => {
  const { users } = useUsers();
  const weekAgo = new Date();

  weekAgo.setDate(weekAgo.getDate() - 7);

  return (
    <ul>
      {users
        .filter((user) => !user.isBanned && user.lastActivityAt >= weekAgo)
        .map((user) => (
          <UserItem key={user.id} user={user} />
        ))}
    </ul>
  );
};
```

和前面的更改一样，我们把用于渲染用户信息的逻辑提取到了单独的组件中，使主组件变的更小和更易读。  

最后，我们可以把从 API 获得的用户列表中过滤出非活动用户的逻辑提取到一个工具函数中，这种逻辑是相对独立的，可以在应用的其他部分中重用。
```ts
const getOnlyActive = (users) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
 
  return users.filter((user) => !user.isBanned && user.lastActivityAt >= weekAgo);
};

const ActiveUsersList = () => {
  const { users } = useUsers();

  return (
    <ul>
      {getOnlyActive(users).map((user) => (
        <UserItem key={user.id} user={user} />
      ))}
    </ul>
  );
};
```

这个时候我们的主组件以及足够的简短和直接了，我们可以选择停止分解它，然后收工，但如果我们仔细观察一下，会发现它做的事情还是比它应该要做的更多。目前我们的组件执行了获取数据，然后过滤掉非活动的用户，最后将它渲染出来，但在理想情况下我们只想要获取数据并渲染它，而不需要更多的额外的操作，因此作为最后一个改进，我们可以将这个逻辑封装到一个新的自定义 hook 中：
```ts
const useActiveUsers = () => {
  const { users } = useUsers()

  const activeUsers = useMemo(() => {
    return getOnlyActive(users)
  }, [users])

  return { activeUsers }
}

const ActiveUsersList = () => {
  const { activeUsers } = useActiveUsers()
  return (
    <ul>
      {activeUsers.map(user => <UserItem key={user.id} user={user} />)}
    </ul>
  )
}
```

在这里，我们创建了 useActiveUsers hook 来封装获取数据和过滤的逻辑，为了性能我们还使用 useMemo 缓存了过滤结果，而我们的主组件只做了最基本的工作——渲染从 hook 中获取的数据。  
那么现在，根据我们对“一件事”的解释，我们仍然可以认为组件首先获取数据然后再渲染它，这不是“一件事”。我们可以进一步的分解，在一个组件中调用 hook 获取数据，然后将结果通过 props 传递给另一个组件，但俗话说过犹不及，这样反而添加了不必要的抽象，在实际的应用中也少有收益。所以让我们放过这个组件，接受“渲染组件所获取的数据”作为“一件事”这个定义。  
接下来，我们透过外部视角，看看我们的组件是如何工作。在我们的系统中，组件从来不是孤立存在的，相反，它们是更大的系统的一部分，在这个系统中，它们通过向其他组件提供功能或者使用其他组件提供的功能而进行交互。因此单一职责的外部视角关心的是一个组件可以用于多少事情。  

## 没有银弹
1. 颗粒化的程度

## 一些实践
1. 随着应用规模的增加，一些组件无法保持最初的设计，功能会变得越来越复杂，最终变为传说级代码。从实际开发角度来说，有一个迹象表明组件已经超出了它的初始用途，需要进行分割，就是一组改变行为的 if 语句。它也适用于 js 函数，如果你一直在添加控制函数内部执行流的参数来产生不同的结果，你可能会发现一个函数做的太多了。另一个标志是一个有很多可选 props 的组件。如果你通过在不同的上下文中提供不同的 props 来使用这样的组件，那么很可能你要处理的是伪装成一个组件的多个组件

# 开闭原则 Open-closed principle (OCP)
这个原则的定义是“软件实体应该对扩展开放，但对修改关闭”。因为我们的 React 组件和函数是软件实体，所以我们不需要改变定义，可以直接可以采用它的原始形式。  
开闭原则主张我们应该构建一个不改变其源代码的情况下就可进行扩展的组件。为了更直观的观察其该如何运行，让我们考虑这么一个场景——我们正在开发一个应用程序，它在不同的页面上使用一个共享的 Header 组件，根据我们所在的页面，Header 应该渲染一个稍微不同的 UI：
```ts
const Header = () => {
  const { pathname } = useRouter();

  return (
    <header>
      <Logo />
      <Actions>
        {pathname === "/dashboard" && <Link to='/events/new'>Create event</Link>}
        {pathname === "/" && <Link to='/dashboard'>Go to dashboard</Link>}
      </Actions>
    </header>
  );
};

const HomePage = () => (
  <>
    <Header />
    <OtherHomeStuff />
  </>
);

const DashboardPage = () => (
  <>
    <Header />
    <OtherDashboardStuff />
  </>
);
```

可以看到，我们根据所在页面的不同，渲染指向不同页面的链接。考虑一下如果我们开始添加更多页面时会发生什么，很容易就会意识到这个实现是不好的。每次创建新的页面时，我们都需要返回 Header 组件调整它的实现，以确保它知道需要渲染哪个链接。这种实现方式使得我们的 Header 组件很脆弱，并且与其使用的上下文紧密耦合，也违背了开闭原则。
为了解决这个问题，我们可以使用组合组件。我们的 Header 组件不在需要关心它要在内部渲染什么，相反它可以通过使用 children prop 将这个责任委托给使用它的组件

```ts
const Header = ({ children }) => (
  <header>
    <Logo />
    <Actions>{children}</Actions>
  </header>
);

const HomePage = () => (
  <>
    <Header>
      <Link to='/dashboard'>Go to dashboard</Link>
    </Header>
    <OtherHomeStuff />
  </>
);

const DashboardPage = () => (
  <>
    <Header>
      <Link to='/events/new'>Create event</Link>
    </Header>
    <OtherDashboardStuff />
  </>
);
```
通过使用这种方法，我们完全删除了 Header 内部的变量逻辑，现在可以使用组合的方式来放置我们想放置的任何内容，而不需要修改组件本身。  

在 React 中解决这个问题的通用方法是，在组件之中提供一个可以插入的占位符，我们也不限制每个组件只能有一个占位符，当我们需要多个占位符时候，我们可以使用任意数量的 props 替代。如果我们需要将一些 Header 内部变量传递给使用它的组件，我们可以使用 render props 模式。如果有熟悉 Vue 的朋友，应该会发觉这个方法和 Vue 的 slot 机制类似，或者说 Vue 通过提供 slot 机制，让用户的组件可以遵循开闭原则，减少组件之间的耦合，使组件更具扩展性和可重用性。两者的根本目的是一致的，只不过 Vue 使用内置的 slot 机制，而在 React 中我们需要通过遵循某种规范来实现。

# 里氏替换原则 Liskov substitution principle (LSP)
里氏替换原则建议设计对象的方式应该是“子类对象应该可以替代父类对象”。在最初的定义中，子类/父类关系是通过类继承实现的，但不一定非要这样，在一个更广泛的意义上，继承仅仅是将一个对象基于另一个对象，同时保留一个类似的实现，这个是我们在 React 中经常做的事情。  
关于子类和父类关系的一个非常基本的例子，可以通过下面这个例子来演示：
```ts
interface ICellComponent {
  (props: { value: string; label: string }): React.ReactElement;
}

const Cell: ICellComponent = (props) => {
  /* ... */
};

const PrefixedCell: ICellComponent = (props) => {
  return <Cell {...props} value={`¥${props.value}`} />;
};

const renderCellList = (data: { value: string; label: string }[], CellComp: ICellComponent) => {
  return data.map((cellProps, index) => <CellComp key={index} {...cellProps} />);
};

const App = () => {
  const orderData = [
    { label: "优惠金额", value: "10.00" },
    { label: "实付金额", value: "20.00" },
  ];

  return (
    <div>
      {renderCellList( orderData, Cell)}
    </div>
  );
};
```
在上面的代码中，我们基于 Cell 组件创建了 PrefixedCell。这个新的 PrefixedCell 组件给 value 属性添加了一个前缀，因此在这个上下文当中，我们可以将 Cell 和 PrefixedCell 视为父类和子类组件。  
此外 PrefixedCell 还符合它所基于的组件的接口，它使用与 Cell 本身相同的 props。因此，我们可以很容易的在应用程序的任何地方将 Cell 替换为 PrefixedCell，而无需中断它或进行任何其他更改。这个就是我们遵守里氏替换原则的好处。  
下面是另一个更有趣的例子：
```ts
type Props = InputHTMLAttributes<HTMLInputElement>;

const Input = (props: Props) => {
  /* ... */
};

const CharCountInput = (props: Props) => {
  return (
    <div>
      <Input {...props} />
      <span>Char count: {props.value.length}</span>
    </div>
  );
};
```
在上面的代码中，我们基于一个基本的 Input 组件来创建一个增强的版本，该版本还可以显示输入的字符数。虽然我们向它添加了新的逻辑，但是 CharCountInput 仍然保留了原始 Input 组件的功能。组件的接口也保持不变，这里再次观察到了里氏替换原则。  
里氏替换原则在组件共享共同特征的情况下特别有用，例如 Icon 或者 Input，一个图标组件可以换成另一个图标，而更具体的 DatePickerInput 和 AutocompleteInput 应该可以换成更通用的 Input 组件。然而我们应该承认，这一原则也不应该总是得到遵守，通常我们创建子组件的目标是添加父组件所不具备的新功能，这通常会破坏父组件的接口，这是一个完全有效的用例，我们不应该死板的遵守这个原则。

# 接口隔离原则 Interface segregation principle (ISP)
接口隔离原则原定义为，“客户端不应该依赖于它们不使用的接口”。为了应用于 React，我们将把它转化为“组件不应该依赖于它们不使用的属性”。  
我们在这里扩展了 ISP 的定义，但这并不是一个很大的扩展，属性和接口，都可以被定义为对象（组件）和外部世界（使用它的上下文）之间的契约，所以我们可以在这两者之间划出相似之处。
为了更好的说明这个原则，请看下面这个实例：
```ts
type Video = {
  title: string;
  duration: number;
  coverUrl: string;
};

type Props = {
  items: Array<Video>;
};

const VideoList = ({ items }) => {
  return (
    <ul>
      {items.map((item) => (
        <Thumbnail key={item.title} video={item} />
      ))}
    </ul>
  );
};
```

我们的 Thumbnail 组件是这样定义的：

```ts
type Props = {
  video: Video;
};

const Thumbnail = ({ video }: Props) => {
  return <img src={video.coverUrl} />;
};
```

Thumbnail 组件非常小和简单，但它有一个问题——它期望一个完整的 Video 对象作为属性，同时它只用了其中一个字段。
为什么我们会认为它是一个有问题的实现呢，来让我们想象一下，除了视频外我们还决定显示直播的预览图，将两种媒体资源混合在一个列表中展示：

```ts
type LiveStream = {
  name: string;
  previewUrl: string;
};

type Props = {
  items: Array<Video | LiveStream>;
};

const VideoList = ({ items }) => {
  return (
    <ul>
      {items.map((item) => {
        if ("coverUrl" in item) {
          // 它是一个Video对象
          return <Thumbnail video={item} />;
        } else {
          // 它是一个LiveStream对象，但我们要怎么使用 Thumbnail组件来渲染它？
        }
      })}
    </ul>
  );
};
```

如你所见，我们可以很容易的区分 Video 和 LiveStream，但是我们不能将后者传递给 Thumbnail 组件，首先它们具有不同的类型，所以 TS 会报错，其次它们在使用不同的字段来标识缩略图 URL，在 Video 对象中它叫做 coverUrl，在 LiveStream 对象中它叫做 previewUrl。这就是问题的关键，让组件依赖于比它们实际需要的更多的属性只会让它们变得更加难以复用。所以让我们来解决这个问题。
我们将重构我们的 Thumbnail 组件，以确保它只依赖于所需的属性:

```ts
type Props = {
  coverUrl: string;
};

const Thumbnail = ({ coverUrl }: Props) => {
  return <img src={coverUrl} />;
};
```

有了这个变化，现在我们可以使用它来渲染 Video 和 LiveStream 的缩略图:

```ts
type Props = {
  items: Array<Video | LiveStream>;
};

const VideoList = ({ items }) => {
  return (
    <ul>
      {items.map((item) => {
        if ("coverUrl" in item) {
          // 它是一个Video
          return <Thumbnail coverUrl={item.coverUrl} />;
        } else {
          // 它是一个LiveStream
          return <Thumbnail coverUrl={item.previewUrl} />;
        }
      })}
    </ul>
  );
};
```

接口隔离原则主张尽量减少组件之间的依赖性，使它们之间的耦合度降低，从而提高可重用性。

# 依赖反转原则 Dependency inversion principle (DIP)
依赖反转原则指出，“一个类应该依赖于抽象，而不是具体实现”。换句话说，一个组件不应该直接依赖于另一个组件，而是它们都应该依赖于某个公共抽象接口。在这里，“组件”指的是我们应用程序的任何部分，可以是 React 组件、工具函数、模块或第三方库。这个原则可能很难抽象地理解，所以让我们直接跳到一个例子中。  
下面是一个 LoginForm 组件，它在提交提交表单的时候将用户的账号密码发送到后端的 Api：

```ts
import api from "~/common/api";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (evt) => {
    evt.preventDefault();

    await api.login(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type='submit'>登录</button>
    </form>
  );
};
```

在这段代码中，我们的 LoginForm 组件直接引用 api 模块，因此它们之间存在紧密耦合。这很糟糕，因为一个组件中的更改将影响其他组件，这种依赖性使得在代码中进行更改变得更为艰难。依赖反转原则主张打破这种耦合，因此让我们看看如何能够做到这一点。  
首先，我们将从 LoginForm 内部移除对 api 模块的直接引用，而是通过props注入所需的功能:

```ts
type Props = {
  onSubmit: (email: string, password: string) => Promise<void>;
};

const LoginForm = ({ onSubmit }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = async (evt) => {
    evt.preventDefault();

    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type='submit'>Log in</button>
    </form>
  );
};
```

通过这个更改，LoginForm 组件不再依赖于 api 模块。向 API 提交账户密码的逻辑通过 onSubmit 回调被抽象出来，现在由父组件负责提供此逻辑的具体实现。  
为此，我们将创建一个 ConnectedLoginForm，它将把表单提交逻辑委托给 api 模块:

```ts
import api from "~/common/api";

const ConnectedLoginForm = () => {
  const handleSubmit = async (email, password) => {
    await api.login(email, password);
  };

  return <LoginForm onSubmit={handleSubmit} />;
};
```

ConnectedLoginForm 组件充当 api 和 LoginForm 之间的粘合剂，它们是完全独立于彼此的。我们可以对它们进行迭代，并且单独测试它们，而不必担心破坏相关的组件，因为根本没有相关的依赖。只要 LoginForm 和 api 都遵守约定的公共抽象，应用程序作为一个整体将按照预期继续工作。
总而言之，依赖反转的目标是尽可能的减少不同组件之间的耦合。

# 总结
所有的 SOLID 如果总结成一句话那就是高内聚低耦合
