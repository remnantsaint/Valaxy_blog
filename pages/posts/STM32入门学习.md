---
layout: post
title: STM32入门学习
date: 2026-11-25 14:20:28
updated: 2026-11-25
time_warning: true 
cover: 
top: 
tags: 
 - STM32
 - 嵌入式
categories:
 - 学习记录
draft: 
# author: @Remsait
---
### 前言
  想学一下嵌入式方面的知识，了解到 B 站江协科技的教学视频，故跟着学习一下。

<!-- more -->

### 1. STM32 简介
  ST 公司基于 ARM Cortex-M 内核开发的 32 位微控制器。常应用在嵌入式领域，如智能车、无人机、机器人、无线通信、物联网、工业控制、娱乐电子产品等。STM32 功能强大、性能优异、片上资源丰富、功耗低，是一款经典的嵌入式微控制器。

  ARM 既指 ARM 公司，也指 ARM 处理器内核。ARM 公司是全球领先的半导体知识产权（IP）提供商，全世界超过 95% 的智能手机和平板电脑都采用 ARM 架构。
  
  本课程用的是 STM32F103C8T6 硬件，系列：主流系列 STM32F1；内核：ARM Cortex-M3；主频：72 MHz；RAM：20K（SRAM）；ROM：64K（Flash）；供电：2.0~3.6V（标准3.3V）；封装 LQFP48。
  
  片上资源/外设：主要学习内容，通过配置外设完成功能。