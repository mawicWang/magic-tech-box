function drawItem(x, y, c) {
    const cx = (x + 0.5) * TILE_SIZE;
    const cy = (y + 0.5) * TILE_SIZE;
    const sz = TILE_SIZE;
    const wireWidth = sz * 0.15; // Thin wire
    const innerWireColor = '#064e3b'; // Dark green for empty wire
    const activeWireColor = '#4ade80'; // Bright green for active

    // Helper to check connections
    const getInputs = () => {
        let inputs = []; // 0: Top, 1: Right, 2: Bottom, 3: Left (Directions from center relative to canvas)
        const check = (nx, ny, expectedDir) => {
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                const target = grid[ny][nx];
                if (target && target.rotation === expectedDir) return true;
            }
            return false;
        };
        // Top neighbor (y-1) pointing Down (2)
        if (check(x, y - 1, 2)) inputs.push(0);
        // Right neighbor (x+1) pointing Left (3)
        if (check(x + 1, y, 3)) inputs.push(1);
        // Bottom neighbor (y+1) pointing Up (0)
        if (check(x, y + 1, 0)) inputs.push(2);
        // Left neighbor (x-1) pointing Right (1)
        if (check(x - 1, y, 1)) inputs.push(3);
        return inputs;
    };

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Energy Glow
    const ePct = c.energy / c.maxEnergy;
    if (ePct > 0.01) {
        let col = COLORS.energyOk;
        if (ePct > 1.0) col = COLORS.energyCrit;
        else if (ePct > 0.8) col = COLORS.energyWarn;

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.1 + Math.min(0.6, ePct * 0.4);
        // Draw glow as a soft circle behind
        ctx.beginPath();
        ctx.arc(0, 0, sz * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // 2. Wires (Bottom Layer)
    const inputs = getInputs();

    const drawHalfWire = (dir) => {
            ctx.save();
            ctx.rotate(dir * Math.PI / 2);
            // Draw Upwards
            ctx.fillStyle = '#334155'; // Casing
            ctx.fillRect(-wireWidth/2, -sz*0.5, wireWidth, sz*0.5);

            // Inner
            const innerW = wireWidth * 0.5;
            ctx.fillStyle = (c.energy > 1) ? activeWireColor : innerWireColor;

            ctx.fillRect(-innerW/2, -sz*0.5, innerW, sz*0.5);

            ctx.restore();
    }

    // Draw Output
    drawHalfWire(c.rotation);

    // Draw Inputs
    inputs.forEach(dir => {
        drawHalfWire(dir);
    });

    // 3. Body (Layer 2)
    // Rotate to face output direction for the body drawing
    ctx.rotate(c.rotation * Math.PI / 2);

    if (c.type === 'wire') {
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
    else if (c.type === 'extractor') {
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
    else if (c.type === 'battery') {
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
    else if (c.type === 'vent') {
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
    else if (c.type === 'maker') {
        // Particle Accelerator Core
        ctx.fillStyle = '#1e1b4b'; // Indigo-950
        ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0,0, sz*0.35, 0, Math.PI*2); ctx.stroke();

        // Core
        ctx.fillStyle = '#fff';
        const coreSz = sz * (0.1 + 0.1 * (c.energy/c.maxEnergy));
        ctx.beginPath(); ctx.arc(0,0, coreSz, 0, Math.PI*2); ctx.fill();

        // Spinning ring
        ctx.save();
        ctx.rotate(Date.now() / 500);
        ctx.strokeStyle = '#6366f1';
        ctx.beginPath(); ctx.arc(0,0, sz*0.25, 0, Math.PI*1.5); ctx.stroke();
        ctx.restore();
    }
    else if (c.type === 'rail') {
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
    else if (c.type === 'emitter') {
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

    ctx.restore();
}
