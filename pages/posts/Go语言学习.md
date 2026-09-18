---
layout: post
title: Go语言学习
date: 2026-09-14 08:58:14
updated: 2026-09-14
time_warning: true 
cover: 
top: 
tags: 
 - go
categories: 
 - 学习记录
draft: 
# author: @Remsait
---
参考[官方文档](https://go-dev.shuijingwanwq.com/tour/)  

## 基础
### 包
  每个 Go 程序都是由包组成，程序从包 main 开始运行，用 Import ("")导入包，包名与导入路径的最后一个元素相同，比如 "math/rand" 包由以语句 package rand 开头的文件组成
```go
package main
import (
	"fmt"
	"math/rand"
)
func main() {
	fmt.Println("My favorite number is", rand.Intn(10))
}
```
### 导入
  导入也可以写成 
```go
import "fmt"
import "math"
```
### 导出名
  在 Go 中，如果一个名称以大写字母开头，就是导出名，比如 `Println`，也就是说 `.`后面的接导出名必须首字母大写。
### 函数
  类型要写在变量名后面
```go
package main
import "fmt"
func add(x int, y int) int {
	return x + y
}
func main() {
	fmt.Println(add(42, 13))
}
```
  当两个或多个连续的具名函数参数具有相同类型，可以省略除最后一个参数外其他参数的类型，如上可以写成`x, y int`
### 多个返回值
  函数可以返回任意数量的返回值，比如 swap 函数：
```go
func swap(x, y string) (string, string) {
	return y, x
}
```
### 命名返回值
  Go 的返回值可以被命名，如果命名了返回值，它们会被视为定义在函数顶部的变量，当不带参数的 return 语句会返回命名返回值，称为“裸返回”，裸返回应当只在较短函数使用，不然影响可读性。
```go
package main
import "fmt"
func split(sum int) (x, y int) {
	x = sum * 4 / 9
	y = sum - x
	return
}
func main() {
	fmt.Println(split(17))
}
```
  这段代码输出 7 10
### 变量
  `var` 语句声明一组变量，类型写在最后，如：`var c, python, java bool`

  声明后不定义值的话，默认是 0/false/“”（零值）

  用 `var i, j int = 1, 2` 来声明初始值。如果声明初始值，可以省略类型，变量会采用初始值类型
### 短变量声明
  在函数内部，可以使用 `:=` 这种短赋值语句，替代带隐式类型的 var 声明

  在函数外部，每条语句都以关键字开头（var、func 等），因此不能用 `:=` 这种写法
### 基本类型
  Go 语言基本类型包括：
```
bool

string

int  int8  int16  int32  int64
uint uint8 uint16 uint32 uint64 uintptr

byte // 是 uint8 的别名

rune // 是 int32 的别名
     // 表示一个 Unicode 码点

float32 float64

complex64 complex128
```
  输出时，%T 是类型、%V 是值，分别是 type 和 value
### 类型转换
  用 T(v) 将 v 转换为 T 类型

  与 C 不同，在 Go 中，不同类型的值进行幅值时要显式转换。

  比如 `var f float64 = float64(i)`或 `f := float64(i)`
### 类型判断
  声明变量但未显式指定类型时，一般根据右侧的值推断出来。
### 常量
  常量的声明方式与变量类似，使用 const 关键字。

  常量可以是字符、字符串、布尔值或数值

  不能使用 `:=` 语法声明常量。

  如：`const Pi = 3.14`
### For 循环
  go 只有 for 一种循环，用三个分号隔开，不需要小括号，但需要花括号
```go
	for i := 0; i < 10; i++ {
		sum += i
	}
```
  for 也能写成和 while 功能相似的类型：
```go
	sum := 1
	for sum < 1000 {
		sum += sum
	}
```
### if 
  if 和 for 类似，表达式不需要用括号（）包围，但是花括号需要：
```go
	if x < 0 {
		return sqrt(-x) + "i"
	}
```
  if 语句可以先执行一个简短语句，再判断条件，由该语句声明的变量，其作用域只持续到 if 语句结束。
```go
	if v := math.Pow(x, n); v < lim {
		return v
	}
```
  else 用法同其他语言，写法和 if 一样
### Switch
  用法与其他语言类似不同之处在于 末尾的 break 语句会制动完成。Go 的 Switch 分支不必是常量，其中涉及的值也不必是整数。
```go
	switch os := runtime.GOOS; os {
	case "darwin":
		fmt.Println("macOS.")
	case "linux":
		fmt.Println("Linux.")
	default:
		// freebsd, openbsd,
		// plan9, windows...
		fmt.Printf("%s.\n", os)
	}
```
### defer 
  defer 语句会将函数调用推迟到外围函数结束返回时执行。

  被推迟调用的参数会立刻求值，但函数调用直到外围函数返回时才执行。

  被延迟的函数调用会被压入一个栈中，当函数返回时，这些延迟调用会按后进先出的顺序执行。
### 指针
  Go 有指针，指针保存一个值的内存地址。类型 `*T` 是指向 T 类型的指针，它的零值为 `nil`，比如用`var p *int` 来声明

  `&` 运算符会生成一个指向其操作数的指针，`*` 运算符表示指针所指向的底层值。（p = &i 就是指向 i ，*p 就是读取 i

  与 C 不同，Go 没有指针运算
### 结构体
  `struct` 是字段的集合
```go
type Vertex struct {
	X int
	Y int
}
```
  可以使用 `.` 来访问结构体字段，比如 `v := Vertex{1, 2}    v.X = 4`

### 指向结构体的指针
  可以通过结构体指针访问结构体字段，进而通过 * 来修改字段。一般来说应该写成 `(*p).X`，但是 Go 语言可以简写为 `p.X`
### 结构体字面量
  字面量通过列出各字段的值来表示一个新分配的结构体值，使用 Nmae: 语法时，可以只列出部分字段。
### 数组
  类型 [n]T 表示一个由 n 个 T 类型的值组成的数组

  表达式：`var a [10]T` 就是声明一个包含十个整数的数组。数组的长度是类型的一部分，银子不能调整大小。  `primes := [6]int{2, 3, 5, 7, 11, 13}`或用这种方式声明

### 切片
  和 python 一样，切片左闭右开，比如 a[1: 4]

  切片本身不存储数据，属于描述底层数组的一段，改切片同时也会改数组，同时其他切片也会同步修改。

  切片字面量就像神略了长度的数组字面量比如`[3]bool{true, true, true}`这是一个数组字面量，下面的写法会创建与上面数组相同的数组，然后构建一个引用该数组的切片：`[]bool{true, true, true}`

  进行切片时，可以省略下界或上界，从而使用默认值。下界默认为0，上界默认为切片或数组长度。（和 Python 用法差不多）

  切片同时具有 length(长度) 和 capacity(容量) ，长度就是包含元素个数，容量是从切片第一个元素开始计算，底层数组能用的元素个数，分别通过 `len(s)` 和 `cap(s)` 方法来查询。

### Nil 切片
  切片的 零值为 nil ，nil 切片的长度和容量均为0，没有底层数组。
### 使用 make 创造切片
  创建动态大小数组的方式，用 make 函数创造切片。

  make 函数会分配一个元素均为 零值 的数组，并返回一个引用该数组的切片：`a := make([]int, 5)`，这是创建长度为5的切片

  若要指定容量，可以向 make 传入第三个参数：`b := make([]int, 0, 5)`

  就是说再指定容量后，可以用 `b[:2]` 来变大切片的长度。

  切片可以包含任何类型，包括其他切片
```go
	board := [][]string{
		[]string{"_", "_", "_"},
		[]string{"_", "_", "_"},
		[]string{"_", "_", "_"},
	}
```
### 向切片追加元素
  Go 内置了 append 函数，用法：`s = append(s, 1, 2, 3)`，就是给切片从后添加元素。如果超过了容量，就会返回一个新分配的更大的数组。
### Range
  range 是 for 循环的一种形式，用于遍历切片或映射。遍历切片时，每次迭代都会返回两个值，一个是索引，一个是索引处元素的副本。
```go
	for i, v := range pow {
		fmt.Printf("2**%d = %d\n", i, v)
	}
```
  可以通过赋值给 `_` 来跳过索引或值，如果只需要索引，可以省略第二个变量。（就是遍历时候不管 _ 替代的变量

### 映射
  映射将键映射到值，映射的零值为 nil，一个 nil 映射没有任何键，也不能添加键。比如`var m map[string]Vertex`只是声明变量，此时还是零值

  make 函数会返回指定类型的映射，该映射已经初始化，可以直接使用。比如必须得`m = make(map[string]Vertex)`。也可以在 main 函数中直接声明`m := make(map[string]Vertex)`

  映射字面量与结构体字面量类似，但必须指定键。
```go
type Vertex struct {
	Lat, Long float64
}
var m = map[string]Vertex{
	"Bell Labs": Vertex{40.68433, -74.39967},
	"Google": Vertex{37.42202, -122.08408},
}
```
  如果顶层类型只是个类型名，那么在字面量的各个元素中可以省略该类型，比如：`"Bell Labs": {40, -74}`
### 修改映射
  在映射 m 中插入或更新元素： m[key] = elem

  获取元素： elem = m[key]

  删除元素：delete(m, key)

  使用双赋值来测试某个键是否存在：`elem, ok = m[key]`，如果 key 存在于 m 中，则 ok 为 true，反之为 false。如果 key 不在映射中，那么 elem 将是该映射元素类型的零值。
### 函数值
  函数也是值，可以像其他值一样被传递，函数值可以用作函数参数和返回值。

### 函数闭包
  Go 函数可以是闭包，闭包是一个引用其函数体之外变量的函数值。函数可以访问这些被引用的变量，也可以为它们赋值，从这个意义上来说，函数与这些变量是“绑定”的。

```go
package main
import "fmt"
// fibonacci 返回一个闭包函数，每次调用返回下一个斐波那契数
func fibonacci() func() int {
	a, b := 0, 1
	return func() int { // 匿名就是闭包，每次调用但变量已经载入内存
		res := a
		a, b = b, a+b
		return res
	}
}
func main() {
	f := fibonacci()
	for i := 0; i < 10; i++ {
		fmt.Println(f())
	}
}
```
### 方法
  Go 没有类，不过可以为类型定义方法

  方法就是一个带有特殊 接收者 参数的函数

  接收者位于自己参数列表中，这个参数列表出现在 func 关键字与方法名之间

  方法其实就是一个带有接收者参数的函数

  就是说定义函数的时候，`func Abs(v Vertex) float64{}`和 `func (v Vrtex) Abs() float64{}`是一样的

  也可以为非结构体类型声明方法，在这个例子中，我们定义了数值类型 MyFloat，并为它声明了 Abs 方法。方法的接收者类型必须定义在与该方法相同的包中，不能为定义在另一个包中的类型声明方法。
```go
package main
import (
	"fmt"
	"math"
)
type MyFloat float64 // 定义数值类型
func (f MyFloat) Abs() float64 { 
	if f < 0 {
		return float64(-f)
	}
	return float64(f)
}
func main() {
	f := MyFloat(-math.Sqrt2)
	fmt.Println(f.Abs())
}
```
### 指针接收者
  可以声明指针接收者的方法，这意味着指针接收者类型使用字面语法 `*T`，其中 T 是某个类型。（另外，T 本身不能是像 `*int` 这样的指针），例如，以下的 Scale 方法定义在 *Vertex 上
```go
package main
import (
	"fmt"
	"math"
)
type Vertex struct {
	X, Y float64
}
func (v Vertex) Abs() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y)
}
func (v *Vertex) Scale(f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}
func main() {
	v := Vertex{3, 4}
	v.Scale(10)
	fmt.Println(v.Abs())
}
```
  也就是说可以改变值。

### 指针与函数
  带有指针参数的函数必须接收一个指针，而使用指针接收者的方法在调用时，接收者既可以是值，也可以是指针。
```go
package main
import "fmt"
type Vertex struct {
	X, Y float64
}
func (v *Vertex) Scale(f float64) { // 结构体的指针接收者方法
	v.X = v.X * f
	v.Y = v.Y * f
}
func ScaleFunc(v *Vertex, f float64) {
	v.X = v.X * f
	v.Y = v.Y * f
}
func main() {
	v := Vertex{3, 4}
	(&v).Scale(2)  // 也可以是 v.Svale(2)
	ScaleFunc(&v, 10)

	p := &Vertex{4, 3}
	p.Scale(3)
	ScaleFunc(p, 8)

	fmt.Println(v, p)
}
```
  反过来也是一样，在使用值接收者的方法调用时，接收者既可以是值，也可以是指针：`p.Abs() 会被解释为 (*p).Abs()`
### 选择值接收者还是指针接收者
  使用指针接收者有两个原因：

  第一，方法可以修改其接收者所指向的值

  第二，可以避免每次调用方法时都复制该值。

  一般来说，一个给定类型的所有方法应该统一使用值接收者或指针接收者，而不应混合使用两者。

### 接口
  接口类型被定义为一组方法签名，接口类型的值可以保存任何实现了这些方法的值。接口只定义方法签名（方法名、参数、返回值），不写实现

  方法绑定在接收者的类型上：接收者带`*`，方法属于指针类型；不带`*`属于值类型。

  接口是隐式实现的，类型通过实现接口的方法来实现该接口，不需要显式声明实现意图，也没有 "implements" 关键字

  接口的隐式实现将接口的定义与其实现解耦，因此实现可以出现在任何包中，而无需预先约定。
```go
package main
import "fmt"
type I interface {
	M()
}
type T struct {
	S string
}
// 此方法意味着类型 T 实现了接口 I，
// 但我们无需显式声明这一点。
func (t T) M() {
	fmt.Println(t.S)
}
func main() {
	var i I = T{"hello"}
	i.M()
}
```
  在内部，接口值可以看作由一个值和一个具体类型组成的元组：`(value, type)`，接口值保存了一个具有特定底层具体类型的值，在接口值上调用方法时，会执行其底层类型上同名的方法。

  如果接口内部的具体值本身为 nil ，调用方法时会使用 nil 接收者。在某些语言中，这会触发空指针异常，但在 Go 中，经常会编写能够妥善处理 nil 接收者调用的方法，比如：
```go
func (t *T) M() {
	if t == nil {
		fmt.Println("<nil>")
		return
	}
	fmt.Println(t.S)
}
```
  nil 接口值既不保存值，也不保存具体类型，在 nil 接口上调用方法会产生运行时错误，因为接口元组中没有类型可用于确定应调用哪个具体方法。

  指定零个方法的接口类型称为空接口，如`interface{}`，空接口可保存任意类型的值，每种类型都至少实现零个方法。 `any` 是 `interface{}` 的别名，两者完全等价。处理未知类型值的代码会使用空接口，例如，fmt.Print 接受任意数量的 any 类型实参。

### 类型断言
  用于访问接口值所保存的底层具体值。`t := i.(T)`，该语句断言接口值 i 保存了具体类型 T，并将底层的 T 值赋给变量 t。如果 i 并未保存 T ，该语句会触发 panic。要测试接口值是否保存了某个特定类型，类型断言可以返回两个值：底层值以及一个表示断言是否成功的布尔值`t, ok := i.(T)`，和映射读取值很相似
```go
package main
import "fmt"
func main() {
	var i interface{} = "hello"
	s := i.(string)
	fmt.Println(s) // hello
	
	s, ok := i.(string)
	fmt.Println(s, ok) // hello true

	f, ok := i.(float64)
	fmt.Println(f, ok) // 0 false

	f = i.(float64) // panic
	fmt.Println(f)
}
```
### 类型选择
  类型选择是一种允许进行多个类型断言的接口，与普通 switch 语句类似，但类型选择中的 case 指定的类型而不是值，这些类型会与给定接口值中所保存值的类型进行比较。
```go
package main
import "fmt"
func do(i interface{}) {
	switch v := i.(type) {
	case int:
		fmt.Printf("Twice %v is %v\n", v, v*2)
	case string:
		fmt.Printf("%q is %v bytes long\n", v, len(v))
	default:
		fmt.Printf("I don't know about type %T!\n", v)
	}
}
func main() {
	do(21)
	do("hello")
	do(true)
}
```
### Stringer
  最常见的接口之一，是由 fmt 包定义的 Stringer 接口。Stringer 是一种能用字符串描述自身的类型。fmt 包在打印值时，会检查待打印的值是否实现了这个接口。
```go
package main
import "fmt"
type Person struct {
	Name string
	Age  int
}
func (p Person) String() string { // 重写接口方法
	return fmt.Sprintf("%v (%v years)", p.Name, p.Age)
}
func main() {
	a := Person{"Arthur Dent", 42}
	z := Person{"Zaphod Beeblebrox", 9001}
	fmt.Println(a, z)
}
```
### 错误
  Go 程序使用 error 值表示错误状态

  error 类型是一个内置接口，类似于 fmt.Stringer：
```go
type error interface {
    Error() string
}
```
  函数通常会返回一个 error 值，调用方应通过判断该错误是否为 nil 来处理错误。error 为 nil 表示成功，非 nil 的 error 表示失败。
```go
package main
import (
	"fmt"
	"time"
)
type MyError struct {
	When time.Time
	What string
}
func (e *MyError) Error() string {
	return fmt.Sprintf("at %v, %s",
		e.When, e.What)
}
func run() error {  // 业务代码
	return &MyError{
		time.Now(),
		"it didn't work",
	}
}
func main() {
	if err := run(); err != nil {  // 判断是否出错
		fmt.Println(err)
	}
}
```
### Reader 
  io 包定义了 io.Reader 接口，它表示数据流的读取端。

  Go 标准库包含该接口的许多实现，包括文件、网络连接、压缩器、加密器等。io.Reader 接口有一个 Read 方法：`func (T) Read(b []byte) (n int, err error)`

  Read 会用数据填充给定的字节切片，并返回填充的字节数和错误值，当数据流结束时，它会返回 io.EOF 错误。示例代码创建了一个 string.Reader ，并以每次 8 个字节的方式读取其中数据。
```go
package main
import (
	"fmt"
	"io"
	"strings"
)
func main() {
	r := strings.NewReader("Hello, Reader!")
	b := make([]byte, 8)
	for {
		n, err := r.Read(b)
		fmt.Printf("n = %v err = %v b = %v\n", n, err, b)
		fmt.Printf("b[:n] = %q\n", b[:n])
		if err == io.EOF {
			break
		}
	}
}
```
  实现一个 Reader 类型，使其生成由 ASCII 字符 ‘A’组成的无限数据流：
```go
package main
import "golang.org/x/tour/reader"
type MyReader struct{}
func (r MyReader) Read(p []byte) (int, error){ // p 是自带的缓冲区
	for i := range p{
		p[i] = 'A'
	}
	return len(p), nil
}
func main() {
	reader.Validate(MyReader{})
}
```
### 图像
  image 包定义了 Image 接口
```go
package image
type Image interface {
    ColorModel() color.Model
    Bounds() Rectangle // 实际类型是 image.Rectangle
    At(x, y int) color.Color
}
```
### 类型参数
  Go 函数可以使用类型参数来编写，从而适用于多种类型，函数的类型参数位于方括号中，并出现在函数的参数之前。`func Index[T comparable](s []T, x T) int`，这个声明表示 s 是一个由任意类型 T 构成的切片，而该类型满足内置约束 comparable。x 也是同一类型的值。

  comparable 是一个很有用的约束，它允许对该类型的值使用 == 和 != 运算符。
```go
package main
import "fmt"
// Index 返回 x 在 s 中的索引；如果未找到，则返回 -1。
func Index[T comparable](s []T, x T) int {
	for i, v := range s {
		// v 和 x 的类型都是 T，T 具有 comparable
		// 约束，因此这里可以使用 ==。
		if v == x {
			return i
		}
	}
	return -1
}
func main() {
	// Index 可用于 int 类型的切片
	si := []int{10, 20, 15, -10}
	fmt.Println(Index(si, 15))
	// Index 也可用于 string 类型的切片
	ss := []string{"foo", "bar", "baz"}
	fmt.Println(Index(ss, "hello"))
}
```
### 泛型类型
  除了泛型函数外， Go 还支持泛型类型。类型可以使用类型参数进行参数化，这对于实现泛型数据结构很有用。一下展示一个可以保存任意类型的值的单链表类型声明
```go
package main

// List 表示一个单向链表，其中保存
// 任意类型的值。
type List[T any] struct {
	next *List[T]
	val  T
}
func main() {
}
```
### Goroutines 协程
  一个 goroutine 是由 Go 运行时管理的轻量级线程。`go f(x, y, z)`会启动一个新的 goroutine 来运行 f(x, y, z) 。f、x、y、z 的求值发生在当前 goroutine 中，而 f 的执行发生在新的 goroutine 中。

  goroutine 运行在同一个地址空间中，因此对共享内存的访问必须进行同步。sync 包提供了实用的同步原语，不过在 Go 中你并不会经常用到它们，因为还有其他原语可用。

  main 返回后，程序就会退出，不会自动等其他 goroutine ，可以用 WaitGroup 等待

  和线程相比，开销更小，切换成本低（用户态），数量级几十万甚至几百万。
### 通道
  在 goroutine 之间传递数据、通知

  通道是一种带类型的通路，你可以通过它使用通道操作符 `<-` 发送和接受值。
```go
ch <- v    // 将 v 发送到通道 ch。
v := <-ch  // 从 ch 接收，并
           // 将值赋给 v。
```
  和映射还有切片一样，使用前必须创建：`ch := make(chan int)`

  默认情况下，发送和接收操作会一直阻塞，直到另一端准备就绪。这使得 goroutines 无需显式使用锁或条件变量即可完成同步。

  示例代码对一个切片中的数字求和，分配给两个goroutines 
```go
package main

import "fmt"

func sum(s []int, c chan int) {
	sum := 0
	for _, v := range s {
		sum += v
	}
	c <- sum // 将 sum 发送到 c
}

func main() {
	s := []int{7, 2, 8, -9, 4, 0}

	c := make(chan int)
	go sum(s[:len(s)/2], c)
	go sum(s[len(s)/2:], c)
	x, y := <-c, <-c // 多个线程结果由一个通道接收，按顺序接收

	fmt.Println(x, y, x+y)
}
```
### 缓冲通道
  通道可以是带缓冲的，将缓冲区长度作为 make 的第二个参数，即可初始化一个带缓冲的通道：`ch := make(chan int, 100)`

  向带缓冲通道发送数据时，只有缓冲区已满才会阻塞，接收操作会在缓冲区为空时阻塞。

### range 和 close
  发送者可以 close 一个通道，以表示不会再发送任何值，接收者可以通过接收表达式的第二个返回值来检测通道是否关闭：执行`v, ok := <- ch`后，如果已经没有值可以接收且通道关闭，ok 就会是 flase。

  循环 for i := range c 会不断从通道接收值，直到通道关闭。 

  只有发送者应该关闭通道，接收者不应关闭，向已经关闭的通道发送值会引发 panic

  通道与文件不同，通道不需要关闭。只有在必须告知接收者不会再由值到来时才需要关闭通道，例如为了终止 range 循环。
### select 
  select 语句使一个 gorouine 可以等待多个通信操作

  select 会阻塞，直到其中某个分支可以执行，然后执行该分支。如果有多个分支同时就绪，它会随机选择一个。

  default case 在 select 中，会在其他 case 都没有就绪时执行，使用 default case ，可以尝试进行不会阻塞的发送或接收：
```go
select {
case i := <-c:
    // 使用 i
default:
    // 从 c 接收会阻塞
}
```
### sync.Mutex 互斥锁
  保护共享数据，让某段操作一次只允许一个任务执行

  我们已经看到，通道非常适合用于 goroutines 之间的通信，如果我们不需要通信呢？ 如果我们只是想确保每次只有一个 goroutine 能访问某个变量，从而避免冲突呢？

  这个概念称为互斥，而提供这种机制的数据结构称为 互斥锁。

  Go 的标准库通过 sync.Mutex 及其两个方法提供互斥机制：Lock 与 Unlock

  通过在代码块前后分别调用 Lock 和 Unlock ，就可以让它们互斥执行，我们还可以用 defer 来确保互斥锁最终会被解锁。
### GMP：Go 怎么把这些任务安排到线程上运行
  goroutine 由 Go 自带的 GPM 模型调度，可以当成一个高效的任务分配系统。

  G（Goroutine）：一个并发任务，包含要执行的函数和上下文

  M（Machine 操作系统线程）：真正干活的“工人”，负责执行 G

  P（Processor 执行 Go 代码需要的调度资源）：逻辑处理器，给 M 提供运行环境并维护一个本地任务队列，默认数量等于 CPU 核心数，数量由 GOMAXPROCS 控制。

  M 需要有 P 才能执行 G

  任务可以很多，Go 调度器负责把他们安排给线程执行，遇到网络等待等情况，我们让其他就绪任务继续执行，提高资源利用率。

  （GMP 是 Go 的调度模型。G 是 goroutine，M 是操作系统线程，P 是执行 Go 代码所需的调度资源。Go 调度器把大量 goroutine 分配到线程上执行。）
### GIN：把请求交给对应函数的 Web 框架
  举例代码：
```go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    r.GET("/hello", func(c *gin.Context) {
        c.JSON(200, gin.H{"message": "你好"})
    })

    r.Run(":8080")
} 
```
### 连接 PostgreSQL 数据库
  Go 程序连接数据库，需要知道：地址、端口、数据库名、用户名、密码。

  常用数据类型：INTEGER 整数、BIGINT 大整数、TEXT 文本、时间类型

  PostgreSQL 在自增列上和 mysql 有区别：前者是 `GENERATED BY DEFAULT AS IDENTITY`，后者是`AUTO_INCREMENT`

  配置好 PostgreSQL 后，用 `psql -h 127.0.0.1 -p 5432 -U counter_app -d counter_lab` 登录 counter_app 用户且进入 counter_lab 数据库。

  psql 提供的快捷操作：
```shell
\dt 列出当前可见的普通表 
\d counters 查看表结构，包括字段、类型、约束
\l 列出数据库
\c 数据库名 切换数据库连接
\du 查看用户/角色
\conninfo =查看当前连接信息
\? 查看 psql 命令帮助
\q 退出
```

  

  

  

  

  

  

  

  

  