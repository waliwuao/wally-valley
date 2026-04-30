---
title: "Lecture 3: Stage设计"
date: 2026-04-29
tags:
  - RISC-V
  - VexRiscv
  - Stage
  - SpinalHDL
---

在这一讲中，我们将会正式开始实现代码，我们会从最简单的Stage和Stageable开始。你不需要有scala的基础，我们会在实战中学习scala的语法，scala和java非常相似，所以你无需担心。

---

首先，我们要澄清一个可能的误解：

我们想要传输一个$Data_A$,$Data_A$由$Stage_A$创建，发送给$Stage_B$。由上一讲的知识我们知道，肯定有一个$Stageable_A$与$Data_A$绑定，那么请问整个流水线上总共有几个$Stageable_A$?

> 答案是两个，$Stage_A$和$Stage_B$各持有一个，每一个$Stage$持有的$Stageable$都指向自己储存对应信号的信号槽

![Vexriscv_Structure](https://raw.githubusercontent.com/waliwuao/wally-valley/v4/asset/stage.png)

如图，为了传递$Data_A$，我们将一个$Stageable_A$添加到$Stage_A$的insert中（自动加入output），然后将另一个$Stageable_A$添加到$Stage_B$中的input中，后续pipeline在检查时发现$output_A$与$input_B$之间的关联，通过查找$Stageable_A$找到两者储存信号的寄存器组，并创建两者之间的硬件连接。

