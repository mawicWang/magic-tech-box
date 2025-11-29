function initInput() {
    const mainCanvas = document.getElementById('mainCanvas');

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
}

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
