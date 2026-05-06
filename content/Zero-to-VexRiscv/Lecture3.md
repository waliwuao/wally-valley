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

如图，为了传递$Data_A$，我们将一个 $Stageable_A$ 添加到 $Stage_A$ 的 insert 中（自动加入 output ），然后将另一个 $Stageable_A$ 添加到 $Stage_B$ 中的input中，后续pipeline在检查时发现 $output_A$ 与 $input_B$ 之间的关联，通过查找 $Stageable_A$ 找到两者储存信号的寄存器组，并创建两者之间的物理连接。

--- 

## 开工大吉

让我们先创建初始的文件结构：

``` txt
VexRiscv/
├── build.sbt
└── src/
    └── main/
        └── scala/
            └── vexriscv/
                ├── Stage.scala
                └── Stageable.scala
```

`build.sbt`直接使用VexRiscv的标准配置，可以直接复制粘贴。
``` scala
val spinalVersion = "1.13.0"

lazy val root = (project in file(".")).
  settings(
    inThisBuild(List(
      organization       := "com.github.spinalhdl",
      crossScalaVersions := Seq("2.12.18", "2.13.18"),
      scalaVersion       := "2.12.18",
      version            := "2.1.0"
    )),
    libraryDependencies ++= Seq(
      "com.github.spinalhdl" %% "spinalhdl-core" % spinalVersion,
      "com.github.spinalhdl" %% "spinalhdl-lib" % spinalVersion,
      compilerPlugin("com.github.spinalhdl" %% "spinalhdl-idsl-plugin" % spinalVersion),
      "org.scalatest" %% "scalatest" % "3.2.17" % Test,
      "org.yaml" % "snakeyaml" % "1.8"
    ),
    name := "VexRiscv"
  )

fork := true
```

接着我们直接在项目根目录下运行： (sbt的安装可以参考[[Lecture1.md]])

``` bash
sbt compile 
```

如果运行成功，你应该可以看到类似输出：

``` bash
[info] Updated file /home/username/VexRiscv/project/build.properties: set sbt.version to 1.12.9
[info] welcome to sbt 1.12.9 (Ubuntu Java 17.0.18)
[info] loading project definition from /home/username/VexRiscv/project
[info] loading settings for project root from build.sbt...
[info] set current project to VexRiscv (in build file:/home/username/VexRiscv/)
[info] Executing in batch mode. For better performance use sbt's shell
[info] compiling 2 Scala sources to /home/username/VexRiscv/target/scala-2.12/classes ...
[success] Total time: 2 s, completed Apr 30, 2026, 4:09:37 PM
```

## Stageable的设计

Stageable是信号的标签，用于表明信号的类型和名称，所以Stageable只需要传入一个Data参数（Data是Spinal中的信号类，其子类包含各种在硬件中常用的信号，比如Bits、UInt、SInt、Bool等），Stageable本身是HardType的子类，HardType是Spinal中负责硬件创建的类，实例化时接收一个Data类型的参数，包含一个apply方法，如果在代码中使用了HardType的apply方法，那么在编译环节就会生成硬件对应的verilog代码。

完整代码如下

``` scala
package vexriscv

import spinal.core._

class Stageable[T <: Data](_dataType : => T) extends HardType[T](_dataType) with Nameable{
  def dataType = apply()
  setWeakName(this.getClass.getSimpleName.replace("$",""))
}
```

这里的setWeakName方法可以在生成verilog代码时自动为信号储存区域命名，大大提高了代码的可读性。比如如果你定义了一个 `object PC extends Stageable(UInt(32 bits))`，那么在使用它的地方，生成的Verilog信号名中就会包含"PC"，非常直观。

---

## Stage的设计

`Stage` 代表了流水线中的一级。它并不直接包含组合逻辑或流水线寄存器，而是维护了一组“信号槽”（slots），通过这些槽与 `Stageable` 进行绑定，来记录本级所拥有以及需要和邻级交换的信号。

完整的 `Stage` 实现如下：

``` scala
package vexriscv

import spinal.core._
import spinal.lib._

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

class Stage() extends Area{
  // 强制在无条件顶层作用域中创建硬件信号
  def outsideCondScope[T](that : => T) : T = {
    val body = Component.current.dslBody
    val ctx = body.push()
    val swapContext = body.swap()
    val ret = that
    ctx.restore()
    swapContext.appendBack()
    ret
  }

  // 为某个 Stageable 声明一个输入信号
  def input[T <: Data](key : Stageable[T]) : T = {
    inputs.getOrElseUpdate(key.asInstanceOf[Stageable[Data]],outsideCondScope{
      val input,inputDefault = key()
      inputsDefault(key.asInstanceOf[Stageable[Data]]) = inputDefault
      input := inputDefault
      input.setPartialName(this, key.getName())
    }).asInstanceOf[T]
  }

  // 为某个 Stageable 声明一个输出信号
  def output[T <: Data](key : Stageable[T]) : T = {
    outputs.getOrElseUpdate(key.asInstanceOf[Stageable[Data]],outsideCondScope{
      val output,outputDefault = key()
      outputsDefault(key.asInstanceOf[Stageable[Data]]) = outputDefault
      output := outputDefault
      output
    }).asInstanceOf[T]
  }

  // 在本级“插入”一个信号，该信号将在流水线连接时传递给下一级的输入
  def insert[T <: Data](key : Stageable[T]) : T = inserts.getOrElseUpdate(key.asInstanceOf[Stageable[Data]],outsideCondScope(key())).asInstanceOf[T]

  // 流水线仲裁与控制信号
  val arbitration = new Area{
    val haltItself   = False       // 本级主动请求停顿
    val haltByOther  = False       // 本级被其他级请求停顿
    val removeIt     = False       // 取消本级指令（如分支预测失败）
    val flushIt      = False       // 冲刷本级
    val flushNext    = False       // 冲刷下一级
    val isValid      = Bool        // 本级数据有效
    val isStuck      = Bool        // 本级被停顿
    val isStuckByOthers = Bool     // 被其他级停顿
    def isRemoved    = removeIt
    val isFlushed    = Bool        // 本级的指令被冲刷掉
    val isMoving     = Bool        // 本级数据正在向前流动
    val isFiring     = Bool        // 本级的指令执行完毕并离开流水线
  }

  // 信号槽映射表
  val inputs   = mutable.LinkedHashMap[Stageable[Data],Data]()
  val outputs  = mutable.LinkedHashMap[Stageable[Data],Data]()
  val signals  = mutable.LinkedHashMap[Stageable[Data],Data]()
  val inserts  = mutable.LinkedHashMap[Stageable[Data],Data]()

  val inputsDefault   = mutable.LinkedHashMap[Stageable[Data],Data]()
  val outputsDefault  = mutable.LinkedHashMap[Stageable[Data],Data]()

  // 用于条件性关闭流水线寄存器采样的机制
  val dontSample      = mutable.LinkedHashMap[Stageable[_], ArrayBuffer[Bool]]()

  def dontSampleStageable(s : Stageable[_], cond : Bool): Unit ={
    dontSample.getOrElseUpdate(s, ArrayBuffer[Bool]()) += cond
  }

  // 为输入寄存器设置复位初始值
  def inputInit[T <: BaseType](stageable : Stageable[T],initValue : T) =
    Component.current.addPrePopTask(() => inputsDefault(stageable.asInstanceOf[Stageable[Data]]).asInstanceOf[T].getDrivingReg().init(initValue))
}
```

下面我们来逐块拆解这个设计。

### 1. 为什么要用 `outsideCondScope`

在 SpinalHDL 中，如果你在一个 `when` / `otherwise` 块内创建硬件信号，该信号的作用域会被限制在该条件分支内，导致在分支外部无法访问，或者生成非预期的硬件结构。

而 `Stage` 中的信号创建可能是由用户在各个 `Stage` 的 `area` 内、甚至在某些条件分支内调用的（例如：在译码阶段根据指令类型才去 `insert` 某个信号）。为了保证所有信号槽中的信号始终存在于顶层、不受当前条件作用域影响，VexRiscv 使用 `outsideCondScope` 临时跳出当前 DSL 作用域，在全局上下文中创建信号，再恢复回原来的上下文。这样就保证了流水线寄存器的结构是固定、平坦的，不会出现因为条件而“消失”的信号。

### 2. `input`、`output` 与 `insert`

- **`input(key: Stageable[T]): T`**  
  检查 `inputs` 映射中是否已经有对应 `key` 的信号，如果没有，则在全局作用域下创建一对信号：`input`（用于接收上一级传来的值）和 `inputDefault`（默认值信号）。`input` 初始会连接至 `inputDefault`，以防输入悬空。同时将 `inputDefault` 存入 `inputsDefault`，以便后续流水线构建器为其连接真正的驱动源。  
  该方法返回的是已经准备好的输入信号，用户可以在本级组合逻辑中直接读取使用。

- **`output(key: Stageable[T]): T`**  
  与 `input` 类似，但创建的是输出信号 `output` 及其默认值 `outputDefault`。输出信号代表着本级计算完成后，准备交给下一级的数值。流水线构建器会负责把本级的 `output` 连接到下一级同名的 `input` 上。

- **`insert(key: Stageable[T]): T`**  
  `insert` 用于在本级内部产生一个信号，并希望它能被传递到下一级。在 VexRiscv 的连接模型中，本级 `inserts` 中的信号会在 Pipeline 构建时被连接到下一级对应的 `inputs` 上（实际上会被视同本级的一个输出）。因此你可以近似理解为：**“insert 即产生一个本级输出，下一级用 input 接收”**。  
  与 `output` 的区别在于：`output` 往往是在本级组合逻辑中通过赋值产生的最终结果，而 `insert` 更偏向于将一个已经存在的信号“登记”到输出列表中，常用于从上一级直接透传过来的信号，或是旁路信号。

### 3. 仲裁与控制信号 `arbitration`

每一个 `Stage` 内部都有一个名为 `arbitration` 的子 `Area`，其中定义了一组用于流水线控制的 `Bool` 信号。这些信号的具体连接和计算是由 `Pipeline` 构建器在连接各 `Stage` 时自动完成的，但我们需要在这里声明并留好位置。

- **haltItself**：当该级因为某些原因（如等待多周期操作、访存未就绪）需要主动停顿时，由用户的逻辑置为 `True`。
- **haltByOther**：当其他级（通常是后级）反压导致本级停顿时，构建器会将该信号驱动为 `True`。
- **removeIt**：当本级的指令需要被取消（如发生在分支预测失败后的错误路径上），用户逻辑或冲刷逻辑将此信号置 `True`，该指令不会离开本级。
- **flushIt / flushNext**：冲刷本级或下一级的所有有效信号，多用于分支跳转或异常处理。
- **isValid**：表示当前级是否含有一条有效指令。对于取指级，通常恒为 `True`；对于执行级，当发生冲刷或取消时变为 `False`。
- **isStuck / isStuckByOthers**：指示停顿状态，帮助用户逻辑判断是否应该更新状态。
- **isMoving**：表示本级数据在当前周期确实向前传递了一级，通常等价于 `isValid && !isStuck && !removeIt`。
- **isFiring**：表示本级指令正在执行完成并离开本流水级（通常是本级的最后一个周期），常用于写回使能。

这些信号的设计使得 VexRiscv 的流水线控制非常灵活，用户可以自行决定停顿、冲刷和取消的条件，而无需手动管理复杂的握手协议。

### 4. 信号槽映射表

`Stage` 中使用四个 `LinkedHashMap` 来记录已分配的信号：

- `inputs`：输入信号映射；
- `outputs`：输出信号映射；
- `signals`：预留的仅用于内部通信的信号（较少使用）；
- `inserts`：插入信号映射。

对应的 `inputsDefault` 和 `outputsDefault` 则记录每个信号的默认值信号，用于在没有任何驱动时提供一个安全默认值，避免生成锁存器。

### 5. `dontSampleStageable` 与时钟门控

`dontSampleStageable(s, cond)` 允许用户在某种特定条件下禁止对某个 `Stageable` 的流水线寄存器进行采样。这在硬件上可以实现细粒度的时钟门控，降低动态功耗。  
`dontSample` 映射为每个 `Stageable` 维护一个条件列表，当任意条件为真时，该信号对应的寄存器就不会更新，保持上一个有效值。

### 6. `inputInit`：设置输入寄存器的复位值

`inputInit` 用于为某个输入 `Stageable` 所对应的流水线寄存器设置复位时的初始值。它通过 `addPrePopTask` 在 RTL 生成之前，找到由 `input` 方法创建的默认值信号背后的寄存器，并调用 `.init(value)` 来为其赋复位值。典型的应用是设置 PC 寄存器的复位值。

---

## 小结

到这一步，我们已经完成了 VexRiscv 最核心的基础设施：`Stageable` 和 `Stage`。`Stageable` 提供了一种类型安全、可命名的方式来标记流水线中的信号；`Stage` 则为每一级流水线提供了统一的信号管理、控制接口和默认值机制。

你可以把 `Stage` 想象成一个带有标准接口的“空壳子”，它本身不包含任何计算逻辑，但它提供了插槽来挂载各种由 `Stageable` 标记的硬件信号。在下一讲中，我们将利用这些空壳子，通过 `Pipeline` 类将它们串联起来，变成一个真正可以流动的流水线。
