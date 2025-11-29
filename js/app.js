/** * 核心逻辑: Magitech Engine v4.1 Fixed
 */

// --- 1. 配置常量 ---
const GRID_SIZE = 10;
const ENERGY_TRANSFER_SPEED = 2.5; // 能量传输速度
const COLORS = {
    grid: '#1f2937',
    energyOk: '#22c55e',
    energyWarn: '#eab308',
    energyCrit: '#ef4444',
    bgLow: '#020617',
    bgHigh: '#172554'
};

// --- 2. 全局状态 ---
let grid = []; // 游戏网格数据
let ambientMap = []; // 环境能量分布
let particles = []; // 粒子系统
let effects = []; // 爆炸特效

let currentTool = 'extractor';
let isRunning = false;
let score = 0;
let lastTime = 0;

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

// --- 3. 初始化 ---
function loadDemoLevel() {
    // 强制设置高能区域
    ambientMap[2][1] = 100; // Power for Maker
    ambientMap[3][2] = 100; // Power for Rail 1
    ambientMap[3][3] = 100; // Power for Rail 2

    // 1. 制造生产线 (x=1)
    // (1,2) 抽取泵 -> 下
    grid[2][1] = { type: 'extractor', rotation: 2, energy: 0, maxEnergy: 50, cooldown: 0 };
    // (1,3) 导线 -> 下
    grid[3][1] = { type: 'wire', rotation: 2, energy: 0, maxEnergy: 60, cooldown: 0 };
    // (1,4) 发生器 -> 右 (发射粒子)
    grid[4][1] = { type: 'maker', rotation: 1, energy: 0, maxEnergy: 80, cooldown: 0 };

    // 2. 粒子轨道 (y=4)
    // (2,4) 磁轨 -> 右
    grid[4][2] = { type: 'rail', rotation: 1, energy: 0, maxEnergy: 100, cooldown: 0 };
    // (3,4) 磁轨 -> 右
    grid[4][3] = { type: 'rail', rotation: 1, energy: 0, maxEnergy: 100, cooldown: 0 };
    // (4,4) 终端 -> 右
    grid[4][4] = { type: 'emitter', rotation: 1, energy: 0, maxEnergy: 100, cooldown: 0 };

    // 3. 轨道供电
    // (2,3) 抽取泵 -> 下 (给 (2,4) 供电)
    grid[3][2] = { type: 'extractor', rotation: 2, energy: 0, maxEnergy: 50, cooldown: 0 };
    // (3,3) 抽取泵 -> 下 (给 (3,4) 供电)
    grid[3][3] = { type: 'extractor', rotation: 2, energy: 0, maxEnergy: 50, cooldown: 0 };

    // 自动开始
    if(!isRunning) toggleRun();
}

function init() {
    // 初始化网格
    for(let y=0; y<GRID_SIZE; y++) {
        grid[y] = Array(GRID_SIZE).fill(null);
        ambientMap[y] = [];
        for(let x=0; x<GRID_SIZE; x++) {
            // 生成能量场: 简单的波形叠加
            const noise = Math.sin(x*0.4) + Math.cos(y*0.4) + Math.random()*0.5;
            // 归一化到 0-100
            let energy = Math.max(0, Math.min(100, (noise + 2) * 25));
            ambientMap[y][x] = energy;
        }
    }

    loadDemoLevel();

    window.addEventListener('resize', handleResize);
    handleResize(); // 立即计算一次

    selectTool('extractor', '抽取泵: 放置在高亮区域');
    requestAnimationFrame(gameLoop);
}

// --- 4. 适配与渲染核心 ---
function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const size = Math.floor(Math.min(w, h) - 20); // 留边距

    // 设置 Canvas 尺寸
    mainCanvas.width = size;
    mainCanvas.height = size;
    mainCanvas.style.width = size + 'px';
    mainCanvas.style.height = size + 'px';

    bgCanvas.width = size;
    bgCanvas.height = size;
    bgCanvas.style.width = size + 'px';
    bgCanvas.style.height = size + 'px';

    TILE_SIZE = size / GRID_SIZE;

    // 缓存 Rect 以备交互计算
    updateRect();

    // 重绘背景
    drawAmbientBg();
}

function updateRect() {
    canvasRect = mainCanvas.getBoundingClientRect();
}

function drawAmbientBg() {
    bgCtx.clearRect(0,0, bgCanvas.width, bgCanvas.height);
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const e = ambientMap[y][x];
            // 能量越高越蓝
            bgCtx.fillStyle = `rgba(30, 64, 175, ${e / 150})`;
            bgCtx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if(e > 70 && Math.random()>0.8) { // 高能星光
                bgCtx.fillStyle = 'rgba(255,255,255,0.1)';
                bgCtx.fillRect(x*TILE_SIZE + Math.random()*TILE_SIZE, y*TILE_SIZE+Math.random()*TILE_SIZE, 2, 2);
            }
        }
    }
}

// --- 5. 交互逻辑 (修复版) ---
// 使用 Pointer Events，最可靠的方案

mainCanvas.addEventListener('pointerdown', e => {
    e.preventDefault(); // 防止滚动
    updateRect(); // 确保坐标准确
    mainCanvas.setPointerCapture(e.pointerId);

    inputState.isDown = true;
    handleInput(e.clientX, e.clientY, true);
});

mainCanvas.addEventListener('pointermove', e => {
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
    // 计算相对坐标
    const relX = clientX - canvasRect.left;
    const relY = clientY - canvasRect.top;

    // 转换为网格坐标
    const x = Math.floor(relX / TILE_SIZE);
    const y = Math.floor(relY / TILE_SIZE);

    // 边界检查
    if(x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;

    // 记录当前手势位置用于高亮
    inputState.gx = x;
    inputState.gy = y;

    // 防抖：同一个格子如果不松手不重复触发（除非是Start）
    if(!isStart && x === inputState.startX && y === inputState.startY) return;

    // 记录这次操作的格子
    inputState.startX = x;
    inputState.startY = y;

    // 执行逻辑
    applyTool(x, y, isStart);
}

function applyTool(x, y, isClick) {
    const cell = grid[y][x];

    // 拆除
    if(currentTool === 'eraser') {
        grid[y][x] = null;
        return;
    }

    // 放置逻辑
    if(cell) {
        // 如果是点击且类型相同 -> 旋转
        if(isClick && cell.type === currentTool) {
            cell.rotation = (cell.rotation + 1) % 4;
        }
        // 如果类型不同，且是点击 -> 覆盖 (拖拽时不覆盖，防止误操作)
        else if (isClick && cell.type !== currentTool) {
            placeComponent(x, y);
        }
    } else {
        // 空格子 -> 放置
        placeComponent(x, y);
    }
}

function placeComponent(x, y) {
    // 创建组件数据结构
    grid[y][x] = {
        type: currentTool,
        rotation: 1, // 默认向右 (0:上, 1:右, 2:下, 3:左)
        energy: 0,
        maxEnergy: 100,
        cooldown: 0
    };

    // 个体差异
    const c = grid[y][x];
    switch(currentTool) {
        case 'extractor': c.maxEnergy = 50; break;
        case 'battery': c.maxEnergy = 300; break;
        case 'vent': c.maxEnergy = 150; break;
        case 'maker': c.maxEnergy = 80; break;
        case 'wire': c.maxEnergy = 60; break;
    }
}

// --- 6. 游戏循环 ---
function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if(isRunning) {
        updatePhysics();
    }

    render();
    requestAnimationFrame(gameLoop);
}

// --- 7. 物理引擎 (能量 + 粒子) ---
const DIRS = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];

function updatePhysics() {
    // 1. 能量模拟 (流体)
    let changes = Array(GRID_SIZE).fill(0).map(()=>Array(GRID_SIZE).fill(0));
    let dangerLevel = 0;

    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const c = grid[y][x];
            if(!c) continue;

            // 生产能量
            if(c.type === 'extractor') {
                // 效率取决于背景能量
                const ambient = ambientMap[y][x];
                if(c.energy < c.maxEnergy) {
                    c.energy += (ambient / 100) * 1.5;
                }
            }

            // 消耗能量
            if(c.type === 'vent') c.energy *= 0.8; // 快速排放

            // 传输能量 (Push Model)
            const dir = DIRS[c.rotation];
            const tx = x + dir.x;
            const ty = y + dir.y;

            if(tx>=0 && tx<GRID_SIZE && ty>=0 && ty<GRID_SIZE) {
                const target = grid[ty][tx];
                if(target) {
                    // 只要我有能量，就往那边推
                    let amount = Math.min(c.energy, ENERGY_TRANSFER_SPEED);
                    if(c.type === 'battery') amount *= 0.5; // 电池放电慢

                    if(amount > 0) {
                        c.energy -= amount;
                        changes[ty][tx] += amount;
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
                    // 爆炸!
                    explode(x, y);
                }
            }
        }
    }

    // 警告UI
    const alertLayer = document.getElementById('alert-layer');
    if(dangerLevel > 0) alertLayer.className = "absolute inset-0 pointer-events-none z-30 bg-red-500/10 animate-pulse";
    else alertLayer.className = "absolute inset-0 pointer-events-none z-30";

    // 2. 粒子模拟 (物质)
    // 生成
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            const c = grid[y][x];
            if(c && c.type === 'maker') {
                c.cooldown--;
                if(c.energy >= 25 && c.cooldown <= 0) {
                    c.energy -= 25;
                    c.cooldown = 15; // 0.25秒CD (加速消耗防止过载)
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

            // 越界
            if(p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) {
                particles.splice(i, 1);
                continue;
            }

            const c = grid[p.y][p.x];
            if(c) {
                if(c.type === 'rail' && p.dir === c.rotation) {
                    // 加速
                    if(c.energy >= 10) {
                        c.energy -= 10;
                        p.speed += 0.5;
                        p.charged = true;
                    }
                } else if (c.type === 'emitter' && p.dir === c.rotation) {
                    // 得分
                    score += Math.floor(10 * p.speed);
                    document.getElementById('score-display').innerText = score;
                    particles.splice(i, 1);
                    // 特效
                    effects.push({x:p.x, y:p.y, life:1, color:'#fbbf24'});
                    continue;
                }
            } else {
                // 撞墙消失
                particles.splice(i, 1);
            }
        }
    }
}

function explode(x, y) {
    grid[y][x] = null; // 移除元件
    effects.push({x, y, life:1, color:'#ef4444'});
    // 震动
    container.classList.add('shaking');
    setTimeout(()=>container.classList.remove('shaking'), 400);
}

function spawnParticle(x, y, dir) {
    particles.push({x, y, dir, progress:0, speed:1, charged:false});
}

// --- 8. 渲染 ---
function render() {
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

    // 绘制网格线 (辅助)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<=GRID_SIZE; i++) {
        ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, GRID_SIZE*TILE_SIZE);
        ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(GRID_SIZE*TILE_SIZE, i*TILE_SIZE);
    }
    ctx.stroke();

    // 绘制交互高亮 (Debug Cursor)
    if(inputState.isDown && inputState.gx >= 0) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(inputState.gx*TILE_SIZE + 2, inputState.gy*TILE_SIZE+2, TILE_SIZE-4, TILE_SIZE-4);
    }

    // 绘制元件
    for(let y=0; y<GRID_SIZE; y++) {
        for(let x=0; x<GRID_SIZE; x++) {
            if(grid[y][x]) drawItem(x, y, grid[y][x]);
        }
    }

    // 绘制粒子
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

    // 绘制特效
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
    const wireWidth = sz * 0.15; // Thin wire
    const innerWireColor = '#064e3b'; // Dark green for empty wire
    const activeWireColor = '#4ade80'; // Bright green for active

    // Helper to check connections
    const getInputs = () => {
        let inputs = []; // 0: Top, 1: Right, 2: Bottom, 3: Left (Directions from center relative to canvas)
        const check = (nx, ny, expectedDir) => {
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const target = grid[ny][nx];
                if (target && target.rotation === expectedDir) return true;
            }
            return false;
        };
        // Top neighbor (y-1) pointing Down (2)
        if (check(x, y - 1, 2)) inputs.push(0);
        // Right neighbor (x+1) pointing Left (3)
        if (check(x + 1, y, 3)) inputs.push(1);
        // Bottom neighbor (y+1) pointing Up (0)
        if (check(x, y + 1, 0)) inputs.push(2);
        // Left neighbor (x-1) pointing Right (1)
        if (check(x - 1, y, 1)) inputs.push(3);
        return inputs;
    };

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Energy Glow
    const ePct = c.energy / c.maxEnergy;
    if (ePct > 0.01) {
        let col = COLORS.energyOk;
        if (ePct > 1.0) col = COLORS.energyCrit;
        else if (ePct > 0.8) col = COLORS.energyWarn;

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.1 + Math.min(0.6, ePct * 0.4);
        // Draw glow as a soft circle behind
        ctx.beginPath();
        ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // 2. Wires (Bottom Layer)
    const inputs = getInputs();

    const drawHalfWire = (dir) => {
            ctx.save();
            ctx.rotate(dir * Math.PI / 2);
            // Draw Upwards
            ctx.fillStyle = '#334155'; // Casing
            ctx.fillRect(-wireWidth/2, -sz*0.5, wireWidth, sz*0.5);

            // Inner
            const innerW = wireWidth * 0.5;
            ctx.fillStyle = (c.energy > 1) ? activeWireColor : innerWireColor;

            ctx.fillRect(-innerW/2, -sz*0.5, innerW, sz*0.5);

            ctx.restore();
    }

    // Draw Output
    drawHalfWire(c.rotation);

    // Draw Inputs
    inputs.forEach(dir => {
        drawHalfWire(dir);
    });

    // 3. Body (Layer 2)
    // Rotate to face output direction for the body drawing
    ctx.rotate(c.rotation * Math.PI / 2);

    if (c.type === 'wire') {
        // Just a central node
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0,0, wireWidth * 0.8, 0, Math.PI*2);
        ctx.fill();
        // Maybe a small gem in middle
        ctx.fillStyle = (c.energy > 1) ? activeWireColor : innerWireColor;
        ctx.beginPath();
        ctx.arc(0,0, wireWidth * 0.4, 0, Math.PI*2);
        ctx.fill();
    }
    else if (c.type === 'extractor') {
        // Pump shape
        ctx.fillStyle = '#065f46'; // Emerald-800
        ctx.fillRect(-sz*0.3, -sz*0.3, sz*0.6, sz*0.6);

        // Inner Detail
        ctx.fillStyle = '#10b981'; // Emerald-500
        const pulse = (Date.now() / 500) % 1;
        ctx.fillRect(-sz*0.15, -sz*0.15, sz*0.3, sz*0.3);

        // Border
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.strokeRect(-sz*0.3, -sz*0.3, sz*0.6, sz*0.6);
    }
    else if (c.type === 'battery') {
        // Battery stack
        ctx.fillStyle = '#155e75'; // Cyan-800
        ctx.fillRect(-sz*0.25, -sz*0.35, sz*0.5, sz*0.7);

        // Charge bars
        const bars = 4;
        const gap = 2;
        const barH = (sz*0.7 - (bars+1)*gap) / bars;

        for(let i=0; i<bars; i++) {
            const limit = (i+1) / bars;
            const isLit = ePct >= limit - (1/bars)*0.5; // lenient threshold

            ctx.fillStyle = isLit ? '#22d3ee' : '#164e63';
            const yBottom = 0.35 * sz - gap - i*(barH+gap);
            ctx.fillRect(-sz*0.2, yBottom - barH, sz*0.4, barH);
        }
    }
    else if (c.type === 'vent') {
        // Fan/Grill
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0,0, sz*0.35, 0, Math.PI*2);
        ctx.fill();

        // Blades
        ctx.save();
        if (c.energy > 10) ctx.rotate(Date.now() / 100);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        for(let i=0; i<4; i++) {
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -sz*0.3); ctx.stroke();
            ctx.rotate(Math.PI/2);
        }
        ctx.restore();
    }
    else if (c.type === 'maker') {
        // Particle Accelerator Core
        ctx.fillStyle = '#1e1b4b'; // Indigo-950
        ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.stroke();

        // Core
        ctx.fillStyle = '#fff';
        const coreSz = sz * (0.1 + 0.1 * (c.energy/c.maxEnergy));
        ctx.beginPath(); ctx.arc(0,0, coreSz, 0, Math.PI*2); ctx.fill();

        // Spinning ring
        ctx.save();
        ctx.rotate(Date.now() / 500);
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath(); ctx.arc(0,0, sz*0.25, 0, Math.PI*1.5); ctx.stroke();
        ctx.restore();
    }
    else if (c.type === 'rail') {
        // Accelerator tracks (Chevron)
        ctx.fillStyle = '#451a03'; // Amber-950
        // Draw base
        ctx.beginPath();
        ctx.moveTo(-sz*0.2, sz*0.3);
        ctx.lineTo(sz*0.2, sz*0.3);
        ctx.lineTo(sz*0.2, -sz*0.3);
        ctx.lineTo(-sz*0.2, -sz*0.3);
        ctx.fill();

        // Chevrons
        ctx.strokeStyle = c.energy > 10 ? '#fbbf24' : '#78350f';
        ctx.lineWidth = 3;

        const drawChevron = (yOffset) => {
            ctx.beginPath();
            ctx.moveTo(-sz*0.15, yOffset + sz*0.1);
            ctx.lineTo(0, yOffset - sz*0.1);
            ctx.lineTo(sz*0.15, yOffset + sz*0.1);
            ctx.stroke();
        };

        drawChevron(sz*0.15);
        drawChevron(-sz*0.15);
    }
    else if (c.type === 'emitter') {
        // Output Terminal
        ctx.fillStyle = '#172554'; // Blue-950
        ctx.fillRect(-sz*0.25, -sz*0.25, sz*0.5, sz*0.5);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, 0, sz*0.15, 0, Math.PI*2);
        ctx.fill();

        // Port
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.strokeRect(-sz*0.25, -sz*0.25, sz*0.5, sz*0.5);
    }

    ctx.restore();
}

// --- 工具函数 ---
function selectTool(t, desc) {
    currentTool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('btn-'+t).classList.add('active');
    document.getElementById('tool-name').innerText = desc;
}

function toggleRun() {
    isRunning = !isRunning;
    const btn = document.getElementById('runBtn');
    if(isRunning) {
        btn.classList.remove('bg-slate-800', 'border-green-500');
        btn.classList.add('bg-red-900', 'border-red-500');
    } else {
        btn.classList.add('bg-slate-800', 'border-green-500');
        btn.classList.remove('bg-red-900', 'border-red-500');
        // 重置部分数据? 不，保留状态更有趣
    }
}

function clearMap() {
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
