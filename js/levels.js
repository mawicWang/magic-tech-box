const LEVELS = [
    {
        id: 0,
        name: "教学关卡: 基础",
        desc: "学习如何抽取能量并驱动粒子加速器。",
        setup: (grid, ambientMap) => {
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
        }
    },
    {
        id: 1,
        name: "沙盒模式",
        desc: "自由建造，无限制。",
        setup: (grid, ambientMap) => {
            // Random ambient map is handled by init usually, but we can customize here
            // Just leave grid empty
        }
    },
    {
        id: 2,
        name: "分流测试",
        desc: "测试棱镜分流功能。",
        setup: (grid, ambientMap) => {
            ambientMap[2][2] = 100;
            grid[2][2] = { type: 'extractor', rotation: 2, energy: 0, maxEnergy: 50, cooldown: 0 };
            grid[3][2] = { type: 'prism', rotation: 2, energy: 0, maxEnergy: 80, cooldown: 0 };
            // Prism at (2,3) pointing Down.
            // Output Front: (2,4)
            // Output Right (relative to Down is Left on screen): (1,3)
            // Output Left (relative to Down is Right on screen): (3,3)

            grid[4][2] = { type: 'wire', rotation: 2, energy: 0, maxEnergy: 60, cooldown: 0 };
            grid[3][1] = { type: 'wire', rotation: 3, energy: 0, maxEnergy: 60, cooldown: 0 };
            grid[3][3] = { type: 'wire', rotation: 1, energy: 0, maxEnergy: 60, cooldown: 0 };
        }
    }
];
