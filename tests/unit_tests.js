const tests = [];
function test(name, fn) { tests.push({name, fn}); }

function runTests() {
    let passed = 0;
    const log = document.getElementById('log');
    tests.forEach(t => {
        try {
            t.fn();
            console.log(`[PASS] ${t.name}`);
            passed++;
        } catch (e) {
            console.error(`[FAIL] ${t.name}: ${e.message}`);
            log.innerHTML += `<div style="color:red">[FAIL] ${t.name}: ${e.message}</div>`;
        }
    });
    console.log(`Passed ${passed}/${tests.length}`);
    if(passed === tests.length) {
        document.body.style.backgroundColor = '#dcfce7';
        log.innerHTML += '<h1 id="status" style="color:green">ALL PASSED</h1>';
    } else {
        document.body.style.backgroundColor = '#fee2e2';
        log.innerHTML += '<h1 id="status" style="color:red">SOME FAILED</h1>';
    }
}

function assert(cond, msg) { if(!cond) throw new Error(msg || 'Assertion failed'); }

// --- Tests ---

test('Components Definitions', () => {
    assert(typeof COMPONENTS !== 'undefined', 'COMPONENTS global not found');
    assert(COMPONENTS['extractor'], 'Extractor missing');
    assert(COMPONENTS['prism'], 'Prism missing');
    assert(COMPONENTS['wall'], 'Wall missing');
});

test('Prism Logic Configuration', () => {
    const p = COMPONENTS['prism'];
    assert(Array.isArray(p.outputs), 'Prism outputs must be array');
    assert(p.outputs.length === 3, 'Prism should have 3 outputs');
    assert(p.outputs.includes(0), 'Prism should output front');
    assert(p.outputs.includes(1), 'Prism should output right');
    assert(p.outputs.includes(3), 'Prism should output left');
});

test('Wall Logic Configuration', () => {
    const w = COMPONENTS['wall'];
    assert(w.outputs.length === 0, 'Wall should have 0 outputs');
    assert(w.maxEnergy > 100, 'Wall should be durable');
});

test('Levels Definitions', () => {
    assert(typeof LEVELS !== 'undefined', 'LEVELS global not found');
    assert(LEVELS.length >= 3, 'Should have at least 3 levels');
});

// Run
window.onload = runTests;
