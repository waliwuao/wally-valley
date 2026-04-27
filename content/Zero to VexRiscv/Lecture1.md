---
title: "Lecture 1: SpinalHDL环境搭建"
date: 2026-04-24
tags:
  - RISC-V
  - SpinalHDL
  - VexRiscv
  - Scala
  - sbt
---

在上一篇教程中，我枚举了在使用verilog进行硬件开发时遇到了种种困难，在这篇教程里，我会讲解为什么选择使用**Scala & SpinalHDL**来实现VexRiscv，以及如何配置**Scala & SpinalHDL**的开发环境。

首先需要澄清一个概念：**SpinalHDL 不是一门新的编程语言**。

它本质上是 **Scala** 语言的一个硬件描述库（Library）。Scala 是一门运行在 Java 虚拟机（JVM）上的高级编程语言，它完美融合了面向对象（OOP）和函数式编程（FP）的特性。

这就带来了一个降维打击般的优势：你可以用**写现代高级软件**的方式，来生成底层的硬件电路。

## VexRiscv 为什么会选择这个技术栈

在传统的 Verilog 中，如果我们要根据配置（比如有没有乘法器、需不需要 MMU）来生成不同的 CPU，通常只能用满篇的 `` `ifdef `` 宏定义，或者极其难用的 `generate` 语句。代码会变得像意大利面条拌42号混凝土一样难以阅读。

VexRiscv 选择 Scala 和 SpinalHDL 的根本原因在于其 **Plugin（插件化）架构**。

利用 Scala 面向对象的特性，VexRiscv 把 CPU 的流水线变成了一个“主板”，而取指单元、解码单元、ALU、分支预测等统统被写成了独立的 Plugin。你需要什么功能，就在实例化的时候把对应的 Plugin “插”进去。Scala 的高级语法会在后台自动为你连线，并在最终将其降维编译成纯粹的、可综合的 Verilog 文件。

## Chisel vs Spinal

值得一提的是，Spinal还有一个强有力的竞争者**Chisel**，它背靠伯克利，学术界资源极好，生态非常庞大。

SpinalHDL 的作者 Charles Papon 最初就是使用 Chisel 的。但他发现早期的 Chisel 有一些痛点：生成的 Verilog 代码**极难阅读**（变量名全是随机乱码，不利于 debug）、时钟域管理容易出错、缺乏某些原生的组合逻辑环检查等。于是他单飞创造了 SpinalHDL。可以说 SpinalHDL 诞生之初就是为了解决 Chisel 的一些工程痛点。

## Scala & SpinalHDL 环境搭建

既然 SpinalHDL 是基于 Scala 的，而 Scala 运行在 JVM 上，我们的环境配置其实就是配置一套标准的 Java/Scala 开发环境。主要需要两样东西：**OpenJDK 17** 和 **sbt**。

### 1. 安装 OpenJDK 17
Java 版本的选择很重要，版本太低或太高都可能导致玄学报错。目前推荐使用稳定且支持广泛的 OpenJDK 17。

- **安装命令**：
  ``` bash
  sudo apt update
  sudo apt install openjdk-17-jdk
  ```
- **验证安装**：
  ``` bash  
  java -version
  # Sample Output
  openjdk version "17.0.18" 2026-01-20
  OpenJDK Runtime Environment (build 17.0.18+8-Ubuntu-122.04.1)
  OpenJDK 64-Bit Server VM (build 17.0.18+8-Ubuntu-122.04.1, mixed mode, sharing)
  ```

### 2. 安装 sbt

如果你写过Java，你可以把 sbt 理解为 Maven。简单来说，sbt 是 Scala 工程的构建工具。它负责帮我们自动下载 SpinalHDL 这个库的代码依赖，并负责编译和运行我们的项目。

- **安装命令**：
  ``` bash
  echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | sudo tee /etc/apt/sources.list.d/sbt.list
  echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | sudo tee /etc/apt/sources.list.d/sbt_old.list
  curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | sudo apt-key add
  
  sudo apt update
  sudo apt install sbt -y
  ```
- **验证安装**：
  ``` bash  
  sbt -version
  # Sample Output
  sbt runner version: 1.12.9
  [info] sbt runner (sbt-the-shell-script) is a runner to run any declared version of sbt.
  [info] Actual version of the sbt is declared using project/build.properties for each build.
  ```

## Spinal 工程结构

不像纯 Verilog 那样把 .v 文件随便堆在文件夹里，一个标准的 SpinalHDL 项目遵循严格的目录规范。当你初始化一个工程后，它的长相大概是这样的：

```
MySpinalProject/
├── build.sbt                 # 项目依赖与编译配置
├── project/
│   └── build.properties      # 固定 SBT 版本
├── src/main/scala/myproject/
│   ├── MyTopLevel.scala      # 硬件设计
│   └── MyTopLevelSim.scala   # 仿真激励
└── hw/gen/                   # 生成的 Verilog/VHDL 输出目录
```

### 工程对比

| 项目 | SpinalHDL 工程 | Vivado 纯 Verilog 工程 |
|------|----------------|------------------------|
| **主要源文件** | `src/main/scala/` 下的 `.scala` 文件 | `xxx.srcs/sources_1/new/` 下的 `.v` 文件 |
| **依赖管理** | `build.sbt` 自动下载 SpinalHDL 库，无需手动管理 | 手动添加源文件或通过 IP Catalog 管理 |
| **参数化配置** | Scala 类参数 → 编译时决定位宽/结构 | `parameter` / `generate`，代码冗长 |
| **仿真** | 同目录 Scala 仿真，`sbt run` 一条命令完成 | 独立仿真文件集，需额外启动仿真器 |
| **输出产物** | `hw/gen/` 下的标准 Verilog，可直接导入 Vivado | 整个工程既包含源文件又包含综合实现结果 |
| **版本控制** | 只跟踪 Scala 源码与 `build.sbt`，生成的 Verilog 可忽略 | 需跟踪大量文件（`.v`、`.xdc`、`.xpr`），容易产生合并冲突 |

### 关键思想

SpinalHDL 项目是一个**硬件生成器**：你维护的是 Scala 源码，每次运行 `sbt run` 都会生成干净的 Verilog。然后你可以把生成的 `.v` 文件像普通 Verilog 一样添加到 Vivado 项目中，配好约束即可综合实现。

## 如何生成 Verilog

说了这么多，我们到底是怎么把 Scala 代码变成 Verilog 的？

让我们来看一个最简单的例子。在 src/main/scala/mylib/MyTopLevel.scala 中，我们写入以下代码：
``` scala

package mylib

import spinal.core._

// 定义一个硬件模块 (相当于 Verilog 的 module)
class MyTopLevel extends Component {
  // 定义输入输出端口
  val io = new Bundle {
    val a = in Bool()
    val b = in Bool()
    val c = out Bool()
  }

  // 硬件逻辑：c = a AND b
  io.c := io.a & io.b
}

// 这是一个伴生对象，包含程序的入口 main 函数
object MyTopLevelVerilog {
  def main(args: Array[String]): Unit = {
    // 调用 SpinalVerilog API，将 MyTopLevel 转换为 Verilog
    SpinalVerilog(new MyTopLevel)
  }
}

```

怎么运行它呢？在工程的根目录下打开终端，输入：

``` bash
sbt "runMain mylib.MyTopLevelVerilog"
```

sbt 会自动编译你的 Scala 代码并运行 main 函数。运行结束后，你会惊喜地发现，项目根目录下多出了一个 MyTopLevel.v 文件。打开它，里面正是由 SpinalHDL 自动为你生成、排版整齐且带有层级注释的 Verilog 代码！

---

## 本讲总结

本讲是整个系列的开篇，主要完成了以下两件事：

**1. 选型论证**
- 传统 Verilog 在参数化配置和大规模复用方面存在根本性局限
- SpinalHDL 本质上是 Scala 语言的一个硬件描述库，借助 Scala 的 OOP/FP 特性，实现了优雅的 **Plugin 架构**和编译期参数化
- 与竞品 Chisel 相比，SpinalHDL 生成的 Verilog 可读性更好，时钟域管理更可靠

**2. 环境与工作流**
- 配置 OpenJDK 17 + sbt，建立标准 Java/Scala 开发环境
- 理解 SpinalHDL 工程的目录结构：`build.sbt` 管理依赖，`src/main/scala/` 存放源码，`sbt run` 生成 Verilog
- 一个完整的硬件设计循环：编写 Scala → `sbt run` → 获得干净 Verilog → 导入 Vivado 综合实现
