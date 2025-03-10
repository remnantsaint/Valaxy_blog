---
layout: post
title: 利用PCA简化数据
date: 2024-09-26 08:58:28
cover: 
top: 
tags: 
  - 机器学习
categories: 
  - 人工智能
  - 机器学习
# author: @Remsait
---
## 降维技术
### 场景
- 在电视上看足球比赛，显示器上会有一个球
- 显示器大概包含了 100万 像素点，而球则可能是由较少的像素点组成，例如说一千像素点
- 人们实时将显示器上的百万像素转换成一个三维图像，该图像就给出运动场上球的位置
- 在这个过程中，人们已经将百万像素点的数据，降至三维，这个过程就称为`降维（dimensionality reduction)

### 对数据简化的原因
1. 使得数据更容易使用
2. 降低很多算法的计算开销
3. 去除噪音
4. 使得结果易懂

### 适用范围
- 在已标注与未标注的数据上都有降维技术
- 这里我们将主要关注未标注数据的降维技术，同样也可以应用于已标注的数据。

### 技术
&emsp; 在下列三种降维技术中，PCA 的应用目前最为广泛
- 独立成分分析（ICA）
- 因子分析（FA）
- 主成分分析（PCA）
	- 通俗理解：就是找出一个最主要的特征，然后进行分析
	- 例如：考察一个人的智力情况，直接看数学成绩就行  ？

## PCA
### PCA 概述
&emsp; 主成分分析。通俗理解：就是找出一个最主要的特征，然后进行分析

### PCA 场景
&emsp; 例如：考察一个人的智力情况，直接看数学成绩就行  ？

### PCA 原理
> 工作原理

1. 找出第一个主成分的方向，也就是数据`方差最大`的方向
2. 找出第二个主成分的方向，也就是数据`方差次大`的方向，并且该方向与第一个主成分方向`正交`（如果在二维空间就叫垂直）
3. 通过这种方式计算出所有的主成分方向
4. 通过数据集的协方差矩阵及其特征值分析，我们就可以得到这些主成分的值
5. 一旦得到了协方差矩阵及其特征值分析，我们就可以得到这些主成分的值
6. 一旦得到了协方差矩阵的特征值和特征向量，我们就可以保留最大的 N 个特征。这些特征向量也给出了 N 个最重要的特征的真实结构，我们就可以通过将数据乘上这 N 个特征向量，从而将他转换到新的空间上

> 为什么正交？

1. 正交是为了数据有效性损失最小
2. 正交的一个原因是 特征值的特征向量是正交的

### PCA 优缺点
```text
优点: 降低数据的复杂性，识别最重要的多个特征。
缺点: 不一定需要，且可能损失有用信息。
适用数据类型: 数值型数据。
```

## 要点补充
```text
降维技术使得数据变的更易使用，并且它们往往能够去除数据中的噪音，使得其他机器学习任务更加精确。
降维往往作为预处理步骤，在数据应用到其他算法之前清洗数据。
比较流行的降维技术:  独立成分分析、因子分析 和 主成分分析， 其中又以主成分分析应用最广泛。

本章中的PCA将所有的数据集都调入了内存，如果无法做到，就需要其他的方法来寻找其特征值。
如果使用在线PCA分析的方法，你可以参考一篇优秀的论文 "Incremental Eigenanalysis for Classification"。 
奇异值分解方法也可以用于特征值分析。
```








## Reference
<https://github.com/apachecn/ailearning/blob/master/docs/ml/13.md>