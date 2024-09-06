# JS Design pattern 常用设计模式

## 零、参考资料
* [js设计模式](https://garychang.cn/2017/01/14/%E8%AE%BE%E8%AE%A1%E6%A8%A1%E5%BC%8F/)

注：代码均为简洁版，如需了解其他版本写法的优缺点，请移步原文章

## 一、单体模式
其思想是在一定的作用域范围内保证一个特定类仅有一个实例，意味着当你第二次使用同一个类创建新对象时，应得到和第一次创建对象完全相同
```js
var Universe;
(function(){
  var instance;

  Universe = function Universe() {
    if(instance) return instance;

    instance = this;
    this.xx = "xx";
  }
})();

var uni = new Universe();

Universe.prototype.a = 1

var uni2 = new Universe();

console.log(uni === uni2) // true
console.log(uni.a)   // 1
console.log(uni2.a)  // 1
console.log(uni.constructor === Universe);  // true
```

## 二、工厂模式
批量创建对象，可根据不同要求小范围内调整，就如同工厂一样，零件我可以采购，然后根据要求生产福特/mini/沃尔沃...

* 公共构造函数 CarMaker
* 名为 factory 的 CarMaker 静态方法来创建 car 对象

```js
function CarMaker() {}  

// 原型链上
CarMaker.prototype.drive = () => {
  return `I have ${this.doors} doors`;
}

// 静态方法
// 枚举子对象
CarMaker.compact = () => {
  this.doors = 4;
}
CarMaker.convertible = () => {
  this.doors = 2;
}
CarMaker.suv = () => {
  this.doors = 6;
}

CarMaker.factory = (type) => {
  if (typeof CarMaker[type] !== 'function') throw new ReferenceError('Error')

  // 关键句，因为 CarMaker.compact/convertible/suv 是独立的函数，并不在 CarMaker 的继承链上
  // 所以这里关联到 CarMaker 的继承链上
  if (typeof CarMaker[type].prototype.drive !== 'function') {
    CarMaker[type].prototype = new CarMaker();
  }

  return new CarMaker[type]();
}

var corolla = CarMaker.factory('compact');

console.log(corolla.drive()); // I have 4 doors
```
是不是和 ```Object.create({...})``` 很像

## 三、迭代器模式
emmm... 用来迭代复杂数据结构的

基础的 api 设计：
* next() 下一个
* hasNext() 是否有下一个
* reWind() 重置指针
* current() 返回当前

```js
var agg = (function() {
  var index = 0;
  var data = [1, 2, 3, 4, 5, 6];
  var length = data.length;

  return {
    next: function() { // 这里是从第一个数据开始输出 本例中为 1
      if (!this.hasNext()) return null;

      var element = data[index];
  
      index++;

      return element;
    },
    hasNext: function() {
        return index < length;
    },
    reWind: function() {
      index = 0;
    },
    current: function() {
      return data[index];
    }
  }
})();

while (agg.hasNext()) {
  console.log(agg.next()); // 1,2,3,4,5,6
}

agg.reWind(); // 此时重置指针到 0
```

## 四、装饰者模式
可以在运行时候添加附加功能到对象中，其一个方便特征在于其预期行为的可定制和可配置特性

### 案例
假设在开发一个销售商品的 Web 应用，每一笔信销售都是一个人新的 ```sale``` 对象。该对象“知道”有关项目的价格，并可以通过 ```getPrice()``` 方法返回加个  

根据不同情况，可以用额外的功能装饰此对象 

假设客户在魁北克省，买房需要支付联邦税和魁北克省税，则此时需要调用联邦税装饰者和魁北克省税装饰者

```js
// 实例及要求
var sale = new Sale(100);

sale = sale.decorate("fedtax"); // 联邦税
sale = sale.decorate("quebec"); // 魁北克省税
sale = sale.decorate("miney"); // 转为美元格式

sale.getPrice(); // 返回价格
```

```js
function Sale(price) {
  this.price = price;
  this.decorateList = [];
}

// 注意这里是静态方法
Sale.decorators = {};

Sale.decorators.fedtax = {
  getPrice: function(price) {
    var price = this.uber.getPrice();

    return price * 0.8; // 对price进行处理
  },
}

Sale.decorators.quebec = {
  getPrice: function(price) {
    var price = this.uber.getPrice();

    return price * 0.7; // 对price进行处理
  },
}

Sale.decorators.money = {
  getPrice: function(price) {
    var price = this.uber.getPrice();

    return "$" + price * 0.9; // 对price进行处理
  },
}

Sale.prototype.decorate = function(decorator) {
  this.decorateList.push(decorator);

  return this;
};

Sale.prototype.getPrice = function() {
  var price = this.price;

  this.decorateList.forEach(function(name) {
    price = Sale.decorators[name].getPrice(price);
  });

  return price;
};

var sale = new Sale(100);

sale = sale.decorate("fedtax"); // 联邦税
sale = sale.decorate("quebec"); // 魁北克省税
sale = sale.decorate("money"); // 转为美元格式

console.log(sale.getPrice()); // $50.4
```
```js
// 便于链式调用的改版：
function Sale(price) {
  this.price = price;
  this.decorateList = [];
}

Sale.decorators = {};

// 自定义的装饰者
Sale.decorators.fedTax = {
  getPrice(price) {
    return price * 0.8;
  }
}
Sale.decorators.queBec = {
  getPrice(price) {
    return price * 0.7;
  }
}
Sale.decorators.money = {
  getPrice: function(price) {
    return "$" + price * 0.9; //对price进行处理
  },
}

Sale.prototype.decorate = function(decorator) {
  this.decorateList.push(decorator);

  return this; // 链式调用
}

Sale.prototype.getPrice = function() {
  let price = this.price;

  this.decorateList.forEach(name => {
    price = Sale.decorators[name].getPrice(price);
  });

  return price;
}

let sale = new Sale(100);

sale.decorate('fedTax').decorate('queBec').decorate('money');
console.log(sale.getPrice()); // $50.4
```

## 五、策略模式
策略模式支持在运行时候选择算法

例如用在表单验证问题上，可以创建一个具有 ```validate()``` 方法的验证器对象，无论表单具体类型是什么，该方法都会被调用，并且返回结果或者错误信息

其核心思想是：预先定义各种规则字典(types), 然后定义数据(data)与规则字典的对应关系(config), 接着循环数据的每个字段，执行匹配的规则检验，搜集对应的 success/error 信息

```js
// 定义验证器对象
let validator = {
  // 所有可以的验证规则处理类存放的地方，后面会单独定义
  types: {},

  // 验证类型所对应的错误信息
  messages: [],

  // 当然需要使用的验证类型
  config: {},

  // 暴露的公开验证方法
  // 传入的参数是 key: value 对
  validate: function(data) {
    let i, msg, type, checker, result_ok;
    // 清空所有的错误信息
    this.messages = [];

    for (i in data) {
      if (data.hasOwnProperty(i)) {
        type = this.config[i]; // 根据 key查询是否有存在的验证规则
        checker = this.types[type]; // 获取验证规则的验证类

        if (!type) continue; // 如果验证规则不存在，则不处理

        if (!checker) { // 如果验证规则类不存在，抛出异常
          throw {
            name: 'ValidationError',
            message: 'No handler to validate type ' + type
          };
        }

        result_ok = checker.validate(data[i]);  // 使用查到的单个验证类进行验证

        if (!result_ok) {
          msg = "Invalid value for *" + i + "*, " + checker.instructions;
          this.messages.push(msg);
        }
      }
    }

    return this.hasErrors();
  },
  hasErrors: function() {
    return this.messages.length !== 0;
  }
}


// 然后剩下的工作，就是定义types里存放的各种验证类了

// 验证给定的值是否不为空
validator.types.isNonEmpty = {
  validate: function(value) { return value !== ''; },
  instructions: '传入的值不能为空',
};

 // 验证给定的值是否是数字
validator.types.isNumber = {
  validate: function(value) { return !isNaN(value); },
  instructions: '传入的值只能是合法的数字，例如：1, 3.14 or 2010',
};

// 验证给定的值是否只是字母或数字
validator.types.isAlphaNum = {
  validate: function(value) { return !/[^a-z0-9]/i.test(value); },
  instructions: '传入的值只能保护字母和数字，不能包含特殊字符',
}

// 使用的时候，我们首先要定义需要验证的数据集合，然后还需要定义每种数据需要验证的规则类型，代码如下：
let data = {
  first_name: 'Tom',
  last_name: 'Xu',
  age: 'unknown',
  username: 'TomXu@',
}

// 配置下验证规则
validator.config = {
  first_name: 'isNonEmpty',
  age: 'isNumber',
  username: 'isAlphaNum'
}

// 最后获取验证结果
validator.validate(data);

if (validator.hasErrors()) {
  console.log(validator.messages.join('\n'));
}
```

策略模式可以作为 switch-case 的拓展版本

## 六、代理模式
在代理模式中，一个对象充当另外一个对象的接口  

代理模式是介于对象的客户端和对象本身之间，并且对该对象的访问进行保护  

原理是：在 代理对象中实例化原来需要的对象，然后调用相应的方法

> 注：在 es6 中有一个原生的代理对象：Proxy，vue 3.0 也将基于这个代理对象

### 案例:
卖家 - 邮局(proxy) - 买家

```js
let Package = function(receiver) {
  this.receiver = receiver;
}

let Seller = function(good) {
  this.package = good;
  this.send = function(gift) {
    return good.receiver + '你的包裹' + gift;
  }
}

let Express = function(good) {
  this.package = good;
  this.send = function(packageName) {
    return new Seller(good).send(packageName);
  }
}

let ems = new Express(new Package('gary'));

console.log(ems.send('键盘'));
```

## 七、中介者模式
中介者模式可以让多个对象之间松耦合，并降低维护成本  

在中介者模式下，对象与对象之间的联系全靠中介者，这意味着除中介者外，其他对象不知道还有没有另外的的对象，这是中介者模式与代理模式不一样的地方

```js
function Player(name) {
  this.point = 0;
  this.name = name;
}
Player.prototype.play = function() {
  this.point += 1;
  mediator.played(); // mediator 中介
}

let scoreBoard = {
  element: document.querySelector('#score'), // '这里放 dom 元素，用来显示分数'
  update: function(score) { // 更新分数
    let msg = '';

    for (let i in score) {
      if (score.hasOwnProperty(i)) {
        msg += score[i] + '-';
      }
    }

    this.element.innerText = msg;
  },
}

let mediator = { // 中介
  players: {}, // 存放玩家对象
  setUp: function() {
    let players = this.players;

    players.home = new Player('home');
    players.guest = new Player('guest');
  },
  played() {
    let players = this.players;
    let score = {
      home: players.home.point,
      guest: players.guest.point
    };

    scoreBoard.update(score);
  },
  keypress: function(e) {
    e = e || window.event;

    if (e.which === 49) { // 按键 1
      return mediator.players.home.play();
    }
    if (e.which === 48) { // 按键 0
      return mediator.players.guest.play();
    }
  },
}

mediator.setUp(); // 启动(初始化)
window.onkeypress = mediator.keypress;

setTimeout(function() { //设 置5秒游戏时间
  window.onkeypress = null;
  alert("game end");
}, 5000);
```

## 八、观察者/订阅-发布模式
详情请移步 [JS.DP.观察者&订阅发布模式](./JS.DP.观察者&订阅发布模式.md)
