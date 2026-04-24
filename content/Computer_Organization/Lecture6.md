---
title: "第6讲：浮点数标准与算术"
date: 2026-04-24
tags:
  - RISC-V
  - Computer_Organization
---

# 计算机组成原理 第6讲：浮点数标准与算术

## 浮点数 (Floating Point)
- 用于表示非整数的数值表示法，类似科学计数法。
- 组成：**符号 (Sign)**、**尾数/有效数 (Mantissa / Significand)**、**指数 (Exponent)**。
- **十进制示例**：
  - \(-2.34 \times 10^{56}\)
  - \(+0.002 \times 10^{-4}\)
  - \(+987.02 \times 10^{9}\)
- **二进制示例**：
  - \(+1.001 \times 2^{-5}\)
  - \(-0.0011 \times 2^{3}\)
- 规范化形式：\(\pm 1.xxxxxxx_2 \times 2^y\)（隐藏最高位 1）

## IEEE 754 浮点标准 (Floating Point Standard)
- 由 **IEEE Std 754-1985** 定义，解决了不同机器表示不一致的问题，提升科学计算的可移植性。
- 已几乎被普遍采用。
- 两种主要精度：
  - **单精度 (Single precision)**：32 位
  - **双精度 (Double precision)**：64 位
- C 语言中的 `float` 和 `double` 对应两种精度。

## IEEE 浮点格式 (IEEE Floating-Point Format)
- **S**：符号位（0→非负数，1→负数）
- **Exponent**：采用**偏移指数 (biased exponent)** 表示，实际指数 = 指数域值 - **偏移值 (Bias)**
  - 单精度：Bias = 127
  - 双精度：Bias = 1023
- **Fraction**：尾数的小数部分。规范化形式默认整数部分为 1（**隐藏位 (hidden bit)**），所以尾数域存储的是小数点后的部分，真实尾数 = 1.Fraction

$$x = (-1)^S \times (1 + \text{Fraction}) \times 2^{\text{Exponent} - \text{Bias}}$$

### 为什么要用偏移指数？
- 偏移后的指数始终为正，便于在硬件中比较指数大小（可以直接按无符号整数比较），同时能有效表示很大和很小的指数。

## 示例 1：十进制转浮点 (Decimal to FP)
**表示 -0.75**
- \(-0.75_{10} = (-1)^1 \times 1.1_2 \times 2^{-1}\)
- S = 1
- Fraction = 1000…00₂ （1.1₂ 的小数部分 “1” 后补零）
- 实际指数 = -1
- 单精度：指数域 = -1 + 127 = 126 = 01111110₂  
  结果：**1_01111110_1000…00**
- 双精度：指数域 = -1 + 1023 = 1022 = 01111111110₂  
  结果：**1_01111111110_1000…00**

## 示例 2：浮点转十进制 (FP to Decimal)
**单精度浮点数：`11000000101000…00`**
- S = 1
- Fraction = 01000…00₂
- 指数域 = 10000001₂ = 129
- 真实指数 = 129 - 127 = 2
- 真值 = \((-1)^1 \times 1.01_2 \times 2^2 = -1 \times 1.25_{10} \times 4 = -5.0_{10}\)

## 单精度范围 (Single-Precision Range)
- 指数域 00000000 和 11111111 保留（用于表示零、无穷、NaN等）。
- **最小规格化正数**：
  - 指数域 = 00000001 → 实际指数 = 1 - 127 = -126
  - Fraction = 000…00 → 尾数 = 1.0
  - 值 ≈ \(1.0 \times 2^{-126} \approx 1.2 \times 10^{-38}\)
- **最大规格化正数**：
  - 指数域 = 11111110 → 实际指数 = 254 - 127 = 127
  - Fraction = 111…11 → 尾数 ≈ 2.0
  - 值 ≈ \(2.0 \times 2^{127} \approx 3.4 \times 10^{38}\)
- 正数表示区间：\([1.0 \times 2^{-126}, 2.0 \times 2^{127}]\)

## 双精度范围 (Double-Precision Range)
- 指数域 000…0 和 111…1 保留。
- **最小规格化正数**：约 \(2.2 \times 10^{-308}\)
- **最大规格化正数**：约 \(1.8 \times 10^{308}\)
- 区间：\([1.0 \times 2^{-1022}, 2.0 \times 2^{1023}]\)

## 溢出与下溢 (Overflow and Underflow)
- **溢出 (Overflow)**：指数太大，无法在指定位宽中表示。
- **下溢 (Underflow)**：指数太小（负数过小），无法表示。
- **示例**（单精度）：
  - 溢出：\(1 \times 2^{128}\)，\(-1.1 \times 2^{129}\)
  - 下溢：\(1 \times 2^{-127}\)，\(-1.1 \times 2^{-128}\)

## IEEE 754 特殊值：零、无穷与 NaN
- **±0**：指数和尾数全为 0，符号位区分正负。
- **±无穷 (Infinity)**：指数全 1，尾数全 0。通常由除以 0 产生。
- **NaN (Not a Number)**：指数全 1，尾数非 0。表示未定义或无效操作，如 \(0/0\) 或 \(\infty - \infty\)。

## 渐进下溢 (Gradual Underflow) 与非规格化数
- 当指数域全 0 时，**不再隐藏整数 1**，此时真实尾数 = 0.Fraction，表示非规格化数 (Denormalized Numbers)。
- 最小规格化数：\(1.0000...0_2 \times 2^{-126}\)
- 更小的非规格化数：\(0.0000...001_2 \times 2^{-126}\)，允许数值逐渐趋近于 0，避免直接下溢为 0。

## 浮点精度 (Floating-Point Precision)
- 相对精度：所有 fraction 位均为有效位。
- 单精度：23 位 fraction，相对精度 \(\approx 2^{-23}\)，相当于约 \(23 \times \log_{10}2 \approx 6.9\) 位十进制有效数字。
- 双精度：52 位 fraction，精度 \(\approx 2^{-52}\)，约 16 位十进制有效数字。

---

## 浮点算术 (Floating-Point Arithmetics)

### 浮点加法 (Addition Example)
**十进制示例**（4 位有效数字）：\(9.999 \times 10^1 + 1.610 \times 10^{-1}\)
1. **对齐指数**：将较小指数的数移位，使指数一致  
   \(9.999 \times 10^1 + 0.016 \times 10^1\)
2. **尾数相加**：\(9.999 + 0.016 = 10.015\)，结果暂存 \(10.015 \times 10^1\)
3. **规范化并检查溢出/下溢**：\(1.0015 \times 10^2\)
4. **舍入并可能重新规范化**：\(1.002 \times 10^2\)（保留 4 位有效数字）

**二进制示例**（4 位有效数字）：\(1.000_2 \times 2^{-1} + (-1.110_2 \times 2^{-2})\)  
（即 \(0.5 + (-0.4375)\)）
1. **对齐指数**：将较小指数的数右移  
   \(1.000_2 \times 2^{-1} + (-0.111_2 \times 2^{-1})\)
2. **尾数相加**：\(1.000_2 + (-0.111_2) = 0.001_2 \times 2^{-1}\)
3. **规范化**：\(1.000_2 \times 2^{-4}\)（无溢出/下溢）
4. **舍入**：\(1.000_2 \times 2^{-4} = 0.0625_{10}\)

### 浮点加法器硬件 (FP Adder Hardware)
- 远较整数加法器复杂，一次单周期完成会拖慢整个 CPU 的时钟频率。
- 通常采用多周期流水线设计：分解为指数对齐、尾数相加、规范化、舍入等阶段。

### 浮点乘法 (FP Multiplication)
**步骤：**
1. 计算指数（注意减去一个 Bias，防止重复加）
2. 尾数相乘，并正确放置小数点
3. 规范化乘积
4. 舍入（可能需要再次规范化）
5. 确定符号（同号得正，异号得负）

**十进制示例**：\(1.110 \times 10^{10} \times 9.200 \times 10^{-5}\)
1. 新指数 = \(10 + (-5) = 5\)
2. 尾数相乘：\(1.110 \times 9.200 = 10.212\)，暂为 \(10.212 \times 10^5\)
3. 规范化：\(1.0212 \times 10^6\)
4. 舍入：\(1.021 \times 10^6\)
5. 符号：正 × 正 → 正，结果 \(+1.021 \times 10^6\)

**二进制示例**：\(1.000_2 \times 2^{-1} \times (-1.110_2 \times 2^{-2})\)
1. 指数：\(-1 + (-2) = -3\)
2. 尾数相乘：\(1.000 \times 1.110 = 1.110_2\)，得 \(1.110 \times 2^{-3}\)
3. 结果已规范化，无溢出/下溢
4. 舍入：无需改变
5. 符号：正 × 负 → 负，最终 \(-1.110_2 \times 2^{-3} = -0.21875_{10}\)

### 浮点运算硬件与精确算术
- 浮点乘法器复杂程度与加法器相当，用乘法阵列替代加法器。
- 现代 FPU 通常支持加、减、乘、除、倒数、平方根以及整数与浮点互转。

### 精确算术：保护位与舍入
为提高中间结果精度，IEEE 754 采用额外的位：**保护位 (guard bit)**、**舍入位 (round bit)**、**粘滞位 (sticky bit)**，确保舍入结果在最后一位上的误差不超过 **½ ulp (units in the last place)**。
- 舍入模式：
  - 向正无穷舍入（round up）
  - 向负无穷舍入（round down）
  - 向零截断（truncate）
  - 向最接近偶数舍入（round to nearest even，用于 binary 的 0.10 情况）
- 这种设计允许程序员精细控制计算的数值特性，但增加了硬件复杂度。

---

## RISC-V 浮点指令 (FP Instructions in RISC-V)

### 寄存器与数据传送
- 独立的浮点寄存器组：`f0` – `f31`
  - 单精度值占用低 32 位，双精度可跨寄存器对存储。
- 浮点指令仅操作浮点寄存器，程序一般不混用整数运算与浮点数据。
- 浮点存取指令：
  - 单精度：`flw`（加载），`fsw`（存储）
  - 双精度：`fld`，`fsd`

### 算术与比较指令
- 单精度算术：`fadd.s`, `fsub.s`, `fmul.s`, `fdiv.s`, `fsqrt.s`  
  例：`fadd.s f2, f4, f6`
- 双精度算术：`fadd.d`, `fsub.d`, `fmul.d`, `fdiv.d`, `fsqrt.d`
- 比较指令：`feq.s/d`, `flt.s/d`, `fle.s/d`，结果写入**整数寄存器**（0 或 1），之后可用 `beq`/`bne` 等分支。

### 浮点示例：华氏度转摄氏度
**C 代码：**
```c
float f2c (float fahr) {
    return ((5.0/9.0) * (fahr - 32.0));
}
```
**转换后的 RISC-V 汇编（带注释）：**
```assembly
# 假设参数 fahr 在 f10 中，结果也返回在 f10
f2c:
    flw   f0, const5(x3)    # f0 = 5.0  （从全局数据加载常量 5.0）
    flw   f1, const9(x3)    # f1 = 9.0
    fdiv.s f0, f0, f1        # f0 = 5.0 / 9.0
    flw   f1, const32(x3)   # f1 = 32.0
    fsub.s f10, f10, f1      # f10 = fahr - 32.0
    fmul.s f10, f0, f10      # f10 = (5.0/9.0) * (fahr - 32.0)
    jalr  x0, 0(x1)          # 返回调用者（ra 在 x1 中）
```

### 浮点示例：矩阵乘法
**C 代码**（未优化，三重循环计算 C = C + A × B，方阵大小 32×32，双精度）：
```c
void mm (double c[32][32], double a[32][32], double b[32][32]) {
    int i, j, k;
    for (i = 0; i != 32; i = i + 1)
        for (j = 0; j != 32; j = j + 1)
            for (k = 0; k != 32; k = k + 1)
                c[i][j] = c[i][j] + a[i][k] * b[k][j];
}
```
**对应 RISC-V 汇编（注释补充）：**
```assembly
# 假设 x10 为 c 的基地址，x11 为 a，x12 为 b
# 用 x5, x6, x7 分别作为 i, j, k，x28 存放常量 32

    li    x5, 0               # i = 0
L1: li    x6, 0               # j = 0
L2: li    x7, 0               # k = 0
    # 计算 c[i][j] 的地址
    slli  x30, x5, 5          # x30 = i * 32（一行有 32 个双精度元素）
    add   x30, x30, x6        # x30 = i * 32 + j
    slli  x30, x30, 3         # x30 = (i*32 + j) * 8（双精度占 8 字节）
    add   x30, x10, x30       # x30 = c 的基地址 + 偏移，即 &c[i][j]
    fld   f0, 0(x30)          # f0 = c[i][j]
L3:
    # 计算 b[k][j] 的地址
    slli  x29, x7, 5
    add   x29, x29, x6
    slli  x29, x29, 3
    add   x29, x12, x29       # x29 = &b[k][j]
    fld   f1, 0(x29)          # f1 = b[k][j]
    # 计算 a[i][k] 的地址
    slli  x29, x5, 5
    add   x29, x29, x7
    slli  x29, x29, 3
    add   x29, x11, x29       # x29 = &a[i][k]
    fld   f2, 0(x29)          # f2 = a[i][k]
    fmul.d f1, f2, f1         # f1 = a[i][k] * b[k][j]
    fadd.d f0, f0, f1         # f0 = c[i][j] + 乘积
    addi  x7, x7, 1           # k++
    bltu  x7, x28, L3         # 若 k < 32 继续内层循环
    fsd   f0, 0(x30)          # 存回 c[i][j]
    addi  x6, x6, 1           # j++
    bltu  x6, x28, L2         # 若 j < 32 继续中层循环
    addi  x5, x5, 1           # i++
    bltu  x5, x28, L1         # 若 i < 32 继续外层循环
```

### 子字并行与 SIMD
- 图形/音频应用常需要对短向量同时操作，例如 128 位加法器可分割为：
  - 16 个 8 位加法
  - 8 个 16 位加法
  - 4 个 32 位加法
- 这也称为**数据级并行 (Data-Level Parallelism)** 或 **SIMD (Single Instruction, Multiple Data)**。

### x86 的 SSE2 及矩阵乘法优化
**SSE2 (Streaming SIMD Extension 2)** 新增 128 位寄存器，可同时处理两个双精度或四个单精度操作数。后续扩展至 256 位 (AVX) 等。
通过 SIMD 指令，可显著加速矩阵乘法。

**未优化的 C 代码（通用矩阵乘，动态大小）：**
```c
void dgemm (int n, double* A, double* B, double* C) {
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j) {
            double cij = C[i+j*n];
            for (int k = 0; k < n; k++)
                cij += A[i+k*n] * B[k+j*n];
            C[i+j*n] = cij;
        }
}
```

**未优化的 x86 汇编（标量运算，核心部分节选并注释）：**
```assembly
1. vmovsd (%r10),%xmm0       # 加载 C[i][j] 到 xmm0 （标量 double）
2. mov %rsi,%rcx
3. xor %eax,%eax             # eax = 0, 用作偏移索引
4. vmovsd (%rcx),%xmm1       # 加载 B[k][j]
5. add %r9,%rcx              # 移动到下一 B 元素
6. vmulsd (%r8,%rax,8),%xmm1,%xmm1 # xmm1 = A[i][k] * B[k][j]
7. add $0x1,%rax             # 索引加 1
8. cmp %eax,%edi
9. vaddsd %xmm1,%xmm0,%xmm0 # cij += 乘积
10. jg <内层循环跳转>
11. ...
12. vmovsd %xmm0,(%r10)      # 存回 C[i][j]
```

**优化后的 C 代码（使用 AVX 内联函数，一次处理 4 个双精度）：**
```c
#include <x86intrin.h>
void dgemm (int n, double* A, double* B, double* C) {
    for (int i = 0; i < n; i += 4)
        for (int j = 0; j < n; j++) {
            __m256d c0 = _mm256_load_pd(C+i+j*n); // 加载 C 的 4 个元素
            for (int k = 0; k < n; k++)
                c0 = _mm256_add_pd(c0,
                     _mm256_mul_pd(_mm256_load_pd(A+i+k*n),
                                   _mm256_broadcast_sd(B+k+j*n)));
            _mm256_store_pd(C+i+j*n, c0);
        }
}
```
**对应的优化汇编（使用 AVX 指令）：**
```assembly
1. vmovapd (%r11),%ymm0           # 一次加载 4 个 C 元素到 ymm0
2. mov %rbx,%rcx
3. xor %eax,%eax
4. vbroadcastsd (%rax,%r8,1),%ymm1 # 将 B[k][j] 广播为 4 个拷贝
5. add $0x8,%rax
6. vmulpd (%rcx),%ymm1,%ymm1      # 并行乘 4 个 A 元素
7. add %r9,%rcx
8. cmp %r10,%rax
9. vaddpd %ymm1,%ymm0,%ymm0       # 并行加 4 个乘积
10. jne <循环>
12. vmovapd %ymm0,(%r11)          # 存回 4 个 C 元素
```

---

## 总结 (Concluding Remarks)
- 二进制位本身并无固定含义，一切取决于指令如何解释。
- 计算机中的数值表示受限于有限的范围和精度，编程时需充分考虑。
- ISA 提供整数与浮点数的算术支持，浮点数是对实数的近似，存在溢出/下溢等问题。
- IEEE 754 标准化了浮点格式与运算行为，使跨平台科学计算成为可能。
- SIMD 技术（如 x86 的 AVX、RISC‑V 的向量扩展）利用数据级并行显著提升多媒体与科学计算的性能。