# 对 elementUI 中 el-tree 的初次探索
## 一、引言
手头需要开发权限结构，首先想起的就是 el-tree，但是最终的表现的样式和 el-tree 完全不一样，因此想着先看一看大佬们是怎样封装这种复杂类型的组件的，顺便复习下树结构(伪)，于是有了本篇的阅读笔记和代码片段

实现功能：节点选择取消（包括全选、半选）、禁用、异步更新

## 二、片段
### (一) js 部分
#### 1. Node 节点对象
```js
import { markNodeData, NODE_KEY, objectAssign } from './utils';

// 作为 自定义子节点的 id
let nodeIdSeed = 0;

// 获取当前节点中子节点的状态
export const getChildState = node => {
  let all = true;
  let none = true;
  let allWithoutDisable = true;
  for (let i = 0, j = node.length; i < j; i++) {
    const n = node[i];
    
    if (n.checked !== true || n.indeterminate) {
      all = false;
      if (!n.disabled) allWithoutDisable = false;
    }

    if (n.checked !== false || n.indeterminate) {
      none = false;
    }
  }

  return { all, none, allWithoutDisable, half: !all && !none };
}

// 根据检索当前节点的状态并通知父节点
export const reInitChecked = function (node) {
  if (node.childNodes.length === 0) return;

  const {all, none, half} = getChildState(node.childNodes);

  if (all) {
    node.checked = true;
    node.indeterminate = false;
  } else if (half) {
    node.checked = false;
    node.indeterminate = true;
  } else if (none) {
    node.checked = false;
    node.indeterminate = false;
  }

  const parent = node.parent;
  if (!parent || parent.level === 0) return;

  if (!node.store.checkStrictly) {
    reInitChecked(parent);
  }
}

// 根据 store.props 处理传入的 this.data 与 eltree 中固有 key 的关系
const getPropertyFromData = function(node, prop) {
  // 初始化 store 时传入的 props 
  const props = node.store.props;
  const data = node.data || {};

  const config = props[prop]; // 用户在 data 中自定义的 key

  if (typeof config === 'function') {
    return config(data, node);
  } else if (typeof config === 'string') {
    return data[config];
  } else if (typeof config === 'undefined') {
    const dataProp = data[prop];
    return dataProp === undefined ? '' : dataProp;
  }
}

class Node {
  constructor(options) {
    // 注意和 this.data 中的 id 区分开来
    this.id = nodeIdSeed++;
    this.text = null;
    this.checked = false;
    this.indeterminate = false;

    // 这个字段 保存 当前节点的数据(不包含父节点的， 父节点的在 this.parent 字段中)
    this.data = null; // options 也有个， 这个待会会被 options 的覆盖掉

    this.parent = null;
    this.visible = true; // 估计是为了 root: Node 准备的
    this.isCurrent = false;

    // 把传入的参数混入到 当前的 Node 对象中去
    for (const option in options) {
      if (options.hasOwnProperty(option)) {
        this[option] = options[option];
      }
    }

    // internal 的一些参数
    this.level = 0;
    this.load = false; // 这个估计是为了懒加载准备的
    this.loading = false; // 这个估计是为了懒加载准备的
    this.childNodes = [];
    
    // 标示节点的等级
    if (this.parent) this.level = this.parent.level + 1;

    const store = this.store;
    if (!store) throw new Error('[Node]store 对象未构建!');

    // 在 store.nodesMap 注册这个节点， 便于后期查找
    store.registerNode(this);

    // const props = store.props;
    if (store.lazy !== true && this.data) {
      this.setData(this.data);
    }

    if (!Array.isArray(this.data)) {
      markNodeData(this, this.data);
    }

    if (!this.data) return;
  }

  /**
   * @param {*} data 每个相应子节点的 data 数据(用户传进来的)
   * @memberof Node
   */
  setData(data) {
    if (!Array.isArray(data)) { // 注意不是数组的时候会走这里！！！
      // 传递 this, 主要是取 节点(this) 自定义的 id
      markNodeData(this, data);
    }
    
    this.data = data;
    this.childNodes = [];

    let children;
    if (this.level === 0 && this.data instanceof Array) {
      children = this.data
    } else {
      children = getPropertyFromData(this, 'children') || [];
    }

    // 循环把 this.data 中的 children 数据也变成 Node 节点
    for (let i = 0, l = children.length; i < l; i++) {
      this.insertChild({ data: children[i] });
    }
  }

  /**
   * 把当前节点下的 children 转换成 Node 节点
   * @param {*} child 
   * @param {*} index 
   * @param {*} batch ques 存疑，源码中只有一个地方的调用(doCreateChildren)传入了true
   */
  insertChild(child, index, batch) {
    if (!child) throw new Error('[node]子节点插入失败，必须要传入所需的数据!');

    if (!(child instanceof Node)) { // child 不是我们的 节点类型
      if (!batch) { // ques 存疑，源码中只有一个地方的调用(doCreateChildren)传入了true
        const children = this.getChildren(true);
        
        if (children.indexOf(child.data) === -1) { // children 数组中找不到 child
          if (typeof index === 'undefined' || index < 0) {
            children.push(child.data);
          } else {
            children.splice(index, 0, child.data);
          }
        }
      }
      // 浅合并对象(足够)
      objectAssign(child, {
        parent: this,
        store: this.store,
      });
      child = new Node(child);
    }

    child.level = this.level + 1;

    if (typeof index === 'undefined' || index < 0) {
      this.childNodes.push(child);
    } else {
      this.childNodes.splice(index, 0, child);
    }

  }

  /**
   * 获取 this.data 下面的 children（或开发映射成 children） 字段的 value 
   * 返回值带扶正处理
   * 这里是从 源数据 取的值，而不是 node 节点对象中 - 与 getPropertyFromData 的区别
   * @param {boolean} [forceInit=false]
   * @returns Array
   * @memberof Node
   */
  getChildren(forceInit = false) { // this is data
    if (this.level === 0) return this.data;

    const data = this.data;
    if (!data) return null;

    const props = this.store.props;
    
    let children = props ? props.children : 'children';
    
    if (data[children] === undefined) data[children] = null;
    
    // 强制初始化 && data[children] 为空
    if (forceInit && !data[children]) data[children] = [];

    return data[children];
  }

  /**
   * 设置 节点的 checked 状态
   * @param {*} value
   * @param { boolean } deep
   * @param {*} recursion 递归
   * @param {*} passValue
   * @memberof Node
   */
  setChecked(value, deep, recursion, passValue) {
    this.indeterminate = value === 'half';
    this.checked = value === true;

    if (this.store.checkStrictly) return;

    // 这个 检索 子节点 的 checked 状态
    // if (!(this.shouldLoadData() && !this.store.checkDescendants)) { // 这里 shouldLoadData 与 lazy 相关， 结合本例看源码，shouldLoadData() 一定返回 false
    if (!(false && !this.store.checkDescendants)) {
      let { all, allWithoutDisable } = getChildState(this.childNodes);


      if (!this.isLeaf && (!all && allWithoutDisable)) {
        this.checked = false;
        value = false;
      }

      const handleDescendants = () => {
        if (deep) {
          const childNodes = this.childNodes;

          for (let i = 0, j = childNodes.length; i < j; i++) {
            const child = childNodes[i];
            passValue = passValue || value !== false;
            const isCheck = child.disabled ? child.checked : passValue;
            child.setChecked(isCheck, deep, true, passValue);
          }
          const { half, all } = getChildState(childNodes);

          if (!all) {
            this.checked = all;
            this.indeterminate = half;
          }
        }
      };

      // if (this.shouldLoadData()) {
      if (false) {
        // Only work on lazy load data. so i don't need to write
      } else {
        handleDescendants();
      }
    }
    

    const parent = this.parent;
    if (!parent || parent.level === 0) return;

    // 这里应该会通知父节点自己的状态
    if (!recursion) reInitChecked(parent)
  }

  /**
   * 这个函数的作用是返回 初始化 store 时传入的 key 字段值
   * @readonly
   * @memberof Node
   */
  get key() {
    const nodeKey = this.store.key;
    if (this.data) return this.data[nodeKey];
    return null;
  }

  /**
   * 这个函数的作用是返回 当前节点的 label 字段值
   * @readonly
   * @memberof Node
   */
  get label() {
    return getPropertyFromData(this, 'label');
  }

  /**
   * 这个函数的作用是返回 当前节点的 disabled 状态
   * @readonly
   * @memberof Node
   */
  get disabled() {
    return getPropertyFromData(this, 'disabled');
  }
}

export default Node;
```

#### 2. Store 状态树对象以及整个树系统的入口（全局只会产生一个该对象）
```js
import Node from './Node';

class Store {
  constructor(options) {
    this.currentNode = null;
    this.currentNodeKey = null;

    // 把传入的参数混入到 store 对象中去
    for (let option in options) {
      if (options.hasOwnProperty(option)) {
        this[option] = options[option];
      }
    }

    // 方便查询所有的子节点
    this.nodesMap = {}

    this.root = new Node({
      data: this.data,
      store: this,
    });

    if (this.lazy && this.load) {
      // 本例中没有，所以不写了
    } else {
      this._initDefaultCheckedNodes();
    }
  }


  /**
   * 如其名，在 this.nodesMap 注册这个节点， 便于后期查找
   * @param { Node } node 
   */
  registerNode(node) {
    // this.key， 初始化 store 对象时传入的 参数，string
    const key = this.key;
    if (!key || !node || !node.data) return;

    // node.key, 会调用 Node 中的 get key 方法
    const nodeKey = node.key;
    if (nodeKey !== undefined) this.nodesMap[node.key] = node;
  }

  // 初始化默认选中的节点们
  _initDefaultCheckedNodes() {
    const defaultCheckedKeys = this.defaultCheckedKeys || [];
    const nodesMap = this.nodesMap;

    defaultCheckedKeys.forEach(checkedKey => {
      const node = nodesMap[checkedKey];

      if (node) {
        node.setChecked(true, !this.checkStrictly);
      }
    });
  }

  /**
   * 获取选中的节点的 keys (不包括半选状态下的)
   * @param {boolean} [leafOnly=false] 跟懒加载有关，本例用不到
   * @returns {Array} 
   * @memberof Store
   */
  getCheckedKeys(leafOnly = false) {
    return this.getCheckedNodes(leafOnly).map(data => (data || {})[this.key]);
  }

  /**
   * 获取选中的节点
   * @param {boolean} [leafOnly=false] 跟懒加载有关，本例用不到
   * @param {boolean} [includeHalfChecked=false] 需要包含 半选 的节点
   * @returns {Array[Node]}
   * @memberof Store
   */
  getCheckedNodes(leafOnly = false, includeHalfChecked = false) {
    const checkedNodes = [];
    const traverse = function (node) {
      const childNodes = node.root ? node.root.childNodes : node.childNodes;

      childNodes.forEach(child => {
        if ((child.checked || (includeHalfChecked && child.indeterminate)) && (!leafOnly || (leafOnly && child.isLeaf))) {
          checkedNodes.push(child.data);
        }

        traverse(child);
      });
    };

    traverse(this);

    return checkedNodes;
  }

  /**
   * 获取 半选择 状态下的节点的 keys
   * @param {boolean} [leafOnly=false] 跟懒加载有关，本例用不到
   * @returns {Array[]}
   * @memberof Store
   */
  getHalfCheckedKeys(leafOnly = false) {
    return this.getHalfCheckedNodes(leafOnly).map((data) => (data || {})[this.key]);
  }

  /**
   * 获取 半选择 状态下的节点
   * @returns {Array[Node]}
   * @memberof Store
   */
  getHalfCheckedNodes() {
    const nodes = [];
    const traverse = function (node) {
      const childNodes = node.root ? node.root.childNodes : node.childNodes;

      childNodes.forEach(child => {
        if (child.indeterminate) {
          nodes.push(child.data);
        }

        traverse(child);
      });
    };
    traverse(this);
    return nodes;
  }

  /**
   * 设置默认选中的节点
   * @param {Array} newValue
   * @memberof Store
   */
  setDefaultCheckedKey(newValue) {
    if (newValue !== this.defaultCheckedKeys) {
      this.defaultCheckedKeys = newValue;
      this._initDefaultCheckedNodes();
    }
  }

  /**
   * 异步数据的更新
   * @memberof Store
   */
  setData(newVal) {
    const instanceChanged = newVal !== this.root.data;

    if (instanceChanged) {
      this.root.setData(newVal);
      this._initDefaultCheckedNodes();
    }
  }
}

export default Store;
```

#### 3. utils.js
```js
export const NODE_KEY = '$treeNodeId';

// 给对象新增个属性 $treeNodeId
export const markNodeData = function(node, data) {
  if (!data || data[NODE_KEY]) return;

  Object.defineProperty(data, NODE_KEY, {
    value: node.id,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

// merge object
export const objectAssign = function(target) {
  for (let i = 1, j = arguments.length; i < j; i++) {
    let source = arguments[i] || {};
    for (let prop in source) {
      if (source.hasOwnProperty(prop)) {
        let value = source[prop];
        if (value !== undefined) {
          target[prop] = value;
        }
      }
    }
  }

  return target;
};

export const getNodeKey = function(key, data) {
  if (!key) return data[NODE_KEY];

  return data[key];
}
```

### (二) 组件部分
#### 1. 自定 CheckBox.vue
```jsx
<template>
  <div class="checkbox-container">
    <el-checkbox 
      v-model="node.checked"
      :indeterminate="node.indeterminate"
      :disabled="!!node.disabled"
      @click.native.stop
      @change="handleCheckChange"
    >{{node.label}}</el-checkbox>
  </div>
</template>

<script>
export default {
  name: 'yourCheckBoxName',
  props: {
    node: {
      props: Object,
      default() {
        return {}
      }
    },
  },
  data() {
    return {
      tree: null, // vue component
    }
  },
  created() {
    const parent = this.$parent;

    if (parent.isTreeTable) {
      this.tree = parent;
    } else {
      this.tree = parent.tree;
    }
  },
  methods: {
    handleCheckChange(value, ev) {
      this.node.setChecked(ev.target.checked, !this.tree.checkStrictly);
    },
  }
}
</script>
```

#### 2. 外壳组件核心内容
```jsx
import TableCheckbox from './ckeckbox';
import Store from './utils/store';
import { getNodeKey } from './utils/utils'

export default {
  name: 'TreeTable',
  components: {TableCheckbox},
  props: {
    data: {
      type: Array,
    },
    nodeKey: String,
    props: {
      default() {
        return {
          children: 'children',
          label: 'label',
          disabled: 'disabled'
        };
      }
    },
    showCheckbox: {
      type: Boolean,
      default: true
    },
    defaultCheckedKeys: Array,
  },
  data() {
    return {
      store: null,
      root: null, // store 上的一个属性, 这个对象就是我们的 Node 树系统
    }
  },
  watch: {
    defaultCheckedKeys(newValue) {
      this.store.setDefaultCheckedKey(newValue);
    },
    data(newVal) {
      this.store.setData(newVal);
    },
  },
  created() {
    this.isTreeTable = true;

    this.store = new Store({
      key: this.nodeKey,
      data: this.data,
      lazy: false,
      props: this.props,

      checkStrictly: false,
      checkDescendants: false,
      defaultCheckedKeys: this.defaultCheckedKeys,
    });

    this.root = this.store.root;
  },
  methods: {
    getNodeKey(node) {
      return getNodeKey(this.nodeKey, node.data);
    },
    getCheckedKeys(leafOnly) {
      return this.store.getCheckedKeys(leafOnly);
    },
    getHalfCheckedKeys() {
      return this.store.getHalfCheckedKeys();
    },
  },
}
```

## 三、思路和感悟
体会了数据与视图分离的思想

代码大致的执行先后顺序：
* 外壳组件 created =>
* 初始化并生成 Store (状态)树(唯一) =>
* 初始化并递归生成 Node 树(按照数据结构形成多个 Node 对象) =>
* 自定义的 Checkbox 组件与节点树一一对应(渲染) => 
* ...

核心方法是 ```Node``` 中的自定义的 ```setChecked```， 半核心方法 ```Checkbox.vue``` 中的 ```handleCheckChange```，需要注意的是，由于在 ```Checkbox``` 中 ```el-checkbox``` 组件与对应的 ```Node``` 节点中的 ```checked``` 的值是存在映射关系的，所以如果我们在 ```setChecked``` 方法首行打印该 Node 对象会发现其状态值已经改变，而我们自定的 ```setChecked``` 方法会根据其他条件进行判断和第二次修正，同理，```handleCheckChange``` 也是对 ```Node``` 状态的第二次修正。
 
比较精彩的是子节点的状态经过 ```setChecked``` 修正后与父组件的状态变更，这里并没有直接调用父节点的 ```setChecked``` 方法(否则会形成死循环)，而是通过 ```reInitChecked(parent)``` 方法，通知父节点，让父节点循环检测下其下子节点的状态(并不需要去检测孙节点)，并直接修改自己的 ```checked``` 字段值，接着，由父节点再递归往上通知，从而完成整个状态值改变逻辑。
 
目前的片段已基本满足需求，因此后续的高级功能抽空(并不)再研究
