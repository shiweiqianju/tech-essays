# Vue 的生命周期
## 零、写在前面
2.0 / 3.0 相关生命周期的文章资源比较丰富，考虑到版本的差异性，就不收录

## 一、父子组件的生命周期
<strong>注：以下过程均为同步</strong>

1. 加载渲染过程
```
父：beforeCreate -> created -> beforeMount ->
子：beforeCreate -> created -> beforeMount -> mounted -> 
父：mounted
```

2. 子组件更新
```
父：beforeUpdate ->
子：beforeUpdate -> updated ->
父：updated
```

3. 父组件更新(无子组件参与)
```
父：beforeUpdate -> updated
```

4. 销毁
```
父：beforeDestroy ->
子：beforeDestroy -> destroyed ->
父：destroyed
```
