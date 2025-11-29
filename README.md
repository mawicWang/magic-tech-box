# 魔导工坊: 高能过载 (修复版) / Magitech Engine: High Energy Overload (Fixed)

一款基于浏览器的能量物理模拟解谜游戏。通过放置抽取泵、导线、电容等元件，构建能量传输网络，制造并加速粒子。

A browser-based puzzle game involving energy physics simulation. Build energy transmission networks using extractors, wires, capacitors, etc., to create and accelerate particles.

## 🎮 游戏玩法 (Gameplay)

目标：构建稳定的能量网络，制造粒子并将其射入发射终端以获取分数。

**统计系统 (Statistics):**
游戏左上角实时显示能量生成 (GEN)、消耗 (USE)、排放 (REC) 及系统效能 (EFFICIENCY)，帮助工程师优化工坊效率。
The top-left panel shows real-time stats: Generation (GEN), Usage (USE), Recycled/Vented (REC), and System Efficiency.

**主要元件 (Tools):**
- **抽取泵 (Extractor)**: 放置在高亮区域抽取环境能量。
- **超导线 (Wire)**: 传输能量。
- **电容堆 (Battery)**: 储存大量能量，防止过载。
- **排气阀 (Vent)**: 安全排放多余能量，防止爆炸。
- **物质发生器 (Maker)**: 消耗能量制造粒子。
- **磁轨 (Rail)**: 消耗能量加速粒子。
- **发射终端 (Emitter)**: 粒子的终点，得分点。

**操作 (Controls):**
- **点击/拖拽**: 放置或使用工具。
- **点击已放置元件**: 旋转元件（部分元件支持）。
- **运行开关**: 点击右下角闪电图标开始/停止模拟 (快捷键: Space)。
- **清空**: 点击左下角 CLR 按钮清空地图。
- **快捷键 (Shortcuts)**:
    - `1` - `7`: 选择对应工具 (Select Tools)
    - `X` / `Delete`: 拆除模式 (Eraser)
    - `Space`: 运行/暂停 (Run/Pause)

## 🛠️ 技术栈 (Tech Stack)

- **HTML5**: 核心结构
- **Tailwind CSS**: 样式 (CDN)
- **Vanilla JavaScript**: 游戏逻辑
- **Canvas API**: 渲染引擎
- **Web Audio API**: 音效系统 (BGM & SFX)

## 🚀 运行与部署 (Run & Deploy)

**本地运行 (Local)**:
直接在浏览器中打开 `index.html` 即可。
Open `index.html` directly in your browser.

**在线试玩 (Demo)**:
[GitHub Pages Link](https://<YOUR_USERNAME>.github.io/<REPO_NAME>/)
*(Enable GitHub Pages in repository settings to view)*

## 📂 文件结构 (Structure)

- `index.html`: 游戏入口。
- `css/style.css`: 样式文件。
- `js/app.js`: 游戏逻辑。
- `js/audio.js`: 音频系统。
