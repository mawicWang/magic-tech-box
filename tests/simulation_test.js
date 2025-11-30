const tests = [];
function test(name, fn) { tests.push({name, fn}); }

function assert(cond, msg) { if(!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) { if(a !== b) throw new Error(`${msg || 'Not equal'}: ${a} !== ${b}`); }

async function runTests() {
    let passed = 0;
    const log = document.getElementById('log');

    for(const t of tests) {
        try {
            await t.fn();
            console.log(`[PASS] ${t.name}`);
            log.innerHTML += `<div style="color:green">[PASS] ${t.name}</div>`;
            passed++;
        } catch (e) {
            console.error(`[FAIL] ${t.name}: ${e.message}`);
            log.innerHTML += `<div style="color:red">[FAIL] ${t.name}: ${e.message}</div>`;
        }
    }

    console.log(`Passed ${passed}/${tests.length}`);
    if(passed === tests.length) {
        document.body.style.backgroundColor = '#dcfce7';
        log.innerHTML += '<h1 id="status" style="color:green">ALL PASSED</h1>';
    } else {
        document.body.style.backgroundColor = '#fee2e2';
        log.innerHTML += '<h1 id="status" style="color:red">SOME FAILED</h1>';
    }
}

// Helpers
function createComponent(type, rot = 0, energy = 0) {
    const def = COMPONENTS[type];
    return {
        type: type,
        rotation: rot,
        energy: energy,
        maxEnergy: def.maxEnergy,
        cooldown: 0
    };
}

// --- Tests ---

test('Engine Initialization', () => {
    const engine = new GameEngine();
    assert(engine.grid.length === GRID_SIZE, 'Grid size mismatch');
    assert(engine.grid[0].length === GRID_SIZE, 'Grid row mismatch');
});

test('Wire Connection - Straight', () => {
    // [Wire UP] -> [Wire UP]
    // (0,1) -> (0,0)
    // Wire at (0,1) Output [0] (UP) -> (0,0)
    // Wire at (0,0) Input [2] (DOWN) -> from (0,1) matches.

    const engine = new GameEngine();
    engine.setupLevel(null);

    const w1 = createComponent('wire', 0, 50); // Source
    const w2 = createComponent('wire', 0, 0);  // Target

    engine.grid[1][0] = w1;
    engine.grid[0][0] = w2;

    engine.update();

    // w1 should lose energy, w2 should gain
    assert(w1.energy < 50, 'Source should lose energy');
    assert(w2.energy > 0, 'Target should receive energy');

    // Check connections
    const conns = engine.activeConnections;
    assert(conns.length === 1, 'Should have 1 active connection');
    assert(conns[0].x === 0 && conns[0].y === 1, 'Source coords match');
    assert(conns[0].tx === 0 && conns[0].ty === 0, 'Target coords match');
});

test('Wire Connection - Broken Rotation', () => {
    // [Wire RIGHT] -> [Wire UP]
    // (0,1) facing RIGHT -> Outputs to (1,1)
    // Target is at (0,0). No output.

    const engine = new GameEngine();
    engine.setupLevel(null);

    const w1 = createComponent('wire', 1, 50); // Source facing RIGHT
    const w2 = createComponent('wire', 0, 0);  // Target at UP

    engine.grid[1][0] = w1;
    engine.grid[0][0] = w2;

    engine.update();

    assert(w1.energy === 50, 'Source should NOT lose energy');
    assert(w2.energy === 0, 'Target should NOT receive energy');
});

test('Wire Connection - Input Rejection', () => {
    // [Wire UP] -> [Extractor]
    // (0,1) -> (0,0)
    // Extractor has NO inputs.

    const engine = new GameEngine();
    engine.setupLevel(null);

    const w1 = createComponent('wire', 0, 50);
    const ex = createComponent('extractor', 0, 0);

    engine.grid[1][0] = w1;
    engine.grid[0][0] = ex;

    engine.update();

    assert(w2 => w1.energy === 50, 'Wire should not push to Extractor');
    assert(engine.activeConnections.length === 0, 'No active connections');
});

test('Wire Connection - Side Input', () => {
    // [Wire UP] -> [Wire LEFT] (Target)
    // (0,1) -> (0,0)
    // Target at (0,0) facing LEFT.
    // Target's Back is RIGHT (Input [2]).
    // Target's Sides are UP and DOWN.
    // Source is at DOWN relative to Target.
    // Input direction for Target is DOWN.
    // Wire Inputs: [1, 2, 3] (Right, Down, Left relative to rotation?)
    // Wait, let's verify logic.

    // Target Rotation: 3 (LEFT).
    // Incoming Dir: 0 (UP) (From source perspective) -> Target is ABOVE Source.
    // Source (0,1) -> Target (0,0). Dir 0.
    // Target Perspective: Source is at (0,1) which is DOWN (2).
    // Input relative to Target Rot (3): (2 - 3 + 4) % 4 = 3.
    // Wire Inputs: [1, 2, 3]. 3 is included.
    // Should connect.

    const engine = new GameEngine();
    engine.setupLevel(null);

    const w1 = createComponent('wire', 0, 50); // Facing UP
    const w2 = createComponent('wire', 3, 0);  // Facing LEFT

    engine.grid[1][0] = w1;
    engine.grid[0][0] = w2;

    engine.update();

    assert(w2.energy > 0, 'Target should accept side input');
});

test('Structural Connections', () => {
    const engine = new GameEngine();
    engine.setupLevel(null);

    const w1 = createComponent('wire', 0, 0);
    const w2 = createComponent('wire', 0, 0);

    engine.grid[1][0] = w1;
    engine.grid[0][0] = w2;

    const conns = engine.getStructuralConnections();
    assert(conns.length === 1, 'Should detect 1 structural connection');
});

// Run
window.onload = runTests;
