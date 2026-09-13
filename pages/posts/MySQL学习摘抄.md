---
layout: post
title: MySQL学习摘抄
date: 2026-09-13 12:40:47
updated: 2026-09-13
time_warning: true 
cover: 
top: 
tags: 
 - MySQL
categories: 
 - 其他
draft: 
# author: @Remsait
---
  同样是[廖雪峰的官方网站](https://liaoxuefeng.com/books/sql/rdbms/install-mysql/index.html) ，重新大体学一下数据库知识
  
  登录用 `mysql -u root -p`。
  
###  主键
  每条记录不能重复，最重要的字段。选取逐渐的基本原则：不使用任何业务相关的字段作为主键。最好是 ID
  
### 外键
  在一个表中，通过添加一个字段（另一张表的主键），把数据和另一张表关联起来，这就叫外键。
```MySQL
ALTER TABLE students
ADD CONSTRAINT fk_class_id # 约束名
FOREIGN KEY (class_id) # 外键名
REFERENCES classes (id); # 指定外键关联到 classes 表的 id 列
```
  删除外键约束：
```mysql
ALTER TABLE students
DROP FOREIGN KEY fk_class_id;
```
  通过一个中间表，可以定义多对多的关系 。一对一的表查询速度更快。
  
### 索引
  使用索引可以加快查询速度
```mysql
ALTER TABLE students
ADD INDEX idx_score (score);
```
  创建名称为 idx_score ，使用列为 score 的索引。
  
  索引如果有多列，可以在括号里依次写上。索引的效率取决于索引列的值是否分散，值越不同，索引效率越高。
  
  索引缺点是在插入、更新、删除时，需要同时修改索引。
  
  唯一索引：看上去唯一的列，但是具有业务含义不能作为主键，就可以设置唯一索引 
```mysql
ALTER TABLE students
ADD UNIQUE INDEX uni_name (name);
```
### 基本查询
  用 `SELECT * FROM <表名>`查询一个表所有信息。
  
### 条件查询
  用 where 设定查询条件，比如：`SELECT * FROM students WHERE score >= 80`。可以在查询时用 AND 或 OR 或 NOT 或 括号改变优先级 来增加条件。`<>`表示不相等、LIKE 可以通过正则匹配
### 投影查询
  查询时，如果我们只希望返回一个表中的部分列，这种情况叫投影查询。比如：`SELECT id, score, name FROM students;`
  
  还可以给每个列起一个别名，这样就可以与原表的列名不同，比如：`SELECT id, score points, name FROM student`，这样就把 score 重命名为 points
  
### 排序
  一般查询结果按照主键顺序排序，如果要根据其他条件排序，加上 `ORDER BY` 子句，`SELECT id, name, score FROM students ORDER BY score;`默认是从低到高，如果想从高到低，就得加上 `DESC` 表示倒序，`SELECT id, name, score FROM students ORDER BY score DESC;`
  
  如果 score 列有相同数据，要进一步排序，可以继续添加列名，例如先按 score 倒序，如果相同分数按 gender 排序：`SELECT id, name, gender, score FROM students ORDER BY score DESC, gender;`
  
  默认的排序规则是升序，即`ASC`，可以省略。如果有 where 子句，ORDER BY 子句要放到 where 后面
  
### 分页查询
  如果查询出来的数据过多，一个页面放不下，就需要分页展示，需要两个参数，一个是设定每页多少个数据，一个是从第几条数据开始展示：
```mysql
-- 查询第3页:
SELECT id, name, gender, score
FROM students
ORDER BY score DESC
LIMIT 3 OFFSET 6;
```
  LIMIT 指展示多少数据，OFFSET 指从第几条数据开始展示。前者是 pageSize，后者是 pageIndex，OFFSET计算公式为 ： pageSize * (pageIndex - 1)

### 聚合查询
  对于统计总数、平均数这类计算，SQL 提供了专门的聚合函数，使用聚合函数进行查询，就是聚合查询，它可以快速获得结果。
  
  例如：`SELECT COUNT(*) num FROM students;`就是查有多少学生，可以在 count(*) 后面加一个字符串设置一个别名。
  
  聚合函数如下：SUM 、AVG、MAX、MIN
  
  分组：用 `GROUP BY ...`来按什么分组，通常用于聚合查询，比如：`SELECT class_id, COUNT(*) num FROM students GROUP BY class_id;`
### 多表查询
  select 查询不但可以从一张表查询数据，还可以从多张表同时查询数据。查询多张表的语法是：`select * from <表1> <表2>`
  
  例如同时查询两个表，获得两个表的”乘积“，又叫笛卡尔查询
  
  多表查询可以添加别名，也可以用 where ：
```mysql
SELECT
    s.id sid,
    s.name,
    s.gender,
    s.score,
    c.id cid,
    c.name cname
FROM students s, classes c
WHERE s.gender = 'M' AND c.id = 1;
```
### 连接查询
  连接查询是另一类的多表查询，连接查询对多个表进行 JOIN 运算，简单地说，就是先确定一个主表为结果集，然后把其他表的行有选择性地”连接“在主表结果集上。
  
  最常见的一种内连接：INNER JOIN 可以来实现：
```mysql
-- 选出所有学生，同时返回班级名称:
SELECT s.id, s.name, s.class_id, c.name class_name, s.gender, s.score
FROM students s
INNER JOIN classes c
ON s.class_id = c.id;
```
  外连接是 `RIGHT/LEFT OUTER JOIN`和内连接的区别为：内连接只返回同时存在两张表的行数据，外连接全都会返回，空的填 NULL。外连接中，RIGHT 填右表都存在的行，LEFT 填左表都存在的行，FULL 就是全部。
### 插入数据
  用 `INSERT`语句插入。`INSERT INTO <表名> (字段1, 字段2, ...) VALUES (值1, 值2, ...);`，主键可以不列出，因为是自增的。
  
  还可以一次性添加多条记录：
```mysql
-- 一次性添加多条新记录:
INSERT INTO students (class_id, name, gender, score) VALUES
  (1, '大宝', 'M', 87),
  (2, '二宝', 'M', 81),
  (3, '三宝', 'M', 83);
```
### 更新数据
  用 UPDATE 语句更新，语法是：`UPDATE <表名> SET 字段1=值1, 字段2=值2, ... WHERE ...;`
  
  也可以 WHERE 后接多个条件：`UPDATE students SET name='小牛', score=77 WHERE id>=5 AND id<=7`
  
  更新字段时还可以用表达式，比如把乘积加十分：score=score+10
  
### 删除数据
  用 DELETE 语句来删除数据。基本语法：`DELETE FROM <表名> WHERE ...;`，例如删除id = 1 的记录：`DELETE FROM students WHERE `
  
### 管理 MySQL
  用 `SHOW DATABASES` 来列出所有的数据库，其中有四个系统库，不要去改动。
  
  新建库：`CREATE DATABASE test;`
  
  删除库：`DROP DATABASE test;`
  
  对数据库操作时，首先切换数据库：`USE test`
  
  列出当前数据库所有表：`SHOW TABLES;`
  
  查看一个表结构：`DESC test`
  
  查看创建表的 SQL 语句：`SHOW CREATE TABLE students;`
  
  新增列：`ALTER TABLE students ADD COLUMN birth VARCHAR(10) NOT NULL;`
  
  修改列：`ALTER TABLE students CHANGE COLUMN birth birthday VARCHAR(20) NOT NULL;
  
  删除列：`ALTER TABLE students DROP COLUMN birthday;`
  
### 实用 SQL 语句
#### 插入或替换
  如果我们希望插入新纪录，但记录已存在，就得先删除再插入。此时可以用 REPLACE 语句，这样就不用先查询再决定是否先删除再插入：
```mysql
REPLACE INTO students (id, class_id, name, gender, score) VALUES (1, 1, '小明', 'F', 99);
```
  若 id=1 的记录不存在，就会直接插入，否则会替换。
  
#### 插入或更新
  如果希望插入一条新记录，但是记录已存在的话就更新记录，此时可以：
```mysql
INSERT INTO students (id, class_id, name, gender, score) VALUES (1, 1, '小明', 'F', 99) ON DUPLICATE KEY UPDATE name='小明', gender='F', score=99;
```
  若记录存在，更新的字段由 UPDATE 指定。
  
#### 插入或忽略
  如果我们希望插入一条新纪录（INSERT），但记录已存在，就啥都不敢直接忽略，如下：
```mysql
INSERT IGNORE INTO students (id, class_id, name, gender, score) VALUES (1, 1, '小明', 'F', 99);
```

#### 快照
  如果想要对一个表进行快照，即复制一份当前表的数据到一个新表，如下：
```mysql
-- 对class_id=1的记录进行快照，并存储为新表students_of_class1:
CREATE TABLE students_of_class1 SELECT * FROM students WHERE class_id=1; 
```

#### 写入查询结果集
  如果查询结果集需要写进表中，可以结合 INSERT 和 SELECT ，将 SELECT 语句的结果直接插入到指定表中。
  
  日过，创建一个统计成绩的表，记录各班平均成绩
```mysql
CREATE TABLE statistics (
    id BIGINT NOT NULL AUTO_INCREMENT,
    class_id BIGINT NOT NULL,
    average DOUBLE NOT NULL,
    PRIMARY KEY (id)
);
```
  然后，我们就可以用一条语句写入各班的平均成绩：
```mysql
INSERT INTO statistics (class_id, average) SELECT class_id, AVG(score) FROM students GROUP BY class_id;
```
### 事务
  在实际应用中，可能存在一系列操作必须执行，而不能只有一部分操作成功，若一部分成功就得撤销。这种看成整体的功能叫 事务。
  
  可见事务具有 ACID 四个特性：
  
  * A：Atomicity 原子性，将所有 SQL 作为原子工作单元执行，要么全执行要么全不执行。
  * C：Consistency 一致性，事务完成后，所有数据的状态一致
  * I：Isolation 隔离性，如果有多个事务并发执行，每个事务做出的修改必须与其他事务隔离
  * D：Durability 持久性，即事务完成后，对数据库数据的修改被持久化存储

  要手动用事务，需要用 BEGIN 开始，用 COMMIT 结束，如下：
```mysql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```
  如果我们想让事务主动失败，就用 ROLLBACK 代替 COMMIT 来直接回滚事务。
### 隔离级别：
#### Read Uncommitted
  隔离级别最低：一个事务会读取到另一个事务更新后但未提交的数据，如果另一个事务回滚，那么当前事务读的就是脏数据，这就是脏读（Dirty Read）
#### ReadCommitted
  一个事务不会读到另一个事务还没提交的数据，但可能会遇到不可重复读（Non Repeatable Read）的问题
  
  不可重复读指：在一个事务内，多次读同一个数据，在这个事务还没结束时，另一个事务恰好修改了数据，那么在第一个事务中两次读取的数据可能不一致。
#### Repeatable Read
  一个事务可能遇到 幻读（Phantom Read）的问题，
  
  幻读是指在一个事务中，第一次查询某条记录，发现没有，但是当试图更新这条不存在的记录时，竟然能成功。
#### Serializable
  最严格，所有事务按照次序依次执行，上述问题都不会出现。但是这样串行执行，效率会大大降低。
  
  默认隔离级别是 Repeatable Read。
















