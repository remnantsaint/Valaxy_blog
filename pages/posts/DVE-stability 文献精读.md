---
layout: post
title: DVE-stability 文献精读
date: 2025-12-23 10:31:54
updated: 2025-12-23
time_warning: true 
cover: 
top: 
tags: 
 - ddg
categories: 
 - 生物信息
draft: 
# author: @Remsait
---
# 基于单序列的双视角集成学习预测突变对蛋白质稳定性的影响
  [Predicting protein stability changes upon mutations  with dual-view ensemble learning from single sequence](https://doi.org/10.1093/bib/bbaf319)
  
  https://github.com/ZhiweiNiepku/DVE-stability
  
## 摘要
  预测突变对蛋白质稳定性的影响是提升蛋白质工程效率的有效途径之一。本文提出了一种基于双视角集成学习的框架——DVE-stability，用于仅从蛋白质单序列出发预测突变所引起的稳定性变化。DVE-stability 通过集成学习整合突变的全局与局部依赖关系，从两个视角捕捉分子内相互作用，并设计了一个结构微环境模拟模块，在序列层面间接引入结构微环境信息。DVE-stability 在七个单点突变基准数据集上取得了当前最优的预测性能，并在其中五个数据集上全面超越了现有方法。此外，在多点突变预测任务中，DVE-stability 通过零样本推理（zero-shot inference）全面优于其他方法，展现出卓越的模型泛化能力，能够有效捕捉多点突变间的上位效应（epistasis）。更重要的是，DVE-stability 在预测对实际蛋白质定向进化至关重要的稀有有益突变方面表现出优异的泛化性能。此外，DVE-stability 还可通过注意力评分识别关键的分子内相互作用，具备良好的可解释性。总体而言，DVE-stability 以一种可解释的集成学习方式，为突变诱导的蛋白质稳定性变化预测提供了一种灵活高效的工具。
  
## 引言
  量化突变所引起的影响对于探索蛋白质的进化适应性景观至关重要。蛋白质热力学稳定性尤其受到关注，因为它为理解蛋白质折叠机制与功能提供了重要线索，从而推动了在药物生物制剂和工业生物催化剂领域的蛋白质工程研究。鉴于传统的实验方法测定突变引起的蛋白质稳定性变化在时间和成本上代价高昂，大量计算方法应运而生，用于预测突变对蛋白质稳定性的影响。
  
  现有的用于预测突变诱导蛋白质稳定性变化的计算方法，尤其是深度学习方法，可分为两大类：基于结构的方法和基于序列的方法。基于结构的方法通过输入蛋白质三维结构来预测单点突变引起的稳定性变化。例如，ThermoMPNN 采用预训练的ProteinMPNN模型对蛋白质结构进行编码，并将该编码用于后续的稳定性变化预测模块；Stability Oracle 则预训练了一个图Transformer主干网络，用于稳定性变化的回归预测；GeoDDG-3D 利用了预训练的图注意力神经网络架构的几何编码器。
  
  相比之下，基于序列的方法仅需蛋白质序列即可预测突变引起的稳定性变化。例如，Mutate Everything 利用预训练的特征提取器（如进化尺度建模ESM 或AlphaFold ）来计算输入序列中每个氨基酸级别的特征；PROSTATA 则采用预训练的ESM模型作为蛋白质序列的嵌入主干；SPIRED-Stab 开发了一种基于单序列的预训练结构预测模型，用于蛋白质稳定性变化预测。