class GameEngine {
    constructor() {
        this.grid = [];
        this.ambientMap = [];
        this.particles = [];
        this.effects = [];
        this.currentStats = { gen:0, use:0, vent:0 };
        this.activeConnections = []; // Stores {x, y, dir, amount} for visualization

        // Initialize grid
        for(let y=0; y<GRID_SIZE; y++) {
            this.grid[y] = Array(GRID_SIZE).fill(null);
            this.ambientMap[y] = Array(GRID_SIZE).fill(0);
        }
    }

    setupLevel(setupFn) {
        // Reset
        this.grid = this.grid.map(r => r.map(()=>null));
        this.particles = [];
        this.effects = [];
        this.currentStats = { gen:0, use:0, vent:0 };

        // Generate ambient noise
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const noise = Math.sin(x*0.4) + Math.cos(y*0.4) + Math.random()*0.5;
                let energy = Math.max(0, Math.min(100, (noise + 2) * 25));
                this.ambientMap[y][x] = energy;
            }
        }

        if(setupFn) setupFn(this.grid, this.ambientMap);
    }

    // Helper to get relative direction
    // dir: 0=Up, 1=Right, 2=Down, 3=Left (Grid space)
    // relative to rotation: (dir - rot + 4) % 4
    canConnect(c1, x1, y1, c2, x2, y2, dir) {
        if(!c1 || !c2) return false;
        const def1 = COMPONENTS[c1.type];
        const def2 = COMPONENTS[c2.type];
        if(!def1 || !def2) return false;

        // Check Output from C1
        const relOut = (dir - c1.rotation + 4) % 4;
        if(!def1.outputs || !def1.outputs.includes(relOut)) return false;

        // Check Input to C2
        const oppDir = (dir + 2) % 4;
        const relIn = (oppDir - c2.rotation + 4) % 4;
        if(!def2.inputs || !def2.inputs.includes(relIn)) return false;

        return true;
    }

    getStructuralConnections() {
        const conns = [];
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const c = this.grid[y][x];
                if(!c) continue;
                const def = COMPONENTS[c.type];
                if(!def.outputs) continue;

                def.outputs.forEach(outDir => {
                    // Grid Direction
                    const absDir = (c.rotation + outDir) % 4;
                    const dirVec = DIRS[absDir];
                    const tx = x + dirVec.x;
                    const ty = y + dirVec.y;

                    if(tx>=0 && tx<GRID_SIZE && ty>=0 && ty<GRID_SIZE) {
                        const target = this.grid[ty][tx];
                        if(this.canConnect(c, x, y, target, tx, ty, absDir)) {
                            conns.push({
                                x: x, y: y,
                                tx: tx, ty: ty,
                                dir: absDir
                            });
                        }
                    }
                });
            }
        }
        return conns;
    }

    update() {
        this.updatePhysics();
        this.updateParticles();
        return {
            stats: this.currentStats,
            events: [] // Could return explosion events etc.
        };
    }

    updatePhysics() {
        let changes = Array(GRID_SIZE).fill(0).map(()=>Array(GRID_SIZE).fill(0));
        let dangerLevel = 0;
        this.activeConnections = []; // Clear per frame

        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const c = this.grid[y][x];
                if(!c) continue;

                const def = COMPONENTS[c.type];

                // Production
                if(c.type === 'extractor') {
                    const ambient = this.ambientMap[y][x];
                    if(c.energy < c.maxEnergy) {
                        let amount = (ambient / 100) * 1.5;
                        c.energy += amount;
                        this.currentStats.gen += amount;
                    }
                }

                // Consumption (Passive)
                if(c.type === 'vent') {
                    let lost = c.energy * 0.2;
                    c.energy *= 0.8;
                    this.currentStats.vent += lost;
                }

                // Transfer
                if(def.outputs && def.outputs.length > 0) {
                     const transferSpeed = (c.type === 'battery') ? ENERGY_TRANSFER_SPEED * 0.5 : ENERGY_TRANSFER_SPEED;
                     const availableEnergy = Math.min(c.energy, transferSpeed);

                     if (availableEnergy > 0.1) {
                         let validTargets = [];

                         // Identify valid targets first using strict connection logic
                         def.outputs.forEach(outDir => {
                             const absDir = (c.rotation + outDir) % 4;
                             const dir = DIRS[absDir];
                             const tx = x + dir.x;
                             const ty = y + dir.y;
                             if(tx>=0 && tx<GRID_SIZE && ty>=0 && ty<GRID_SIZE) {
                                 const target = this.grid[ty][tx];
                                 if(this.canConnect(c, x, y, target, tx, ty, absDir)) {
                                     validTargets.push({x:tx, y:ty, dir: absDir});
                                 }
                             }
                         });

                         if (validTargets.length > 0) {
                             const amountPerTarget = availableEnergy / validTargets.length;

                             validTargets.forEach(t => {
                                 if(c.energy >= amountPerTarget) {
                                     c.energy -= amountPerTarget;
                                     changes[t.y][t.x] += amountPerTarget;

                                     // Record flow for visualization
                                     this.activeConnections.push({
                                         x: x, y: y,
                                         tx: t.x, ty: t.y,
                                         amount: amountPerTarget
                                     });
                                 }
                             });
                         }
                     }
                }
            }
        }

        // Apply changes & Check Overload
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const c = this.grid[y][x];
                if(!c) continue;

                c.energy += changes[y][x];

                // Overload
                if(c.energy > c.maxEnergy) {
                    if(c.energy > c.maxEnergy + 50) {
                        this.explode(x, y);
                    }
                }
            }
        }
    }

    updateParticles() {
        // Spawn
        for(let y=0; y<GRID_SIZE; y++) {
            for(let x=0; x<GRID_SIZE; x++) {
                const c = this.grid[y][x];
                if(c && c.type === 'maker') {
                    c.cooldown--;
                    if(c.energy >= 25 && c.cooldown <= 0) {
                        c.energy -= 25;
                        this.currentStats.use += 25;
                        c.cooldown = 15;
                        this.spawnParticle(x, y, c.rotation);
                    }
                }
            }
        }

        // Move
        for(let i=this.particles.length-1; i>=0; i--) {
            const p = this.particles[i];
            p.progress += 0.05 * p.speed;

            if(p.progress >= 1) {
                p.progress = 0;
                const dir = DIRS[p.dir];
                p.x += dir.x;
                p.y += dir.y;

                if(p.x < 0 || p.x >= GRID_SIZE || p.y < 0 || p.y >= GRID_SIZE) {
                    this.particles.splice(i, 1);
                    continue;
                }

                const c = this.grid[p.y][p.x];
                if(c) {
                    if(c.type === 'rail' && p.dir === c.rotation) {
                        // Boost
                        if(c.energy >= 25) {
                            c.energy -= 25;
                            this.currentStats.use += 25;
                            p.speed += 0.5;
                            p.charged = true;
                            if(window.AudioSystem) window.AudioSystem.playSFX('boost');
                        }
                    } else if (c.type === 'emitter' && p.dir === c.rotation) {
                        // Score (handled by App usually, but we can emit event or update score if we track it)
                        // For now, let's just remove particle. App needs to poll for score events?
                        // Or we pass a callback?
                        // Let's modify 'updateParticles' to return events.
                        // But for now, to keep it simple, I'll access a global 'score' if needed or just handle it here.
                        // Wait, 'score' is in app.js.
                        // I should invoke a callback.
                        if(this.onScore) this.onScore(Math.floor(10 * p.speed));
                        this.particles.splice(i, 1);
                        this.effects.push({x:p.x, y:p.y, life:1, color:'#fbbf24'});
                        if(window.AudioSystem) window.AudioSystem.playSFX('score');
                        continue;
                    } else if (['wall', 'maker', 'extractor', 'battery', 'prism'].includes(c.type)) {
                         this.particles.splice(i, 1);
                    }
                } else {
                     this.particles.splice(i, 1);
                }
            }
        }

        // Update Effects
        for(let i=this.effects.length-1; i>=0; i--) {
            const e = this.effects[i];
            e.life -= 0.05;
            if(e.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }

    spawnParticle(x, y, dir) {
        if(window.AudioSystem) window.AudioSystem.playSFX('spawn');
        this.particles.push({x, y, dir, progress:0, speed:1, charged:false});
    }

    explode(x, y) {
        if(window.AudioSystem) window.AudioSystem.playSFX('explode');
        this.grid[y][x] = null;
        this.effects.push({x, y, life:1, color:'#ef4444'});
        if(this.onExplode) this.onExplode();
    }
}

// Export for testing if module system is used, otherwise global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine };
}
