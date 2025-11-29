# AGENTS.md

## 项目概览 (Project Overview)
**魔导工坊: 高能过载 (修复版)** 是一款基于浏览器的能量物理模拟解谜游戏。
**Magitech Engine: High Energy Overload (Fixed)** is a browser-based puzzle game involving energy physics simulation.

## 技术栈 (Tech Stack)
- **HTML5**: 核心结构
- **Tailwind CSS**: 样式 (通过 CDN 加载)
- **Vanilla JavaScript**: 游戏逻辑
- **Canvas API**: 渲染引擎

## 文件结构 (File Structure)
- `index.html`: 游戏入口点 (Entry point).
- `css/`: 包含样式文件 (`style.css`).
- `js/`: 包含游戏逻辑脚本.
  - `config.js`: 常量配置.
  - `state.js`: 全局状态管理.
  - `main.js`: 初始化与主循环.
  - `components/`: 绘制组件 (`drawing.js`).
  - `systems/`: 核心系统 (`physics.js`, `input.js`, `renderer.js`).

## 开发指南 (Guidelines)
1. **模块化结构 (Modular Structure)**: 项目已重构为模块化结构。所有 JavaScript 逻辑分布在 `js/` 目录下。保持逻辑分离 (UI, 物理, 渲染)。
2. **移动端适配**: 游戏设计为支持触摸操作，请确保 `touch-action: none` 等属性保留。
3. **Canvas 渲染**: 使用 `pixelated` 渲染模式保持复古风格。

## 运行方式 (How to Run)
直接在浏览器中打开 `index.html` 即可运行。
