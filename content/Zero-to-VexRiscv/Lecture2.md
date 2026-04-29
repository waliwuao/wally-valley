---
title: "Lecture 2: VexRiscv核心架构"
date: 2026-04-29
tags:
  - RISC-V
  - VexRiscv
  - Computer Architecture
  - SpinalHDL
---

## VexRiscv 基本设计理念

VexRiscv 并不是一个传统意义上用Verilog或Chisel编写的**固定**CPU 核心，而是一个基于 **SpinalHDL** 的**模块化 CPU 架构框架**。

其核心设计哲学是：**将硬件执行逻辑（Logic）与流水线物理结构（Structure）彻底解耦**。

传统的 CPU 设计通常使用一个巨大的数据结构（如 Bundle 或 Struct）作为“总线”，在各级流水线之间传递信号。这种模式下，硬件组件之间相互依赖：

- 修改成本高：若要增加一个信号，必须手动修改每一级流水线的接口定义。
- 连线冗余：即使某个信号只在第一级和第五级使用，你也必须在中间的第二、三、四级手动编写“过路”转发逻辑。
- 维护困难：逻辑处理与流水线控制逻辑（如 Stall/Flush）紧紧耦合在一起。

VexRiscv 提供了一种基于**插件（Plugin）**的动态构建方案：

- 按需互联（Demand-driven Interconnect）：不再使用集中式的大 Bundle 传输信号。每个信号（Stageable）是独立的，框架会自动分析各插件对信号的引用情况，自动生成跨阶段的寄存器连线。
- 逻辑注入（Logic Injection）：Pipeline 骨架本身不包含具体指令的处理逻辑。所有的操作（如译码、运算、访存）都由插件在 build 阶段动态“注入”到对应的流水线阶段（Stage）中。
- 弹性流水线：你可以通过增减插件，极其便捷地调整 CPU 的功能（如添加浮点单元、更改分支预测算法），而无需改动 CPU 的核心骨架代码。

使用这个框架，你可以得到极高的代码复用性，一个插件既可以适配二级流水线，也可以适配五级流水线。

并且你的硬件几乎零冗余，因为框架在生成时会完全移除那些没有启动的功能，实现真正的**按需构建**

![Vexriscv_Structure](/asset/vexriscv_struct.png)
*VexRiscv 插件化流水线示意图*

---

## Vexriscv架构精讲

### 1. Stageable：流水线信号的“标签”

前面我提到Vexriscv架构可以实现信号的独立传递，**自动**生成跨阶段的寄存器连线，这一强大功能的实现正是基于`Stageable`。

Stageable是一个快递标签，和需要传递的快递 **Data** 捆绑在一起，包含 **Name** 和 **Datatype**两个属性。

当 StageA 需要向 StageB 寄快递 **Data** 时，StageA 只需要在快递上贴上标签 **Stageable**, StageB 也需要填写信息，说明自己需要带有指定标签的快递，后续的快递员 **Pipeline**就会 StageA 和 StageB 填写的信息，创建跨阶段的寄存器连线，将快递送到StageB手中。

---

### 2. Stage：流水线阶段的“仓库”

每一个 `Stage` 都对z着 CPU 中的一个物理阶段，但是在 Vexriscv 中 Stage 只是这个阶段的 “仓库”，Stage 内部不包含任何实质性的操作逻辑，所有的具体操作逻辑都需要后续插件被激活后插入。

Stage 包含三个重要的属性：
- Input: 包含所有这个阶段需要的信号对应的 Stageable, 初始为空，由插件在(Build)阶段填写
- Output:包含所有这个阶段输出的信号对应的 Stageable, 初始为空，由插件在(Build)阶段填写
- Insert:包含所有这个阶段产生的信号对应的 Stageable, 初始为空，由插件在(Build)阶段填写，所有Insert默认自动加入Output

值得注意的是，Insert 的数据不仅仅会自动加入 Output，更重要的是它标志着该信号在流水线中的 “起始点”。

后续流水线会仔细阅读记录每一个Stage的 Input、Output、Insert 属性并创建寄存器连线。

Stage 还包含一个**仲裁逻辑**(Arbitration),它采用**分布式握手协议（Distributed Handshake Protocol）**，决定了指令何时可以进入下一级，何时必须停下来等待，以及何时需要被撤销。

**分布式握手协议（Distributed Handshake Protocol）**也是Vexriscv相较与传统CPU设计的优势之一,在分布式握手协议中，没有一个中央控制器来指挥所有阶段。相反，每一级流水线只观察两个方向：

- 前级（Upstream）：你给我的数据有效吗？（isValid）
- 后级（Downstream）：你现在能收我的数据吗？（!isStuck）

当这两个条件同时满足时，这一级就完成一次“握手”，指令向前移动。

---

### 3. Plugin：功能逻辑的“加工机器”

VexRiscv 的所有功能都是通过插件实现的。一个插件通常包含两个核心生命周期：

- setup(pipeline)：协商阶段,插件在此阶段不生成任何硬件，而是进行信息交换：

  - 服务发现：寻找依赖的其他插件（如分支插件寻找跳转服务 JumpService）。
  - 指令注册：向译码器登记指令编码。例如：ALU 插件告诉译码器：“如果匹配到 0110011，请将 ALU_CTRL 设为 ADD 模式。”

- build(pipeline)：实现阶段,在所有插件完成协商后，框架再次遍历插件执行 build，开始逻辑注入：

  - 硬件建模：插件在指定的 Stage 中使用 input 获取数据，编写 RTL 逻辑（如加法运算），并通过 insert 输出结果。

> 为什么分两步？
> 因为硬件生成（build）往往依赖全局信息。例如，译码器必须等所有插件在 setup 中提交完指令编码后，才能在 build 阶段生成完整的译码逻辑。

---

### 4. Pipeline：流水线的“系统集成”

`Pipeline` 负责执行最繁琐、最容易出错的自动化集成工作，确保所有部件能严丝合缝地协同工作：

- 自动连线：Pipeline 包含一个**KeyInfo**数据结构，pipeline会遍历每一个stage,并将stage的Input、Output、Insert记录到KeyInfo中，并规划布线
- 配置共享：Pipeline通过 **things** 属性存储全局配置（如总线宽度、寄存器数量），确保所有插件在施工时拿到的图纸是一致的。
- 服务匹配：当一个插件需要跳转服务（JumpService）却不知道找谁时，它只要向 Pipeline 申请，Pipeline 就会从已有的插件库中找到那个“懂跳转业务”的插件并建立起两者之间的链接。
- 反射命名：Pipeline会通过scala的**反射机制**获取你在代码中定义的变量名。它会遍历所有信号并赋予它们“人类可读”的名字（如 execute_to_memory_PC），这让后期的硬件仿真和调试效率提升了数倍。


## 总结

回顾整讲，VexRiscv 把一个 CPU 的设计拆成了四个干净的概念：**Stageable** 是灵活贴取的信号标签，**Stage** 是等待注入逻辑的空仓库，**Plugin** 是按需开动的加工机器，而 **Pipeline** 则是统筹全局的系统集成器。它们各司其职，把硬件执行逻辑和流水线物理结构彻底解耦。

正是因为这种“插件化”的组合，你才能像搭积木一样自由组装 CPU 功能。更妙的是，最终生成的硬件零冗余，只留下你真正用到的部分，完完全全的**按需构建**。无论你是搭两级小流水线还是五级大核，同一个插件不用改一行代码就能复用，这就是 VexRiscv 真正强大的地方。