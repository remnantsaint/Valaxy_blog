---
layout: post
title: Pymol 使使用方法
date: 2026-03-19 12:15:40
updated: 2026-03-19
time_warning: true 
cover: 
top: 
tags: 
categories: 生物信息
draft: 
# author: @Remsait
---
  因论文需要给蛋白质三维结构作图，所以学习`Pymol`。

### 下载与安装
  首先访问开源版 Pymol 的 github 网页[pymol-open-source-wheels
](https://github.com/cgohlke/pymol-open-source-wheels)

  在右侧release中下载 readme 中提到的两个文件，python版本根据电脑python版本自选，推荐虚拟环境

  在本地创建一个对应python版本的虚拟环境，在一个目录下用`conda activate xxx`来启用，之后运行`pip install pymol-3.2.0a0-cp314-cp314-win_amd64.whl`来安装，再运行`pip install pymol_launcher-3.2.0a0-cp314-cp314-win_amd64.whl`安装启动器

  下载PyQt5更方便使用，命令：`pip install PyQt5`

  然后在那个目录下运行`python -m pymol`就可以打开pymol了

### 使用
  上栏的 file 可以导入pdb，

  鼠标左键是拖动旋转，ctrl+左键是平移，右键是放大缩小

  在右边的操作栏可以选中pdb，然后show选择cartoon模式更方便看

  上栏Display->background->white可以使背景变为白色、Setting->transparency->cartoon->60%可以调整透明度，dpb改变颜色可以用 `by ss`选第二个

  右下角的S可以显示氨基酸，然后可以改变残基的颜色，一般用`by element`

  改变氨基酸的显示方式为`sticks`更方便看

  用lable可以给残基添加标签，右下角的`Mouse Mode`点一下会变成edit模式，可以用ctrl拖动标签，setting->lable可以调整标签字体大小和格式

  右上角`Draw/Ray`可以保存，输入300dp，然后选择`Ray slow`来保存成png格式的空白背景图片





### 参考
  [PyMOL小白自留教程1——PyMOL的安装](https://zhuanlan.zhihu.com/p/628418429)