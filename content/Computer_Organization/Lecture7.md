---
title: "第7讲：单周期处理器设计"
date: 2026-04-24
tags:
  - RISC-V
  - Computer_Organization
---

# 计算机组成原理 第7讲：单周期处理器设计 (Single‑Cycle Processor Design)

## 本讲提纲 (Outline)
- 处理器设计方法 (Processor Design Methodology)
- 数据通路元件 (Datapath Elements)
- 单周期处理器数据通路 (Single‑Cycle Processor Datapath)
- 控制单元原理与实现 (Control Unit Principles and Implementation)

---

## 处理器设计方法 (Processor Design Methodology)

### 引言 (Introduction)
CPU 性能由三大因素决定：
- **指令数 (Instruction Count)**：由 ISA 和编译器决定。
- **CPI (Cycles Per Instruction)** 和 **时钟周期 (Cycle Time)**：由 CPU 硬件决定。

本讲将考察两种 RISC‑V 实现：
- 一种简化版本（本章重点）
- 一种更实际的流水线版本（后续章节）

### 如何设计处理器？ (How to Design a Processor?)
遵循四步设计流程：
1. **分析指令集** — 明确数据通路的需求。
2. **选择数据通路组件** — 并建立时钟方法。
3. **组装数据通路** — 满足指令执行的需求。
4. **组装控制逻辑** — 产生正确的控制信号。

### 第一步：分析指令集 (Analyze Instruction Set)
我们选取一个简化子集，覆盖主要指令类型：
- **算术/逻辑指令**：`add`, `sub`, `and`, `or`
- **存储器访问指令**：`lw`, `sw`
- **控制转移指令**：`beq`

由此提取硬件需求：
- **存储器**：用于存放指令和数据（暂时考虑分立单元，即指令内存和数据内存独立）。
- **寄存器堆**、**ALU**、以及大量**控制逻辑**。
- 所有指令共同的操作：
  - 使用程序计数器 (PC) 从指令内存取出指令。
  - 读取寄存器值。

### CPU 总览 (CPU Overview)
下面是一个简化的单周期 CPU 框图（文字描述）：
- 左上：PC → 指令内存 → 指令字段分离。
- 寄存器堆：读寄存器1/2，写寄存器，写数据端口。
- ALU：两个输入（一个来自寄存器，一个来自立即数或寄存器），输出结果到数据内存地址或写回寄存器。
- 数据内存：地址、写数据、读数据。
- 两个加法器：
  - 一个用于 `PC + 4`，顺序指向下一条指令。
  - 一个用于分支目标计算：`PC + 偏移量 × 2`。
- 多路选择器：选择 ALU 的第二操作数（寄存器或立即数）、选择写回寄存器的数据（ALU 结果或内存读出数据）、选择下一条 PC 的值（PC+4 或分支目标）。
- 控制单元：根据指令 opcode 产生各控制信号。

---

## 数据通路元件 (Datapath Elements)

### 第二步：选择数据通路组件和时钟方法
数据通路包括两类基本元件：
- **组合元件 (Combinational Elements)**：输出仅取决于当前输入。
- **时序元件 (State / Sequential Elements)**：具有内部存储，输出由先前写入的值决定，受时钟控制。

### 组合元件 (Combinational Elements)
常用的组合逻辑：
- **与门 (AND gate)**：Y = A & B
- **加法器 (Adder)**：Y = A + B
- **多路选择器 (Multiplexer)**：Y = S ? I1 : I0
- **ALU**：Y = F(A, B)

### 时序元件 (State Elements)
- 具有内部存储，通常至少两个输入一个输出：
  - 数据输入 (写入值)
  - 时钟输入 (何时写入)
  - 数据输出 (当前存储值)
- 示例：寄存器、内存。

### 带写控制的时序元件
- **无写控制**（如 PC）：每个时钟边沿都更新。
- **带写控制**（如寄存器堆、数据内存）：仅在写使能信号有效且时钟边沿到来时才更新。

### 指令内存与程序计数器 (Instruction Memory and PC)
- **指令内存 (Instruction Memory)**
  - 输入：32 位指令地址 (来自 PC)
  - 输出：32 位指令
- **程序计数器 (Program Counter, PC)**
  - 32 位寄存器，存放当前指令地址。
  - 每个时钟上升沿更新为下一条地址 (PC+4 或分支目标)。
  - 无外部写控制信号。

### 数据内存 (Data Memory)
- 输入：
  - `Address` (32 位)
  - `Write data` (32 位)
  - `MemWrite` (1 位)，`MemRead` (1 位)
- 输出：
  - `Read data` (32 位)
- 当 `MemRead = 1`，由地址选中的字被输出到读数据总线。
- 当 `MemWrite = 1`，写数据总线上的值被写入地址选中的内存字。

### 寄存器堆 (Registers)
- 32 个 32 位寄存器 (`x0`‑`x31`)。
- 输入：
  - 三个 5 位寄存器编号 (`Read register 1`, `Read register 2`, `Write register`)
  - 32 位写数据 (`Write data`)
  - `RegWrite` (1 位写使能)
- 输出：两个 32 位读数据 (`Read data 1`, `Read data 2`)
- 寄存器读：由两个读地址通过内部多路选择器选出对应数据输出。
- 寄存器写：由写使能、写地址和写数据，通过译码器选择写入的目标寄存器。

### 其他常用组合元件
- **左移 1 位 (Shift left 1)**：用于分支偏移量 ×2。
- **立即数生成单元 (Imm Gen)**：从 32 位指令中提取并符号扩展立即数到 32 位。

### 时钟方法 (Clocking Methodology)
- 规定信号何时可读、何时可写。
- **边沿触发时钟**：所有状态改变发生在时钟边沿（上升沿）。
- 时钟周期必须长于组合逻辑的传播延迟，以确保信号从第一个时序元件通过组合逻辑稳定到达第二个时序元件。
- 同一个周期内可安全地对同一个时序元件进行读和写，不会产生竞争，但需确保时钟周期足够长。

---

## 单周期处理器数据通路 (Single‑Cycle Processor Datapath)

### 第三步：组装数据通路
- 我们将逐步构建满足指令需求的数据通路。
- 关注寄存器传输和操作如何执行。

### 取指 (Fetch Instructions)
- 指令从指令内存取出，同时计算 `PC + 4`。
- 组件：程序计数器 (PC)、指令内存、加法器。
- 每个时钟上升沿 PC 更新为新地址。

### 实现 R‑Type 指令 (Implementing R‑Format Instructions)
指令格式：`add x1, x2, x3` (rd = rs1 + rs2)
- **数据流**：
  1. 从指令中提取 `rs1`, `rs2`, `rd`，送往寄存器堆的读地址和写地址。
  2. 寄存器输出 `Read data 1` 和 `Read data 2` 作为 ALU 两操作数。
  3. ALU 执行加法（由 ALU 控制信号决定）。
  4. ALU 结果通过多路选择器选择写回寄存器（写数据端），`RegWrite` 置 1。
  5. 写回 `rd` 寄存器。
- **控制信号**：`RegWrite = 1`, `ALUSrc = 0`（第二操作数来自寄存器），`MemToReg = 0`（写回数据来自 ALU），`MemRead = 0`, `MemWrite = 0`, `Branch = 0`, `ALUOp = 10`（R‑type）。

### 实现 Load/Store 指令 (Implementing Load/Store Instructions)
指令：`lw x1, offset(x2)`
1. 基址寄存器 `rs1` 从寄存器堆读出。
2. 立即数 `offset` 经符号扩展后，通过 `ALUSrc` 多路器送 ALU 第二输入。
3. ALU 计算 `地址 = rs1 + offset`。
4. 地址送数据内存：
   - `lw`：`MemRead = 1`，内存输出数据经 `MemToReg` 多路器写回 `rd`。
   - `sw`：`MemWrite = 1`，`rs2` 的数据送内存写数据端，不写寄存器 (`RegWrite = 0`)。
5. 控制信号：
   - `lw`：`RegWrite = 1`, `ALUSrc = 1`, `MemToReg = 1`, `MemRead = 1`, `MemWrite = 0`, `Branch = 0`
   - `sw`：`RegWrite = 0`, `ALUSrc = 1`, `MemRead = 0`, `MemWrite = 1`, `Branch = 0`

### 实现分支指令 (Implementing Branch Instructions)
指令：`beq rs1, rs2, offset`
1. 寄存器 `rs1` 和 `rs2` 读出，送入 ALU 进行相减（实际比较是否相等）。
2. ALU 产生零标志 `Zero`（若相等则 `Zero = 1`）。
3. 分支目标地址 = `PC + offset × 2`（偏移量经左移 1 位后与 PC 相加）。
4. 若 `Zero = 1` 且 `Branch = 1`，则选择分支目标地址作为下一条 PC；否则选择 `PC + 4`。
- 控制信号：`RegWrite = 0`, `ALUSrc = 0`, `Branch = 1`, `MemRead = 0`, `MemWrite = 0`, `ALUOp = 01`（减法）。

### 组合数据通路 (Combined Datapath)
将上述各指令所需的数据通路合并，通过多路选择器和控制信号统一管理：
- 公共部分：取指、寄存器堆、ALU、数据内存、写回。
- 多路选择器：
  - **ALUSrc**：选择 ALU 第二操作数来自寄存器 (`Read data 2`) 还是立即数。
  - **MemToReg**：选择写回数据来自 ALU 结果或内存读数。
  - **PCSrc**：选择下一条 PC 来自 `PC+4` 或分支目标。
- 控制信号由主控制单元根据 `opcode` 产生，ALU 控制单元根据 `ALUOp` 和 `funct3/funct7` 产生 ALU 操作码。

---

## 控制单元原理与实现 (Control Unit Principles and Implementation)

### 第四步：组装控制逻辑
- 分析每条指令的实现，确定控制点的设置，从而产生控制信号。

### 主控制真值表 (Truth Table for Main Control Unit)
基于简化指令集，信号真值表如下：

| 指令 | Opcode | RegWrite | ALUSrc | MemRead | MemWrite | MemToReg | Branch | ALUOp |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `lw`  | 0000011 | 1 | 1 | 1 | 0 | 1 | 0 | 00 |
| `sw`  | 0100011 | 0 | 1 | 0 | 1 | X | 0 | 00 |
| `beq` | 1100011 | 0 | 0 | 0 | 0 | X | 1 | 01 |
| R‑type| 0110011 | 1 | 0 | 0 | 0 | 0 | 0 | 10 |

(*X 表示无关项*)

### ALU 控制 (ALU Control)
- ALU 功能由 `ALUOp` 和 `funct3` (加 `funct7`) 决定。
- `ALUOp` 由主控制单元基于 opcode 输出：
  - Load/Store：加法 (`ALUOp = 00`)
  - 分支：减法 (`ALUOp = 01`)
  - R‑type：由 `funct` 字段译码 (`ALUOp = 10`)

典型 ALU 控制信号生成表 (根据 `ALUOp` 和 `funct3`)：

| ALUOp | funct7[5] | funct3 | 操作 | ALU 控制码 |
|:---:|:---:|:---:|:---|:---:|
| 00 | X | XXX | 加法 | 0010 |
| 01 | X | XXX | 减法 | 0110 |
| 10 | 0 | 000 | 加法 | 0010 |
| 10 | 1 | 000 | 减法 | 0110 |
| 10 | 0 | 111 | AND | 0000 |
| 10 | 0 | 110 | OR  | 0001 |

根据 ALU 控制码，ALU 执行相应运算。

---

## 总结
- 处理器设计遵循“分析‑选件‑搭通路‑加控制”的四步法。
- 单周期数据通路在一个时钟周期内完成取指、译码、执行、访存、写回所有步骤。
- 控制单元产生多路选择信号和写使能信号，协调数据流动。
- 后续将通过流水线技术优化单周期设计的时钟频率和吞吐量。