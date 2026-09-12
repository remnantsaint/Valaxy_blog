---
layout: post
title: Python学习摘抄
date: 2026-09-12 14:03:16
updated: 2026-09-12
time_warning: true 
cover: 
top: 
tags: 
 - python
categories: 
 - 人工智能
draft: 
# author: @Remsait
---
本文参考 [廖雪峰的官方网站](https://liaoxuefeng.com/)，仅记录自己学习 python 时基于 C++ 基础遇到的一些小知识

---

  字符串输出，用 f-string 格式输出，比如 print(f'xxx{y}')，其中 y 就是变量
  
  列表：classmates = ['Michael', 'Bob', 'Tracy']，可修改，classmates.append('Adam') 添加，.pop('') 或 .pop(i) 删除
  
  元组：classmates = ('Michael', 'Bob', 'Tracy')，初始化后不可修改
  
  dict（字典）：d = {'Michael': 95, 'Bob': 75, 'Tracy': 85}，相当于 C++ 中的 map ，用 'Thomas' in d 或 d.get('Thomas') 判断是否存在，用 pop(key) 方法删除
  
  set（集合）：不能重复，add(key) 添加，remove(key) 删除
  
  倒数第一个元素的索引是 -1
  
  切片：前十个数 L[:10] ；后十个数 L[-10:]；前11-20个数 L[10:20]；前十个数，每两个取一个 L[:10:2]；所有数 L[:]；可以看出，切片是左闭右开
  
  map()：r = map(f, [1,2,3])，其中 f(x) = x * x，map() 用处是传入一个函数和一串列表，把列表每个数都按函数计算，并返回计算后的列表。
  
  reduce()：和 map() 区别在于把前两个元素结果和序列下一个元素做累积计算，并继续下去，如下：`reduce(f, [x1, x2, x3, x4]) = f(f(f(x1, x2), x3), x4)`
  
  filter()：用于过滤序列，也接收一个函数和一个序列，但把序列中不符合函数的都过滤掉。
  
  sorted()：排序方法，直接传入序列的话从小到大排序，可以传入一个 key 函数，比如 sorted([36, 5, -12, 9, -21], key=abs) 其中 abs 是绝对值函数，这样就会按绝对值大小排序
  
  匿名函数 lambda：比如 lambda x: x * x，好处是不用写 def，更方便。
  
  type()： 判断对象类型，但是只有判断基本数据类型时简单
  
  isinstance()：同样判断对象类型，可以用于类的判断，基本可以代替 type()
  
  dir()：获取一个对象的所有属性和方法
  
  错误处理：python 中用 try...except...finally... 的错误处理机制，所有的错误类型都继承自`BaseException`，日常用 `Exception`
  
  调用栈：当错误没被捕获，就会一直往上抛，最后被 Python 解释器捕获，打印错误信息。错误信息是一层一层的，越往下越接近错误源头
  
  调试：简单方法用 print() 输出，但结果会包含很多垃圾信息。用断言 assert 代替 print，比如 `assert n != 0, 'n is zero!'`，如果断言失败就会抛出异常，启动时可以用 -O 参数关闭 assert；logging 更常用
  
  读文件：使用 python 内置的 open() 函数：`f = open('/test.txt', 'r')`其中 'r' 表示只读，接下来调用 read() 方法可以一次读取文件全部内容，Python 把内容督导内存，用一个 str 对象表示。最后一步是用 f.close() 关闭文件读取。为了保证是否出错都能关闭文件，可以用 **with** 于局自动调用 close() 方法：
```python
with open('/path/to/file','r') as f:
	print(f.read())
```
  如果是二进制文件，比如图片、视频等，需要用 'rb' 模式打开文件，也就是把 'r' 换成 'rb'；open() 函数中还可以加字符编码参数，即 `f = open('/Users/michael/gbk.txt', 'r', encoding='gbk')`，如果有编码错误，最简单方式是直接忽略，用 errors = 'ignore'
  
  写文件：把 ‘r' 换成 'w'，直接覆盖写入，如果不想覆盖，就用 'a' 替换 'w'
  
  JSON：如果要在不同编程语言传递对象，就必须序列化为标准格式，比如 JSON。用 `json.dumps(d)` 可以把一个 `dict` 类型的对象 JSON 化，同样，`loads()`可以反序列化。如果想给一个类序列化，可以写一个专门用来序列化的函数，先把类转化为 dict 类型，比如`print(json.dumps(s, default=student2dict))`，得用 default（遇到 JSON 本身不支持的对象，就调用这个函数，把它转换成可处理的形式。），其中 student2dict 是一个转化的函数。偷懒可以写`print(json.dumps(s, default=lambda obj: obj.__dict__))`。dump 和 load 是 JSON 和文件的交互。
  
```python
import json

try:
    with open("faults.json", "r", encoding="utf-8") as f:
        records = json.load(f) # 先从 JSON 文件读取转换成列表

    for record in records:
        record["status"] = "待处理" # 用列表添加

    with open("new_faults.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2) # 写入新文件，用 dump 写入 json 文件，indent 表示缩进、

except FileNotFoundError:
    print("找不到输入文件")
except json.JSONDecodeError:
    print("输入文件不是合法的 JSON")
```
  
  HTTP：浏览器和服务器之间的传输协议。访问一个网址，打开开发者界面，在 Network - Headers - Request Headers 处，可以看到 `GET / HTTP/1.1`，其中 GET 表示一个读取请求，在服务器获得网页数据， / 表示 URL 的路径，URL 总是以 / 开头，/ 就表示首页，最后的 `HTTP/1.1`指采用的协议版本。200 表示成功响应，3xx 表示重定向，4xx 表示客户端发送的请求有错误，5xx 表示服务器处理时发生错误。
  
  HTTP请求：首先浏览器向服务器发送请求，GET 仅请求资源，POST 会附带用户数据 Body；然后服务器向浏览器返回 HTTP 响应，响应包括：响应代码、响应类型、相关 Header；如果浏览器继续请求，就重复前两个步骤。
  
  读取 CSV 时，可以加 `newline=""`自动换行；`csv.DictReader(f)`函数可以把每一行读成字典。；`.strip()`去掉字符串两端空白
  
  
  
  
  
  
  
