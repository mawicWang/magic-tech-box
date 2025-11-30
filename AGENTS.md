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
- `index.html`: 游戏入口 (HTML)。
- `css/style.css`: 游戏样式。
- `js/app.js`: 游戏主循环与UI逻辑。
- `js/engine.js`: 核心物理与模拟引擎。
- `tests/`: 自动化测试用例。

## 开发指南 (Guidelines)
1. **模块化结构**: 项目已重构为分离的 HTML/CSS/JS 结构。
2. **移动端适配**: 游戏设计为支持触摸操作，请确保 `touch-action: none` 等属性保留。
3. **Canvas 渲染**: 使用 `pixelated` 渲染模式保持复古风格。

## 运行方式 (How to Run)
直接在浏览器中打开 `index.html` 即可运行。
