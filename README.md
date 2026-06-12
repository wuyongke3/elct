# GIF 工具箱

一个基于 Electron + Vue + Vite 的桌面端 GIF 编辑工具，支持抽帧、压缩等功能。

## 功能

- **抽帧**：加载 GIF 所有帧预览，选中后删除指定帧；支持每隔 N 帧自动删除
- **压缩**：O1/O2/O3 优化等级、有损压缩（lossy）、颜色数限制、缩放比例
- **调整尺寸**：等比/自由缩放
- **其他**：旋转（90°/180°/270°）、循环次数设置、倒放、导出单帧

## 技术栈

- Electron 42
- Vue 3 + TypeScript
- Vite 8
- gifsicle-wasm-browser（WASM 版 gifsicle）

## 快速开始

```sh
# 安装依赖
npm install

# 开发模式
npm run dev

# 打包 Windows
npm run build:win

# 打包 macOS
npm run build:mac

# 打包 Linux
npm run build:linux
```

打包产物在 `dist/windows` / `dist/mac` / `dist/linux` 目录下。

## 版权

Copyright © 2026 [easygo](https://github.com/wuyongke3)

MIT License
