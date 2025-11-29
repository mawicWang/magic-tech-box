function handleResize() {
    const container = document.getElementById('game-container');
    const mainCanvas = document.getElementById('mainCanvas');
    const bgCanvas = document.getElementById('bgCanvas');

    // Initialize globals if needed
    if (!ctx) ctx = mainCanvas.getContext('2d');
    if (!bgCtx) bgCtx = bgCanvas.getContext('2d');

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
    const mainCanvas = document.getElementById('mainCanvas');
    canvasRect = mainCanvas.getBoundingClientRect();
}

function drawAmbientBg() {
    const bgCanvas = document.getElementById('bgCanvas');
    if (!bgCtx) bgCtx = bgCanvas.getContext('2d');

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

function render() {
    if (!ctx) return; // Wait for init

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
