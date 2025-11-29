/**
 * 核心逻辑: Magitech Engine v5.0 (Standardized)
 */

// --- 全局状态 ---
let grid = []; // 游戏网格数据
let ambientMap = []; // 环境能量分布
let particles = []; // 粒子系统
let effects = []; // 爆炸特效

// 统计数据
let currentStats = { gen:0, use:0, vent:0 };
let statTimer = 0;

let currentTool = 'extractor';
let isRunning = false;
let score = 0;
let lastTime = 0;
let gameState = 'MENU'; // MENU, PLAYING

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

// --- 初始化与菜单 ---

function init() {
    setupMenu();
    window.addEventListener('resize', handleResize);
    handleResize();

    // 键盘快捷键
    window.addEventListener('keydown', handleKeyDown);

    // 默认不开始，显示菜单
    renderMenuBackground();
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

    // Initialize Grid
    grid = [];
    ambientMap = [];
    particles = [];
    effects = [];
    score = 0;
    isRunning = true;

    // Reset Grid
    for(let y=0; y<GRID_SIZE; y++) {
        grid[y] = Array(GRID_SIZE).fill(null);
        ambientMap[y] = [];
        for(let x=0; x<GRID_SIZE; x++) {
            // Default noise
            const noise = Math.sin(x*0.4) + Math.cos(y*0.4) + Math.random()*0.5;
            let energy = Math.max(0, Math.min(100, (noise + 2) * 25));
            ambientMap[y][x] = energy;
        }
    }

    // Load Level Data
    const level = LEVELS[levelId];
    if(level && level.setup) {
        level.setup(grid, ambientMap);
    }

    // Reset UI
    document.getElementById('runBtn').classList.add('bg-red-900', 'border-red-500');
    document.getElementById('runBtn').classList.remove('bg-slate-800');

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
            const e = ambientMap[y][x];
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
mainCanvas.addEventListener('pointerdown', e => {
    if(gameState !== 'PLAYING') return;
    e.preventDefault();
    updateRect();
    mainCanvas.setPointerCapture(e.pointerId);

    if (window.AudioSystem && !window.AudioSystem.initialized) {
        window.AudioSystem.init();
    }

    inputState.isDown = true;
    handleInput(e.clientX, e.clientY, true);
});

mainCanvas.addEventListener('pointermove', e => {
    if(gameState !== 'PLAYING') return;
    e.preventDefault();
    if(!inputState.isDown) return;
    handleInput(e.clientX, e.clientY, false);
});

const endInput = (e) => {
    inputState.isDown = false;
    inputState.gx = -1;
    inputState.gy = -1;
    inputState.startX = -1;
};
mainCanvas.addEventListener('pointerup', endInput);
mainCanvas.addEventListener('pointercancel', endInput);

function handleInput(clientX, clientY, isStart) {
    const relX = clientX - canvasRect.left;
    const relY = clientY - canvasRect.top;
    const x = Math.floor(relX / TILE_SIZE);
    const y = Math.floor(relY / TILE_SIZE);

    if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    inputState.gx = x;
    inputState.gy = y;

    if(!isStart && x === inputState.startX && y === inputState.startY) return;

    inputState.startX = x;
    inputState.startY = y;

    applyTool(x, y, isStart);
}

function applyTool(x, y, isClick) {
    const cell = grid[y][x];

    if(currentTool === 'eraser') {
        if(grid[y][x]) {
            grid[y][x] = null;
            if(window.AudioSystem) window.AudioSystem.playSFX('delete');
        }
        return;
    }

    if(cell) {
        if(isClick && cell.type === currentTool) {
            cell.rotation = (cell.rotation + 1) % 4;
            if(window.AudioSystem) window.AudioSystem.playSFX('rotate');
        } else if (isClick && cell.type !== currentTool) {
            placeComponent(x, y);
        }
    } else {
        placeComponent(x, y);
    }
}

function placeComponent(x, y) {
    if(window.AudioSystem) window.AudioSystem.playSFX('place');

    const def = COMPONENTS[currentTool];
    if(!def) return;

    grid[y][x] = {
        type: currentTool,
        rotation: 1,
        energy: 0,
        maxEnergy: def.maxEnergy,
        cooldown: 0
    };
}

function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();

    if(key >= '1' && key <= '9') {
        const tools = ['extractor', 'wire', 'battery', 'vent', 'maker', 'rail', 'emitter', 'prism', 'wall'];
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
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if(gameState === 'PLAYING') {
        if(isRunning) {
            updatePhysics();
        }
        render();
    }

    requestAnimationFrame(gameLoop);
}

// --- 物理引擎 ---
const DIRS = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];

function updatePhysics() {
    let changes = Array(GRID_SIZE).fill(0).map(()=>Array(GRID_SIZE).fill(0));
    let dangerLevel = 0;

    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const c = grid[y][x];
            if(!c) continue;

            const def = COMPONENTS[c.type];

            // 生产能量
            if(c.type === 'extractor') {
                const ambient = ambientMap[y][x];
                if(c.energy < c.maxEnergy) {
                    let amount = (ambient / 100) * 1.5;
                    c.energy += amount;
                    currentStats.gen += amount;
                }
            }

            // 消耗能量
            if(c.type === 'vent') {
                let lost = c.energy * 0.2;
                c.energy *= 0.8;
                currentStats.vent += lost;
            }

            // 传输能量 (Push Model - Standardized)
            // Maker consumes internally, doesn't output.
            if(def.outputs && def.outputs.length > 0) {
                 const transferSpeed = (c.type === 'battery') ? ENERGY_TRANSFER_SPEED * 0.5 : ENERGY_TRANSFER_SPEED;

                 const availableEnergy = Math.min(c.energy, transferSpeed);

                 if (availableEnergy > 0.1) {
                     let validTargets = [];

                     def.outputs.forEach(outDir => {
                         const absDir = (c.rotation + outDir) % 4;
                         const dir = DIRS[absDir];
                         const tx = x + dir.x;
                         const ty = y + dir.y;
                         if(tx>=0 && tx<GRID_SIZE && ty>=0 && ty<GRID_SIZE) {
                             const target = grid[ty][tx];
                             // Components that can receive energy? (Basically anything except maybe walls?)
                             // Even walls might exist, but we should define if they conduct.
                             // Currently walls have empty outputs, but receiving is implicit in being a grid neighbor.
                             // BUT, we usually only push to things that "connect" or at least exist.
                             if(target && target.type !== 'wall') validTargets.push({x:tx, y:ty});
                         }
                     });

                     if (validTargets.length > 0) {
                         const amountPerTarget = availableEnergy / validTargets.length;
                         // Check if we actually have that much energy (double check float issues)
                         let totalDeduced = 0;

                         validTargets.forEach(t => {
                             if(c.energy >= amountPerTarget) {
                                 c.energy -= amountPerTarget;
                                 changes[t.y][t.x] += amountPerTarget;
                             }
                         });
                     }
                 }
            }
        }
    }

    // 应用能量变化 & 检查过载
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const c = grid[y][x];
            if(!c) continue;

            c.energy += changes[y][x];

            // 过载判定
            if(c.energy > c.maxEnergy) {
                dangerLevel++;
                if(c.energy > c.maxEnergy + 50) {
                    explode(x, y);
                }
            }
        }
    }

    // 警告UI
    const alertLayer = document.getElementById('alert-layer');
    if(dangerLevel > 0) alertLayer.className = "absolute inset-0 pointer-events-none z-30 bg-red-500/10 animate-pulse";
    else alertLayer.className = "absolute inset-0 pointer-events-none z-30";

    // 更新统计 UI
    statTimer++;
    if(statTimer >= 60) {
        updateStatsUI();
        statTimer = 0;
        currentStats = { gen:0, use:0, vent:0 };
    }

    // 2. 粒子模拟
    updateParticles();
}

function updateParticles() {
    // 生成
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const c = grid[y][x];
            if(c && c.type === 'maker') {
                c.cooldown--;
                if(c.energy >= 25 && c.cooldown <= 0) {
                    c.energy -= 25;
                    currentStats.use += 25;
                    c.cooldown = 15;
                    spawnParticle(x, y, c.rotation);
                }
            }
        }
    }

    // 移动
    for(let i=particles.length-1; i>=0; i--) {
        const p = particles[i];
        p.progress += 0.05 * p.speed;

        if(p.progress >= 1) {
            p.progress = 0;
            const dir = DIRS[p.dir];
            p.x += dir.x;
            p.y += dir.y;

            if(p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) {
                particles.splice(i, 1);
                continue;
            }

            const c = grid[p.y][p.x];
            if(c) {
                if(c.type === 'rail' && p.dir === c.rotation) {
                    // 加速
                    if(c.energy >= 25) {
                        c.energy -= 25;
                        currentStats.use += 25;
                        p.speed += 0.5;
                        p.charged = true;
                        if(window.AudioSystem) window.AudioSystem.playSFX('boost');
                    }
                } else if (c.type === 'emitter' && p.dir === c.rotation) {
                    // 得分
                    score += Math.floor(10 * p.speed);
                    document.getElementById('score-display').innerText = score;
                    particles.splice(i, 1);
                    effects.push({x:p.x, y:p.y, life:1, color:'#fbbf24'});
                    if(window.AudioSystem) window.AudioSystem.playSFX('score');
                    continue;
                } else if (c.type === 'wall' || c.type === 'maker' || c.type === 'extractor' || c.type === 'battery' || c.type === 'prism') {
                    // 碰撞 (Simplified collision for now)
                    particles.splice(i, 1);
                }
            } else {
                // 撞墙消失 (Outside component area but inside grid - treated as empty space, particles fly over empty space?
                // Logic says: if no component, it keeps flying?
                // Original logic: "撞墙消失" (particles.splice(i, 1)) if c is null?
                // Wait, original logic:
                // if(c) { ... } else { particles.splice(i, 1); }
                // So particles die on empty space?
                // Let's keep that behavior.
                 particles.splice(i, 1);
            }
        }
    }
}

function explode(x, y) {
    if(window.AudioSystem) window.AudioSystem.playSFX('explode');
    grid[y][x] = null;
    effects.push({x, y, life:1, color:'#ef4444'});
    container.classList.add('shaking');
    setTimeout(()=>container.classList.remove('shaking'), 400);
}

function spawnParticle(x, y, dir) {
    if(window.AudioSystem) window.AudioSystem.playSFX('spawn');
    particles.push({x, y, dir, progress:0, speed:1, charged:false});
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

    if(inputState.isDown && inputState.gx >= 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(inputState.gx*TILE_SIZE + 2, inputState.gy*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-4);
    }

    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            if(grid[y][x]) drawItem(x, y, grid[y][x]);
        }
    }

    particles.forEach(p => {
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

    for(let i=effects.length-1; i>=0; i--) {
        const e = effects[i];
        e.life -= 0.05;
        if(e.life <= 0) {
            effects.splice(i, 1);
            continue;
        }
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

    // Wires (Bottom Layer) - Visualize connections
    // Note: We can simplify this visual logic or keep it.
    // Let's keep a simplified version that just draws connections based on 'outputs' of neighbors?
    // Or just rely on the component's internal draw.

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
    const gen = currentStats.gen;
    const use = currentStats.use;
    const vent = currentStats.vent;

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
    grid = grid.map(r => r.map(()=>null));
    particles = [];
    effects = [];
    score = 0;
    isRunning = false;
    document.getElementById('runBtn').classList.remove('bg-red-900', 'border-red-500');
    document.getElementById('runBtn').classList.add('bg-slate-800', 'border-green-500');
}

// Start
init();
