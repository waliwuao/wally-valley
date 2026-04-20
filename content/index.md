---
title: Quartz 功能测试
tags:
  - 测试
  - 示例
date: 2026-04-15
math: true
---

# Quartz 功能测试页面

这是一个测试页面，用于验证 Quartz 的各项功能是否正常工作。

## 1. 标题层级

### 三级标题

#### 四级标题

##### 五级标题

## 2. 文本格式

**粗体文本** 和 *斜体文本* 以及 ***粗体斜体***

~~删除线文字~~

`行内代码` 示例

## 3. 列表

### 无序列表
- 苹果
- 香蕉
  - 大香蕉
  - 小香蕉
- 橙子

### 有序列表
1. 第一步
2. 第二步
   1. 子步骤 A
   2. 子步骤 B
3. 第三步

## 4. 链接和图片

[Quartz 官方文档](https://quartz.jzhao.xyz)

![示例图片占位符](https://via.placeholder.com/150)

## 5. 引用

> 这是一段引用内容。
> 
> 可以有多行。
> 
> > 嵌套引用

## 6. 代码块

```javascript
function hello() {
  console.log("Hello, Quartz!");
  return {
    success: true,
    message: "测试成功"
  };
}

hello();
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

## 7. 表格

| 功能 | 状态 | 备注 |
|------|------|------|
| 标题 | ✅ | 正常 |
| 列表 | ✅ | 正常 |
| 代码 | ✅ | 正常 |
| 表格 | ✅ | 正常 |

## 8. 数学公式（如果支持）

行内公式：$E = mc^2$

独立公式：
$$
f(x) = \int_{-\infty}^\infty
    f(\xi)e^{2 \pi i \xi x}
    \,d\xi
$$


## 9. 水平线

---

## 10. 链接到其他页面

- [[setting up your GitHub repository|部署指南]]

---

**最后更新：** 2026年4月15日