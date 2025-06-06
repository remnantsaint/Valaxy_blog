---
layout: post
title: 腾讯云cos图床+cloudflare+Picgo
date: 2024-09-15 08:15:51
time_warning: true
cover: 
top: 
tags: 
categories: 其他
# author: @Remsait
---

## 前言
以前一直是用github作为图床，同时使用免费cdn，但是缺点就是偶尔会加载不出来图片，科学上网后倒是可以正常看，总之很烦，手机看也是基本加载不出来图片。

现在考虑用存储桶来存储图片，同时使用 cloudflare 代理网站来提供 cdn 加速。我的域名没有备案，所以就得腾讯云 cos 中国外的存储桶

<!-- more -->

优点：加载图片更稳定
缺点：加载速度比较慢

1. 首先在 cloudflare 中添加自己的域名，然后更改dns服务商，把原来的两个链接修改成 cloudflare 给的。
2. 完成代理网站后，把原来服务商的 dns 记录添加到 cloudflare 中，确保能正常访问博客。如果遇到博客访问不了的情况，可以尝试清除浏览器缓存和清除 cloudflare 端的缓存。还是访问不了可以试试把 SSL 模式设置成完全。
3. 将 github 中图床仓库下载到本地。在腾讯云控制台的存储对象中创建新的存储桶。
4. 存储桶地区推荐选择新加坡，创建完毕后，在存储桶内创建一个 img 文件夹来存储图片。
5. 把所有图片上传到 img 文件夹中，安全选项中的防盗链可以先关闭（我开启后设置正确不知道为什么自己网站图片加载不出来
6. 设置自定义域名，可以用自己域名的二级域名，例如 cloudflare.example.com，同时配置 dns ，这时候有红色感叹号不用管，访问一下二级域名和默认域名看看内容一不一样就行了。只有配置了自定义域名，cos 才能被 cloudflare 的 cdn 保护。
7. 配置 picgo 其中前五项是必填，可以在腾讯云控制台中找到，存储路径填 img/ ，自定义域名填 https://cloudflare.example.com 填自己的
8. 用 vscode 把所有调用图床的链接全部替换一下。
9. 一般情况下就可以用了