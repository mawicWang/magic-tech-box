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
                if(c.energy >= 20 && c.cooldown <= 0) {
                    c.energy -= 20;
                    c.cooldown = 60; // 1秒CD
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
    const container = document.getElementById('game-container');
    container.classList.add('shaking');
    setTimeout(()=>container.classList.remove('shaking'), 400);
}

function spawnParticle(x, y, dir) {
    particles.push({x, y, dir, progress:0, speed:1, charged:false});
}
