const COMPONENTS = {
    'extractor': {
        name: '抽取泵',
        desc: '放置在高亮区域抽取能量',
        maxEnergy: 50,
        cost: 10,
        outputs: [0], // Front
        iconHtml: '<div class="w-3 h-3 bg-green-500 shadow-[0_0_8px_#4ade80]"></div>',
        draw: (ctx, sz, c, ePct) => {
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
    },
    'wire': {
        name: '超导线',
        desc: '传输能量',
        maxEnergy: 60,
        cost: 5,
        outputs: [0],
        iconHtml: '<div class="w-6 h-0.5 bg-green-500"></div>',
        draw: (ctx, sz, c, ePct) => {
            const wireWidth = sz * 0.15;
            const innerWireColor = '#064e3b';
            const activeWireColor = '#4ade80';

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
    },
    'battery': {
        name: '电容堆',
        desc: '储存大量能量 (防过载缓冲)',
        maxEnergy: 300,
        cost: 20,
        outputs: [0],
        iconHtml: '<div class="w-3 h-4 border border-green-500"></div>',
        draw: (ctx, sz, c, ePct) => {
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
    },
    'vent': {
        name: '排气阀',
        desc: '安全排放多余能量 (防止爆炸)',
        maxEnergy: 150,
        cost: 15,
        outputs: [0], // Still pushes forward if it has any left
        iconHtml: '<div class="flex gap-0.5"><div class="w-0.5 h-3 bg-slate-400"></div><div class="w-0.5 h-3 bg-slate-400"></div><div class="w-0.5 h-3 bg-slate-400"></div></div>',
        draw: (ctx, sz, c, ePct) => {
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
    },
    'maker': {
        name: '物质发生器',
        desc: '消耗能量制造粒子',
        maxEnergy: 80,
        cost: 50,
        outputs: [], // Consumes only
        iconHtml: '<div class="w-3 h-3 rounded-full bg-white"></div>',
        draw: (ctx, sz, c, ePct) => {
            // Particle Accelerator Core
            ctx.fillStyle = '#1e1b4b'; // Indigo-950
            ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.fill();

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.stroke();

            // Core
            ctx.fillStyle = '#fff';
            const coreSz = sz * (0.1 + 0.1 * ePct);
            ctx.beginPath(); ctx.arc(0,0, coreSz, 0, Math.PI*2); ctx.fill();

            // Spinning ring
            ctx.save();
            ctx.rotate(Date.now() / 500);
            ctx.strokeStyle = '#6366f1';
            ctx.beginPath(); ctx.arc(0,0, sz*0.25, 0, Math.PI*1.5); ctx.stroke();
            ctx.restore();
        }
    },
    'rail': {
        name: '磁轨',
        desc: '消耗能量加速粒子',
        maxEnergy: 100,
        cost: 20,
        outputs: [0],
        iconHtml: '<div class="text-[10px] text-yellow-500 font-bold">>>></div>',
        draw: (ctx, sz, c, ePct) => {
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
    },
    'emitter': {
        name: '发射终端',
        desc: '粒子的终点',
        maxEnergy: 100,
        cost: 30,
        outputs: [0],
        iconHtml: '<div class="w-3 h-3 border border-yellow-500"></div>',
        draw: (ctx, sz, c, ePct) => {
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
    },
    'prism': {
        name: '分流棱镜',
        desc: '将能量分配到三个方向',
        maxEnergy: 80,
        cost: 25,
        outputs: [0, 1, 3], // Front, Right, Left
        iconHtml: '<div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-purple-500"></div>',
        draw: (ctx, sz, c, ePct) => {
            // Triangle shape
            ctx.fillStyle = '#4c1d95'; // Violet-900
            ctx.beginPath();
            ctx.moveTo(0, -sz*0.3);
            ctx.lineTo(sz*0.3, sz*0.3);
            ctx.lineTo(-sz*0.3, sz*0.3);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#a78bfa';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner Crystal
            ctx.fillStyle = ePct > 0.1 ? '#d8b4fe' : '#7c3aed';
            ctx.beginPath();
            ctx.moveTo(0, -sz*0.15);
            ctx.lineTo(sz*0.15, sz*0.15);
            ctx.lineTo(-sz*0.15, sz*0.15);
            ctx.closePath();
            ctx.fill();
        }
    },
    'wall': {
        name: '绝缘墙',
        desc: '阻挡能量和粒子',
        maxEnergy: 200,
        cost: 5,
        outputs: [],
        iconHtml: '<div class="w-4 h-4 border border-slate-500 bg-slate-700"></div>',
        draw: (ctx, sz, c, ePct) => {
            ctx.fillStyle = '#3f3f46'; // Zinc-700
            ctx.fillRect(-sz*0.4, -sz*0.4, sz*0.8, sz*0.8);

            ctx.strokeStyle = '#71717a';
            ctx.lineWidth = 2;

            // Cross hatch
            ctx.beginPath();
            ctx.moveTo(-sz*0.4, -sz*0.4); ctx.lineTo(sz*0.4, sz*0.4);
            ctx.moveTo(sz*0.4, -sz*0.4); ctx.lineTo(-sz*0.4, sz*0.4);
            ctx.stroke();

            ctx.strokeRect(-sz*0.4, -sz*0.4, sz*0.8, sz*0.8);
        }
    }
};
