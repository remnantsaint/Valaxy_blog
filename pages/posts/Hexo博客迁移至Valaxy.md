---
categories: 其他
cover: https://cloudflare.remsait.com/img/valaxy.png
date: 2024-09-07 21:50:59
image: 
layout: post
tags: valaxy
time_warning: true
title: Hexo博客迁移至Valaxy
top: 10
aplayer: true
---
Valaxy真的很棒   
解决了不少困扰已久的问题
<!-- more -->

<meting-js
 id="520461955"
 server="netease"
 type="song"
 theme="#C20C0C">
</meting-js>

## 安装

> 以下纪录我开始用Valaxy框架，yun主题重新建站的过程

首先得下载 git，直接官网下载最新版
valaxy官方文档：<https://valaxy.site/guide/getting-started>
首先下载nvm，然后用nvm下载18版本的node.js（我下载的是18.20.4），再下载pnpm，因为valaxy常用pnpm来管理包
运行命令`pnpm create valaxy`来安装valaxy，默认主题是`yun`  
> 很好看！ 

默认配置一下pnpm环境变量：`pnpm setup`  
配置一下淘宝镜像源`npm config set registry https://registry.npmmirror.com`
安装依赖： `pnpm i`
然后下载valaxy命令行：`pnpm add -g valaxy`  全局安装  
输入 `valaxy`就可以预览界面啦！

## 部署
参考：<https://valaxy.site/guide/deploy>
部署在github的一个仓库里很简单
首先得创建github账户，然后配置 ssh 公钥密钥，具体看 [[Github使用指南 - -Remsait's Blog-](https://remsait.com/posts/Github使用指南)]  
然后根据valaxy官方网站所说，在自己创的仓库的设置里进行修改（略
我每次要三步提交：`git add .`  and   `git commit -m '说明'`  and  `git push`
提交的是源代码，静态网页会自动部署在 gh 分支
git艺不精见谅  
> 一般情况下不需要`valaxy build --ssg`   有时候做修改时需要先进行构建


## 使用
`valaxy new name`创建新文章
模板可以看官方文档的自定义模板

在主题配置文件中，背景图片可以用`/bgimage/x.jpg`来设置，其中`bgimage`是`public`下的一个文件夹

边栏之类的在自定义设置里，在`styles/css-vars.scss`
以下是大佬的配置：
```css
// styles/css-vars.scss
:root {
    // 白天模式下文章框的底色
    --va-c-bg-light: rgba(255, 255, 255, 0.7);
    // 边栏背景图片
    --yun-sidebar-bg-img: url('');
    // 边栏背景颜色透明
    --yun-sidebar-bg-color: rgba(255, 255, 255, 0);
}

// 夜晚模式下文章框的底色
html.dark{
    --va-c-bg-light:rgba(5, 16, 29, 0.7);
}

// 首页大字两边的背景
.char-left {
    border-right:0px solid rgba(255,255,255, 0)
}
.char-right {
    border-left:0px solid rgba(255,255,255, 0)
}

// 鼠标光标
body {
  cursor:url(https://cdn.jsdelivr.net/gh/sviptzk/HexoStaticFile@latest/Hexo/img/default.cur),
          default;
  }
  a,
  img { cursor:url(https://cdn.jsdelivr.net/gh/sviptzk/HexoStaticFile@latest/Hexo/img/pointer.cur),
          default;
}

```

看官方文档的插件橱窗
设置waline评论系统：<https://waline.js.org/guide/get-started/#html-%E5%BC%95%E5%85%A5-%E5%AE%A2%E6%88%B7%E7%AB%AF>
跟着这个教程走

在页面设置中，边栏是整个右边栏，关闭目录是右边栏内的目录   nav是导航下一页文章
image是文章中的顶图   cover是显示在主页的图

girls添加头像时直接在百度搜图片，然后复制链接，挂了再补

新建了个scaffolds文件夹，里面放`post.md`名字的模板，用`valaxy new --layout post name`命令创建新文件，缩写是`valaxy new -l post name`
> 貌似创建模板后，直接valaxy new name即可
标签要类似这样创建
```
tags:
  - valaxy
  - 笔记
```
字数统计和阅读时长不用写在FrongMatter
标签最好换行用`  - `来写

转移文章时候用karu大佬给的脚本来进行，代码如下,自己修改对应的frontmatter：
需要先安装依赖：`pip3 install python-frontmatter`
```python
import frontmatter
import glob

path = 'posts/' #你的文章路径，相对于该脚本
mds = glob.glob(f'./{path}/*.md')

def del_metedata(md: str, key: str):
    post = frontmatter.load(md)
    metedata = post.metadata
    try:
        if isinstance(key, list):
            for k in key:
                try:
                    del metedata[k]
                except:
                    continue
        elif isinstance(key, str):
            del metedata[key]
        else:
            raise TypeError('key 是 str 或 list')
        frontmatter.dump(post, md)
    except Exception as e:
        print(f'{e} 在 {md}')


def add_metedata(md: str, key: str, value: str):
    post = frontmatter.load(md)
    metedata = post.metadata
    try:
        metedata[key] = value
        frontmatter.dump(post, md)
    except Exception as e:
        print(f'{e} 在 {md}')

def main():
    del_keys = [
        #要删除的项，你可以根据需要修改
        'toc',
        'mathjax',
    ]
    for md in mds:
        del_metedata(md,del_keys)
        #添加你需要的项,如添加 layout: post
        add_metedata(md, 'layout', 'post')
        add_metedata(md, 'time_warning', 'true')
        add_metedata(md, 'image', ' ')
        add_metedata(md, 'cover', ' ')
        add_metedata(md, 'top', ' ')
        add_metedata(md, 'categories', ' ')

if __name__ == '__main__':
    main()
```

自定义域名失效问题：在public文件夹创建`CNAME`文件，里面有不带https和www的域名

经过测试，貌似valaxy的yun主题只支持2、3、4级的多级目录，我原来的博客文章都是4、5级啊啊啊啊   啊啊啊 啊啊啊啊

原来valaxy支持多级分类，像写标签那样，舒服了💆‍

可以看看其他人`valaxy`框架的博客，哪里泄愤好看直接去github上下源码看，爽

想把博客加入必应站长平台，要下载一个 .xml 文件放入根目录，那么这个根目录在哪呢？  
答案是 public 文件夹！  public文件夹内的文件会直接上传到网站 gh 分支

可以添加以下类型的图片，在中央更好看一点
`<img src=""  alt="404" title="鼠标悬停文本"  />`

用这个给图片下面加备注
```vue
<center><div style="color:orange; border-bottom: 1px solid #d9d9d9;
    display: inline-block;
    color: #999;
    padding: 2px;">
      谨以此纪念我永远的队友们
  	</div>
</center>
```

发现一个bug ，本地文章列表创建多级目录的时候，在网站刷新一下当前文章就会 404 ！！  
&emsp; 该bug解决办法：升级valaxy的新版本，详见本博客内另外一篇文章[valaxy版本升级指南 - -西柿's Blog- (remsait.com)](https://remsait.com/posts/valaxy版本升级指南)

踩坑：   我把域名转移到cloudfare下面，利用它的加速，但是转移后总报错重定向过多
解决办法：在SSL证书那块选择`完全`  

好难啊，暂时不想改主题了(艰难花费两天时间改完了），以后有时间系统学习一下vue相关的。没有前端基础，自己创个新界面都费劲。
原hexo界面仍然部署在github-page上，想用原来的也很简单，因为是两个库，主要是迁移文章太麻烦啦！！  

当git拉取不对的时候，最好直接删掉本地valaxy文件夹，重新在github上拉取，方法如下：(1)先git clone到本地 （2）进入目录后 `pnpm i`  (3) 大功告成  








参考链接：    
[karu的博客](https://krau.top/posts/hexo-migrate-to-valaxy)      
[yuumi的博客](https://www.yuumi.link/posts/valaxy)     
[valaxy框架](https://valaxy.site/addons/gallery)