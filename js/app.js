/**
 * 核心逻辑: Magitech Engine v5.0 (Standardized)
 */

// --- 游戏引擎实例 ---
// Assumes js/engine.js is loaded
const engine = new GameEngine();

// --- 全局 UI 状态 ---
let currentTool = 'extractor';
let isRunning = false;
let score = 0;
let lastTime = 0;
let gameState = 'MENU'; // MENU, PLAYING
let statTimer = 0;

// 渲染相关
const container = document.getElementById('game-container');
const mainCanvas = document.getElementById('mainCanvas');
const bgCanvas = document.getElementById('bgCanvas');
const ctx = mainCanvas.getContext('2d');
const bgCtx = bgCanvas.getContext('2d');

let TILE_SIZE = 0;
let canvasRect = { left:0, top:0, width:0, height:0 };

// 交互状态
let inputState = {
    isDown: false,
    gx: -1, gy: -1, // 当前网格坐标
    startX: -1, startY: -1 // 按下的起始坐标
};

let dragState = {
    active: false,
    type: null,
    fromGrid: false,
    originalX: -1,
    originalY: -1,
    data: null,
    dragX: 0,
    dragY: 0
};

// --- 初始化与菜单 ---

function init() {
    setupMenu();
    initToolbar();
    window.addEventListener('resize', handleResize);
    handleResize();

    // 键盘快捷键
    window.addEventListener('keydown', handleKeyDown);

    // Engine Callbacks
    engine.onScore = (points) => {
        score += points;
        document.getElementById('score-display').innerText = score;
    };
    engine.onExplode = () => {
        container.classList.add('shaking');
        setTimeout(()=>container.classList.remove('shaking'), 400);
    };

    // 默认不开始，显示菜单
    renderMenuBackground();
}

function initToolbar() {
    const container = document.getElementById('toolbar-container');
    container.innerHTML = '';

    let index = 1;
    for (const key in COMPONENTS) {
        const def = COMPONENTS[key];
        const btn = document.createElement('button');

        btn.onpointerdown = (e) => {
            selectTool(key, def.name + ': ' + def.desc);
            startDrag(key, false, -1, -1, e.clientX, e.clientY);
        };

        btn.id = 'btn-' + key;
        btn.className = "tool-btn flex-none w-14 h-14 rounded flex flex-col items-center justify-center gap-1 transition hover:bg-slate-800 select-none touch-none";
        if (key === currentTool) btn.classList.add('active');

        btn.innerHTML = `
            ${def.iconHtml || '<div class="w-3 h-3 bg-slate-500"></div>'}
            <span class="text-[9px] text-slate-300">${def.name.slice(0, 4)} [${index}]</span>
        `;
        container.appendChild(btn);
        index++;
    }

    // Divider
    const div = document.createElement('div');
    div.className = "w-px h-8 bg-slate-700 mx-1";
    container.appendChild(div);

    // Eraser
    const eraserBtn = document.createElement('button');
    eraserBtn.onclick = () => selectTool('eraser', '拆除元件');
    eraserBtn.id = 'btn-eraser';
    eraserBtn.className = "tool-btn flex-none w-14 h-14 rounded flex flex-col items-center justify-center gap-1 text-red-500 hover:bg-slate-800";
    eraserBtn.innerHTML = `
        <span class="text-xl font-bold">× [X]</span>
    `;
    container.appendChild(eraserBtn);

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = "w-4 flex-none";
    container.appendChild(spacer);
}

function returnToMenu() {
    gameState = 'MENU';
    isRunning = false;
    document.getElementById('main-menu').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('runBtn').classList.add('bg-slate-800', 'border-green-500');
    document.getElementById('runBtn').classList.remove('bg-red-900', 'border-red-500');
}

function setupMenu() {
    const list = document.getElementById('level-list');
    list.innerHTML = '';

    LEVELS.forEach((lvl, idx) => {
        const btn = document.createElement('button');
        btn.className = "w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 text-left transition group";
        btn.onclick = () => startGame(idx);

        btn.innerHTML = `
            <div class="text-green-400 font-bold group-hover:text-white transition">${lvl.name}</div>
            <div class="text-xs text-slate-500 group-hover:text-slate-400">${lvl.desc}</div>
        `;
        list.appendChild(btn);
    });
}

function startGame(levelId) {
    if(window.AudioSystem) window.AudioSystem.init();

    // Hide Menu
    document.getElementById('main-menu').classList.add('opacity-0', 'pointer-events-none');
    gameState = 'PLAYING';
    score = 0;
    isRunning = true;

    // Load Level Data via Engine
    const level = LEVELS[levelId];
    engine.setupLevel(level ? level.setup : null);

    // Reset UI
    document.getElementById('runBtn').classList.add('bg-red-900', 'border-red-500');
    document.getElementById('runBtn').classList.remove('bg-slate-800');
    document.getElementById('score-display').innerText = score;

    selectTool('extractor', '抽取泵: 放置在高亮区域');
    handleResize(); // Redraw BG

    requestAnimationFrame(gameLoop);
}

function renderMenuBackground() {
    if(gameState === 'MENU') {
        // Just a loop to keep background alive if we want dynamic background in menu
        // For now, CSS handles it.
    }
}

// --- 适配与渲染核心 ---
function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const size = Math.floor(Math.min(w, h) - 20);

    mainCanvas.width = size;
    mainCanvas.height = size;
    mainCanvas.style.width = size + 'px';
    mainCanvas.style.height = size + 'px';

    bgCanvas.width = size;
    bgCanvas.height = size;
    bgCanvas.style.width = size + 'px';
    bgCanvas.style.height = size + 'px';

    TILE_SIZE = size / GRID_SIZE;

    updateRect();
    if(gameState === 'PLAYING') drawAmbientBg();
}

function updateRect() {
    canvasRect = mainCanvas.getBoundingClientRect();
}

function drawAmbientBg() {
    bgCtx.clearRect(0,0, bgCanvas.width, bgCanvas.height);
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const e = engine.ambientMap[y][x];
            bgCtx.fillStyle = `rgba(30, 64, 175, ${e / 150})`;
            bgCtx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if(e > 70 && Math.random()>0.8) {
                bgCtx.fillStyle = 'rgba(255,255,255,0.1)';
                bgCtx.fillRect(x*TILE_SIZE + Math.random()*TILE_SIZE, y*TILE_SIZE+Math.random()*TILE_SIZE, 2, 2);
            }
        }
    }
}

// --- 交互逻辑 ---
function startDrag(type, fromGrid, ox, oy, clientX, clientY) {
    if (window.AudioSystem && !window.AudioSystem.initialized) {
        window.AudioSystem.init();
    }

    dragState.active = true;
    dragState.type = type;
    dragState.fromGrid = fromGrid;
    dragState.originalX = ox;
    dragState.originalY = oy;
    dragState.dragX = clientX;
    dragState.dragY = clientY;

    if (fromGrid) {
        dragState.data = engine.grid[oy][ox];
        engine.grid[oy][ox] = null;
        if(window.AudioSystem) window.AudioSystem.playSFX('click');
    } else {
        const def = COMPONENTS[type];
        dragState.data = {
            type: type,
            rotation: 1,
            energy: 0,
            maxEnergy: def.maxEnergy,
            cooldown: 0
        };
    }
}

window.addEventListener('pointermove', e => {
    if(dragState.active) {
        dragState.dragX = e.clientX;
        dragState.dragY = e.clientY;
        e.preventDefault();
        return;
    }

    if(gameState === 'PLAYING' && inputState.isDown && currentTool === 'eraser') {
        handleEraser(e.clientX, e.clientY);
    }
});

window.addEventListener('pointerup', e => {
    if(dragState.active) {
        endDrag(e);
        dragState.active = false;
        e.preventDefault();
    }
    inputState.isDown = false;
});

function endDrag(e) {
    updateRect();
    const relX = e.clientX - canvasRect.left;
    const relY = e.clientY - canvasRect.top;
    const x = Math.floor(relX / TILE_SIZE);
    const y = Math.floor(relY / TILE_SIZE);

    let placed = false;

    if(x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        if(dragState.fromGrid && x === dragState.originalX && y === dragState.originalY) {
            dragState.data.rotation = (dragState.data.rotation + 1) % 4;
            engine.grid[y][x] = dragState.data;
            if(window.AudioSystem) window.AudioSystem.playSFX('rotate');
            placed = true;
        } else if (engine.grid[y][x] === null) {
            engine.grid[y][x] = dragState.data;
            if(window.AudioSystem) window.AudioSystem.playSFX('place');
            placed = true;
        }
    }

    if(!placed) {
        if(dragState.fromGrid) {
            engine.grid[dragState.originalY][dragState.originalX] = dragState.data;
        }
    }

    dragState.data = null;
}

mainCanvas.addEventListener('pointerdown', e => {
    if(gameState !== 'PLAYING') return;
    e.preventDefault();
    updateRect();

    if (window.AudioSystem && !window.AudioSystem.initialized) {
        window.AudioSystem.init();
    }

    const relX = e.clientX - canvasRect.left;
    const relY = e.clientY - canvasRect.top;
    const x = Math.floor(relX / TILE_SIZE);
    const y = Math.floor(relY / TILE_SIZE);

    if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    if (currentTool === 'eraser') {
        inputState.isDown = true;
        handleEraser(e.clientX, e.clientY);
    } else {
        if (engine.grid[y][x]) {
            startDrag(engine.grid[y][x].type, true, x, y, e.clientX, e.clientY);
        } else if (currentTool && currentTool !== 'eraser') {
            startDrag(currentTool, false, -1, -1, e.clientX, e.clientY);
        }
    }
});

function handleEraser(clientX, clientY) {
    updateRect();
    const relX = clientX - canvasRect.left;
    const relY = clientY - canvasRect.top;
    const x = Math.floor(relX / TILE_SIZE);
    const y = Math.floor(relY / TILE_SIZE);

    if(x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE && engine.grid[y][x]) {
        engine.grid[y][x] = null;
        if(window.AudioSystem) window.AudioSystem.playSFX('delete');
    }
}

function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if(key >= '1' && key <= '9') {
        const tools = Object.keys(COMPONENTS);
        const idx = parseInt(key) - 1;
        if(idx < tools.length) {
            const t = tools[idx];
            selectTool(t, COMPONENTS[t].desc);
        }
    } else if (key === 'x' || key === 'delete') {
        document.getElementById('btn-eraser').click();
    } else if (key === ' ') {
        e.preventDefault();
        toggleRun();
    }
}

// --- 游戏循环 ---
function gameLoop(timestamp) {
    if(gameState !== 'PLAYING') return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if(isRunning) {
        engine.update();

        // Check danger (simplified from previous logic, checking if any effect is 'explode' type or just iterate grid)
        // Engine handles explosions, but we need danger level for UI overlay.
        let dangerLevel = 0;
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const c = engine.grid[y][x];
                if(c && c.energy > c.maxEnergy) dangerLevel++;
            }
        }

        const alertLayer = document.getElementById('alert-layer');
        if(dangerLevel > 0) alertLayer.className = "absolute inset-0 pointer-events-none z-30 bg-red-500/10 animate-pulse";
        else alertLayer.className = "absolute inset-0 pointer-events-none z-30";

        // Stats UI
        statTimer++;
        if(statTimer >= 60) {
            updateStatsUI();
            statTimer = 0;
            engine.currentStats = { gen:0, use:0, vent:0 };
        }
    }

    render();

    requestAnimationFrame(gameLoop);
}

// --- 渲染 ---
function render() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=GRID_SIZE; i++) {
        ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, GRID_SIZE*TILE_SIZE);
        ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(GRID_SIZE*TILE_SIZE, i*TILE_SIZE);
    }
    ctx.stroke();

    drawConnections();

    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            if(engine.grid[y][x]) drawItem(x, y, engine.grid[y][x]);
        }
    }

    if(dragState.active && dragState.data) {
        const rect = mainCanvas.getBoundingClientRect();
        const rX = dragState.dragX - rect.left;
        const rY = dragState.dragY - rect.top;

        ctx.save();
        ctx.globalAlpha = 0.5;

        const floatX = (rX / TILE_SIZE) - 0.5;
        const floatY = (rY / TILE_SIZE) - 0.5;

        drawItem(floatX, floatY, dragState.data);

        ctx.restore();
    }

    engine.particles.forEach(p => {
        const dir = DIRS[p.dir];
        const px = (p.x + 0.5 + dir.x * p.progress) * TILE_SIZE;
        const py = (p.y + 0.5 + dir.y * p.progress) * TILE_SIZE;

        ctx.beginPath();
        ctx.arc(px, py, TILE_SIZE*0.15, 0, Math.PI*2);
        ctx.fillStyle = p.charged ? '#fff' : '#94a3b8';
        ctx.fill();

        if(p.charged) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    for(let i=engine.effects.length-1; i>=0; i--) {
        const e = engine.effects[i];
        const cx = (e.x+0.5)*TILE_SIZE;
        const cy = (e.y+0.5)*TILE_SIZE;
        ctx.globalAlpha = e.life;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(cx, cy, TILE_SIZE * (1.5-e.life), 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawConnections() {
    // 1. Structural Connections (Dark, Static)
    // These represent "Valid Cabling" even if no energy flows
    const connections = engine.getStructuralConnections();

    ctx.lineWidth = Math.max(2, TILE_SIZE * 0.1);
    ctx.lineCap = 'round';

    connections.forEach(conn => {
        const sx = (conn.x + 0.5) * TILE_SIZE;
        const sy = (conn.y + 0.5) * TILE_SIZE;
        const tx = (conn.tx + 0.5) * TILE_SIZE;
        const ty = (conn.ty + 0.5) * TILE_SIZE;

        ctx.strokeStyle = '#374151'; // Dark Grey (Grid lines +)
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
    });

    // 2. Active Flow (Bright, Animated)
    const time = Date.now() / 20; // Speed
    ctx.lineDashOffset = -time;
    ctx.setLineDash([TILE_SIZE * 0.2, TILE_SIZE * 0.2]);

    engine.activeConnections.forEach(conn => {
        const sx = (conn.x + 0.5) * TILE_SIZE;
        const sy = (conn.y + 0.5) * TILE_SIZE;
        const tx = (conn.tx + 0.5) * TILE_SIZE;
        const ty = (conn.ty + 0.5) * TILE_SIZE;

        // Color intensity based on amount?
        // const intensity = Math.min(1, conn.amount * 2);
        ctx.strokeStyle = '#4ade80'; // Bright Green
        ctx.lineWidth = Math.max(2, TILE_SIZE * 0.08);

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
    });

    // Reset Dash
    ctx.setLineDash([]);
}

function drawItem(x, y, c) {
    const cx = (x + 0.5) * TILE_SIZE;
    const cy = (y + 0.5) * TILE_SIZE;
    const sz = TILE_SIZE;

    ctx.save();
    ctx.translate(cx, cy);

    const ePct = c.energy / c.maxEnergy;
    if (ePct > 0.01) {
        let col = COLORS.energyOk;
        if (ePct > 1.0) col = COLORS.energyCrit;
        else if (ePct > 0.8) col = COLORS.energyWarn;

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.1 + Math.min(0.6, ePct * 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Rotate entire component
    ctx.rotate(c.rotation * Math.PI / 2);

    const def = COMPONENTS[c.type];
    if(def && def.draw) {
        def.draw(ctx, sz, c, ePct);
    } else {
        // Fallback
        ctx.fillStyle = '#f0f';
        ctx.fillRect(-sz*0.2, -sz*0.2, sz*0.4, sz*0.4);
    }

    ctx.restore();
}

// --- 工具函数 ---
function updateStatsUI() {
    const gen = engine.currentStats.gen;
    const use = engine.currentStats.use;
    const vent = engine.currentStats.vent;

    document.getElementById('stat-gen').innerText = '+' + gen.toFixed(1) + '/s';
    document.getElementById('stat-use').innerText = '-' + use.toFixed(1) + '/s';
    document.getElementById('stat-vent').innerText = '-' + vent.toFixed(1) + '/s';

    let eff = 0;
    if(gen > 0.1) {
        eff = (use / gen) * 100;
    } else if (use > 0) {
        eff = 100;
    }

    const elEff = document.getElementById('stat-eff');
    elEff.innerText = eff.toFixed(0) + '%';

    if(eff > 80) elEff.className = "font-mono font-bold text-green-400";
    else if(eff > 40) elEff.className = "font-mono font-bold text-yellow-400";
    else elEff.className = "font-mono font-bold text-red-400";
}

function selectTool(t, desc) {
    if(window.AudioSystem) window.AudioSystem.playSFX('click');
    currentTool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-'+t);
    if(btn) btn.classList.add('active');
    document.getElementById('tool-name').innerText = desc;
}

function toggleRun() {
    if(window.AudioSystem) window.AudioSystem.playSFX('click');
    isRunning = !isRunning;
    const btn = document.getElementById('runBtn');
    if(isRunning) {
        btn.classList.remove('bg-slate-800', 'border-green-500');
        btn.classList.add('bg-red-900', 'border-red-500');
    } else {
        btn.classList.add('bg-slate-800', 'border-green-500');
        btn.classList.remove('bg-red-900', 'border-red-500');
    }
}

function clearMap() {
    if(window.AudioSystem) window.AudioSystem.playSFX('click');
    engine.setupLevel(null);
    score = 0;
    isRunning = false;
    document.getElementById('runBtn').classList.remove('bg-red-900', 'border-red-500');
    document.getElementById('runBtn').classList.add('bg-slate-800', 'border-green-500');
}

// Start
init();
