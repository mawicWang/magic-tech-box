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

    selectTool('extractor', '抽取泵: 放置在高亮区域');
    requestAnimationFrame(gameLoop);
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
// DOMContentLoaded is safer if scripts are in head, but if at end of body it's fine.
// I'll add event listener just in case.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
