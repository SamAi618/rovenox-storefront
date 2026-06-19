---
name: code-rules-skills
description: 执行简洁、安全的 AI 编程规则，用于实现、代码审查、重构和调试。Use when Codex writes or changes code, reviews code for rule violations, works on JavaScript/TypeScript/React/Next.js projects, touches AI or LLM integrations, changes dependencies or environment variables, or handles database/security-sensitive code.
---

# 代码规则技能

## 总览

写代码或审查代码时，把这些规则当成硬约束。优先做满足当前需求的最小清晰改动；遇到非法输入要明确报错；不要写会隐藏问题、掩盖失败、制造假成功的代码。

## 工作流程

1. 修改前先阅读当前项目已有写法和约定。
2. 选择能满足当前需求的最简单实现。
3. 对照下面的规则检查新增或修改的代码。
4. 修改 `package.json`、锁文件或 `.env` 文件前，先停下来告诉用户。
5. 用最小但有用的验证方式确认改动有效。

## 项目技术栈约束

- 具体项目技术栈以当前项目的 `AGENTS.md`、`package.json`、锁文件和运行时配置为准。
- 新建项目、升级依赖或选择技术方案时，优先使用最新稳定版本，并先实时确认官方文档或 npm registry 的 `latest` / LTS 信息。
- 不要凭旧记忆写死版本；已有项目固定版本时，不要静默升级。

## 核心设计规则

- 遵守 YAGNI：只做当前需求用得上的东西。不要提前设计扩展点、抽象层、占位选项或 `TODO` 注释。
- 遵守 KISS：简单代码能解决就用简单代码。能用普通函数就不要写类；能用 `if-else` 就不要上策略模式、工厂模式或复杂框架式写法。
- 把命名当成设计：变量名要说清楚里面装的是什么，函数名要说清楚它做什么。避免 `data`、`temp`、`helper`、`util`、`manager`、`do*`、`process*`、`handle*` 这类空泛名字。
- 快速失败：在 API、数据库、文件、用户输入等边界校验数据。报错要具体，并包含导致出错的值。不要静默失败。

## 依赖和环境规则

- 使用 `pnpm`，不要用 `npm install`。
- 使用 ESM `import`，不要用 `require()`。
- 使用原生 `fetch` 或 `ofetch`，不要用 `axios`。
- 使用 `date-fns` 或原生 `Intl`，不要用 `moment.js`。
- React 项目里不要用 jQuery。
- 不要在没告诉用户的情况下修改依赖、`package.json`、锁文件或环境变量。

## AI 和 LLM 规则

- 不要把 `OPENAI_API_KEY`、`ANTHROPIC_API_KEY` 或其他密钥写进前端代码。需要密钥的请求必须走后端代理。
- OpenAI 相关代码使用 AI SDK v6，不要用旧版 `chat.completions`。
- 保持流式响应的流式特性。不要对流式响应调用 `await response.text()`。
- 不要把 prompt 硬编码在 UI 组件里。prompt 放到可版本化管理的 `prompts/` 目录。
- LLM 调用失败时不要返回假成功数据或 mock 兜底数据。要清楚地暴露错误。

## Next.js 规则

- 使用 App Router，不要回退到 `pages/`。
- 不要在 `'use client'` 组件里直接读取数据库。使用 Server Component、Server Action 或服务端 API 边界。
- 不要用 `useEffect` 做初始数据加载。优先使用 Server Component，合适时使用 SWR。

## 代码风格规则

- 单文件不要超过 200 行。快超过时拆成职责明确的小文件。
- 不要留下 `TODO` 注释。
- 不要写宽泛的 catch 后只打印日志，例如 `try { ... } catch (e) { console.log(e) }`。
- 只捕获代码确实能处理的具体错误；不能处理就让它失败。
- 提交代码时使用语义清楚的 commit message，让人能看懂为什么改。

## 数据和安全规则

- 不要执行没有 `WHERE` 条件的 `DELETE`。优先使用软删除。
- 不要明文存储用户密码。使用 `bcrypt` 或 `argon2`。
- 不要在前端或日志里展示完整 token、API key 或密钥。

## 审查清单

- 标出过度抽象、用不到的扩展点和为了未来而写的代码。
- 标出命名含糊、动词空泛的问题。
- 标出静默失败、吞异常、假成功数据和 mock 兜底。
- 标出禁用依赖、旧 OpenAI API、密钥泄露和不安全数据库操作。
- 标出 Next.js 路由、客户端取数和数据加载方式违规。
