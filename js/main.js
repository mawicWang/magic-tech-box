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

    window.addEventListener('resize', handleResize);
    handleResize(); // 立即计算一次

    // Initialize Input
    initInput();

    // Auto start demo
    loadDemoLevel();

    selectTool('extractor', '抽取泵: 放置在高亮区域');
    requestAnimationFrame(gameLoop);
}

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

function gameLoop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if(isRunning) {
        updatePhysics();
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Global functions for HTML buttons
window.selectTool = function(t, desc) {
    currentTool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-'+t);
    if(btn) btn.classList.add('active');

    const label = document.getElementById('tool-name');
    if(label) label.innerText = desc;
}

window.toggleRun = function() {
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

window.clearMap = function() {
    grid = grid.map(r => r.map(()=>null));
    particles = [];
    effects = [];
    score = 0;
    isRunning = false;
    document.getElementById('runBtn').classList.remove('bg-red-900', 'border-red-500');
    document.getElementById('runBtn').classList.add('bg-slate-800', 'border-green-500');

    document.getElementById('score-display').innerText = score;
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
