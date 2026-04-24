---
title: "Computer Organization Lecture 1"
date: 2026-04-24
tags:
  - RISC-V
  - Computer_Organization
---

# 计算机组成原理 第2讲：RISC-V 汇编基础 (Computer Organization Lecture 2)

## 本讲提纲

- 指令集架构 (Instruction Set Architecture, ISA)
- RISC-V 汇编基础 (RISC-V Assembly Fundamentals)
- 数据传送与存储器访问机制 (Data Transfer and Memory Access Mechanisms)
- 逻辑与流程控制指令 (Logic and Flow Control Instructions)

---

## RISC-V 概览

- RISC-V 是加州大学伯克利分校 (UC Berkeley) 开发的**第五代 RISC 设计**。
- 它是一套**高质量、免许可证、免版税**的 RISC 指令集规范，实现者无需支付任何版税。
- 拥有庞大的用户社区 (riscv.org)，涵盖工业界与学术界。
- 具备**完整的软件栈** (Full software stack)。
- 标准由非营利组织 **RISC-V 基金会 (RISC-V Foundation)** 维护。
- 适用于所有级别的计算系统——从微控制器到超级计算机。
- 在 AI 加速、边缘计算和高性能计算场景中采用日益广泛，许多 RISC-V 芯片已瞄准 AI 加速应用。
- 提供 32 位、64 位和 128 位变体。在课程讲授和实验中，我们使用 **32 位变体 (RV32)**，而教材使用 64 位。

---

## RISC-V 指令/操作 (RISC-V Instructions/Operations)

下表列出了 RISC-V 中常用的指令类别、指令及示例。这些指令是后续编程的基础，请务必熟悉。

| 类别 (Category) | 指令 (Instruction) | 示例 (Example) |
| :--- | :--- | :--- |
| **算术运算 (Arithmetic)** | 加 (Add) | `add x5, x6, x7` |
| | 减 (Subtract) | `sub x5, x6, x7` |
| | 立即数加 (Add immediate) | `addi x5, x6, 20` |
| **数据传送 (Data Transfer)** | 加载双字 (Load doubleword) | `ld x5, 40(x6)` |
| | 存储双字 (Store doubleword) | `sd x5, 40(x6)` |
| | 加载字 (Load word) | `lw x5, 40(x6)` |
| | 无符号加载字 (Load word, unsigned) | `lwu x5, 40(x6)` |
| | 存储字 (Store word) | `sw x5, 40(x6)` |
| | 加载半字 (Load halfword) | `lh x5, 40(x6)` |
| | 无符号加载半字 (Load halfword, unsigned) | `lhu x5, 40(x6)` |
| | 存储半字 (Store halfword) | `sh x5, 40(x6)` |
| | 加载字节 (Load byte) | `lb x5, 40(x6)` |
| | 无符号加载字节 (Load byte, unsigned) | `lbu x5, 40(x6)` |
| | 存储字节 (Store byte) | `sb x5, 40(x6)` |
| | 保留加载 (Load reserved) | `lr.d x5, (x6)` |
| | 条件存储 (Store conditional) | `sc.d x7, x5, (x6)` |
| | 加载高位立即数 (Load upper immediate) | `lui x5, 0x12345` |
| **逻辑运算 (Logical)** | 与 (And) | `and x5, x6, x7` |
| | 或 (Inclusive or) | `or x5, x6, x8` |
| | 异或 (Exclusive or) | `xor x5, x6, x9` |
| | 立即数与 (And immediate) | `andi x5, x6, 20` |
| | 立即数或 (Inclusive or immediate) | `ori x5, x6, 20` |
| | 立即数异或 (Exclusive or immediate) | `xori x5, x6, 20` |
| **移位 (Shift)** | 逻辑左移 (Shift left logical) | `sll x5, x6, x7` |
| | 逻辑右移 (Shift right logical) | `srl x5, x6, x7` |
| | 算术右移 (Shift right arithmetic) | `sra x5, x6, x7` |
| | 立即数逻辑左移 (Shift left logical immediate) | `slli x5, x6, 3` |
| | 立即数逻辑右移 (Shift right logical immediate) | `srli x5, x6, 3` |
| | 立即数算术右移 (Shift right arithmetic immediate) | `srai x5, x6, 3` |
| **条件分支 (Conditional Branch)** | 相等则分支 (Branch if equal) | `beq x5, x6, 100` |
| | 不等则分支 (Branch if not equal) | `bne x5, x6, 100` |
| | 小于则分支 (Branch if less than) | `blt x5, x6, 100` |
| | 大于等于则分支 (Branch if greater or equal) | `bge x5, x6, 100` |
| | 无符号小于则分支 (Branch if less, unsigned) | `bltu x5, x6, 100` |
| | 无符号大于等于则分支 (Branch if greater or equal, unsigned) | `bgeu x5, x6, 100` |
| **无条件跳转 (Unconditional Branch)** | 跳转并链接 (Jump and link) | `jal x1, 100` |
| | 寄存器跳转并链接 (Jump and link register) | `jalr x1, 100(x5)` |

---

## 算术操作 (Arithmetic Operations)

高级语言中的一个表达式，在汇编中需要分解为多条简单的指令。例如：

- **C 代码**：`f = (g + h) - (i + j);`
- **汇编代码**：
  ```assembly
  add t0, g, h    # 临时寄存器 t0 = g + h
  add t1, i, j    # 临时寄存器 t1 = i + j
  sub f, t0, t1   # f = t0 - t1
  ```

这体现了 **设计原则 1**：**简单性崇尚规整性 (Simplicity favors regularity)**。  
- 规整性使实现更简单，简单性则有助于在低成本下获得更高的性能。

---

## 汇编的“变量”：寄存器 (Assembly Variables: Registers)

- 汇编语言不像 C 或 Java 那样的高级语言 (High‑Level Language, HLL) 拥有随意命名的变量。
- 汇编操作数是一种称为 **寄存器 (Registers)** 的特殊存储位置。
- 它们是内置于硬件中的**数量有限、速度极快**的数值存放单元。
- RISC‑V 有 **32 个通用寄存器**，命名为 `x0` 到 `x31`。
- 在 RV32 变体中，每个 RISC‑V 寄存器宽度为 32 位，称为一个 **“字” (Word)**。
- 寄存器自身**无类型**，如何解释其内容完全由所执行的操作决定。
- 在 RISC‑V 中，算术操作的操作数几乎都来自寄存器。

这背后是 **设计原则 2**：**越小越快 (Smaller is faster)**。  
- 寄存器只有 32 个存储位置，而主存有数百万个位置，因此寄存器的访问速度远高于内存。

---

## RISC-V 寄存器约定 (RISC-V Registers)

RISC‑V 将 32 个寄存器按软件惯例赋予不同的用途，这些约定让不同编译器生成的代码能够互相配合：

- `x0`：恒为零常数。
- `x1`：返回地址 (return address)。
- `x2`：栈指针 (stack pointer)。
- `x3`：全局指针 (global pointer)。
- `x4`：线程指针 (thread pointer)。
- `x5` – `x7`、`x28` – `x31`：临时寄存器 (temporaries)。
- `x8`：帧指针 (frame pointer)。
- `x9`、`x18` – `x27`：保存寄存器 (saved registers)。
- `x10` – `x11`：函数参数/返回值 (function arguments/results)。
- `x12` – `x17`：函数参数 (function arguments)。

### 零寄存器 x0

`x0` 非常有用：它**永远为 0，且不可更改**（无需初始化）。  
例如，拷贝一个寄存器的值到另一个寄存器：
- RISC‑V：`add x3, x4, x0`
- 等效于 C 语言：`f = g`

当你需要丢弃某个计算结果时，将其目的寄存器指定为 `x0` 即可（相当于把结果扔进“黑洞”）。

---

## 立即数 (Immediates)

- **立即数 (Immediates)** 直接在指令中提供数值常量，避免访问内存，从而加速执行。
- 例如：
  - `a++`：`addi x3, x3, 1`
  - `a -= 3`：`addi x3, x3, -3`
  - `a = 0`：`addi x3, x0, 0`

这里体现 **设计原则 3**：**加速大概率事件 (Make the common case fast)**。  
- 小常数在程序中非常常见。
- 使用立即数避免了从内存加载操作数。
- 注意，RISC‑V 没有 `subi` 指令，因为减去立即数可以通过 `addi` 加上负数立即数实现，这保持了指令集的规整性。

---

## 有符号数的表示 (Signed Numeric Representations)

### 二进制补码 (Two's‑Complement Signed Integers)

对于 n 位二进制数，其补码表示的**取值范围**为：  
\(-2^{n-1}\) 到 \(+2^{n-1} - 1\)。

**示例**：  
一个 32 位二进制数  
`1111 1111 1111 1111 1111 1111 1111 1100`<sub>2</sub>

其值 =  
\(-1 \times 2^{31} + 1 \times 2^{30} + \dots + 1 \times 2^{2} + 0 \times 2^{1} + 0 \times 2^{0}\)  
\(= -2,147,483,648 + 2,147,483,644 = -4_{10}\)

32 位有符号整数范围：**–2,147,483,648 到 +2,147,483,647**。

### 如何取负？(Signed Negation)

**规则：按位取反 (1's Complement) 后加 1。**

**证明思路**：一个数加上它的按位取反结果，得到全 1（即 –1），因此取反加 1 就是该数的相反数。

**示例 1**：对 +2 取负  
- +2 = `0000 0000 … 0010`<sub>2</sub>  
- 按位取反：`1111 1111 … 1101`<sub>2</sub>  
- 加 1：`1111 1111 … 1110`<sub>2</sub>  **= –2**

**示例 2**：对 –3 取负  
- –3 = `1111 1111 … 1101`<sub>2</sub>  
- 按位取反：`0000 0000 … 0010`<sub>2</sub>  
- 加 1：`0000 0000 … 0011`<sub>2</sub>  **= +3**

---

## 符号扩展 (Sign Extension)

- 像 `addi` 这样的指令，其立即数字段限制为 12 位（指令格式细节后面会讲）。
- 类似的，`lb`、`lh` 会将被加载的字节/半字进行扩展；`beq`、`bne` 也会对偏移量进行扩展。
- RISC‑V 中的立即数会被**符号扩展 (Sign‑Extended)** 到 32 位。
  - 即，高位全部用 12 位立即数的最高位（符号位，bit[11]）填充。

**示例：12 位到 32 位符号扩展**  
- +1（12 位）：`0000_0000_0001`  
  → 32 位：`0000 0000 0000 0000 0000 0000 0000 0001`  
- –3（12 位）：`1111_1111_1101`  
  → 32 位：`1111 1111 1111 1111 1111 1111 1111 1101`

---

## 数据传送与存储器访问机制 (Data Transfer and Memory Access Mechanisms)

### 数据传送操作 (Data Transfer Operations)

- 算术操作**只能在寄存器上进行**，因此与存储器交互的动作只有**加载 (Load)** 和**存储 (Store)**。
- 数量对比：
  - 寄存器：32 个字 (128 字节)
  - 内存 (DRAM)：数十亿字节（笔记本通常 2 GB 到 16 GB）
- 访问速度差异：寄存器大约比 DRAM **快 100 到 500 倍**（就单次访问延迟而言）。

### 按字节编址的存储器 (Byte‑Addressable Memory)

- RISC‑V 采用**按字节编址**，每个字节都有唯一的地址。
- 1 个字 = 32 位 = 4 字节，因此**字的地址以 4 递增**。
  - 字 2 的地址 = 2 × 4 = 8
  - 字 10 的地址 = 10 × 4 = 40 (0x28)

### 存储器读 —— 加载 (Memory Read – Load)

**例**：将内存地址 4 处的一个字加载到 `x3`。  
```assembly
lw x3, 4(x0)   # 读取地址 x0 + 4 处的字，放入 x3
                # x0 为基地址，4 为偏移量
```
加载后，`x3` 的值为 `0xF2F1AC07`（假设小端方式）。

再看一个 C 语言对应的例子：
```c
int A[100];
g = h + A[8];
```
假设 `x13` 存放基址数组 `A` 的首地址（即指向 `A[0]`）。  
`A[8]` 的地址偏移量为 8 × 4 = 32 字节。  
汇编实现：
```assembly
lw x10, 32(x13)    # x10 = A[8]
add x11, x12, x10  # g = h + A[8]
```

### 存储器写 —— 存储 (Memory Write – Store)

```c
int A[100];
A[10] = h + A[3];  // 题目中为 A[8]，这里沿用讲解中的 A[10] = h + A[8]
```
仍用 `x13` 指向 `A[0]`。偏移量 32 和 40 字节。  
```assembly
lw x10, 32(x13)    # x10 得到 A[8]
add x11, x12, x10  # g = h + A[8]（这里为临时计算）
sw x11, 40(x13)    # 将结果存入 A[10]
```
> 注意：`sw` 要求存储地址必须是 4 的倍数，以保持**对齐 (alignment)**。

### 字节序 —— 小端与大端 (Endianness – Little Endian vs Big Endian)

- **字节序 (Endianness)** 指一个字内部各个字节的排列顺序。
- **小端 (Little‑Endian)**（如 RISC‑V、x86）：最低有效字节 (LSB) 存放在最低的地址。
- **大端 (Big‑Endian)**（如 MIPS）：最高有效字节 (MSB) 存放在最低的地址。

### 字节数据传送 (Byte Data Transfer)

除整字传送 (`lw` / `sw`) 外，RISC‑V 还支持按字节传送：
- 加载字节：`lb`
- 存储字节：`sb`

格式与 `lw`/`sw` 相同。  
```assembly
lb x10, 3(x0)    # 从地址 0x3 加载一个字节
```
假设内存地址 `0x3` 处存放 `0xAB`，由于符号扩展，`x10` 被填入：`0xFFFFFFAB`。

RISC‑V 还提供 **无符号加载字节** 指令 `lbu`，它将高位**零扩展 (Zero‑Extended)** 而非符号扩展：
```assembly
lbu x11, 3(x0)   # x11 = 0x000000AB
```

### 字节序与字节传送示例

**示例 1**  
```assembly
addi x11, x0, 0x3f5   # x11 = 0x000003F5
sw   x11, 0(x5)       # 将 x11 存入 x5 指向的地址（假设小端，地址由低到高依次存放 0xF5, 0x03, 0x00, 0x00）
lb   x12, 1(x5)       # 加载地址 x5+1 处的字节（即 0x03）
```
- 由于加载的是 `0x03`，最高位为 0，符号扩展后 `x12` 最终为 `0x00000003`。

**示例 2**  
```assembly
addi x11, x0, -512    # x11 = -512
sw   x11, 0(x5)
lb   x12, 1(x5)
```
- `-512` 的 32 位补码表示为 `0xFFFFFE00`。  
  存入后，各字节从低到高为：`0x00, 0xFE, 0xFF, 0xFF`。
- `lb x12, 1(x5)` 取出 `0xFE`，其最高位为 1，符号扩展得到 `0xFFFFFFFE`。
- 若改用 `lbu`，则结果为 `0x000000FE`。

---

## 存储程序计算机 (Stored Program Computers)

- 指令与数据一样，都以**二进制**的形式表示。
- 指令和数据**存放在同一个存储器**中。
- 程序因此可以处理程序（如编译器、链接器等）。
- 二进制兼容性允许编译后的程序在不同计算机上运行——靠的是标准化的 ISA。

---

## 逻辑与流程控制指令 (Logic and Flow Control Instructions)

### 逻辑操作 (Logical Operations)

逻辑操作常用于**提取和插入字中的位组**。

**移位指令：**
- **逻辑左移 (`sll` / `slli`)**：左移，空出的低位补 0。  
  `slli` 移 i 位相当于乘以 \(2^i\)。
- **逻辑右移 (`srl` / `srli`)**：右移，空出的高位补 0。  
  `srli` 移 i 位相当于无符号数除以 \(2^i\)。
- **算术右移 (`sra` / `srai`)**：右移，空出的高位用符号位填充。

**按位逻辑指令：**
- `AND`：**清 0** 某些位。  
  `and x9, x10, x11`
- `OR`：**置 1** 某些位。  
  `or x9, x10, x11`
- `XOR`：**翻转**某些位。  
  `xor x9, x10, x12`
- 如何实现 `NOT`？可用异或实现：  
  `xori x15, x14, -1`（因为 `-1` 所有位为 1，异或等价于按位取反）

### 带可变下标的数组访问 (Data Transfer with Variable Indexing)

```c
int A[100];  // A[0] 地址在 x13 中
int i;       // i 在 x14 中
...
g = h + A[i];
```
需要通过指针算术来计算地址，再加载：
```assembly
slli x15, x14, 2      # i * 4 （int 占 4 字节）
add  x15, x15, x13    # 地址 = A + i*4
lw   x10, 0(x15)      # 加载 A[i]
add  x11, x12, x10    # g = h + A[i]
```

### 条件分支操作 (Conditional Operations)

- **条件分支**：如果条件成立，则跳转到带标签的指令；否则顺序向下执行。
  - 相等则分支：`beq rs1, rs2, L1`（若 `rs1 == rs2` 则跳至 `L1`）
  - 不等则分支：`bne rs1, rs2, L1`
  - 无条件分支：`beq x0, x0, L1`（因为 `x0 == x0` 恒真）

**更多条件分支指令（有符号比较）：**
- 小于则分支：`blt rs1, rs2, L1`
- 大于等于则分支：`bge rs1, rs2, L1`

**示例**：C 代码 `if (a > b) a += 1;` （假设 `a` 在 `x22`，`b` 在 `x23`）
```assembly
bge x23, x22, Exit   # 若 b >= a 则跳过加1
addi x22, x22, 1     # a = a + 1
Exit:
```
对于**无符号比较**，对应指令为 `bltu` 和 `bgeu`。

### 缺少的条件怎么处理？(What if we need more instructions?)

- RISC‑V 没有直接的“大于则分支”或“小于等于则分支”，但可以通过**交换比较双方的角色**来实现：
  - `A > B` 等价于 `B < A`
  - `A <= B` 等价于 `B >= A`
- 为了方便编程，**汇编器 (Assembler)** 提供了**伪指令 (Pseudo‑instructions)**，会被自动翻译为真实指令：
  - `bgt x2, x3, foo` （伪指令）将被汇编为 `blt x3, x2, foo`（基本指令）。

---

## 基本块 (Basic Blocks)

- **基本块**是一个指令序列，它满足：
  - 除了末尾之外，内部不包含分支指令；
  - 除了开头，没有其他入口作为分支目标。
- 编译器识别基本块以进行优化。
- 高级处理器也可通过识别基本块来加速执行。

---

## 设计原则总结

1. **简单性崇尚规整性 (Simplicity favors regularity)**
   - 所有指令保持相同长度，格式尽量统一。
2. **越小越快 (Smaller is faster)**
   - 寄存器比内存快，因此寄存器数量保持适度。
3. **加速大概率事件 (Make the common case fast)**
   - 立即数操作让常数值无需额外加载。
4. **优秀的设计需要权衡 (Good design demands good compromises)**
   - 尽可能保持指令格式相似，同时满足多种需求。

---

## 本讲小结

1. **指令集架构 (ISA)** 规定了一台计算机能够执行的命令（指令）集合。
2. 硬件寄存器为指令提供了极少但极快的“变量”操作数。
3. RISC‑V ISA 要求软件将复杂操作分解为一串简单指令，从而换得更快、更简单的硬件实现。
4. 汇编代码是计算机原生机器码的**人类可读版本**，最终由汇编器转换为二进制。