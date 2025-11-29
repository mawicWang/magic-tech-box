// --- 2. 全局状态 ---
let grid = []; // 游戏网格数据
let ambientMap = []; // 环境能量分布
let particles = []; // 粒子系统
let effects = []; // 爆炸特效

let currentTool = 'extractor';
let isRunning = false;
let score = 0;
let lastTime = 0;

// 渲染相关 - 尺寸与位置
let TILE_SIZE = 0;
let canvasRect = { left:0, top:0, width:0, height:0 };
let ctx;
let bgCtx;

// 交互状态
let inputState = {
    isDown: false,
    gx: -1, gy: -1, // 当前网格坐标
    startX: -1, startY: -1 // 按下的起始坐标
};

const DIRS = [{x:0,y:-1}, {x:1,y:0}, {x:0,y:1}, {x:-1,y:0}];
