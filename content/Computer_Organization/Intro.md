---
title: "Computer Organization Lecture 0"
date: 2026-04-24
tags:
  - RISC-V
  - Computer_Organization
---

# 计算机组成原理 第1讲 (Computer Organization Lecture 1)

## 简介

计算机组成原理在 CS 课程体系中属于**系统思维 (System Thinking)** 的学习。在这门课程中，我们将学习如何设计一个系统，并为软件系统课程打下硬件知识基础（例如计算机操作系统、大规模并行系统）。同时我们还将学会如何使用计算机解决问题，理解程序是如何在计算机上运行的，这些学习最终将帮助你更快、更好地解决遇到的问题。

本课程主要内容包括：
- 计算机的基本组成
- 计算机架构设计原则
- RISC-V 指令集下的汇编语言编写
- 数据层级结构设计
- I/O 组成与设计

课程安排如下：
- **引言（第1章）**
  - 基本术语
  - 摩尔定律 (Moore's Law)、功耗墙 (Power Wall)
  - 计算机体系结构核心思想
- **处理器（第2–4章）**
  - 汇编语言（第2章）
  - 计算机运算（第3章）
  - 流水线技术 (Pipelining)（第4章）
- **存储器（第5章）**
- **并行处理器（第6章）**

---

## 计算机的发展与演变

要理解现代计算机，我们首先回顾它的历史演变。计算机硬件技术大致经历了以下几代，每一代的核心器件都发生了革命性变化，推动性能不断飞跃：

- **第一代（20世纪40年代–50年代）**
  - 核心器件：**真空电子管 (Vacuum Tubes)**
- **第二代（20世纪50年代–60年代）**
  - 核心器件：**晶体管 (Transistors)**
- **第三代（20世纪60年代–70年代）**
  - 核心器件：**集成电路 (Integrated Circuits, IC)**
- **第四代（20世纪70年代–至今）**
  - 核心器件：**微处理器 (Microprocessors)**
- **新一代**
  - 核心驱动力：**人工智能 (Artificial Intelligence, AI)**

### 计算机革命 (The Computer Revolution)
这一系列器件进步，基石正是**摩尔定律 (Moore's Law)**——集成电路上可容纳的晶体管数目大约每隔两年便会增加一倍。这一定律驱动的计算机技术进步，使大量新型应用从设想变为现实：
  - 汽车中的计算机
  - 手机
  - 人类基因组计划
  - 万维网 (World Wide Web)
  - 搜索引擎
- **结果**：计算机已经无处不在。

### 计算机的分类 (Classes of Computers)
随着应用场景的不同，计算机也演化出了多种形态，以满足不同的成本、性能和功耗需求：
- **个人计算机 (Personal Computers)**
  - 面向通用任务，可运行多种软件
  - 设计时必须权衡成本/性能 (Cost/Performance Tradeoff)
- **服务器计算机 (Server Computers)**
  - 基于网络，为客户端提供各种服务
  - 强调高容量、高性能、高可靠性
  - 规模覆盖范围从小型服务器到大型数据中心
- **超级计算机 (Supercomputers)**
  - 用于高端科学计算和工程仿真
  - 代表最高计算能力，但在整个计算机市场中所占份额很小
  - （可参考 TOP500 榜单：https://www.top500.org/lists/top500）
- **嵌入式计算机 (Embedded Computers)**
  - 隐藏在各种设备内部，作为系统的一个组件
  - 面临严格的功耗/性能/成本约束

随着互联网与移动通信普及，又派生出一系列新的计算形态：
- **个人移动设备 (Personal Mobile Device, PMD)**
  - 依靠电池供电
  - 连接互联网
  - 零售价格通常在数百美元
- **物联网 (Internet of Things, IoT)**
  - 海量的嵌入式设备通过网络互联互通
- **云计算 (Cloud Computing)**
  - 由大规模**仓储级计算机 (Warehouse Scale Computers, WSC)** 提供算力支持
  - 典型交付模式：**软件即服务 (Software as a Service, SaaS)**
  - 物理载体为遍布全球的**数据中心 (Data Centers)**
- **面向 AI 时代的新架构**
  - 专为**深度学习 (Deep Learning)** 等应用优化
  - 代表性芯片：**GPU (Graphics Processing Unit，图形处理器)、TPU (Tensor Processing Unit，张量处理器)、NPU (Neural Processing Unit，神经网络处理器)**
  - 统称为 AI 芯片

### 产业格局变迁
技术浪潮也重塑了全球最大公司的版图。一个清晰的路径是：
- 通用电气 (General Electric, 1990) → 微软 (Microsoft, 1998) → 苹果 (Apple, 2012) → 英伟达 (Nvidia, 2024)
- **背后的逻辑**：工业时代 → PC 时代的软件 → 移动时代的硬件与软件 → AI 时代的基础设施
- 英伟达当前的核心基础设施即 GPU + CUDA
- 与此同时，越来越多近期 IPO 或独角兽 (Unicorn) 公司也加入这一赛道，比如寒武纪、壁仞、沐曦、地平线等。
- **本课程的价值**：计算机组成原理将告诉你设计 GPU/NPU/TPU 等芯片的基础，让你理解这波浪潮的硬件根基。

---

## 计算机的组成部分 (Components of a Computer)

无论一台计算机是超级计算机还是嵌入式设备，它在逻辑上始终由相同的五大基本部分组成：
- **输入 (Input)、输出 (Output)、存储器 (Memory)、处理器 (Processor)**
  - 处理器内部又分为：**控制器 (Control)** 与**数据通路 (Datapath)**，其中数据通路的核心计算部件是 **ALU (Arithmetic Logic Unit，算术逻辑单元)**

架构上，目前主要有两种经典范式：
- **冯·诺依曼架构 (Von Neumann Architecture)** — 程序指令和数据共用同一存储器
- **哈佛架构 (Harvard Architecture)** — 指令与数据分开存储，可以同时访问

### 实例：MacBook 拆解 (Teardown of MacBook)
为方便把上述组件与现实设备对应，我们来看一台笔记本电脑的内部实例：
- 16" LED 背光 IPS 视网膜显示屏 (Retina Display)
- 键盘 (Keyboard) 和触控栏 (Touch Bar)
- **处理器**：2.6 GHz 6 核 Intel Core i7
- **主存**：16 GB 2666 MHz DDR4 SDRAM
- **存储**：512 GB 固态硬盘 (SSD, Solid State Drive)
- **电源**：100 瓦时电池 (100 Watt-hour battery)
- 扬声器 (Speaker) 和麦克风 (Microphone)

从这里你能直观看到，输入、输出、存储、处理器等部件是如何集成在一台实物中的。

---

## 八大重要思想 (Eight Great Ideas)

理解计算机的组成只是第一步，真正令计算机设计走向优秀的是以下 **八大重要思想**。它们像一条主线，贯穿整个计算机体系结构的设计。我们不仅要记住它们，更要在后续每一章中反复体会它们如何落地：
1. 为摩尔定律设计 (Design for Moore's Law)
2. 使用抽象简化设计 (Use abstraction to simplify design)
3. 加速大概率事件 (Make the common case fast)
4. 通过并行提高性能 (Performance via parallelism)
5. 通过流水线提高性能 (Performance via pipelining)
6. 通过预测提高性能 (Performance via prediction)
7. 存储器层次结构 (Hierarchy of memories)
8. 通过冗余提高可靠性 (Dependability via redundancy)

下面重点展开后几个关于性能与可靠性的思想。

### 提高性能的方法 (Ways to improve performance)
- **大概率事件加速 (Common Case Fast)**
  - 优化经常发生的事情远比优化罕见情况收益更大。
  - 同时，常见情况往往更简单，更容易做增强，这正是设计的重要法则。
- **通过并行提高性能 (Performance via Parallelism)**
  - 并行就是让多个操作同时进行，从而突破单任务的吞吐限制。
- **通过流水线提高性能 (Performance via Pipelining)**
  - 流水线是并行的一种特殊模式。
  - 它像工厂装配线：将任务切分成一系列子步骤，数据处理元件串联工作，前一个元件的输出直接作为下一个元件的输入，从而每个时钟周期都能完成一部分工作，大幅提升吞吐率。
- **通过预测提高性能 (Performance via Prediction)**
  - 某些情况下，猜测并提前开始工作，平均而言比等待确定的结果更快。后面在流水线冒险处理中会进一步看到预测的具体应用。

### 存储器层次结构 (Hierarchy of memories)
因为快而大的存储器太昂贵，计算机采用分层结构来兼顾速度、容量和成本：
- 最靠近处理器的层级最快、最小、每比特最贵；最远离处理器的层级最慢、最大、每比特最便宜。
- 典型层次：
  - **高速缓存 (Cache)** — 通常使用 SRAM (Static Random-Access Memory，静态随机存取存储器)
  - **主存 (Main Memory)** — 通常使用 DRAM (Dynamic Random-Access Memory，动态随机存取存储器)
  - **辅助存储器 (Secondary Storage)**：例如机械硬盘 (Hard Disk) 或固态硬盘 (SSD)

### 通过冗余提高可靠性 (Dependability via Redundancy)
- 任何物理设备，包括计算机，都可能失效。
- 因此系统通过添加**冗余组件**，在故障发生时接管工作并帮助检测故障，从而实现高可靠性。

---

## 设计原则 (Design rules)

从八大思想中，可以提炼出两条根本性的设计原则：
- **为摩尔定律设计**
  - 硬件的集成度在项目进行期间仍会快速提升，因此计算机架构师必须预测当设计完成时技术会发展到什么水平，而不是仅仅瞄准设计开始时的工艺。眼光必须足够前瞻。
- **抽象 (Abstraction)**
  - 抽象是应对复杂性的关键手段：隐藏底层细节，向高层提供更简单的模型，从而同时提升硬件和软件的生产率。

---

## 程序运行在哪些层面？ (Below Your Program)

你能在电脑或手机上运行程序，背后依赖一套严谨的层次分工。从上到下依次为：
- **应用软件 (Application Software)**
  - 使用高级语言 (High-Level Language, HLL) 编写，比如 C、Python
- **系统软件 (System Software)**
  - **编译器 (Compiler)**：将高级语言代码翻译成机器能够理解的机器码 (Machine Code)
  - **操作系统 (Operating System, OS)**：提供各种基础服务
    - 处理输入/输出 (I/O)
    - 管理内存和存储
    - 调度任务与共享硬件资源
- **硬件 (Hardware)**
  - 实际执行机器码的物理实体：处理器、存储器、I/O 控制器等

---

## 程序代码的不同层次 (Levels of Program Code)

从人类可读的代码到底层硬件执行，逐层转换：
- **高级语言 (High-Level Language)**
  - 抽象层次更接近问题领域本身，关心“做什么”
  - 提供良好的生产率和跨平台可移植性
- **汇编语言 (Assembly Language)**
  - 用助记符文本表示机器指令，非常接近硬件
- **硬件表示 (Hardware Representation)**
  - 一切最终都变为二进制位（比特, bits）
  - 指令和数据都以二进制编码形式存在

---

## 抽象：硬件与软件的接口

上述分层能用好，依赖一个关键概念——**抽象**：
- 抽象帮助我们应对日益增长的复杂度，把底层细节隐藏起来。
- 最重要的一层抽象是 **指令集架构 (Instruction Set Architecture, ISA)**
  - ISA 是硬件与软件之间的接口（契约），软件只需要面向 ISA 编写，无需关心底层的具体实现。
- 往上还有一层：**应用程序二进制接口 (Application Binary Interface, ABI)**
  - ABI = ISA 加上一部分系统软件接口（如调用约定、系统调用方式等），使得编译后的二进制程序能够在同一家族的不同系统上运行。
- 而接口之下的真正实现细节，就是 **实现 (Implementation)**，即微架构。

---

## 指令集架构 (Instruction Set Architecture, ISA)

- **指令 (Instructions)**：CPU 能识别的最基本操作。
- 程序由一条条指令按顺序组成，每条指令完成极少量的工作——一个庞大程序不过是亿万个微小指令的累积。
- 每条指令包含对所指定操作数 (Operands) 执行的操作，并可改变指令执行顺序（分支/跳转）。
- 不同 CPU 家族有不同的指令集，即对应不同的 ISA。
- 常见 ISA 实例：ARM、Intel x86、MIPS、RISC-V、PowerPC ...

---

## ISA：RISC 与 CISC

历史上，ISA 的设计理念分为两大流派，可以形象地用一个比喻来理解：
| 比较项 | RISC (精简指令集计算机, Reduced Instruction Set Computer) | CISC (复杂指令集计算机, Complex Instruction Set Computer) |
|---|---|---|
| 形象比喻 | 拿起勺子 → 舀饭 → 送到嘴里 → 吞咽（每个细节都是一条指令） | 指令：吃饭（一条涵盖整个复杂动作） |
| 优点 | • 每条指令简单，针对常见操作优化，可以高效流水线执行<br>• 设计简洁，硬件实现相对规整 | • 单条指令功能强大，代码密度高 |
| 缺点 | • 一个复杂任务需多条指令配合 | • 复杂指令执行慢<br>• 流水线往往难以充分利用，硬件设计复杂 |
| 典型执行周期 | ≤ 1 周期/指令 | 通常 5–8 周期/指令 |
| 代表架构 | ARM, RISC-V, MIPS, LoongArch | x86 |

**RISC (Reduced Instruction Set Computer)**：追求每条指令做简单的事，让常用操作跑得极快，再配合流水线和并行技术，使整体吞吐量极高。
**CISC (Complex Instruction Set Computer)**：期望一条指令完成较多工作，但复杂的指令会给硬件设计和流水线带来负担，执行延迟较大。

---

## RISC 架构与芯片实例

在当今的移动、嵌入式以及新兴的 AI 加速场景中，RISC 架构以及它的最新代表 RISC-V 占据了重要地位。下面是一些真实芯片的例子：
- **ARM**
  - 华为鲲鹏 920 (Huawei Kunpeng 920) — 服务器领域
  - Apple M1 — 笔记本/桌面领域
  - 高通骁龙 (Qualcomm Snapdragon) — 移动设备领域
- **RISC-V** (开源指令集，已被众多厂商采用)
  - 阿里巴巴平头哥玄铁 C910 (Alibaba T-Head Xuantie C910) — 高性能计算 (HPC)
  - SiFive Intelligence X160 — AI 加速
  - ESP32-C6 — 物联网 (IoT)
- **MIPS**
  - Microchip PIC32 — 工业控制
- **LoongArch**
  - 龙芯 3A6000 (Loongson 3A6000) — 国产桌面平台

从这些实例可以看出，**计算机组成原理**所教授的流水线、存储层次、ISA 设计等思想，都直接体现在这些影响世界的芯片中。理解了这些基本原理，你就拿到了打开现代计算系统大门的钥匙。