---
layout: post
title: AI Agent学习（下）
date: 2026-09-04 16:54:03
updated: 2026-10-28
time_warning: true 
cover: 
top: 
tags: 
 - AI
categories: 
 - 学习记录
draft: 
# author: @Remsait
---
## langgraph_basics
  前言：在前几篇中，我们用 AgentExecutor 构建了能调工具、查知识、记历史的全能 Agent。但它是个封装严密的黑盒：看不到它中间调用了几次工具；无法在“删除文件”前插入人工缺人；难以加入“总结”“重试”等自定义逻辑

  本篇将会针对这个黑盒，用 Langgraph 从零构建一个透明、可控的白盒 Agent

  AgentExecutor 所做的事，正是 Langgraph 要让我们亲手实现的事，它不是 Langgraph，但 Langgraph 比它做的更好、更灵活。

### Langgraph 的三要素：如何从零拼出一个流程
#### 为什么需要 Langgraph
  我们之前用 Langchain 构建了各种智能体，但是有没有发现，整个执行流程完全不可控？

  按理说，一个真正的 Agent 应该涉及工作流编排、状态管理、条件跳转、错误重试等复杂逻辑。实际上，这些都被一行代码悄悄包办了：`agent_executor = AgentExecutor(agent=agent,tools=tools)`

  AgentExecutor 内部封装了一个完整的 ReAct 循环（思考-行动-观察），但它是个黑盒：无法看到中间调用几次工具；无法在危险操作前插入人工缺人；不能自定义“总结”重试“”超时中断“等行为。

  虽然它实现了类似 Langgraph 的事情，但是不可见、不可改、不可扩展。因子我们要丢掉这个黑盒
#### Langgraph 的三要素
  如果你用过 dify、coze 这种低代码 Agent 构建平台，一定熟悉它们的”可视化流程图“，拖拽大模型、工具节点、用连线定义条件跳转。Langgraph 就是这个流程图的代码实现，用代码搭建一个可控的流程图。

  综上，我们可以总结出三个 Langgraph 的核心元素：

| 组件 | 作用 | 类比 |
| --- | --- | --- |
| State | 存储整个流程的共享数据，例如对话历史和中间结果 | 一张所有人都能读写的白板 |
| Node | 执行具体任务的函数，例如调用 LLM、查询工具 | 一个工人，干完活把结果写回白板 |
| Edge | 定义执行顺序的规则，包括固定顺序或条件跳转 | 工头喊：“A 干完，B 上！”或“如果成功，去 C；否则去 D” |

  同样，根据这三要素，可以总结出拼装的四步法：  
  （1）定义 State 结构：决定白板上有哪些字段；  
  （2）编写 Node 函数：每个函数接收当前 State，返回要更新的部分；  
  （3）添加 Node 到图中：拖拽节点到白板中；  
  （4）用 Edge 链接Node：为各个节点画运行先后顺序的线。

  用一段代码展示：
```python
from typing import TypedDict
from langgraph.graph import StateGraph,END
 
# 1. 定义State(状态) -- 白板上只有一个字段"count"
class State(TypedDict):
    count:int
 
# 2. 编写Node(节点) -- 两个"工人"
def node_a(state:State):
    # 接收当前State状态，返回要更新的部分
    print(f'[Node A]收到状态：{state}')
    return {"count":state["count"]+1}
 
def node_b(state:State):
    print(f'[Node B]收到状态：{state}')
    return {"count":state["count"]+1}
 
# 3. 添加Node到图中
workflow = StateGraph(State) # 创建画布
workflow.add_node("A",node_a) # 添加节点A
workflow.add_node("B",node_b) # 添加节点B
 
# 4. 用Edge连线
workflow.add_edge(START,"A") # START -> A
workflow.add_edge("A","B") # A -> B
workflow.add_edge("B",END) # B -> END
 
# 编译成可运行应用
app = workflow.compile()
 
# 传入初始状态，执行工作流
print("---开始执行---")
result = app.invoke({"count":1})
print("最终状态:",result) # 输出{'count':4}
```
  绝大多数 Agent 的 Langgraph 实现，本质上就是围绕 State、Node、Edge 这三大要素进行设计。
#### 可视化支持
  LangGraph 提供内置的流程图生成功能：
```python
# 保存可视化架构图
with open('01_workflow.png', 'wb') as f:
    f.write(app.get_graph().draw_mermaid_png())
print("图表已保存为 01_workflow.png")
```
  能在设计阶段直观查看流程结构，但是它只是静态架构图，无法展示运行时状态或调试信息。

  若需深度观测执行过程（如每一步输入/输出、耗时、错误），就需要引入 LangSmith——LangGraph 的官方调试与监控平台。

## LangSmith —— 你的 Agent “飞行记录仪”与性能仪表盘
  LangSmith 不是可选项，而是 Langchain/Langgraph 开发的标准工作流
### 什么是 Langsmith
  Langsmith 不只是一个流程图查看器，而是专为 LLM 应用打造的全链路开发、调试与监控平台，对于像 Langgraph 这样状态复杂、多步骤交互的系统，没有 Langsmith，就像闭着眼睛开飞机，知道飞了但是不知道怎么飞和为何坠毁。

  在 Langsmith 的 Web 控制台中，可以：  

  * 查看每次运行的完整执行轨迹（Trace）：从用户输入到最终输出，每一步都清晰可见；
  * 监控性能指标：LLM 延迟、Token 消耗、成本估算一目了然
  * 精准定位问题：工具未触发？陷入无限循环？异常堆栈直接标红；
  * 对比不同版本：A/B 测试两个 Prompt 或工具策略的效果差异；
  * 回放历史对话：完整还原任意一次交互的上下文与中间状态

  对 Langgraph 开发者而言，Langsmith 就如同 Chrome DevTools 之于前端工程师——不是可有可无，而是标准开发栈的必备组件。
#### 如何快速接入 LangSmith
  首先到官网注册，[LangSmith](https://smith.langchain.com/)，然后点击 `You've set up Tracing`开始 LangSmith 追踪。创建 API Key，再配置好环境变量，就可以用 LangSmith 追踪我们用 langgraph 写的代码了。
```python
# ...其他所有代码保持不变
os.environ["LANGCHAIN_TRACING_V2"] = "true" # 总开关，决定启用追踪功能
os.environ["LANGCHAIN_PROJECT"] = "my_demo" # 指定项目名，运行自动上传
os.environ["LANGCHAIN_API_KEY"] = langchain_api_key # 从.env读取
```
  运行代码后， LangSmith 网站就会自动追踪。LangSmith 会自动捕获每一次 app.invoke() 的完整执行过程，并在控制台生成一条 Trace 记录。点开任何一条记录，即可看到：

| 功能 | 说明 |
| --- | --- |
| Trace 列表 | 每次 `app.invoke()` 生成一条记录，按时间排序。 |
| 执行 DAG 图 | 自动绘制本次运行的实际路径，例如 `agent -> tools -> agent`。 |
| 节点详情 | 点击任一节点，可查看输入、输出和耗时，例如 LLM 的 Prompt、`tool_calls` 内容。 |
| Token 统计 | 显示输入/输出 Token 数量及估算费用。 |
| 状态快照 | 展示每一步的完整 `messages` 内容，包括 `tool_call_id`、`role` 等元数据。 |
| 错误高亮 | 如果工具抛出异常，会标红并显示 traceback。 |

  这才是真正的白盒化，不仅能看到每个数据，还能听到每次“心跳”

### 最小 ReAct 引擎：用 Langgraph 替换 AgentExecutor
  Langgraph 不是另起炉灶，而是 Langchain 的“白盒化升级”
#### Langchain 到 Langgraph 的演进
  回顾我们在 Langchain 时的六大核心模块：LLM / Prompt / Chain / Memory / Agent / RAG 

  传统方式下，你只要声明：“你要做什么”，系统就在黑盒中完成执行，尤其是 AgentExecutor，它封装了完整的推理与行动逻辑

  而 Langgraph 并非抛弃 Langchain，而是对其”声明式“体系的一种过程式补全：它深度复用 Langchain 的所有组件，唯独将 AgentExecutor 这个黑盒打开，让你能显示定义控制流，实现真正的白盒化 Agent。

  各模块在 Langgraph 中的演进对比：

| 模块 | LangChain 原始写法 | LangGraph 中的变化 | 封装程度 |
| --- | --- | --- | --- |
| LLM | `ChatOpenAI(...)` | 完全不变 | 无需改动 |
| Prompt | 手动拼接 `system + history + input` | 不再需要手动维护，使用 `MessagesState` 自动管理对话历史，等价于早期无框架时的 `messages.append()` | 更简洁、更贴近原生聊天格式 |
| Chain | 显式或隐式构建，例如 RAG Chain | 仍可复用，通常封装在工具函数内部 | 无需改动 |
| Memory | `RunnableWithMessageHistory + 自定义 store` | 通过 `checkpointer=MemorySaver()` 保存整个 State，无需手动管理历史消息 | 更轻量、更鲁棒 |
| Agent | `create_tool_calling_agent + AgentExecutor` | 拆解为节点与边：Agent 节点调用 LLM，Tools 节点执行工具，`should_continue` 控制跳转 | 从黑盒变为白箱，但工具定义方式不变 |
| RAG | 作为独立 Chain 构建，再传入工具 | 原有 RAG Chain 封装进 `@tool` 函数体，即可作为普通工具接入 | 无需改动 |

  可见 LLM、Chain、与 RAG 保持原样，其他模块封装更友好，唯有 Agent 的 AgentExecutor 需要被拆开，由我们手动构建控制流。
#### 基于 ReAct 思想重构 Agent
  AgentExecutor 本质上封装的就是经典 ReAct 循环：Thought（思考）-> Action（行动）-> Observation（观察）-> Router（是否继续？）

  现在，我们用 Langgraph 显式实现这四步：
```python
from config import OPENAI_API_KEY,LANGCHAIN_API_KEY
from langchain_core.messages import HumanMessage
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, END,START
from langgraph.prebuilt import ToolNode
import os
 
os.environ["LANGCHAIN_TRACING_V2"] = "true" # 总开关，决定启用追踪功能
os.environ["LANGCHAIN_PROJECT"] = "demo01" # 自定义项目名
os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
 
# LLM配置
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=OPENAI_API_KEY,
    base_url="https://api.deepseek.com"
)
 
# 工具定义
@tool
def get_weather(loaction):
    """模拟获取天气"""
    return f'{loaction}当前天气：23℃，晴，风力2级'
 
tools = [get_weather]
llm_with_tools = llm.bind_tools(tools) # 让llm学会调用工具节点
 
# --- 核心组件:拆解AgentExecutor ---
# ReAct Step1:Thought(LLM决策)
def call_model(state:MessagesState):
    response = llm_with_tools.invoke(state['messages'])
    return {"messages":[response]} # 新消息追加到状态
 
# ReAct Step2-3:Action + Observation
tool_node = ToolNode(tools) # 工具节点函数，langgraph已封装
 
# ReAct Step4:Loop Controller(是否循环)
def should_continue(state:MessagesState):
    last_msg = state["messages"][-1]
    if hasattr(last_msg,"tool_calls") and last_msg.tool_calls:
        return "tools" # 有工具调用 -> 执行工具
    return END         # 无工具调用 -> 返回答案
 
# --- 构建 ReAct 循环图---
workflow = StateGraph(MessagesState)
 
workflow.add_node("agent",call_model) # Thought
workflow.add_node("tools",tool_node) # Action + Observation
workflow.add_edge(START,"agent")
# 条件边:Thought -> 决定下一步
workflow.add_conditional_edges(
    "agent", # 从哪个节点出发
    should_continue, # 决定下一步去哪
    {
        "tools":"tools", # 如果返回tools，去tools节点
        END:END          # 如果返回END，直接结束工作流
    }
)
workflow.add_edge("tools","agent") # 工具调用的结果再返回给agent节点
 
app = workflow.compile()
 
if __name__ == '__main__':
    # 触发工具
    result = app.invoke(
        {"messages":[
            HumanMessage(content="北京天气如何?")
        ]}
    )
    print('工具调用结果:',result['messages'][-1].content)
    # 不触发工具
    result = app.invoke({"messages":HumanMessage(content="你好")})
    print('直接回答:',result['messages'][-1].content)
```
  关于 add_contional_edges 的说明：与基础的 add_edge 不同，add_conditional_deges 引入了动态路由能力：  

  * 它根据当前状态（如是否有 tool_calls）决定下一步走向；
  * 支持多路分支、状态感知、自定义判断逻辑；
  * 相比 Coze/Dify 等平台的固定条件判断，可控性更强，灵活性更高。

  这正是 Langgraph 实现复杂 Agent 控制流的核心机制。这段代码复现了标准的 ReAct 循环、完全替代了 AgentExecutor 的黑盒行为；保留了 LangChain 所有生态组件的兼容性（包括未来接入 RAG）；获得了更高的可观测性、可调试性与壳扩展性。

  此时的 Agent 不再是魔法，而是一个清晰、同名、可干预的可视化工作流——这正是迈向生产级智能体的关键一步。

### 带记忆的完整交互
  在上一节的基础上，只需要增加两行代码，就可以让 Langgraph 带上持久化记忆能力，得益于 Langgraph 的状态驱动设计，我们不再需要：手动拼接 history 到 prompt；实现 get_session_history；管理 ChatMessageHistory 存储；一切由 checkpointer 自动完成。
#### 正确处理系统提示（Prompt）
  上一节未显式使用系统提示，在这一节中，我们希望引入 sys_prompt，但不能每次 app.invoke() 时都传入 SystemMessage，不然会在多轮对话中重复插入，污染历史记录。

  正确做法是：仅在 LLM 调用时临时拼接系统提示，但不将其写入状态历史。
```python
# ...
# ReAct Step1:Thought(LLM决策)
def call_model(state:MessagesState):
    # 构造带system prompt 的完整消息列表(仅用于本次LLM调用)
    message_for_llm = [SystemMessage(content=sys_prompt)]+state["messages"]
    response = llm_with_tools.invoke(message_for_llm)
    # 此处只会返回新生成的消息，不包含prompt，防止污染历史
    return {"messages":[response]}
```
  这样，系统提示仅影响当前推理，不会保存到历史记录中，保证了状态的干净与一致性。
#### 启用记忆功能
  其余代码不变，仅在编译时启用检查点：
```python
# 编译时启用记忆
app = workflow.compile(checkpointer=MemorySaver())
```
#### 交互循环（带会话隔离）
```python
if __name__ == '__main__':
    session_id = "user123"
    config = {
        "configurable":{"thread_id":session_id}
    }
    while 1:
        user_input = input('\n你：')
        if user_input.strip().lower() == 'quit': # 去掉前后空格且转为小写
            break
 
        result = app.invoke(
            {'messages':[HumanMessage(content=user_input)]},
            config=config
        )
 
        ai_msg = result["messages"][-1]
        print(f'AI：{ai_msg.content}')
```
  注意：Langgraph 中用于标识会话的字段是 thread_id，而非 Langchain 早期使用的 session_id。  

  * session_id 是 Langchain 高层组件中的“会话”的抽象，主要用于消息历史管理；
  * thread_id 是 Langgraph 的标准字段，代表一个完整的状态执行流程，用于整个 State 的持久化和恢复。

  因此，langgraph 必须使用 thread_id，否则记忆无法工作。

  至此，我们构建了一个具备系统提示、工具调用、多轮记忆、会话隔离和完整 ReAct Agent ，符合 Agentgraph 最佳实践。
## langgraph_advanced
  在上一篇中，我们亲手用 Langgraph 实现了一个透明、可追踪、带记忆的 ReAct，它能思考、调用工具并记住历史，看起来已经很强大，但是在生产级环境，还有三大难题：

  1. 安全失控：Agent 可以自动删除数据、发送邮件、转账付款——如果没有任何确认机制，一旦出错便无可挽回。
  2. 工作流臃肿：为了让 Agent 处理复杂任务，我们在单个节点里不断堆砌逻辑：“先验证输入、再查数据、然后进行业务计算、最后格式化输出...”，节点函数越来越长，流程臃肿，每次修改业务逻辑都需要重写整个函数，测试难度飙升。
  3. 职责混乱：所有功能都挤在一个 Agent 里，它既是研究员又是专家还是客服，身兼数职，更别提还要加上不断扩大的记忆，短期尚可长期必炸。

  所以，本篇为这三大痛点分别提供了三种对应解决的进阶能力：Human-in-the-Loop（人工干预）解决安全失控；Graph-as-a-tool（图即工具）解决工作流臃肿；Multi-Agent（多智能体编排）解决职责混乱。
### Human-in-the-Loop 让 AI 学会“请示”
#### 为什么需要人工干预
  全自动执行在 demo 运行中听起来很好，但在实际运行中极其危险。比如用户说“把项目预算邮件发给财务”，Agent 自动调用 send_email(to="@xx.com",content="xx")，如果内容有误，邮件一旦发出无法撤回。

  所以我们需要一种机制：在执行高风险操作前暂停，等待人类确认。

  Langgraph 提供了完美的解决方案：interrupt_before + MemorySaver  
  * MemorySaver 会将图的当前状态（包括消息历史、中间变量）持久化；
  * interrupt_before = ["node_name"] 表示“在进入该节点前暂停执行”；
  * 暂停后，程序可以检查即将执行的操作，并询问用户是否继续；
  * 若用户批准，调用 app.straem(None, config) 即可从断点恢复执行。

  这相当于为 Agent 加了一道安全锁。人为审批的思路也很简单，我们假设一个发邮件的 Agent：当你发邮件时，该 Agent 会暂停并显示即将执行的操作，等待你输入 yes 才继续。

  大致步骤如下：  
  1. 提前确定好哪个节点需要审批，在这里停住：
```python
app = workflow.compile(
    # 在内存里做状态持久化
    checkpointer=MemorySaver(),
    interrupt_before=["tools"] # 选择要人工审批的节点 -- 负责在哪里停，之后的代码负责停了之后怎么办
)
```
  2. 触发执行，并自动暂停。此处用 stream 流式，是利用流式 API 的中断机制，使其能够精准在特定节点前暂停。
```python
    while 1:
        # 触发工作流执行，推进到下一个中断点或自然结束
        for _ in app.stream(inputs,config,stream_mode="values"): # 流式执行
        # inputs注入事件;config确定回话id;"values":完整记录每步结果
            pass   # 必须迭代生成器，才能实际执行工作流
```
  3. 获取暂停节点的状态：
```python
        # 获取当前状态
        snapshot = app.get_state(config)
        next_tasks = snapshot.next # 返回下一步要执行的节点名列表
```
  4. 如果没有下一步，说明工作流已结束：
```python
        if not next_tasks:
            final_msg = snapshot.values['messages'][-1]
            print(f'\n最终回复:{final_msg.content}')
            break
```
  5. 如果下一步是需要审批的节点，进行审批：
```python
        if "tools" in next_tasks:
            last_msg = snapshot.values['messages'][-1]
            tool_call = last_msg.tool_calls[0]
            print(f'\n⚠️ Agent准备执行操作：')
            print(f'    工具名称：{tool_call["name"]}')
            print(f'    参数：{tool_call["args"]}')
 
            approval = input("\n✅ 是否批准执行？(输入 'yes' 继续，其他取消): ").strip().lower()
            if approval == "yes":
                print('\n 继续执行...')
                inputs = None # 表示从断点继续，无新输入
            else:
                print("\n❌ 操作已取消，流程终止")
                break
```
  完整代码如下：
```python
import os
from config import OPENAI_API_KEY,LANGCHAIN_API_KEY
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
 
# langsmith调试
os.environ["LANGCHAIN_TRACING_V2"] = "true" # 总开关，决定启用追踪功能
os.environ["LANGCHAIN_PROJECT"] = "human_approval" # 自定义项目名
os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
 
# llm配置
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=OPENAI_API_KEY,
    base_url="https://api.deepseek.com"
)
 
# 定义一个敏感工具：发送邮件(模拟)
@tool
def send_email(to, content):
    """模拟发送邮件"""
    return f'邮件已发送至{to},内容为：{content}'
 
 
# 工具绑定到llm
tools = [send_email]
llm_with_tools = llm.bind_tools(tools)
 
# Node函数与Edge节点
tool_node = ToolNode(tools)
 
 
def call_model(state: MessagesState):
    response = llm_with_tools.invoke(state['messages'])
    return {"messages":[response]}
 
 
def should_continue(state: MessagesState):
    last_msg = state['messages'][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return END
 
 
# 构建基础ReAct图
workflow = StateGraph(MessagesState)
 
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)
workflow.add_edge(START, "agent")
 
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)
 
workflow.add_edge("tools", "agent")
 
app = workflow.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"] # 选择要人工审批的节点 -- 负责在哪里停，之后的代码负责停了之后怎么办
)
 
 
if __name__ == '__main__':
    config = {
        "configurable":{"thread_id":"user123"}
    }
    user_input = "请帮我给 boss@example.com 发一封邮件，内容是：会议推迟到明天下午3点。"
 
    print("用户输入:",user_input)
    print("\nAgent正在思考...\n")
 
    # 初识输入
    inputs = {"messages":[HumanMessage(content=user_input)]}
 
    while 1:
        # 触发工作流执行，推进到下一个中断点或自然结束
        for _ in app.stream(inputs,config,stream_mode="values"): # 流式执行
            pass   # 必须迭代生成器，才能实际执行工作流
 
        # 获取当前状态
        snapshot = app.get_state(config)
        next_tasks = snapshot.next # 返回下一步要执行的节点名列表
 
        # 如果没有下一步，说明工作流已结束
        if not next_tasks:
            final_msg = snapshot.values['messages'][-1]
            print(f'\n最终回复:{final_msg.content}')
            break
 
        # 如果下一步是需要审批的节点
        if "tools" in next_tasks:
            last_msg = snapshot.values['messages'][-1]
            tool_call = last_msg.tool_calls[0]
            print(f'\n⚠️ Agent准备执行操作：')
            print(f'    工具名称：{tool_call["name"]}')
            print(f'    参数：{tool_call["args"]}')
 
            approval = input("\n✅ 是否批准执行？(输入 'yes' 继续，其他取消): ").strip().lower()
            if approval == "yes":
                print('\n 继续执行...')
                inputs = None # 表示从断点继续，无新输入
            else:
                print("\n❌ 操作已取消，流程终止")
                break
```
### Graph-as-a-Tool：把复杂流程封装成“黑盒工具”
#### 为什么要这么封装？
  回想之前的 RAG 实现：一个完整的检索增强生成流程，通常包含多个步骤——文档加载与分块、文本向量化、存入向量数据库、执行检索、上下文增强、最终生成答案，这些操作本身已经足够繁琐。

  如果直接把这些逻辑塞进一个普通函数，并作为 LangChain Tool 注册给 LangGraph 使用，虽然技术上可行，但会带来明显问题：  
  * 耦合度高：所有逻辑挤在一起，难以单独测试或替换某一步；
  * 可读性差：主图节点变成“大泥球”，失去流程清晰性；
  * 扩展困难：一旦需求变化（比如加入重排、多跳查询、结果校验），代码迅速膨胀，if-else 嵌套失控

  更关键的是——真实智能任务往往不是线性的。比如，RAG 可能需要根据检索质量决定是否生成查询、是否引入外部只是、甚至请求人工确认。这类带状态转移、条件分支、循环反馈的逻辑，用传统函数难以优雅表达。

  这时，Graph-as-a-Tool 的价值就凸显出来了。它允许我们将某个复杂子任务（如 RAG）自身建模为一个独立的工作流图（sub-graph），再将整个图封装为一个对外透明的 Tool，对主 Graph 而言，它只是一个语义明确的黑盒接口；而内部，却是一个结构清晰、节点分明、支持中断恢复的完整流程。

  这正是现代智能体架构的核心理念：分层抽象，嵌套编排。主图负责“决策做什么”，子图（作为 Tool）负责“如何做”。而只有“图”这种结构，才能优雅地表达这种分层、嵌套、带反馈的复杂工作流。

  假设我们要做一个可以自动重试的 API 服务调用，该服务调用作为一个工具给主工作流，而它自身则是由一个子图构成，里面涵盖了一个完整的子工作流。

  主要代码构建如下：
```python
# ...相关配置
# 构建子工作流
# 1.子任务状态
class RetryState(TypedDict):
    query: str
    attempt: int
    result: str
 
# 2.子图逻辑 -- 模拟一个可能失败，需重试的API调用
def call_unstable_api(state:RetryState):
    """模拟偶发性的外部服务，偶发失败"""
    attempt = state["attempt"]
    if attempt == 1:
        # 第一次故意失败
        return {"result":"ERROR：服务暂时不可用","attempt":attempt+1}
    else:
        # 第二次成功
        return {"result":f"SUCCESS：成功处理请求：{state['query']}","attempt":attempt+1}
 
def should_retry(state:RetryState):
    if "ERROR" in state["result"] and state["attempt"] <= 2: # 出现报错且重试次数小于2，重连
        return "call_api"
    return END
 
# 3.构建子图工作流
retry_workflow = StateGraph(RetryState)
retry_workflow.add_node("call_api",call_unstable_api)
retry_workflow.add_edge(START,"call_api")
retry_workflow.add_conditional_edges(
    "call_api",
    should_retry,
    {"call_api":"call_api",END:END}
)
retry_app = retry_workflow.compile()
 
# 4.封装为tool(Graph-as-a-Tool)
@tool
def create_order(query:str) -> str:
    """创建新订单，自动重试保障成功率"""
    result = retry_app.invoke({"query":query,"attempt":1,"result":""})
    return result["result"]
 
 
# 5.主graph
tools = [create_order]
llm_with_tools = llm.bind_tools(tools)
tool_node = ToolNode(tools)
 
def agent_node(state:MessagesState):
    response = llm_with_tools.invoke(state["messages"])
    return {"messages":[response]}
 
def should_continue(state:MessagesState):
    last_msg = state["messages"][-1]
    if hasattr(last_msg,"tool_calls") and last_msg.tool_calls:
        return "tools"
    return END
 
# 构建主工作流
workflow = StateGraph(MessagesState)
workflow.add_node("agent",agent_node)
workflow.add_node("tools",tool_node)
workflow.add_edge(START,"agent")
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)
workflow.add_edge("tools","agent")
 
app = workflow.compile()
 
# 运行
if __name__ == '__main__':
    user_input = "请创建一个新订单：购买三本书"
    print('用户输入:',user_input)
 
    inputs = {"messages":[
        SystemMessage(content="你是一个任务执行助手。当用户提出任何需要处理、操作或执行的请求时，必须调用 create_order 工具来完成，不要自行回答细节"),
        HumanMessage(content=user_input)
    ]}
    result = app.invoke(inputs)
 
    tool_result = None
    # 在主工作流的消息历史中，查找最近的工具执行结果
    for msg in reversed(result["messages"]):
        if msg.type == "tool": # 找到ToolMessage类型消息
            tool_result = msg.content
            break
    if tool_result:
        print(f"\n✅ 直接获取子图返回值:\n{tool_result}")
    else:
        print("\n❌ 未执行任何工具")
    final_reply = result["messages"][-1]
    print(f'\n最终回复:\n{final_reply}')
```
  其中的 for msg in reversed(result["messages"]) 包含的是完整的对话历史记录，而非工作流执行过程。ToolNode 会在对话历史中执行结果消息。

  现在我们能对应不同场景的 tool，编写不同的 graph 来应对复杂的逻辑，这就是 graph-as-a-tool（图即工具）。
### Multi-Agent 编排：让多个专家协同工作
#### 痛点：为什么单 Agent 会崩溃？
  在之前的章节中，我们习惯通过 System Prompt 让一个 Agent 扮演“全能神”，但当需求变得复杂（例如同时需要 RAG 检索私有信息、联网查找数据、生成代码）时，这种模式会迅速崩塌：

  * 注意力分散：Prompt 过长，LLM 经常忽略指令，表现为“幻觉”
  * 记忆爆炸：所有任务共用一个 Message History，上下文飞速扩张，不仅烧钱还容易让模型“记混”信息
  * 工具混杂：几十个工具堆在一起，模型极易误调（例如该查文档时去联网）
  * 脆弱性：一步错，全盘输。无法针对特定任务（如写代码）单独优化 Prompt。

  揭发：微服务化（MIcroservices）将一个试图全能的单智能体，拆解为多个专注、自治、可组合的子智能体，并通过编排协调完成复杂任务。

  * 让 RAG 专家只负责查私有知识
  * 让 Web 搜索员只负责查公开信息
  * 让 代码生成器只写 Python

  而这一切，都需要一个 **总控（Supervisor）**来调度
#### 初始化：工具配置与核心状态定义
  首先，我们需要定义工具和状态，这里的核心技术点在于状态（State）的设计。
  代码实现：
```python
# 模拟工具
@tool
def search_internal_docs(query:str):
    """搜索公司内部文档获取政策信息"""
    return "根据公司手册，年假为15天"
 
@tool
def search_web(query:str):
    """通过搜索引擎获取最新的公开信息"""
    return "据TechCrunch报道，LangGraph 0.6已支持持久化记忆"
 
@tool
def generate_code(requirement:str):
    """根据需求生成可运行的Python代码"""
    return "python\nprint('Hello from Code writer!')"
 
# 共享状态定义
class AgentState(TypedDict):
    messages: Annotated[list,add_messages] # 自动累积对话历史
    next_speaker: str
```
  为什么不用预置的 MessagesState：Langgraph 提供了一个预置类 MessagesState，但它只有一个 messages 字段，在多智能体编排中，我们需要额外的字段 next_speaker 来存储 Supervisor 的决策结果，因此必须自定义 TyperDict。

  关于 Annotated[list, add_messages]：  

  * Annotated 的作用：在这里它不仅仅是类型提示，它会被 LangGraph 框架读取
  * add_messages 的机制：它的作用是告诉框架，当节点返回新的 messages 时，不要直接覆盖旧列表，而是追加（Append）。这是实现自动累积对话历史的关键。

#### 定义节点：专家与总控
  这一步我们需要明确“大脑”与“手脚”的分工

  代码实现：
```python
# 专家节点
def rag_expert(state:AgentState):
    prompt = "你是公司知识库专家，只基于内部文档回答问题。回答应简洁明了，直接给出最终结论。请在回答的最后一行加上：(任务已完成)"
    messages = [SystemMessage(content=prompt)]+state['messages']
    tools = [search_internal_docs]
    response = llm.bind_tools(tools).invoke(messages)
    return {'messages':[response]}
 
def web_research(state:AgentState):
    prompt = "你是互联网研究员，擅长用搜索引擎获取最新公开信息。回答应简洁明了，直接给出最终结论。请在回答的最后一行加上：(任务已完成)"
    messages = [SystemMessage(content=prompt)]+state['messages']
    tools = [search_web]
    response = llm.bind_tools(tools).invoke(messages)
    return {'messages':[response]}
 
def code_writer(state:AgentState):
    prompt = "你是python工程师，只生成可运行代码，不解释。回答应简洁明了，直接给出最终结论。请在回答的最后一行加上：(任务已完成)"
    messages = [SystemMessage(content=prompt)]+state['messages']
    tools = [generate_code]
    response = llm.bind_tools(tools).invoke(messages)
    return {'messages':[response]}
 
# 总控节点
def supervisor(state:AgentState):
    supervisor_prompt = """
        你是一个任务协调员。你的目标是管理专家来解决用户的问题。
        当前对话需要以下专家参与：
        - rag_expert：涉及公司政策、内部流程
        - web_research：涉及外部新闻、公开数据
        - code_writer：需要生成代码
        【决策逻辑】
        1. **检查历史记录**：先看上一个回复是否已经完整回答了用户的初始问题。
        2. **如果已经回答完毕**：必须输出 'FINISH'。
        3. **如果尚未回答或需要补充**：根据当前缺少的步骤，选择下一个最合适的专家。
        请只输出专家名字或 'FINISH'，不要输出任何其他解释。
        """
    messages = [SystemMessage(content=supervisor_prompt)]+state['messages']
    response = llm.invoke(messages)
    next_speaker = response.content.strip()
    return {"next_speaker":next_speaker}
```
  逻辑要点：  

  * 专家节点：遵循 ReAct 模式。必须使用 bind_tools 将工具绑定给 LLM ，否则模型无法触发工具调用。我们还在 Prompt 中加入了“任务已完成”的标记，辅助总控判断。
  * 总控节点：不执行具体任务，只负责“看”。它的输出直接决定了 next_speaker 的值，从而控制整个图的流向。

#### 构建协作图：核心架构逻辑
  这是本章最复杂的部分，我们需要通过 StateGraph 将节点织成一张网

  代码实现：
```python
# 路由函数定义
def route_supervisor(state:AgentState):
    if state["next_speaker"]=="FINISH":
        return END
    return state["next_speaker"]
 
def should_continue(state:AgentState):
    last_msg = state["messages"][-1]
    if hasattr(last_msg,"tool_calls") and last_msg.tool_calls:
        return "tools"
    return "supervisor"
 
def route_after_tool(state:AgentState):
    # 工具执行完后，通过next_speaker知道是谁调用的，路由回去
    return state["next_speaker"]
 
 
# 添加工具节点
tools = [search_internal_docs,search_web,generate_code]
tool_node = ToolNode(tools)
 
 
# 构建协作图
workflow = StateGraph(AgentState)
 
# 1. 添加节点
workflow.add_node("supervisor",supervisor)
workflow.add_node("rag_expert",rag_expert)
workflow.add_node("web_research",web_research)
workflow.add_node("code_writer",code_writer)
workflow.add_node("tools",tool_node)
 
# 2. 总控回路
workflow.add_edge(START,"supervisor")
workflow.add_conditional_edges("supervisor",route_supervisor)
 
# 3. 专家节点的ReAct循环
for member in ["rag_expert","web_research","code_writer"]: # 为每个专家添加条件边：决定是去执行工具还是回总控
    workflow.add_conditional_edges(
        member,
        should_continue,
        {"tools":"tools","supervisor":"supervisor"}
    )
 
# 4.工具节点闭环
workflow.add_conditional_edges( # 工具执行完，根据next_speaker路由回原来的专家
    "tools",
    route_after_tool
)
 
app = workflow.compile()
```
  理解图构建中的三个关键点  

  第一点：条件边的两种写法（动态 vs 静态）  

  * 直接返回（动态路由）：如 route_supervisor。函数直接返回节点名称字符串，适用于目标节点不确定的情况（Supervisor 可能返回任何专家的名字）。
```python
# 读取总控做出的决定，然后告诉工具流下一步去哪
def route_supervisor(state:AgentState):
    if state["next_speaker"]=="FINISH":
        return END
    return state["next_speaker"]

workflow.add_conditional_edges("supervisor",route_supervisor)
```

  * 字典映射（静态结构）：如 should_continue。虽然函数返回的是 ”tools“，但我们在 add_conditional_edges 中显式定义了 {"tools":"tools"} 的映射。这适用于结构固定的场景（三选一或二选一）。
```python
def should_continue(state:AgentState):
    last_msg = state["messages"][-1]
    if hasattr(last_msg,"tool_calls") and last_msg.tool_calls:
        return "tools"
    return "supervisor"
 
# 提前列出所有可能的判断结果，以及每个结果要去的固定节点
for member in ["rag_expert","web_research","code_writer"]: # 为每个专家添加条件边：决定是去执行工具还是回总控
    workflow.add_conditional_edges(
        member,
        should_continue,
        {"tools":"tools","supervisor":"supervisor"}
    )
```
  第二点：For 循环的本质（构建时 vs 运行时）代码中的 for member in [...] 并不是让程序运行时轮流跑一遍专家。这是构建阶段（Build Time）的代码。它的作用是”批量注册“：我们告诉图，这三个专家节点，它们”出门“后规则是一样的（要么修工具，要么回总控）。这避免了重复写三遍相同的 add_conditional_deges 代码。

  第三点：add_conditional_edges 的回环特性。这一代码相当于给节点安装了一个永久生效的”单向任意门“。  

  * 回环：一旦定义了 Expert->check->Tools，以后无论流程回到几次 Expert 节点，离开时都会触发这个检查。
  * 单向性：虽然我们在逻辑上实现了 Expert->check->Tools 的闭环，但这个闭环式由两条单向边拼凑的：
    1. Expert->Tools（通过 should_continue 定义）
    2. Tools->Expert（通过 route_after_tool 定义，必须显式写出来，否则程序会卡死在 Tools 节点）。

#### 测试运行
  最后，通过打印日志来验证多智能体的协作流

  代码实现：
```python
# 测试运行
if __name__ == '__main__':
    user_input = "公司年假多少天"
    print("用户提问:",user_input)
    print('\n开始多智能体协作...\n')
 
    inputs = {"messages":[HumanMessage(content=user_input)]}
    # app是编译好的图，stream()会让图开始运转，并返回一个生成器
    # 图每执行完一个节点，就会产出一个step字典
    for step in app.stream(inputs):
        # 因为step是个字典，所以需要拆包拿到 节点名(Node) 与 输出内容(output)
        for node,output in step.items():
            # 有工具/专家回复
            if "messages" in output:
                msg = output["messages"][-1]
                if hasattr(msg,"tool_calls") and msg.tool_calls:
                    call = msg.tool_calls[0]
                    print(f"【{node}】调用工具 {call['name']}({call['args']})")
                else:
                    print(f"【{node}】回复：{msg.content}")
            # supervisor刚做完决策，确定下个发言人
            elif "next_speaker" in output:
                speaker = output["next_speaker"]
                print(f"【Supervisor】指定下一位发言人：{speaker}")
```
  系统的运行脉络：Supervisor 识别意图 -> 指派 RAG 专家 -> RAG 专家发现需要查库 -> 调用 Tools -> Tools 返回结果 -> RAG 专家生成最终答复 -> Supervisor 确认任务完成（FINISH）。

  工作流大致如下图所示：
```shell
           (开始)
             |
             v
   +--> [ 🧠 总控 Supervisor ] --(完成)--> (( END ))
   |         |
   |         | (1. 指派)
   |         v
   |    [ 👷 专家 (Workers) ] <====> [ 🛠️ 工具 (Tools) ]
   |         |        ^         (2. 干活循环)
   |         |        |
   +---------+--------+
      (3. 汇报结果)
```
  总结：三种能力如何组合？

| 能力 | 解决的问题 | 典型场景 |
|---|---|---|
| Human-in-the-Loop | 不可逆操作的安全风险 | 发邮件、删除数据、审批流程 |
| Graph-as-a-Tool | 复杂内部逻辑的维护难题 | 带重试的 API 调用、多步验证 |
| Multi-Agent 编排 | 单个 Agent 职责过多 | 会议纪要、故障排查、需求分析 |

### 综合实战
  在前三章中，我们分别掌握了 安全锁、黑盒工具、团队管理。现在，我们不再纸上谈兵，而是将这三者融为一体，构建一个生产级架构的 IT 运维智能体。

  业务场景设定：我们模拟一个服务器故障排查场景

  总控（Supervisor）：负责接收报警，调度专家；

  日志专家（Log Exper）：负责分析服务器日志。它手中的工具 analyze_logs 是一个子图，包含 SSH 连接重试、日志提取等复杂逻辑（模拟网络不稳定的真实环境）。

  运维专家（Ops Expert）：负责执行修复。它手中的工具 restart_services 是敏感操作，必须经过人工审批（Human-in-the-Loop）。

  代码实现：
```python
import os
import time
from config import OPENAI_API_KEY,LANGCHAIN_API_KEY
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain_core.messages import HumanMessage,SystemMessage
from langgraph.graph import StateGraph,MessagesState,START,END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from typing import TypedDict,Annotated
from langgraph.graph.message import add_messages
 
# LangSmith调试
os.environ["LANGCHAIN_TRACING_V2"] = "true" # 总开关，决定启用追踪功能
os.environ["LANGCHAIN_PROJECT"] = "supervisor_agent_ops_system" # 自定义项目名
os.environ["LANGCHAIN_API_KEY"] = LANGCHAIN_API_KEY
 
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=OPENAI_API_KEY,
    base_url="https://api.deepseek.com"
)
 
# === 一、Graph-as-a-Tool ===
# === 模拟一个不稳定的SSH日志查询过程 ===
 
class SSHState(TypedDict):
    target_ip: str
    attempt: int
    logs: str
 
def connect_ssh(state:SSHState):
    """模拟SSH连接，第一次连接必定超时"""
    print(f'    [子图]正在尝试连接服务器{state["target_ip"]}(第{state["attempt"]}次)')
    if state['attempt'] == 1:
        return {'logs':'ERROR:Connection Timed Out','attempt':state['attempt']+1}
    return {'logs':'CONNECTED','attempt':state['attempt']+1}
 
def grep_system_logs(state:SSHState):
    """连接成功后读取日志"""
    if state["logs"] == "CONNECTED":
        # 打印查到的结果
        return {'logs':f'SUCCESS: Retrieved logs from {state['target_ip']}:[ERROR: OutOfMemory at line 4032]'}
    return {'logs':state['logs']} # 保持错误状态
 
def ssh_routing(state:SSHState):
    """路由逻辑：如果连接失败且尝试次数少于3，重试"""
    if "ERROR" in state['logs'] and state["attempt"] <= 2:
        return "connect"
    return "grep"
 
# 构建子图
ssh_workflow = StateGraph(SSHState)
ssh_workflow.add_node("connect",connect_ssh)
ssh_workflow.add_node("grep",grep_system_logs)
 
ssh_workflow.add_edge(START,"connect")
ssh_workflow.add_conditional_edges("connect",ssh_routing,{"connect":"connect","grep":"grep"})
ssh_workflow.add_edge("grep",END)
 
ssh_app = ssh_workflow.compile()
 
# 将子图封装为工具
@tool
def analyze_server_logs(ip_address:str):
    """使用SSH连接服务器并分析最近的错误日志（内含自动重连机制）"""
    result = ssh_app.invoke({"target_ip":ip_address,"attempt":1,"log":""})
    return result['logs']
 
 
 
# === 二、Human-in-the-Loop ===
# === 重启服务，高危操作，需要审批 ===
 
@tool
def restart_service(service_name:str):
    """重启指定的服务器服务"""
    return f"服务[{service_name}]已成功重启，系统负载已恢复正常"
 
 
 
# === 三、Multi-Agent 编排 ===
# === 总控调度 + 专家分工 ===
 
# 1. 共享状态
class AgentState(TypedDict):
    messages:Annotated[list,add_messages]
    next_speaker:str
 
# 2. 专家节点
def log_expert(state:AgentState):
    prompt = "你是日志分析专家，使用工具分析服务器日志，找出报错原因。回答需简洁。"
    messages = [SystemMessage(content=prompt)] + state['messages']
    # 绑定子图工具
    tools = [analyze_server_logs]
    response = llm.bind_tools(tools).invoke(messages)
    return {"messages":[response]}
 
def ops_expert(state:AgentState):
    prompt = "你是运维专家。当收到修复指令时，请立即调用 'restart_service' 工具进行修复，不要输出任何额外的解释文本。"
    messages = [SystemMessage(content=prompt)] + state['messages']
    tools = [restart_service]
    # 绑定敏感工具
    response = llm.bind_tools(tools).invoke(messages)
    return {"messages":[response]}
 
# 3. 总控节点（supervisor）
def supervisor(state:AgentState):
    prompt = """
    你是 IT 运维总指挥。
    专家列表：
    - log_expert
    - ops_expert
    决策逻辑：
    1. 未知原因 -> log_expert
    2. 已知原因（如OOM、报错） -> ops_expert
    3. 修复完成 -> FINISH
    【输出约束】
    仅输出下一个专家的名字（如 log_expert），不要包含任何其他字符或标点。
    """
    messages = [SystemMessage(content=prompt)] + state['messages']
    response = llm.invoke(messages)
    return {"next_speaker":response.content.strip()}
 
# 4. 路由逻辑
def route_supervisor(state:AgentState):
    if state['next_speaker'] == "FINISH":
        return END
    return state['next_speaker']
 
def should_continue(state:AgentState):
    last_msg = state['messages'][-1]
    if hasattr(last_msg,"tool_calls") and last_msg.tool_calls:
        return "tools"
    return "supervisor"
 
def route_after_tool(state:AgentState):
    return state["next_speaker"]
 
 
# === 四、构建主图与集成 ===
 
# 工具集合
all_tools = [analyze_server_logs,restart_service]
tool_node = ToolNode(all_tools)
 
# 构建主图
workflow = StateGraph(AgentState)
 
workflow.add_node("supervisor",supervisor)
workflow.add_node("log_expert",log_expert)
workflow.add_node("ops_expert",ops_expert)
workflow.add_node("tools",tool_node)
 
workflow.add_edge(START,"supervisor")
workflow.add_conditional_edges("supervisor",route_supervisor)
for member in ["log_expert","ops_expert"]:
    workflow.add_conditional_edges(
        member,
        should_continue,
        {"tools":"tools","supervisor":"supervisor"}
    )
workflow.add_conditional_edges("tools",route_after_tool)
 
# 编译图:加入记忆与中断机制(Human-in-the-Loop)
# 注: 我们在所有工具执行前都暂停，但在运行时进行逻辑判断
app = workflow.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"]
)
 
# === 五、运行时逻辑(模拟生产环境的交互) ===
 
if __name__ == '__main__':
    # 模拟一次完整的故障处理流程
    user_input = "服务器 192.168.1.100 报警，响应极慢，请处理。"
    config = {
        "configurable": {"thread_id": "incident_001"}
    }
 
    print(f'收到报警 : {user_input}')
    inputs = {"messages":[HumanMessage(content=user_input)]}
 
    # 循环执行，直到任务结束
    while 1:
        # 1. 执行图直到中断或结束
        for _ in app.stream(inputs,config,stream_mode="values"):
            pass
 
        # 2. 检查当前状态
        snapshot = app.get_state(config)
        next_tasks = snapshot.next
 
        # 没有下一步，任务结束
        if not next_tasks:
            print(f"    最终报告:{snapshot.values['messages'][-1].content}")
            break
 
        # 3. 处理中断:判断是哪个工具被调用
        if "tools" in next_tasks:
            last_msg = snapshot.values['messages'][-1]
            tool_call = last_msg.tool_calls[0]
            tool_name = tool_call["name"]
 
            print(f'\n[系统暂停] 请求调用工具:{tool_name}')
 
            # 策略A: 自动放行安全工具(Graph-as-a-Tool)
            if tool_name == "analyze_server_logs":
                print('     -> 这是一个查询类工具，系统自行批准。')
                inputs = None # 继续执行
                continue
 
            # 策略B: 拦截高危工具(Human-in-the-Loop)
            elif tool_name == "restart_service":
                print("     -> ⚠️ 警告: 这是一个高危操作!")
                user_approval = input("     -> 请人工审批 (输入 'yes' 允许重启):")
 
                if user_approval == "yes":
                    print('    -> ✅ 审批通过，正在执行...')
                    inputs = None # 继续执行
                else:
                    print('    -> ❌️ 审批拒绝，任务终止!')
                    # 实际系统中，应通过 ToolMessage 反馈人工拒绝，使 LLM 能继续响应；
                    # 当前demo为简化，直接退出
                    break
```
  运行效果：

  1. 总控调度：Supervisor 收到报警，首先指派 log_expert。
  2. 子图自动重试：  

    * log_expert 调用 analyze_server_logs；
    * 系统识别这是安全工具，自动批准；
    * 控制台打印出子图内部逻辑：第一次连接超时 -> 自动重试 -> 连接成功 -> 获取到 OutOfMemory 错误
  3. 二次调度：

    * log_expert 汇报：”发现了 OOM 错误“
    * Supervisor 决策：”这是内存溢出，需要重启，指派 ops_expert。“
  4. 人工拦截：

    * ops_expert 试图调用 restart_services
    * 系统识别这是高危工具，强制暂停。
    * 控制台提示：警告：这是一个高危操作！
  5. 最终修复：

    * 输入 yes
    * 服务重启成功，Supervisor 输出 FINISH。

## mcp_basics
  在 RAG 篇中，为了让 Agent 能查询天气，我们手写了一个 get_weather 函数，并用 @tool 装饰器将其注册为工具。但现实需求远不止如此：查询高德地图的驾车路线、通过 Github 自动创建 Issue 通过飞书机器人发送通知。

  难道我们要为每一个服务去阅读 API 文档、处理认证、封装错误、维护版本，再手写几百个 @tool 函数吗？这正是“工具孤岛”问题——每个 Agent 都在重复造轮子，无法共享、难以复用、维护成本极高。

  Model Context Protocol （MCP）的诞生，就是为了解决这个问题。

  MCP 把工具剥离开来，放到独立的 Sever 里：

  * 它可以是一个 USB 设备（支持 Stdio 插拔）
  * 也可以是个 Wifi 热点（支持 HTTP 连接）

  有了 MCP 的 Agent ，才可以自由调用成百上千个工具，让 Agent 的能力飞速扩张。

  对于 MCP 的基础篇与进阶篇，我们将逐步学习 MCP 的服务端与客户端搭建。

### 为什么先学服务端
  按常理，我们或许应该先学会“如何接入别人的 MCP 服务”（客户端），再学习“如何发布自己的服务”（服务端）。但在 MCP 的学习路径中，这个顺序恰恰应该反过来，原因很简单：服务端适合“极速上手”，而客户端适合“深度进阶”

  服务端：极低门槛，所见即所得

  得益于 FastMCP 这样高质量框架的存在，服务端的开发已经变得及其简单。你不需要处理复杂的协议握手，只需写一个带类型提示的普通 Python 函数，加个装饰器，它就立刻变成了一个标准工具。配合 CherryStudio 这样的可视化客户端，你能立刻看到自己的代码跑起来，获得极强的正反馈。

  客户端：不仅是调用，更是架构

  虽然社区已经出现了如 langchain-mcp-adapters 这样的封装库，能让你一键连接，但作为 Agent 全栈工程师，如果只学会调用一个封装好的 load_tools() 函数，就永远也无法理解 MCP 的真正威力。

  * 它是如何跨越进程（Stdio）与 Node.js 服务对话的？
  * 它是如何通过 HTTP (SSE) 实现远程流式传输的？
  * 当连接断开或报错时，如何优雅地处理资源释放？

  这些底层通信机制和生命周期管理，被封装库隐藏了。先搭建一个能自己控制的服务端，再观察客户端如何发现和调用工具，会更容易理解整条通信链路。

  因此应该先攻服务端：利用 FastMCP 的便利性，5分钟构建出可用的工具，建立信心，理解 MCP 的“双模”（Stdio/HTTP）形态。

  后磨客户端：我们将基于官方 SDK 拆解双模连接、工具发现与调用过程，再通过适配层接入 Agent。先理解通信与生命周期，再复用框架，可以减少后续排错时的盲区。

### 极速上手：开发第一个基于 FastMCP 的 Stdio Sever 
  我们先从最简单的开始：本地管道模式（Stdio），这是 Cursor Trae 等本地应用连接工具的标准方式。

  在没有框架之前，我们写 MCP Server 需要处理各种复杂的协议格式。但借助 FastMCP，我们只需学会写 Python 函数即可。：
```python
# stdio_server.py
from mcp.server.fastmcp import FastMCP
 
# 初始化服务
# WeatherService 是服务的名字
mcp = FastMCP("WeatherService")
 
# 业务逻辑工具
@mcp.tool()
async def get_weather(city:str):
    """
    查询指定城市的实时天气。
    如果是此时此刻的天气请求，调用此工具。
    """
    # 模拟真实的网络请求(你可以换成自己的天气API)
    # 在MCP中，工具函数可以是async的，FastMCP会自动处理
    return f"{city}的天气是:晴，气温25℃，风力3级"
 
# 启动入口
if __name__ == '__main__':
    # 默认运行方式:Stdio(标准输入输出)
    # 这种模式下，程序启动后会“挂起”等待指令，不会有任何打印输出。
    mcp.run()
```
  代码解析：

  1. 自动 Schema 生成：

    * 看代码中的 city:str。FastMCP 会自动读取这些类型注释（Type Hints）。生成 JSON Schema 告诉 LLM：“这个工具需要一个字符串类型的 city 参数”。
    * 写 MCP 工具，必须写 Tpye Hints（类型注释），不然 LLM 不知道如何调用
  2. Docstring 说明书：

    * 函数下方的注释（“”“查询指定...”“”）会被自动提取为文档描述。LLM 靠这个来决定什么情况下调用这个工具。
  3. Stdio 管道连接：

    * mcp.run() 默认开启 Stdio 模式。此时 FastMCP 会接管标准输入/输出，将 MCP 消息通过 JSON 流处理。
    * 尽量不要再 Server 或工具函数中随意使用 print() 输出消息，因为 Stdout 是 MCP 协议通道，随意输出会破坏消息格式，导致客户端解析失败。

### 测试 MCP 连接：CherryStudio 初体验
  Server 代码写好了，写起来感觉非常简单，但我们怎么知道它能不能用？我们还没写 Client 测试代码。这时候，现成的 Cherry Studio 作为目前对 MCP 支持最好的客户端之一，就是非常好的调试器。
#### 下载与安装
  打开 [Cherry Studio](https://www.cherry-ai.com/)，下载该文件并安装好。
#### 配置 MCP
  下载好后，点击右上角设置，然后点击左栏 MCP，再点击添加-快速创建 MCP 服务器。

  在这里，我们把如下信息填充完整：

  * 类型（Type）：stdio（通信方式）
  * 名称（Name）：Weather-Local（MCP 工具名）
  * 命令（Command）：python.exe 的绝对路径（启动 py 脚本的解释器）
  * 参数（Args）：绝对路径/path/to/weather_server.py（你的服务器代码本地地址）

  配置完成后点击保存，当看到有工具与小版本号时，意味着已经连接成功。
### 理解 MCP 的 Transport 通信机制
  上一节中，我们成功使用 Stdio 模式启动了一个本地 MCP Server。你可能会疑惑：“既然 Stdio 是本地通信，为什么我用 npx @amap/ ... 时，感觉像是‘远程调用了高德地图’？"

  其实，这种”远程感“是一种部署层面的错觉，通信本身仍是纯本地的，下面我们就来彻底厘清 Stdio 与 Streamable HTTP 的本质区别。
#### Stdio：真正的本地进程间通信（IPC）
  Stdio（Standard Input/Output）的本质是 父子进程之间的匿名管道通信。它不经过网络协议栈，完全在操作系统内存中完成数据交换。

  场景一：纯本地开发（前文所用的方法）

  * 在客户端中配置 Python 命令与 weather_server.py 脚本路径
  * 客户端（如 CherryStudio）通过 subprocess 启动该脚本
  * 双方通过 stdin/stdout 交换 JSON-RPC 消息
  * MCP 这一段不经过网络，通信开销较小；实际耗时还取决于工具本身
  * 仅限同一台机器

  场景二：“伪远程”——通过 npx/uvx 临时执行

  当你执行`npx @amap/amap-maps-mcp-server YOUR_KEY`，实际上发生了三步：1. 联网下载（一次性），npx 从 npm 仓库拉取包并缓存到本地；2. 本地启动：在你的机器上立即运行这个 Node.js 脚本，生成一个子进程；3. Stdio 通信：客户端通过 stdin/stdout 与这个本地子进程对话。

  在这种常规配置中，无论代码来自哪里，Stdio 子进程都运行在 MCP 客户端所在的机器上。客户端部署在服务器时，这个“本地”就是服务器。MCP 这一段仍是本机 IPC，但工具内部可以继续请求高德等远程 API。
#### Stdio 的边界：同机调用与远程共享
  Stdio 适合客户端管理同一台机器上的工具进程，包括本地开发、桌面应用，以及服务器上的同机工具调用。它也可以用于生产，只是不能直接提供跨机器访问的网络接口。

| 问题 | 说明 |
| --- | --- |
| 通信范围 | 常规 Stdio 配置要求客户端与工具进程在同一台机器上 |
| 生命周期 | 子进程通常随连接启动与关闭，同一连接可以调用多次工具 |
| 并发与共享 | 一个连接可以承载多次请求，但多客户端共享与扩容需要另行设计 |
| 可靠性 | 需要正确管理进程、环境变量、权限与异常退出 |

  因此，选择传输方式的依据是部署边界。要让多台机器上的 Agent 共享同一个工具服务，通常选择 Streamable HTTP。

#### 远程部署：Streamable HTTP 到底是什么？
  Streamable HTTP 是 MCP 基于 HTTP 定义的传输方式，不是独立于 HTTP 的新网络协议，也不强制依赖 HTTP/2 或 HTTP/3。

  客户端向 MCP 地址发送 HTTP POST 请求，服务端可以直接返回 JSON，也可以使用 SSE 流返回消息。是否出现长时间保持的流，取决于具体请求与服务实现；它不等同于 WebSocket 的全双工连接。

  同样，HTTP 支持连接复用，不能简单理解成“普通 HTTP 每次都断开，而 Streamable HTTP 永远保持连接”。业务会话与 Agent 历史也不会因为使用这个传输方式就自动保存。

  协议还有版本差异：2025 年版本包含可选的会话与独立 GET 事件流；2026-07-28 版本调整了这些机制。实际开发应由兼容的 SDK 处理协商，不能把某一版的连接行为当作所有版本的固定特性。参考：[MCP Streamable HTTP 规范](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2026-07-28/basic/transports/streamable-http.mdx)。

#### 两种 Transport 对比

| 维度 | Stdio | Streamable HTTP |
| --- | --- | --- |
| 通信机制 | 进程间的标准输入输出管道 | HTTP 请求，返回 JSON 或 SSE 流 |
| 部署位置 | 通常与客户端同机 | 可以同机，也可以跨机器 |
| 服务管理 | 通常由客户端启动子进程 | 通常独立部署，由进程管理器维护可用性 |
| 安全边界 | 操作系统用户、进程与文件权限 | 网络认证、授权与 TLS 等 |
| 业务状态 | 需要应用自行管理 | 同样需要应用自行管理 |
| 日志与进度 | 协议支持时可以发送 | 协议支持时同样可以发送 |

  Stdio 像“插 USB”，Streamable HTTP 像“通过网络访问设备”。区别在连接范围与部署方式，而不是一个只能做 Demo，另一个才允许用于生产。

  前文已经讲了 Stdio 的实现，下一小节继续开启 Streamable HTTP 远程模式。

### 架构升级——一键开启 Streamable HTTP 远程模式
  既然要支持远程调用，代码会不会变得复杂？

  完全不会！FastMCP 已将底层细节全部封装，只需要改动两行配置。
```python
# streamable_http_server.py
 
# ...
 
# 创建服务实例，指定监听地址和端口
mcp = FastMCP("WeatherService",host="0.0.0.0",port=8001)
 
# ...
 
# 启动入口
if __name__ == '__main__':
    # 运行方式:Streamable HTTP
    # 这会自动启动 uvicorn 服务器，支持远程调用  
    mcp.run('streamable-http')
```
  在 MCP 初始化处，我们为其填上 host 与 port 的主机与端口，再在末尾 run 内指定 streamable-http 即可。

  在本地运行后，到 CherryStudio 里验证（URL 本地要填 http://127.0.0.1:8001/mcp） ，这里要填 /mcp 的后缀。MCP 连接成功后再去对话。

  Streamable HTTP 让工具服务具备网络访问入口。需要展示日志或进度时，还要由服务端显式上报、客户端接收；Stdio 同样可以承载协议支持的通知，并不是切换到 HTTP 才具备进度反馈能力。

## mcp_advanced
  上一节中，我们已经把天气查询函数变成了一个独立的 MCP Server，并用 CherryStudio 成功调用。但 CherryStudio 替我们完成了客户端的工作，如果换成自己用 LangGraph 编写的 Agent，工具该如何接进去？

  这一章，我们就从“工具提供者”切换到“工具使用者”，把 MCP Server 接到自己的 Agent 上。先拆解一次客户端的通信过程，再用适配层完成工具发现与调用。

### 先理清架构：谁是大脑，谁是插座？
  MCP 的接入过程可以类比成给电脑插外设：Agent 是使用外设的程序，MCP Client 是连接和通信的驱动，MCP Server 则是暴露具体能力的设备接口。

```text
用户提出问题
    ↓
Agent / LangGraph：决定是否调用工具、调用哪个工具
    ↓
MCP Client：发现工具、发送参数、接收结果
    ↓ Stdio / Streamable HTTP
MCP Server：校验参数、执行工具
    ↓
第三方 API / 数据库 / 内部业务系统
```

  这里要区分两个概念：**模型负责生成调用意图，客户端和服务端负责真正执行。** 模型输出一个 `get_weather(city="北京")` 的工具调用，并不代表它自己连接了天气服务。

| 组件 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| LangGraph | 状态管理、节点执行、条件跳转 | 不会自动知道远端有哪些工具 |
| MCP Client | 连接服务、发现工具、发起调用 | 不代替模型决定业务流程 |
| MCP Server | 暴露工具并执行具体业务 | 不必包含一个自主决策的 Agent |
| 适配层 | 把 MCP 工具转换成 LangChain 工具 | 不代替 MCP Server 实现业务 |

  因此，自己搭建 MCP Server，通常是在封装自己的业务能力，或者把服务商 API 转换为可复用的工具。如果服务商已经提供 MCP Server，Agent 也可以直接连接它。

### 版本说明：先把两套接口分开
  这一系列是逐步记录的学习笔记，MCP SDK 与 LangChain 的接口也在变化。为了让前面的代码还能接着运行，这里明确区分两条路线：

| 路线 | 本文使用的接口 | 适用范围 |
| --- | --- | --- |
| 原理演示 | MCP Python SDK 1.x 的 `ClientSession`、`stdio_client`、`streamablehttp_client` | 与前文 `mcp.server.fastmcp.FastMCP` 示例配套 |
| 当前 LangChain 接入 | `langchain.mcp.MCPAdapter` | 新项目的工具适配示例，当前为 Beta |

  前一条路线请在独立虚拟环境中安装 `mcp>=1.28,<2`。后一条路线请另建环境，安装 `langchain[mcp]>=1.4,<2`、`langchain-openai` 和 `langgraph`，交给依赖管理器解析兼容版本，并保存锁文件。不要把两条路线的安装命令直接叠到同一个环境中。

  另外，前文提到的独立库 `langchain-mcp-adapters`，其官方仓库现已标注停止活跃维护，并提供了迁移到 `langchain.mcp` 的说明。两者都属于客户端适配层，但新旧导入路径、配置格式和生命周期管理不能混用。

  版本参考：[MCP SDK 1.x](https://github.com/modelcontextprotocol/python-sdk/tree/v1.x)、[LangChain 迁移指南](https://docs.langchain.com/oss/python/migrate/langchain-mcp-adapters)。

### 拆开客户端：连接、初始化、发现、调用
  先不让模型参与。我们直接用程序调用上一节的天气工具，看看一个 MCP Client 到底做了什么。

  基本步骤可以概括为：

  1. 建立 Transport：打开进程管道，或者连接 HTTP 地址；
  2. 创建并初始化 ClientSession：协商协议版本与能力；
  3. 调用 `list_tools()`：获取工具名称、说明和参数 Schema；
  4. 调用 `call_tool()`：提交工具名与参数，读取执行结果；
  5. 退出上下文：释放会话和通信资源。

  下面将两种 Transport 放进同一个异步上下文管理器中。保存为 `mcp_client_demo.py`，与前文的 `stdio_server.py` 放在同一目录：

```python
import asyncio
import sys
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from typing import Literal

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client


@asynccontextmanager
async def connect_mcp(mode: Literal["stdio", "http"]):
    # 1. 根据传输方式，创建对应的通信上下文
    if mode == "stdio":
        server_path = Path(__file__).with_name("stdio_server.py")
        transport = stdio_client(
            StdioServerParameters(
                command=sys.executable,  # 与客户端使用同一个 Python 环境
                args=[str(server_path)],
            )
        )
    elif mode == "http":
        # HTTP 服务需要提前在另一个终端启动
        transport = streamablehttp_client("http://127.0.0.1:8001/mcp")
    else:
        raise ValueError(f"不支持的传输方式：{mode}")

    # 2. Stdio 返回两个对象，HTTP 返回三个；前两个都是读写流
    async with transport as streams:
        read, write = streams[:2]
        async with ClientSession(
            read,
            write,
            read_timeout_seconds=timedelta(seconds=30),
        ) as session:
            await session.initialize()
            yield session


async def main():
    # 改成 "http"，即可连接前文的远程模式服务
    async with connect_mcp("stdio") as session:
        # 3. 发现工具：这里为了演示，假设工具列表只有一页
        catalog = await session.list_tools()
        for item in catalog.tools:
            print(f"工具名称：{item.name}")
            print(f"工具说明：{item.description}")
            print(f"参数结构：{item.inputSchema}")

        # 4. 执行工具：参数名必须与服务端定义的 city 一致
        result = await session.call_tool(
            "get_weather",
            arguments={"city": "北京"},
        )
        if result.isError:
            raise RuntimeError(f"天气工具执行失败：{result.content}")

        # MCP 结果可能包含多个内容块，不能假定第一个一定是文本
        for block in result.content:
            if block.type == "text":
                print(f"工具结果：{block.text}")


if __name__ == "__main__":
    asyncio.run(main())
```

  代码解析：

  * `async with` 是资源管理边界。会话先关闭，外层 Transport 再关闭；Stdio 子进程的清理也由对应的上下文管理器处理。
  * `initialize()` 是 SDK 1.x 客户端初始化的一部分，不能打开管道后就直接调用工具。
  * `list_tools()` 拿到的是工具说明书，包括 `name`、`description`、`inputSchema`。如果服务端返回分页游标，还需要继续获取后续页。
  * `call_tool()` 返回 MCP 结果对象，要区分工具返回的错误与连接超时、网络中断等异常。图片、文件等内容也需要按类型处理。

  注意生命周期：**同一个 Stdio 连接可以调用多次工具，不需要每次重启进程。** 上面在退出 `connect_mcp()` 后，`session` 就不应继续使用了。

  这只是展示双模连接与基本错误检查的最小客户端。生产系统还需要处理认证、分页、断线恢复、取消和监控等问题。客户端接口参考：[MCP SDK 1.x 客户端文档](https://py.sdk.modelcontextprotocol.io/v1/client/)。

### 从 MCP 工具到 Agent 工具：适配层做了什么？
  上面的程序能够调用工具，但还不会自主决定何时调用。接下来，我们要把远端的工具说明书交给模型，再把模型产生的调用请求交回 MCP Client。

```text
list_tools() 获取 MCP 工具目录
    ↓
转换成 LangChain 工具对象
    ↓
模型看到工具描述与参数结构，产生 tool_calls
    ↓
工具对象通过 MCP Client 调用远端工具
    ↓
执行结果转换为 ToolMessage，回到 Agent 循环
```

  这就是适配层的工作。它省去了我们逐个编写远程代理函数、转换参数和包装结果的重复劳动。

  对于当前的 LangChain 接入方式，可以使用 `MCPAdapter`。下面是一个独立示例，使用前面已经运行在 8001 端口的天气服务；模型配置沿用前文的 `config.py`：

```python
import asyncio

from config import OPENAI_API_KEY
from langchain.agents import create_agent
from langchain.mcp import MCPAdapter
from langchain.tools import tool
from langchain_openai import ChatOpenAI


@tool
def get_temperature_tip(temperature: float) -> str:
    """根据摄氏温度给出简单的穿衣建议。"""
    return "建议加一件外套" if temperature < 20 else "可以穿轻薄衣物"


async def main():
    llm = ChatOpenAI(
        model="deepseek-chat",
        api_key=OPENAI_API_KEY,
        base_url="https://api.deepseek.com",
    )

    async with MCPAdapter("http://127.0.0.1:8001/mcp") as adapter:
        remote_tools = await adapter.list_tools()
        tools = [get_temperature_tip, *remote_tools]
        agent = create_agent(
            model=llm,
            tools=tools,
            system_prompt="你是天气助手。查询天气后，根据气温给出穿衣建议。",
        )
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": "北京天气如何，穿什么合适？"}]},
            config={"recursion_limit": 20},
        )
        print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
```

  这里有两个不同来源的工具：`get_temperature_tip` 是当前进程中的 Python 函数，`get_weather` 则来自 MCP Server，但对 Agent 来说，它们都已经成为统一的 LangChain 工具。

  注意：“直接注册 / MCP 接入”与“本地 / 远程”是两个维度。一个直接注册的工具也可以在函数内部请求远程 API，一个 MCP 工具也可以通过 Stdio 在同一台机器上执行。

  前文亲手编写 ReAct 循环，是为了理解 `agent -> tools -> agent`。这里用 `create_agent()` 复用这套循环；如果保留手写的图，也可以把适配后的工具交给 `bind_tools()` 和 `ToolNode`。参考：[LangChain MCP 工具接入](https://docs.langchain.com/oss/python/langchain/mcp/tools)。

### 多服务接入：一张工具表，多个能力来源
  一个 Agent 不必只连接一个 MCP Server，也不必把所有第三方服务都转发到自己搭建的 Server 上。

  当前 `MCPAdapter` 可以接收 `mcpServers` 配置。例如，下面同时连接本地脚本和 HTTP 服务；这是替换上一节 Adapter 初始化部分的配置片段：

```python
from pathlib import Path
import sys

connections = {
    "mcpServers": {
        "weather_local": {
            "command": sys.executable,
            "args": [str(Path("stdio_server.py").resolve())],
        },
        "weather_remote": {
            "url": "http://127.0.0.1:8001/mcp",
        },
    }
}

# 使用 MCPAdapter(connections) 替换 MCPAdapter("http://...") 即可
```

  这个例子故意用两种方式连接天气服务，便于观察协议差异。实际项目中，可以换成搜索、知识库、工单系统等不同能力。多服务配置会为工具名添加服务前缀，处理不同服务中同名工具的冲突。参考：[连接与多服务配置](https://docs.langchain.com/oss/python/langchain/mcp/connections)。

  工具来源多了，不代表要把所有工具一次性塞给模型。更合理的方式是按任务筛选工具，或者按领域分配给不同专家，这也是下一章多智能体要解决的问题。

### 从跑通到部署：哪些东西应该长期运行？
  一个典型的服务器部署结构如下：

```text
浏览器前端（Vue / React / Streamlit）
    ↓ HTTP 请求，SSE 或 WebSocket 接收执行事件
Agent 后端（LangGraph）
    ├─ 直接调用业务函数或服务商 API
    ├─ MCP Client → 第三方 MCP Server
    └─ MCP Client → 自建 MCP Server → 内部业务系统
```

  MCP Server 可以与 Agent 部署在同一台机器，也可以分开部署。需要远程共享的服务，通过 Streamable HTTP 提供接口，使用 Docker、systemd 等管理进程的启动、重启与日志。服务要持续可用，但客户端不必一直保持一条连接。

  部署时主要关注三件事：

  1. 凭据与权限：服务商 API Key 放在服务端环境变量或密钥管理系统中；远程接口配置 HTTPS、认证与工具权限，服务端校验调用者身份。
  2. 超时与重试：查询工具可以按策略重试；创建订单、发消息等有副作用的操作，需要幂等键或状态核查，避免断线重试造成重复执行。
  3. 业务状态：用户身份、会话历史与任务进度由业务系统或 Agent 状态管理，不能假定 HTTP 连接本身替我们保存了这些信息。

  如果多个 Agent、多个团队需要共享大量工具，还可以增加 MCP 网关，统一认证、限流和审计。它是集中管理的一层，不是每个 MCP 项目都必须添加的一层。

### 流式接入：MCP 进度不等于前端文字流
  Streamable HTTP 中的“Streamable”，并不代表工具函数返回的字符串会自动逐字显示，也不代表 MCP Server 会自动产生模型的 Token。

| 流的来源 | 内容 | 如何进入前端 |
| --- | --- | --- |
| 大模型 | 消息片段、工具调用参数片段 | LangGraph `messages` 流 |
| 图的节点 | 节点返回的状态更新 | LangGraph `updates` 流 |
| 工具运行过程 | 日志、进度通知 | 客户端接收后，按需转换成 `custom` 事件 |

  工具进度需要服务端显式上报、客户端接收并转发。浏览器这一侧，再由 Agent 后端使用 SSE 或 WebSocket 推送。这和 MCP Client 到 MCP Server 的连接是两段独立的通信链路。

## multi_agent
  前面在 LangGraph 进阶中，我们已经手写过 Supervisor 调度专家的协作图。但那个例子主要解决“下一个节点由谁执行”，还没有完整解决另一个问题：**不同专家应该看到哪些信息，最终又应该交回什么结果？**

  如果所有专家都读取同一份不断增长的消息历史，就相当于把公司的全部邮件抄送给每一个员工。人虽然分工了，信息却没有分工。这一章，我们继续把多智能体从“多个节点”推进到“有边界的协作系统”。

### 多智能体到底拆的是什么？
  拆分 Agent，通常是在拆分职责、上下文、工具权限与执行策略，而不一定是在拆分模型。

| 维度 | 日志专家 | 方案专家 | 总控 |
| --- | --- | --- | --- |
| 职责 | 获取日志，分析故障证据 | 查询运维手册，提出处理步骤 | 分配任务，汇总结果 |
| 上下文 | 当前日志任务与必要背景 | 当前处理任务与故障摘要 | 用户请求与专家报告 |
| 工具 | 日志查询 | 手册检索 | 调用两个专家 |
| 输出 | 现象、证据、判断、不确定项 | 建议步骤、风险与验证方式 | 面向用户的完整回答 |

  三个 Agent 可以使用同一个模型服务，也可以使用不同模型。它们甚至可以运行在同一个 Python 进程中，多智能体并不等于必须部署多台服务器。

  同样，一个调用了 LLM 的节点也未必就是完整 Agent。如果它只做一次分类或总结，可以把它视为模型节点；需要自主选择工具、多轮执行时，再给它完整的 Agent 循环。

### 常见协作方式：调度、交接与固定流程

| 模式 | 执行方式 | 适合的任务 |
| --- | --- | --- |
| Supervisor / Subagents | 总控调用专家，专家返回结果，总控继续处理 | 研究、运维、跨领域问答 |
| Handoffs | 当前 Agent 把后续对话控制权交给另一位专家 | 客服转接、分阶段咨询 |
| 固定工作流 | 代码规定先后顺序或并行分支 | 检索后审核、生成后校验、多来源分析 |

  可以把第一种理解为“经理派活，员工交报告”；第二种是“把客户转接给专门的负责人”；第三种则是“按已经确定的工序执行”。

  固定工作流与自主决策可以组合：外层用 LangGraph 固定执行顺序，内层的专家自行选择工具。没有必要让模型连“已经确定的下一步”也重新决定一次。

### Agent-as-a-Tool：把专家当作工具调用
  还记得前面的 Graph-as-a-Tool 吗？我们把一张子图封装成工具，交给主 Agent 调用。Agent-as-a-Tool 延续同一个思路：把专家自己的 ReAct 循环封装成工具，主 Agent 只需要提交任务并等待报告。

```text
用户 → Supervisor
           ├─ analyze_logs(task) → 日志专家 → 日志工具
           └─ consult_runbook(task) → 方案专家 → 手册工具
                 ↓ 返回各自的报告
           Supervisor 汇总 → 用户
```

  下面用模拟日志和手册数据，把重点放在协作机制上。示例沿用 `config.py` 中的模型凭据，安装 `langchain` 1.x、`langchain-openai` 与 `langgraph` 后，可以独立运行：

```python
import asyncio

from config import OPENAI_API_KEY
from langchain.agents import create_agent
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver


# 1. 准备两个不同领域的工具，数据均为模拟
@tool
def read_service_logs(service: str) -> str:
    """查询服务的模拟错误日志，分析故障时使用。"""
    return f"[模拟日志] {service}: worker 被 OOM killer 终止，内存达到容器上限。"


@tool
def search_runbook(query: str) -> str:
    """检索模拟运维手册，获取故障检查与恢复建议。"""
    return (
        "[模拟手册] OOM：先检查内存曲线、容器限制、并发与批处理大小；"
        "保留故障证据，再评估扩容或降低并发。重启只能临时恢复，不能证明根因已解决。"
    )


# 2. 共用模型配置，各专家拥有自己的提示与工具列表
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=OPENAI_API_KEY,
    base_url="https://api.deepseek.com",
)

log_agent = create_agent(
    model=llm,
    tools=[read_service_logs],
    system_prompt=(
        "你是日志分析专家。先查日志，再报告现象、证据、判断与不确定项。"
        "保留数据中的模拟标记，不把推测写成事实，不执行修复。"
    ),
)

runbook_agent = create_agent(
    model=llm,
    tools=[search_runbook],
    system_prompt=(
        "你是运维方案专家。先检索手册，再给出检查步骤、处理建议与验证方法。"
        "保留模拟标记；你没有操作服务器的权限，不得声称已经完成修复。"
    ),
)


# 3. 专家工具只传入任务，返回报告，不把整段内部历史带回总控
@tool
async def analyze_logs(task: str) -> str:
    """委派日志专家，查询指定服务的日志并返回故障分析报告。"""
    result = await log_agent.ainvoke(
        {"messages": [{"role": "user", "content": task}]},
        config={"recursion_limit": 12},
    )
    return result["messages"][-1].content


@tool
async def consult_runbook(task: str) -> str:
    """委派方案专家，根据故障现象查询运维手册并返回处理建议。"""
    result = await runbook_agent.ainvoke(
        {"messages": [{"role": "user", "content": task}]},
        config={"recursion_limit": 12},
    )
    return result["messages"][-1].content


# 4. 总控负责用户会话，专家默认每次接收一份新的任务输入
supervisor = create_agent(
    model=llm,
    tools=[analyze_logs, consult_runbook],
    system_prompt=(
        "你是运维总控。先委派日志专家获取证据，再把必要的故障摘要交给方案专家。"
        "最后汇总现象、证据、建议和未确认事项。"
        "调用专家时必须说明服务名与具体任务，保留模拟数据标记。"
        "当前只有查询与建议能力，不得声称已经重启或修复服务。"
    ),
    checkpointer=InMemorySaver(),
)


async def main():
    result = await supervisor.ainvoke(
        {"messages": [{"role": "user", "content": "payment-api 容器反复退出，请分析原因并给出处理建议。"}]},
        config={
            "configurable": {"thread_id": "ops-demo-001"},
            "recursion_limit": 30,
        },
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(main())
```

  预期流程是：总控委派日志专家，日志专家查日志并报告 OOM 现象；总控把这个故障摘要交给方案专家，获得检查建议后汇总回答。调用路径由模型选择，具体措辞和调用次数可能变化；如果业务要求严格按这个顺序执行，就应该用固定的图边来约束。

  这个实现与前面的共享消息版本有一个关键区别：专家在自己的局部消息列表中完成工具调用，总控收到的只有最终报告。工具调用消息与对应的 `ToolMessage` 留在专家内部，不需要把半段调用历史搬到主会话中。实现模式参考：[LangChain 子智能体](https://docs.langchain.com/oss/python/langchain/multi-agent/subagents)。

### 上下文隔离：派任务，而不是转发全部聊天记录
  假设用户先讨论了十轮数据库问题，再问“查一下 payment-api 为什么退出”。日志专家通常只需要服务名、时间范围、环境和故障现象，并不需要前十轮无关聊天。

  因此，总控派发的内容应该像一张任务单：

```text
任务：分析 payment-api 在测试环境反复退出的原因。
范围：最近 30 分钟，只读查询。
已知现象：容器反复重启。
需要返回：关键日志、证据支持的判断、尚未确认的事项。
```

  隔离也不能走向另一个极端：只发“分析一下”却不带服务名，专家自然无法工作。总控要做的是提取必要背景，并明确交付要求。

  当前示例把专家的 `content` 当作文本报告。任务复杂后，可以进一步约定结构化字段，例如 `summary`、`evidence`、`uncertainties`，并校验输出。这样后续节点才能按字段处理，而不必反复猜测一大段自然语言的意思。

### 并行协作：能同时做的任务，不必排队
  前面的运维任务存在依赖：先查日志，才能针对实际故障查询手册，因此应该串行。另一类任务则彼此独立，例如同时做技术方案的成本分析与风险分析，最后汇总。

  对于固定的并行任务，可以直接用 LangGraph 的分支与汇合。下面用两个模拟分析节点展示控制流，实际项目中把节点函数体替换成专家的 `ainvoke()` 即可：

```python
import asyncio
from typing import TypedDict

from langgraph.graph import StateGraph, START, END


class ReviewState(TypedDict):
    requirement: str
    cost_report: str
    risk_report: str
    final_report: str


async def analyze_cost(state: ReviewState):
    return {"cost_report": f"[模拟成本分析] {state['requirement']}：统计模型调用、存储与运维成本。"}


async def analyze_risk(state: ReviewState):
    return {"risk_report": f"[模拟风险分析] {state['requirement']}：检查权限隔离、失败恢复与重复执行。"}


def summarize(state: ReviewState):
    # 汇合后，两份报告都已经写入 State
    return {"final_report": state["cost_report"] + "\n" + state["risk_report"]}


builder = StateGraph(ReviewState)
builder.add_node("cost", analyze_cost)
builder.add_node("risk", analyze_risk)
builder.add_node("summary", summarize)

# 同一个起点激活两个分支
builder.add_edge(START, "cost")
builder.add_edge(START, "risk")

# 列表形式表示等待两个分支都结束，再进入汇总节点
builder.add_edge(["cost", "risk"], "summary")
builder.add_edge("summary", END)
app = builder.compile()


async def main():
    result = await app.ainvoke({"requirement": "部署一个内部知识库 Agent"})
    print(result["final_report"])


if __name__ == "__main__":
    asyncio.run(main())
```

  这里让两个分支写不同的字段，避免同时覆盖同一个值。如果多个并行节点都要向 `reports` 列表追加内容，就需要为该字段声明合并规则，例如 `Annotated[list[str], operator.add]`；汇总时再按任务编号整理顺序，不能把并发结果的到达顺序当成业务顺序。

  另一个容易混淆的地方：函数写成 `async def`，不代表任务已经并行，也不代表用户可以在后台任务运行期间继续聊天。是否并行由调度和等待方式决定；后台任务还需要任务状态、结果存储与取消机制。图的执行与状态合并参考：[LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)。

### 多智能体 + MCP：职责分工与能力复用
  把这两章连起来看，职责就很清晰了：多智能体负责“谁来处理”，MCP 负责“工具怎么接入”。

```text
Supervisor
    ├─ 日志专家 → 日志 MCP 工具
    ├─ 知识专家 → 内部知识库 MCP 工具
    └─ 方案专家 → 文档检索工具
```

  可以先从不同 MCP Server 加载工具，再把对应工具列表传给各自的 `create_agent()`。这样工具服务可以独立维护，专家的 Prompt 和执行逻辑也能独立调整。

  但分配工具不等于完成权限控制。不给专家绑定重启工具，可以减少误调用；真正的身份认证与授权仍应由工具服务校验。需要执行重启、删除、发送等操作时，再接入前面学过的人工审批机制。

### 从协作 Demo 到可维护系统
  多几个 Agent 不会自动提高效果。每次委派都会增加模型调用、延迟和上下文传递，也可能让错误在专家之间传播。只有职责、工具或上下文确实需要分开时，拆分才有意义。

  落到工程实现，重点关注以下几件事：

| 问题 | 处理方式 |
| --- | --- |
| 总控反复委派，迟迟不结束 | 设置递归步数、总耗时与调用预算，明确失败退出条件 |
| 专家失败被包装成成功报告 | 返回明确的失败状态，保留错误信息，由总控决定重试或降级 |
| 重启后会话丢失 | `InMemorySaver` 仅用于内存演示，持久化需要数据库检查点 |
| 所有专家共享敏感信息 | 按任务传递必要字段，在服务端实施权限控制 |
| 看不到是哪位专家出错 | 为一次请求关联 Trace，记录专家、工具、耗时与结果 |
| 用户只看到最终答案 | 消费 LangGraph 消息、节点更新与自定义进度事件，并标记事件来源 |

  递归限制计算的是图的执行步数，不等于模型调用次数；调用预算和超时仍需单独管理。同样，记忆保留多久、哪些信息需要跨任务共享，也应在设计时明确，而不是把所有消息无限追加。持久化机制参考：[LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)。

  至此，我们把整条链路串了起来：LangGraph 管理执行与状态，Agent 根据任务选择动作，MCP 连接可复用的工具，多个专家通过清晰的输入与输出协作，前端再把执行过程展示给用户。



  参考：[agent-craft](https://github.com/Annyfee/agent-craft)
