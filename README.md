# Collie Code

基于 [Claude Code](https://www.npmjs.com/package/@anthropic-ai/claude-code) v2.1.88 源码还原的二次开发版本。

> 源码通过 npm 发布包内附带的 source map 还原，版权归 [Anthropic](https://www.anthropic.com) 所有。仅供技术研究与学习，请勿用于商业用途。

## 与原版的差异

- 品牌名称改为 **Collie Code**
- 主题色调整为灰绿色
- Logo 改为狗头形象
- 修复 `@anthropic-ai/sdk` v0.39.0 中 `APIError.headers` Proxy 对象的 `.get()` 兼容问题

## 环境要求

- Node.js >= 18
- Anthropic API Key（复用本地 Claude Code 配置）

## 快速开始

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行
npm start
```

## 项目结构

```
├── build.mjs          # esbuild 构建脚本
├── package.json
├── tsconfig.json
├── src/
│   ├── entrypoints/   # CLI 入口
│   ├── shims/         # 平台兼容垫片（sandbox-runtime、bun 等）
│   ├── components/    # Ink/React 终端 UI 组件
│   ├── tools/         # 内置工具（Bash、FileEdit、Grep、Glob 等）
│   ├── commands/      # CLI 子命令
│   ├── services/      # API 调用、MCP、分析等服务层
│   ├── utils/         # 通用工具函数
│   ├── coordinator/   # 多 Agent 协调
│   ├── skills/        # 技能系统
│   └── ...
├── dist/              # 构建产物（gitignore）
└── vendor/            # ripgrep 等二进制依赖（gitignore）
```

## 构建说明

项目使用 esbuild 将 TypeScript 源码打包为单文件 `dist/cli.js`。构建过程中：

- 约 170 个内部/私有模块通过 stub 插件自动填充空实现
- `@anthropic-ai/sandbox-runtime` 等不可用包通过 `src/shims/` 提供兼容垫片
- `vendor/ripgrep/` 提供内置的 ripgrep 二进制文件，需从原始 npm 包中复制

## 声明

- 源码版权归 [Anthropic](https://www.anthropic.com) 所有
- 本项目仅用于技术研究与学习
