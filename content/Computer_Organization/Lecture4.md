---
title: "Computer Organization Lecture 4"
date: 2026-04-24
tags:
  - RISC-V
  - Computer_Organization
---

# 计算机组成原理 第4讲：程序编译链接与性能评估

## 本讲提纲 (Outline)
- 程序的编译、链接与加载 (Program Compilation, Linking, and Loading)
- 性能概念与评估方法 (Performance Concepts and Evaluation Methods)

---

## 程序的编译、链接与加载 (Program Compilation, Linking, and Loading)

### 运行一个程序：调用链 (Running a Program: “CALL”)
从一个 C 程序到最终在内存中运行，需要经过以下工具链：
- **编译器 (Compiler)**
- **汇编器 (Assembler)**
- **链接器 (Linker)**
- **加载器 (Loader)**

流程如下：
```
C 程序 → 编译器 → 汇编语言程序 → 汇编器 → 目标模块 (机器语言) → 链接器 → 可执行文件 (机器语言) → 加载器 → 内存
                                                                   ↑
                                                     库例程 (机器语言)
```

### 编译器 (Compiler)
- **输入**：高级语言代码（如 C 文件 `foo.c`）
- **输出**：汇编语言代码（如 `foo.s` / `foo.asm`）
- 输出可能包含**伪指令 (Pseudo‑instructions)**。
- 现代优化编译器生成的汇编代码质量已可与汇编专家媲美，对大型程序甚至更优。

### 汇编器 (Assembler)
- **输入**：汇编语言代码（如 `foo.s`）
- **输出**：目标代码及信息表（如 `foo.o` / `foo.obj`）
- 读取并使用**汇编指令 (Directives)**：如 `.data`、`.text`、`.word`、`.byte`、`.global`、`.equ`
- 将**伪指令 (Pseudo‑instructions)** 替换为真实指令（如 `mv` → `addi`，`j` → `jal x0, target`），以简化汇编编程。
- 生成真正的机器语言，创建目标文件。

### 链接器 (Linker)
- **输入**：目标代码文件及信息表（如 `foo.o`、`lib.o`、`x.lib`）
- **输出**：可执行代码（如 `a.out` / `a.exe`）
- 将不同的目标文件拼接成单一可执行文件。
- 解析内部与外部引用，确定数据和指令标签的地址，将代码与数据模块组织到内存中。

#### 链接器的作用示例
- 目标文件 1：`jal x1, 252` → 目标地址 = `0x400004 + 0xFC (252) = 0x400100`
- 目标文件 2：`jal x1, -260` → 目标地址 = `0x400104 – 0x104 (260) = 0x400000`

链接器负责修正这些跨文件的相对跳转，使它们指向正确的绝对地址。

### 加载器 (Loader)
- **输入**：可执行代码（如 `a.out`）
- **输出**：程序开始运行
- 可执行文件存储在磁盘上。当程序运行时，加载器负责将其装入内存并启动执行。
- 实际上，加载器是操作系统 (OS) 的一部分。
- 如今，加载器还承担大量链接工作：链接器生成的“可执行文件”往往只是部分链接，仍包含外部引用——这称为**动态链接 (Dynamic Linking)**。

---

## 性能概念与评估方法 (Performance Concepts and Evaluation Methods)

### 定义性能 (Defining Performance)
- 哪架飞机性能最好？要评估性能，必须先**定义度量标准**。

### 响应时间与吞吐量 (Response Time and Throughput)
- 计算机性能主要基于以下两个指标：
  - **响应时间 (Response Time)**：一个任务从开始到结束所经历的时间。即“做一件事要多久”。
  - **吞吐量 (Throughput)**：单位时间内完成的任务总数（如每小时处理的任务/事务数）。
- 更换更快的处理器或添加更多处理器，分别对响应时间和吞吐量有何影响？
- 本讲先聚焦于**响应时间**。

### 相对性能 (Relative Performance)

- **定义性能**：
  $$\text{Performance} = \frac{1}{\text{Execution time}}$$
  性能与执行时间成反比。

- **“X 比 Y 快 n 倍”的含义**：
  $$\text{性能比 (Performance ratio, n)} = \frac{\text{Performance}_x}{\text{Performance}_y} = \frac{\text{Execution time}_y}{\text{Execution time}_x}$$

- **示例**：
  同一个程序，在计算机 X 上耗时 10s，在 Y 上耗时 15s：
  $$\frac{\text{Execution time}_y}{\text{Execution time}_x} = \frac{15s}{10s} = 1.5$$
  所以 **X 的速度是 Y 的 1.5 倍**。

> **提高性能 = 减少执行时间**：将执行时间改善（improve）若干倍，性能即提高若干倍。

### 度量执行时间 (Measuring Execution Time)
- **墙上时间 (Elapsed Time)**：总响应时间，包含处理、I/O、操作系统开销、空闲时间等所有方面，决定系统性能。
- **CPU 时间 (CPU Time)**：专用于处理某个任务的时间，不含 I/O 和其他作业的份额。包括用户 CPU 时间和系统 CPU 时间。
- 不同程序受 CPU 和系统性能的影响不同。
- 服务器运行中，I/O 性能（硬件与软件）至关重要。
- 总体墙上时间是真正的关注点，需据此定义性能指标并继续分析。

### CPU 时钟 (CPU Clocking)
- 数字硬件的运行受**恒定速率时钟 (Constant‑rate Clock)** 控制。
- 相关概念：
  - **时钟周期 / 时钟周期时间 (Clock Cycle / Clock Period)**：一个时钟周期的持续时间。
    - 例：250ps = 250×10⁻¹²s = 0.25ns
  - **时钟频率 (Clock Rate / Frequency)**：每秒的周期数。
    - 例：4.0GHz = 4000MHz = 4.0×10⁹Hz

常见单位：s, ms, μs, ns, ps … ； Hz, KHz, MHz, GHz …

### CPU 时间 (CPU Time)

\[
\text{CPU Time} = \text{时钟周期数 (No. of Clock Cycles)} \times \text{时钟周期 (Clock Period)}
\]

\[
= \frac{\text{时钟周期数}}{\text{时钟频率 (Clock Rate)}}
\]

- 提高性能可来自：减少时钟周期数，或提高时钟频率。
- 硬件设计者常常需要在时钟频率与时钟周期数之间**权衡 (Trade‑off)**。

### CPU 时间示例

- 计算机 A：2GHz 时钟，CPU 时间 = 10s
- 设计计算机 B：目标 6s CPU 时间。但时钟加快会导致周期数变为 A 的 1.2 倍。
- B 的时钟需多快？

\[
\text{Clock Rate}_B = \frac{\text{Clock Cycles}_B}{\text{CPU Time}_B} = \frac{1.2 \times \text{Clock Cycles}_A}{6s}
\]

\[
\text{Clock Cycles}_A = \text{CPU Time}_A \times \text{Clock Rate}_A = 10s \times 2\text{GHz} = 20 \times 10^9
\]

\[
\text{Clock Rate}_B = \frac{1.2 \times 20 \times 10^9}{6s} = \frac{4 \times 10^9 \text{ cycles}}{s} = 4\text{GHz}
\]

所以 B 需要 4 GHz 的时钟频率。

### 指令数与 CPI (Instruction Count and CPI)

\[ \text{时钟周期数 (Clock Cycles)} = \text{指令数 (Instruction Count)} \times \text{平均每指令周期数 (Cycles per Instruction, CPI)} \]

\[ \text{CPU Time} = \frac{\text{指令数} \times \text{CPI} \times \text{时钟周期}}{} = \frac{\text{指令数} \times \text{CPI}}{\text{时钟频率}} \]

- CPU 顺序执行指令。
- **指令数 (Instruction Count, IC)**：由程序、ISA 和编译器共同决定。
- **平均每指令周期数 (CPI)**：由 CPU 硬件决定。
  - 若不同指令有不同 CPI，平均 CPI 会受**指令组合 (Instruction Mix)** 影响。
  - 平均 CPI = 总周期数 / 总指令数。

### CPI 示例

- 计算机 A：Cycle Time = 250ps，CPI = 2.0
- 计算机 B：Cycle Time = 500ps，CPI = 1.2
- 相同 ISA。谁更快？快多少？

\[
\text{CPU Time}_A = I \times CPI_A \times \text{Clock Period}_A = I \times 2.0 \times 250\text{ps} = I \times 500\text{ps}
\]

\[
\text{CPU Time}_B = I \times CPI_B \times \text{Clock Period}_B = I \times 1.2 \times 500\text{ps} = I \times 600\text{ps}
\]

\[
\frac{\text{Performance}_A}{\text{Performance}_B} = \frac{\text{Execution time}_B}{\text{Execution time}_A} = \frac{I \times 600\text{ps}}{I \times 500\text{ps}} = 1.2
\]

因此，**A 比 B 快 1.2 倍**。

### CPI 的详细计算

若不同指令类别需要不同周期数，CPI 可由加权平均求出：

\[
CPI = \frac{\text{总时钟周期数}}{\text{总指令数}} = \sum_{i=1}^n \left(CPI_i \times \frac{\text{第 i 类指令数}}{\text{总指令数}}\right)
\]

其中 \(\frac{\text{第 i 类指令数}}{\text{总指令数}}\) 即为该类指令的**相对频率 (Relative Frequency)**。

### 编译器设计影响 —— 代码段比较

两段功能相同的代码序列，使用了不同比例的 A、B、C 三类指令。

| 类别 | A | B | C |
|------|---|---|---|
| 各类 CPI | 1 | 2 | 3 |
| 序列1 指令数 | 2 | 1 | 2 |
| 序列2 指令数 | 4 | 1 | 1 |

- **序列 1**：总指令数 \(IC = 5\)  
  时钟周期数 = \(2 \times 1 + 1 \times 2 + 2 \times 3 = 10\)  
  平均 CPI = \(10 / 5 = 2.0\)

- **序列 2**：总指令数 \(IC = 6\)  
  时钟周期数 = \(4 \times 1 + 1 \times 2 + 1 \times 3 = 9\)  
  平均 CPI = \(9 / 6 = 1.5\)

序列 2 虽然指令数更多，但总周期数更少，因此**执行更快**。这说明 CPI 和指令数的综合评价才能反映真实性能。

### 性能总结：经典 CPU 性能公式

\[
\text{CPU Time} = \text{指令数 (IC)} \times \text{CPI} \times \text{时钟周期 (T_c)} = IC \times CPI \times T_c = \frac{IC \times CPI}{f} \quad (f = 1/T_c)
\]

性能取决于：
- **算法 (Algorithm)**：影响 IC，也可能影响 CPI
- **编程语言 (Programming Language)**：影响 IC 和 CPI
- **编译器 (Compiler)**：影响 IC 和 CPI
- **指令集架构 (ISA)**：影响 IC、CPI 和 \(T_c\)

### 评论
- 单独看指令数或 CPI 并不能准确反映性能。
- **执行时间 (CPU Time)** 是衡量计算机性能唯一完整且可靠的指标。
- 编译器优化对算法敏感。
- 任何硬件都无法修补一个愚蠢的算法！

---

## 芯片能耗 (Energy Consumption of a Chip)

- **能耗 (Energy consumption)** = 动态能耗 + 静态能耗
  - **动态能耗 (Dynamic Energy)**：晶体管从 0→1→0 翻转时所消耗的能量，占主导。
  - **静态能耗 (Static Energy)**：无晶体管翻转时的漏电能耗。

- 一次完整的 0→1→0 翻转能耗：
  \[
  \text{Energy} \propto \text{Capacitive load} \times \text{Voltage}^2
  \]

- 单次 0→1 或 1→0 翻转能耗：
  \[
  \text{Energy} \propto \frac{1}{2} \times \text{Capacitive load} \times \text{Voltage}^2
  \]

- **功率 (Power)**，即单位时间能耗：
  \[
  \text{Power} \propto \frac{1}{2} \times \text{Capacitive load} \times \text{Voltage}^2 \times \text{Frequency switched}
  \]

---

## 多处理器 (Multiprocessors)

- **多核微处理器 (Multicore Microprocessors)**：单个芯片上集成多个处理器核心。
- 必须采用**显式并行编程 (Explicitly Parallel Programming)**。
- 相比指令级并行 (Instruction Level Parallelism, ILP)，多核并行对程序员可见，编程更难。
- 面向性能的编程需关注：
  - **负载均衡 (Load Balancing)**
  - **优化通信与同步 (Optimizing Communication and Synchronization)**

---

## 基准测试套件 (Benchmark Suites)

- 各厂商公布其系统的 **SPEC (Standard Performance Evaluation Cooperative，标准性能评估组织)** 评分。
  - 这是一组固定程序的执行时间度量。
  - 与特定 CPU、内存系统、I/O 系统、操作系统、编译器相关。
  - 便于对不同系统进行横向比较。
- 关键在于选取一组具有代表性的相关程序集合。

### SPEC CPU 基准测试
- 用于度量性能的程序，代表典型工作负载。
- **SPEC** 组织制定 CPU、I/O、Web 等基准测试。
- **SPEC CPU2006**：
  - 执行一系列选定的程序，测量墙上时间，几乎无 I/O，集中关注 CPU 性能。
  - 结果对参考机进行归一化，以性能比的**几何平均 (Geometric Mean)** 汇总。
  - 分为 **CINT2006** (整数) 和 **CFP2006** (浮点)。

### SPEC Power 基准测试

- 衡量服务器在不同工作负载水平下的**能耗表现**：
  - 性能指标：`ssj_ops` (Server Side Java Operations per Second)
  - 功率指标：Watts (Joules/sec)

\[
\text{Overall ssj\_ops per watt} = \frac{\sum_{i=0}^{10} ssj\_ops_i}{\sum_{i=0}^{10} power_i}
\]

**SPECpower_ssj2008 for Xeon X5650 示例：**

| 目标负载 (Target Load %) | 性能 (ssj_ops) | 平均功率 (Watts) |
|:---:|:---:|:---:|
| 100% | 865,618 | 258 |
| 90% | 786,688 | 242 |
| 80% | 698,051 | 224 |
| 70% | 607,826 | 204 |
| 60% | 521,391 | 185 |
| 50% | 436,757 | 170 |
| 40% | 345,919 | 157 |
| 30% | 262,071 | 146 |
| 20% | 176,061 | 135 |
| 10% | 86,784 | 121 |
| 0% | 0 | 80 |

整体汇总：总 `ssj_ops` = 4,787,166；每瓦性能 = \(\sum ssj\_ops / \sum power\)。

---

## 谬误：闲置时低功耗？ (Fallacy: Low Power at Idle)

- **谬误 (Fallacy)**：回顾 i7 电源基准数据
  - 100% 负载：258W
  - 50% 负载：170W (66%)
  - 10% 负载：121W (47%)
- Google 数据中心大多在 10%–50% 负载下运行，满负载不到 1% 的时间。
- 启示：应设计**功耗与负载成比例**的处理器，而非仅在满载时优秀。

---

## 阿姆达尔定律 (Amdahl’s Law)

- 架构设计极度受**瓶颈**驱动：加速大概率事件，不要将资源浪费在对整体性能/功耗影响甚微的组件上。
- **Amdahl 定律**：通过某项增强得到的性能提升，受限于该增强在总执行时间中所占的**比例**。
- **示例**：假设乘法占 100s 总执行时间中的 80s。
  - 要使整体性能提升 5 倍，乘法速度需要提升多少？（提升空间受限）
- **推论**：**加速大概率事件** (Make the common case fast)。

---

## 总结 (Summary)

- 硬件知识提升软件质量：编译器、操作系统、多线程程序、内存管理。
- **重要趋势**：
  - 晶体管密度的持续增长
  - 向多核迁移
  - 性能提升速度放缓
  - 功耗/热约束日益突出
- **性能推理**：
  - 时钟速度、CPI、基准测试套件、性能公式
  - 经典公式：\(\text{CPU Time} = IC \times CPI \times T_c\)