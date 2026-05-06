---
title: "Lecture 4: Plugin与Pipeline的实现"
date: 2026-05-06
tags:
  - RISC-V
  - VexRiscv
  - Plugin
  - Pipeline
  - SpinalHDL
---

上一讲我们完成了 `Stage` 和 `Stageable` 的设计，它们是流水线的“骨骼”和“标签”。现在我们有了可以挂载信号的线站，但还没有一种统一的方式去组织这些线站，并把散落的信号连成一串真正的流水线。今天我们要做的就是这件事——引入 **Plugin** 和 **Pipeline**。

---

## 为什么需要 Plugin？

在传统的硬件设计里，我们可能会直接在一个顶层模块里把取指、译码、执行、写回等逻辑全部堆进去。这样做的缺点是：一旦你想为不同配置生成不同的 CPU（比如带/不带乘法器、带/不带分支预测），代码就会变得臃肿且难以维护。

VexRiscv 的做法是把每个功能模块（译码器、ALU、寄存器堆、跳转处理…）都封装成一个 **Plugin**。每个 Plugin 负责向流水线的各个 Stage 中添加自己需要的硬件逻辑，并通过 `Stageable` 与其他 Plugin 交换数据。最后，由 **Pipeline** 负责把所有 Plugin 召集起来，依次调用它们的 `setup` 和 `build` 方法，再把所有 Stage 正确连接。

在代码层面，`Plugin` 和 `Pipeline` 都是 `trait`（特质），可以理解成带一些默认实现的接口。我们先来看 `Plugin`。

---

## Plugin 的设计

完整文件：`src/main/scala/vexriscv/plugin/Plugin.scala`

``` scala
package vexriscv.plugin

import vexriscv.{Pipeline, Stage}
import spinal.core.{Area, Nameable}

/**
 * Created by PIC32F_USER on 03/03/2017.
 */
trait Plugin[T <: Pipeline] extends Nameable{
  var pipeline : T = null.asInstanceOf[T]
  setName(this.getClass.getSimpleName.replace("$",""))

  // Used to setup things with other plugins
  def setup(pipeline: T) : Unit = {}

  //Used to flush out the required hardware (called after setup)
  def build(pipeline: T) : Unit

  implicit class implicitsStage(stage: Stage){
    def plug[T <: Area](area : T) : T = {area.setCompositeName(stage,getName()).reflectNames();area}
  }
  implicit class implicitsPipeline(stage: Pipeline){
    def plug[T <: Area](area : T) = {area.setName(getName()).reflectNames();area}
  }
}
```

下面逐块拆解。

### 1. `trait Plugin[T <: Pipeline] extends Nameable`

`Plugin` 是一个泛型特质，它的类型参数 `T` 必须继承自 `Pipeline`。这样做的目的是让每个 Plugin 都能知道自己最终会被组装到哪一个具体的 `Pipeline` 子类里。

`extends Nameable` 表示每个 Plugin 都有自己的名字。在 Scala 里，`Nameable` 提供了 `setName` 方法，我们在下一行就用它设置了一个默认的弱名字：取类名，去掉末尾可能的 `$` 符号。这样做的好处是：在生成的 Verilog 代码中，与该 Plugin 相关的硬件信号会自动带上 Plugin 的名字，方便调试。

### 2. `var pipeline : T = null.asInstanceOf[T]`

每个 Plugin 内部都持有一个对所属 `Pipeline` 对象的引用。这保证了在 `setup` 和 `build` 阶段，Plugin 可以随时访问流水线中的所有 Stage 和其他 Plugin。

当然，这种 `var` 并且初始化为 `null` 的做法看起来有点不“Scala”，但这是出于设计上的取舍：`Pipeline` 和 `Plugin` 是互相引用的，必须分阶段初始化——先创建所有 Plugin 和 Pipeline 实例，再调用 `build()` 进行最后的连线，那时才把 `pipeline` 赋上正确的值。

### 3. `setup` 和 `build` 方法

- **`def setup(pipeline: T): Unit = {}`**  
  这个方法的默认实现是什么都不做。Plugin 可以选择覆写它，用来完成**与其他 Plugin 之间的协调工作**。例如译码器 Plugin 需要知道有哪些指令扩展被启用了，它就可以在 `setup` 中通过与别的 Plugin 交互收集这些信息。**注意：在 `setup` 阶段还不能生成任何硬件逻辑。**

- **`def build(pipeline: T): Unit`**  
  这是一个抽象方法，每个 Plugin 都必须实现。它会在所有 Plugin 的 `setup` 执行完毕之后被调用，是真正创建硬件、向各个 Stage 插入信号、连接组合逻辑的地方。可以等价地理解为：`build` 就是描述这个 Plugin 的“电路图”。

这种两步走的机制，允许所有 Plugin 先完成“握手”和“协商”，再统一开始建造硬件，避免了初始化顺序依赖带来的混乱。

### 4. 隐式转换与 `plug` 方法

在 `Plugin` trait 内部定义了两个隐式类（implicit class）：

``` scala
implicit class implicitsStage(stage: Stage){
  def plug[T <: Area](area : T) : T = {
    area.setCompositeName(stage,getName())
    area.reflectNames()
    area
  }
}
implicit class implicitsPipeline(stage: Pipeline){
  def plug[T <: Area](area : T) = {
    area.setName(getName())
    area.reflectNames()
    area
  }
}
```

它们的作用是提供一种非常方便的语法糖。当你在某个 Plugin 的 `build` 方法里，想为某个 `Stage` 添加一块组合逻辑时，可以这样写：

``` scala
val decode = pipeline.stages(1)
decode plug new Area {
  // 在这里写组合逻辑
  val someSignal = decode.input(INSTRUCTION)
  // ...
}
```

其实 `plug` 方法做的工作就是为传入的 `Area` 设置好层次化命名（让它属于这个 Stage，并且带有当前 Plugin 的名字），然后调用 `reflectNames()` 把命名传播给区域内的所有信号。这样生成的 Verilog 信号名就会像 `decode_MyPlugin_someSignal` 这样，非常可读。

同样，如果你想在顶层为整个 Pipeline 添加一块不属于任何特定 Stage 的硬件，可以用 `pipeline plug new Area {...}`。

这种设计让代码非常整洁，开发者不用手动去管理信号命名。

---

## Pipeline 的设计

现在每个 Plugin 已经可以独立地描述自己要在流水线的哪些位置插入什么样的硬件，但这些“建材”如何被砌成一堵墙？这就需要 `Pipeline` 了。

完整文件：`src/main/scala/vexriscv/Pipeline.scala`

``` scala
package vexriscv

import vexriscv.plugin._
import spinal.core._
import spinal.lib._

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

trait PipelineThing[T]

trait Pipeline {
  type T <: Pipeline
  val plugins = ArrayBuffer[Plugin[T]]()
  var stages = ArrayBuffer[Stage]()
  var unremovableStages = mutable.Set[Stage]()
  val things = mutable.LinkedHashMap[PipelineThing[_], Any]()

  def stageBefore(stage : Stage) = stages(indexOf(stage)-1)

  def indexOf(stage : Stage) = stages.indexOf(stage)

  def service[T](clazz : Class[T]) = {
    val filtered = plugins.filter(o => clazz.isAssignableFrom(o.getClass))
    assert(filtered.length == 1, s"??? ${clazz.getName}")
    filtered.head.asInstanceOf[T]
  }

  def serviceExist[T](clazz : Class[T]) = {
    val filtered = plugins.filter(o => clazz.isAssignableFrom(o.getClass))
     filtered.length != 0
  }

  def serviceElse[T](clazz : Class[T], default : => T) : T = {
    if(!serviceExist(clazz)) return default
    val filtered = plugins.filter(o => clazz.isAssignableFrom(o.getClass))
    assert(filtered.length == 1)
    filtered.head.asInstanceOf[T]
  }

  def update[T](that : PipelineThing[T], value : T) : Unit = things(that) = value
  def apply[T](that : PipelineThing[T]) : T = things(that).asInstanceOf[T]

  def build(): Unit ={
    plugins.foreach(_.pipeline = this.asInstanceOf[T])
    plugins.foreach(_.setup(this.asInstanceOf[T]))

    plugins.foreach{ p =>
      p.parentScope = Component.current.dslBody
      p.reflectNames()
    }

    //Build plugins
    plugins.foreach(_.build(this.asInstanceOf[T]))

    //Interconnect stages
    class KeyInfo{
      var insertStageId = Int.MaxValue
      var lastInputStageId = Int.MinValue
      var lastOutputStageId = Int.MinValue

      def addInputStageIndex(stageId : Int): Unit = {
        require(stageId >= insertStageId)
        lastInputStageId = Math.max(lastInputStageId,stageId)
        lastOutputStageId = Math.max(lastOutputStageId,stageId-1)
      }


      def addOutputStageIndex(stageId : Int): Unit = {
        require(stageId >= insertStageId)
        lastInputStageId = Math.max(lastInputStageId,stageId)
        lastOutputStageId = Math.max(lastOutputStageId,stageId)
      }

      def setInsertStageId(stageId : Int) = insertStageId = stageId
    }

    val inputOutputKeys = mutable.LinkedHashMap[Stageable[Data],KeyInfo]()
    val insertedStageable = mutable.Set[Stageable[Data]]()
    for(stageIndex <- 0 until stages.length; stage = stages(stageIndex)){
      stage.inserts.keysIterator.foreach(signal => inputOutputKeys.getOrElseUpdate(signal,new KeyInfo).setInsertStageId(stageIndex))
      stage.inserts.keysIterator.foreach(insertedStageable += _)
    }

    val missingInserts = mutable.Set[Stageable[Data]]()
    for(stageIndex <- 0 until stages.length; stage = stages(stageIndex)){
      stage.inputs.keysIterator.foreach(key => if(!insertedStageable.contains(key)) missingInserts += key)
      stage.outputs.keysIterator.foreach(key => if(!insertedStageable.contains(key)) missingInserts += key)
    }

    if(missingInserts.nonEmpty){
      throw new Exception("Missing inserts : " + missingInserts.map(_.getName()).mkString(", "))
    }

    for(stageIndex <- 0 until stages.length; stage = stages(stageIndex)){
      stage.inputs.keysIterator.foreach(key => inputOutputKeys.getOrElseUpdate(key,new KeyInfo).addInputStageIndex(stageIndex))
      stage.outputs.keysIterator.foreach(key => inputOutputKeys.getOrElseUpdate(key,new KeyInfo).addOutputStageIndex(stageIndex))
    }

    for((key,info) <- inputOutputKeys) {
      //Interconnect inputs -> outputs
      for (stageIndex <- info.insertStageId to info.lastOutputStageId;
           stage = stages(stageIndex)) {
        stage.output(key)
        val outputDefault = stage.outputsDefault.getOrElse(key, null)
        if (outputDefault != null) {
          outputDefault := stage.input(key)
        }
      }

      //Interconnect outputs -> inputs
      for (stageIndex <- info.insertStageId to info.lastInputStageId) {
        val stage = stages(stageIndex)
        stage.input(key)
        val inputDefault = stage.inputsDefault.getOrElse(key, null)
        if (inputDefault != null) {
          if (stageIndex == info.insertStageId) {
            inputDefault := stage.inserts(key)
          } else {
            val stageBefore = stages(stageIndex - 1)
            inputDefault := RegNextWhen(stageBefore.output(key), stage.dontSample.getOrElse(key, Nil).foldLeft(!stage.arbitration.isStuck)(_ && !_)).setName(s"${stageBefore.getName()}_to_${stage.getName()}_${key.getName()}")
          }
        }
      }
    }

    //Arbitration
    for(stageIndex <- 0 until stages.length; stage = stages(stageIndex)) {
      stage.arbitration.isFlushed := stages.drop(stageIndex+1).map(_.arbitration.flushNext).orR || stages.drop(stageIndex).map(_.arbitration.flushIt).orR
      if(!unremovableStages.contains(stage))
        stage.arbitration.removeIt setWhen stage.arbitration.isFlushed
      else
        assert(stage.arbitration.removeIt === False,"removeIt should never be asserted on this stage")

    }

    for(stageIndex <- 0 until stages.length; stage = stages(stageIndex)){
      stage.arbitration.isStuckByOthers := stage.arbitration.haltByOther || stages.takeRight(stages.length - stageIndex - 1).map(s => s.arbitration.isStuck/* && !s.arbitration.removeIt*/).foldLeft(False)(_ || _)
      stage.arbitration.isStuck := stage.arbitration.haltItself || stage.arbitration.isStuckByOthers
      stage.arbitration.isMoving := !stage.arbitration.isStuck && !stage.arbitration.removeIt
      stage.arbitration.isFiring := stage.arbitration.isValid && !stage.arbitration.isStuck && !stage.arbitration.removeIt
    }

    for(stageIndex <- 1 until stages.length){
      val stageBefore = stages(stageIndex - 1)
      val stage = stages(stageIndex)
      stage.arbitration.isValid.setAsReg() init(False)
      when(!stage.arbitration.isStuck || stage.arbitration.removeIt) {
        stage.arbitration.isValid := False
      }
      when(!stageBefore.arbitration.isStuck && !stageBefore.arbitration.removeIt) {
        stage.arbitration.isValid := stageBefore.arbitration.isValid
      }
    }
  }


  Component.current.addPrePopTask(() => build())
}
```

看到这么多代码先别慌，我们顺着逻辑一块一块拆开看。

### 1. `PipelineThing` 与服务定位

``` scala
trait PipelineThing[T]
```

`PipelineThing` 是一个简单的泛型标记特性，本身没有任何内容。它类似于一个类型化的“钥匙”，用来在 `Pipeline` 的 `things` 映射中存储或获取某些全局共享的配置/对象。例如，你可能想定义一个 `object RV32I extends PipelineThing[Boolean]`，用它来指示当前流水线是否配置了 RV32I 指令集。

`Pipeline` trait 里提供了对应的 `update` 和 `apply` 方法来读写这个映射：

``` scala
def update[T](that : PipelineThing[T], value : T) : Unit = things(that) = value
def apply[T](that : PipelineThing[T]) : T = things(that).asInstanceOf[T]
```

### 2. 插件管理：`service` 系列方法

`Pipeline` 中维护了一个 `plugins: ArrayBuffer[Plugin[T]]`，存放所有已添加的插件。`service`、`serviceExist`、`serviceElse` 这三个方法提供了在插件之间查找特定类型插件的能力：

- `service[T](clazz)` ：在所有插件中寻找第一个类型满足 `clazz` 的插件，并断言必须找到且唯一。
- `serviceExist[T](clazz)` ：检查是否至少存在一个指定类型的插件。
- `serviceElse[T](clazz, default)` ：如果找到对应类型的插件则返回它，否则返回一个默认值。

这种机制使得插件之间可以通过类型而不是名称来互相协作。例如，ALU 插件可以调用 `pipeline.service(classOf[DecoderPlugin])` 来获取译码器插件，从而查询指令的操作数信息。

### 3. 核心方法 `build()`

`build()` 是整个流水线的灵魂，它负责从“零件”到“整体”的组装过程。它的调用时机是被 `Component.current.addPrePopTask(() => build())` 注册为 SpinalHDL 的“弹出前任务”——即在当前 Component 的 RTL 生成之前，一次性完成所有连线。

#### 3.1 插件初始化与 setup/build

``` scala
plugins.foreach(_.pipeline = this.asInstanceOf[T])
plugins.foreach(_.setup(this.asInstanceOf[T]))
plugins.foreach{ p =>
  p.parentScope = Component.current.dslBody
  p.reflectNames()
}
plugins.foreach(_.build(this.asInstanceOf[T]))
```

首先，为每个插件赋予 `pipeline` 引用。接着调用 `setup`，让它们有机会互相“打招呼”。然后为了生成美观的 Verilog 信号名，将每个插件的命名空间设置为当前 Component 的 DSL body，并刷新其下所有信号的命名。最后，按顺序调用每个插件的 `build`，真正生成硬件。

#### 3.2 信号连接规则：`inputs`、`outputs` 和 `inserts`

回顾上一讲，一个 `Stage` 里可以有 `inputs`（输入槽）、`outputs`（输出槽）和 `inserts`（插入槽）。`Pipeline` 负责把它们连接起来，规则如下：

- **每个需要跨级传输的信号，必须由某个 `Stage` 的 `inserts` 声明其“诞生点”。**
- 从诞生点开始，往后每一级如果需要这个信号，就调用 `input` 或 `output`。`output` 意味着本级会对这个信号做修改，而 `input` 只是接收并保持（通常透传）。

`build` 中的连接算法是这样的：

1. 遍历所有 `Stage`，找出所有被 `inserts` 注册的 `Stageable`，并记录其第一次出现的 stage 索引（`insertStageId`）。
2. 检查是否所有被 `inputs` 或 `outputs` 使用的 `Stageable` 都已经有了 `insert`。如果存在未 `insert` 的信号，直接报错——这保证了每个信号都有明确的来源。
3. 然后收集每个 `Stageable` 在整个流水线中被 `input` 或 `output` 使用的范围（`lastInputStageId` 和 `lastOutputStageId`）。
4. 生成连接逻辑：
   - 对于每个 `Stageable`，从 `insertStageId` 到 `lastOutputStageId` 的每一个 Stage 中，如果该 Stage 声明了 `output`，就用 `REG` 把它们串起来：本级 `output` 的默认值驱动来自本级的 `input`（即 `outputDefault := input(key)`）。
   - 对于从 `insertStageId` 到 `lastInputStageId` 的每一个 Stage，如果声明了 `input`，就连线：
     * 如果是诞生级（`insertStageId`），则 `inputDefault := inserts(key)`。
     * 否则，用流水线寄存器连接前一级的输出：  
       `inputDefault := RegNextWhen(stageBefore.output(key), !stage.arbitration.isStuck && !dontSampleCond)`  
       这表示只有当前级未停顿时，才能采样前一级的有效数据。`dontSample` 条件可以进一步提供细粒度的时钟门控。

注意，这里 `output` 的连线优先于 `input`：如果一个 Stage 同时有 `input` 和 `output`，逻辑上相当于本级先接收输入，经过组合逻辑修改后作为输出，再把输出寄存到下一级。

#### 3.3 仲裁与控制信号的自动连接

每个 Stage 的 `arbitration` 区域在上一讲里留了一堆 `Bool` 信号，现在 `Pipeline` 会负责把它们算出逻辑关系：

- **`isFlushed`**：如果后面任何一级声明了 `flushNext`，或者本级或后面任何一级声明了 `flushIt`，那么本级的 `isFlushed` 就为真。
- **`removeIt`**：当 `isFlushed` 为真，且本级不是“不可移除级”（`unremovableStages` 集合中的级，比如取指级可能不能随便移除），就置 `removeIt`。
- **`isStuckByOthers`**：本级的停顿可以由 `haltByOther` 信号引起，或者后方任何一级正处于停顿状态（`isStuck`）造成反压。
- **`isStuck`**：即 `haltItself | isStuckByOthers`。
- **`isMoving`**：数据真正能移动的条件是 `!isStuck && !removeIt`。
- **`isFiring`**：最后一级指令完成的条件是 `isValid && !isStuck && !removeIt`。
- **`isValid`** 的传递：从第二级开始，`isValid` 被实现为一个寄存器，初值为 `False`。
  - 如果本级被停顿但不移除，则 `isValid` 保持。
  - 如果没被停顿且不移除，则 `isValid` 被前一级的 `isValid` 驱动。这就是最基本的流水线气泡传递逻辑。

这套仲裁机制保证了流水线中指令的流动、停顿和冲刷行为都是可预测且一致的。Plugin 只需要在需要的时候驱动 `haltItself`、`flushIt`、`flushNext` 等信号，流水线连接器就会自动处理好所有的连锁反应。

---

## 如何将插件和流水线组合在一起？

现在你可能会好奇：到底怎么使用这些东西？让我们快速展望一下。

假设你已经有了几个插件：`DecoderPlugin`、`AluPlugin`、`RegFilePlugin` 等，以及定义了一些 `Stageable`（例如 `PC`、`INSTRUCTION`）。你可以创建一个自己的流水线类：

``` scala
class MyCpuPipeline extends Pipeline {
  // 定义自己的类型，让 Plugin 知道是哪个 Pipeline
  type T = MyCpuPipeline
  
  // 创建各个级
  stages += new Stage()
  stages += new Stage()
  stages += new Stage()
  
  // 添加插件
  plugins += new DecoderPlugin()
  plugins += new AluPlugin()
  // ...
}
```

然后在顶层 `Component` 中实例化它，并调用 `build()`（当然，由于 `addPrePopTask` 的存在，你只需实例化即可，`build` 会在最后自动执行）。这时，所有插件会依次 `setup` 和 `build`，接着 `Pipeline` 会连接所有信号，最终生成一个完整的可综合 CPU。

---

## 小结

这一讲我们揭开了 VexRiscv 可扩展架构的秘密武器：

- **`Plugin`** 定义了功能模块的标准接口，通过 `setup` 和 `build` 分阶段介入流水线构建，并提供简洁的 `plug` 语法来组织硬件。
- **`Pipeline`** 充当装配者，它持有所有 Stage 和 Plugin，负责按序调用它们的方法，并最后用一套精巧的算法自动连接 `inputs`、`outputs`、`inserts` 以及控制信号，形成一条完整的、可停顿、可冲刷的流水线。

有了这两个核心组件，我们就可以像搭积木一样往流水线里添加译码、执行、访存等功能了。下一讲，我们将动手写出第一个真正产生输出的 Plugin，让这些抽象的机制第一次“活”起来。
