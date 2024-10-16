# 浏览器 回流与重绘

## 零、参考
* [LRU和LFU 缓存淘汰算法（javascript与go语言实现）](https://juejin.cn/post/7254458065310711866)

## 一、基本概念
LRU（Least Recently Used）和LFU（Least Frequently Used）是两种常见的缓存淘汰算法， 用于在缓存空间有限的情况下选择合适的缓存对象进行淘汰，以提高缓存的利用效率
* LRU算法基于"最近最少使用"的原则进行淘汰。它维护一个缓存的访问顺序链表，当有新的数据被访问时，如果数据已经在缓存中，则将其移到链表头部；如果数据不在缓存中，则将其添加到链表头部。当需要淘汰数据时，选择链表尾部的数据进行淘汰，因为尾部的数据是最近最少被访问的数据
* LFU算法基于"最不经常使用"的原则进行淘汰。它维护一个缓存对象的访问频次，对于每个访问到的对象，增加其访问频次。当需要淘汰数据时，选择访问频次最低的数据进行淘汰

LRU 和 LFU 算法都有各自的优势和适用场景：
* LRU算法适用于访问具有时间局部性的数据，即最近被访问的数据可能在将来一段时间内仍然会被访问。LRU算法相对较简单，容易实现，适用于大多数场景。但是，当存在"热点数据"（被频繁访问的数据）时，LRU算法可能无法有效地保证缓存的命中率
* LFU算法适用于访问具有访问频次局部性的数据，即访问频次高的数据很可能在将来一段时间内仍然会被频繁访问。LFU算法需要维护每个对象的访问频次计数，相对于LRU算法来说更加复杂。LFU算法在面对热点数据的场景下表现较好，但在某些场景下可能存在"频次突变"的问题，即频次高的数据突然不再被访问，但因为频次计数较高而长时间无法被淘汰

## 二、代码实现及分析
### LRU
```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    // Map 的特性：记住键的原始插入顺序
    // 因此，最后插入的一定是最新鲜的，第一个也是最不新鲜的
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const value = this.cache.get(key);
    
    // 调用过了 get，表明这个数据最近被消费，所以可以挪到 Map 的尾部
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) { // 超出缓存容量
      // 获取 Map 的首位数据，即最旧数据
      const oldestKey = this.cache.keys().next().value;

      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
  }
}

// 示例用法
const cache = new LRUCache(2); // 创建容量为2的LRU缓存

cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // 输出 1

cache.put(3, 3);
console.log(cache.get(2)); // 输出 -1
console.log(cache.get(3)); // 输出 3

cache.put(4, 4);
console.log(cache.get(1)); // 输出 -1
console.log(cache.get(3)); // 输出 3
console.log(cache.get(4)); // 输出 4
```

### LFU
LFU 的整体思路是在 LRU 的基础上再维护一个 Map，这个 Map 以新鲜度(从 1 开始)为 key，分别记录对应新鲜度的数据在 cache 中的 Key，从而再去 cache 中查到对应的具体数据
```js
class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();

    this.frequency = new Map();
    this.minFrequency = 0;
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    const { value, freq } = this.cache.get(key);

    // 更新访问次数
    this.updateFrequency(key, freq);

    return value;
  }

  put(key, value) {
    if (this.capacity === 0) return;

    if (this.cache.has(key)) {
      const { freq } = this.cache.get(key);

      this.cache.set(key, { value, freq });
      this.updateFrequency(key, freq); 

      return;
    }

    if (this.cache.size >= this.capacity) {
      const leastFreq = this.frequency.get(this.minFrequency);
      const deleteKey = leastFreq.keys().next().value;

      leastFreq.delete(deleteKey);
      this.cache.delete(deleteKey);
    }

    this.cache.set(key, { value, freq: 1 });

    if (!this.frequency.has(1)) this.frequency.set(1, new Set());

    this.frequency.get(1).add(key);
    this.minFrequency = 1; // 新添加元素时最小访问次数更新为 1
  }

  updateFrequency(key, freq) {
    const freqList = this.frequency.get(freq);

    freqList.delete(key);

    // 当前元素旧的访问次数等于最小访问次数并且当前访问次数 freq 组成的 Set 为空
    //（元素旧的访问次数等于最小访问次数，并且最小访问次数对应的 Set 为空的情况）
    // 如果某个元素它之前的访问次数为最小访问次数，而且没有其他元素与该元素的访问次数相同
    if (freq === this.minFrequency && freqList.size === 0) this.minFrequency++;

    if (!this.frequency.has(freq + 1)) this.frequency.set(freq + 1, new Set());

    // 在更新后的访问次数对应的 Set 里面添加当前元素对应的 key
    this.frequency.get(freq + 1).add(key);
    this.cache.get(key).freq = freq + 1; // 更新当前元素的访问次数 + 1
  }
}

// 示例用法
const cache = new LFUCache(2); // 创建容量为2的LFU缓存

cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // 输出 1

cache.put(3, 3); // 删除 1
console.log(cache.get(2)); // 输出 2

console.log(cache.get(3)); // 输出 3

cache.put(4, 4); // 删除 2
console.log(cache.get(2)); // 输出 -1
console.log(cache.get(3)); // 输出 3
console.log(cache.get(4)); // 输出 4
```
