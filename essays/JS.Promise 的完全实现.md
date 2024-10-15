# JS Promise/A+ 的完全实现

## 零、参考资料
* [手把手一行一行代码教你“手写Promise“，完美通过 Promises/A+ 官方872个测试用例 ](https://juejin.cn/post/7043758954496655397)
* [手写实现 Promise 全部实例方法和静态方法，来看看 Promise.all、Promise.race 和 Promise.any 都是怎么实现的](https://juejin.cn/post/7044088065874198536)
* [手写Promise](https://juejin.cn/post/6844904112346103816)
* [Promise A+ 的最简实现](./../codes/Promise%20A+%20的最简实现.md)

## 一、具体代码和解析
```js
export default class MyPromise {
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  state = MyPromise.PENDING;
  result = null; // for fulfilled
  reason = null; // for rejected

  // 为了多次调用(不是链式调用)，故而用数组来 cache
  onResolvedCallbacks = []; // for asynchronous fulfilled
  onRejectedCallbacks = []; // for asynchronous rejected

  constructor(func) {
    try {
      func(
        this.resolve.bind(this),
        this.reject.bind(this)
      );
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(result) {
    if (this.state === MyPromise.PENDING) {
      this.state = MyPromise.FULFILLED;
      this.result = result;

      this.onResolvedCallbacks.forEach(fn => fn());
    }
  }

  reject(reason) {
    if (this.state === MyPromise.PENDING) {
      this.state = MyPromise.REJECTED;
      this.reason = reason;

      this.onRejectedCallbacks.forEach(fn => fn());
    }
  }

  then(onFulfilled, onRejected) {
    // 为了符合 Promise A+ 中的 2.2.7.3|4 标准，下面的兼容处理被分散至 promise2 中做处理，故而注释掉
    // onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    // onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };

    const promise2 = new MyPromise((resolve, reject) => {
      // 同步的两个任务
      if (this.state === MyPromise.FULFILLED) {
        setTimeout(() => {
          try {
            if (typeof onFulfilled !== 'function') { // for 2.2.7.3
              resolve(this.result);
            } else {
              let x = onFulfilled(this.result);

              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(error); // 捕获前面 onFulfilled 中抛出的异常
          }
        });
      }
      if (this.state === MyPromise.REJECTED) {
        setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') { // for 2.2.7.4
              reject(this.reason); 
            } else {
              let x = onRejected(this.reason);

              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(e); // 捕获前面 onRejected 中抛出的异常
          }
        });
      }

      // 异步的任务
      if (this.state === MyPromise.PENDING) {
        this.onResolvedCallbacks.push(() => setTimeout(() => {
          try {
            if (typeof onFulfilled !== 'function') { // for 2.2.7.3
              resolve(this.result);
            } else {
              let x = onFulfilled(this.result);

              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);  // 捕获前面 onFulfilled 中抛出的异常
          }
        }));
        this.onRejectedCallbacks.push(() => setTimeout(() => {
          try {
            if (typeof onRejected !== 'function') { // for 2.2.7.4
              reject(this.reason); 
            } else {
              let x = onRejected(this.reason);

              resolvePromise(promise2, x, resolve, reject);
            }
          } catch (error) {
            reject(error);  // 捕获前面 onRejected 中抛出的异常
          }
        }));
      }
    });

    // then() 返回一个新的 promise 对象，用于链式调用
    return promise2;
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(callback) {
    return this.then(callback, callback);
  }

  /**
   * Promise.resolve()
   *
   * @param {[type]} value 要解析为 Promise 对象的值，可以是任意类型
   * 
   * @returns MyPromise
   */
  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    } else if (
      value instanceof Object &&
      'then' in value
    ) {
      // 如果这个值是 thenable（即带有`"then" `方法），返回的 promise 会“跟随”这个 thenable 的对象，采用它的最终状态
      return new MyPromise((resolve, reject) => {
        value.then(resolve, reject);
      })
    }

    // 否则返回的 promise 将以此值完成，即以此值执行 `resolve()`方法 (状态为fulfilled)
    return new MyPromise((resolve) => {
      resolve(value);
    })
  }

  /**
   * Promise.reject()
   *
   * @param {[type]} reason 表示 Promise 被拒绝的原因
   * 
   * @returns MyPromise
   */
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    })
  }

  /**
   * Promise.all
   * @param {iterable} promises 一个 promise 的 iterable 类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
   * 
   * @returns 
   */
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) return reject(new TypeError('Argument is not iterable'));
      if (!promises.length) return resolve(promises);

      const result = Array.from({ length: promises.length }, () => undefined); // 存储结果
      let count = 0; // 计数器

      promises.forEach((p, index) => {
        MyPromise.resolve(p).then(
          value => {
            count++;
            result[index] = value;

            // Promise.all 等待所有都完成（或第一个失败）
            (count === promises.length) && resolve(result);
          },
          reason => {
            // 只要有一个失败，则 MyPromise.all 失败
            reject(reason);
          }
        )
      })
    })
  }

  /**
   * Promise.allSettled 
   * @param {*} promises 一个 promise 的 iterable 类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
   * 
   * @returns 
   */
  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) return reject(new TypeError('Argument is not iterable'));
      if (!promises.length) return resolve(promises);

      const result = Array.from({ length: promises.length }, () => undefined); // 存储结果
      let count = 0; // 计数器

      promises.forEach((p, index) => {
        MyPromise.resolve(p).then(
          value => {
            count++;
            result[index] = {
              status: 'fulfilled',
              value,
            };

            (count === promises.length) && resolve(result);
          },
          reason => {
            count++;
            result[index] = {
              status: 'rejected',
              reason,
            };

            (count === promises.length) && resolve(result);
          }
        )
      })
    })
  }

  /**
   * Promise.any
   * @param {*} promises 一个 promise 的 iterable 类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
   * 
   * @returns 
   */
  static any(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) return reject(new TypeError('Argument is not iterable'));
      if (!promises.length) return reject(new AggregateError('All promises were rejected'));

      const errors = Array.from({ length: promises.length }, () => undefined); // 存储结果
      let count = 0; // 计数器

      promises.forEach((p, index) => {
        MyPromise.resolve(p).then(
          value => {
            resolve(value);
          },
          reason => {
            count++;
            errors[index] = reason;
            (count === promises.length) && reject(new AggregateError(errors));
          }
        )
      })
    })
  }

  /**
   * Promise.race
   * @param {*} promises 一个 promise 的 iterable 类型（注：Array，Map，Set都属于ES6的iterable类型）的输入
   * 
   * @returns 
   */
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      if (!Array.isArray(promises)) return reject(new TypeError('Argument is not iterable'));
      if (!promises.length) return; // 注意，这里不改变 promise 的状态

      promises.forEach(p => {
        MyPromise.resolve(p).then(resolve, reject);
      })
    })
  }
}

/**
 * 对resolve()、reject() 进行改造增强, 针对 resolve() 和 reject() 中不同值情况进行处理
 *
 * @param  {promise} promise2 then 方法返回的新的 promise 对象(便于链式调用)
 * @param  {[type]} x         promise1 中 onFulfilled 或 onRejected 的返回值，可以是任意类型
 * @param  {[type]} resolve   promise2 的 resolve 方法
 * @param  {[type]} reject    promise2 的 reject 方法
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 这个是解决循环引用的问题，具体见 demo-1
  if (promise2 === x) throw new TypeError('Chaining cycle detected for promise');

  if (x instanceof MyPromise) {
    // 如果 onFulfilled/onRejected 这两个回调结果是 MyPromise 对象(此时 promise2 仍然处于 pending 状态)
    // 那么等这个 x 发生了状态改变，同时修改 promise2 的状态
    // 因为这个 x 也可能是一个 thenable 的 MyPromise 对象，也可能发生循环引用，所以仍然要使用 resolvePromise 来继续解析
    // 具体见 demo-2
    x.then(y => {
      resolvePromise(promise2, y, resolve, reject);
    }, reject);
  } else if (
    x !== null &&
    ((typeof x === 'object') || (typeof x === 'function'))
  ) { // 2.3.3 如果 x 为对象或函数
    try {
      // 判断 x 有没有 then 属性
      // 这里用 var 进行了隐式变量提升
      var then = x.then;
    } catch (error) {
      reject(error);
    }

    /**
     * 2.3.3.3
     * 如果 then 是函数，将 x 作为函数的作用域 this 调用之
     */
    if (typeof then === 'function') {
      let callee = false; // 避免多次调用
      try {
        then.call(
          x,
          y => { // 这个回掉函数，相当于 onFulfilled
            if (callee) return;
            
            callee = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          r => { // 这个回掉函数，相当于 onRejected
            if (callee) return;
            
            callee = true;
            reject(r);
          }
        )
      } catch (error) {
        /**
         * 2.3.3.3.4 如果调用 then 方法抛出了异常 e
         */
        if (called) return;

        called = true;
        reject(e);
      }
    } else { // 2.3.3.4 如果 then 不是函数，以 x 为参数执行 promise
      resolve(x);
    }
  } else {
    // 2.3.4 如果 x 不为对象或者函数(一些基础类型的数据)，以 x 为参数执行 promise
    // 需要 return 吗？
    return resolve(x);
  }
}
```

## 二、一些规范中的 Case
### (一)、then 函数接受的参数函数有返回值，返回值类型是常规类型(基本数据类型，常规的字面量对象等)
```js
const p = new Promise((resolve, reject) => {
  resolve(100)
})

p.then(res => {
  console.log('fulfilled', res); // fulfilled 100
  return 2 * res;
}).then(res => {
  console.log('fulfilled', res); // fulfilled 300
})
```

### (二)、then 函数接受的参数函数有返回值，返回值类型是 Promise
```js
const p = new Promise((resolve, reject) => {
  resolve(100)
})

p.then(res => {
  console.log('fulfilled', res); // fulfilled 100
  return new Promise((resolve, reject) => resolve(3 * res));
}).then(res => {
  console.log('fulfilled', res); // fulfilled 300
})
```

### (三)、Edge-case
#### demo-1: ```resolvePromise``` 中为何需要 ```promise2 === x``` 的判断
```js
const promise = new Promise((resolve, reject) => {
  resolve(100)
})
// 此处声明的 p2 就是 then() 执行后的返回值，相当于 then 内部生成的 promise2
// 而 then 接受的回掉函数会有个返回值 p2, 即 then 内部生成的 x
// 这样，promise2 与 x 将会相等，就产生了循环引用的问题
const p2 = promise.then(value => {
  console.log(value)
  return p2；
})
```

#### demo-2：```x instanceof MyPromise``` 中为何要继续使用 ```resolvePromise``` 来解析
```js
const promise = new Promise((resolve, reject) => {
  resolve(100)
})

const p2 = promise.then(value => {
  console.log(value)
  return new MyPromise((resolve, reject) => {
    resolve(p2);
  });
})
```

## 三、一些感悟
Promise 中的核心是 ```then``` 函数，在这个函数中，我们实现了链式调用，而因为 ```then``` 函数接受的参数，既可以有返回值，又可以无返回值，所以两相结合，就需要 ```resolvePromise ```这个辅助函数来处理，然而，由于返回值的类型又是多种多样的(普通数据类型、 ```function```、 ```object``` 甚至新的 ```Promise``` 对象)，所以虽然是辅助函数，但是其重要性可见一斑。因此，Promise 的整套体系，就是围绕着着两个函数展开的
