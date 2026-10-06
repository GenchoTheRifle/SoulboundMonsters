// --- TUTORIAL ---
        // First-time tutorial, played right after the player picks their first starter: a 3-stage
        // "soul simulation" run on a blueprint backdrop. A safe start node, a guided easy battle
        // against the base starter the chosen one counters (winning unlocks it, giving the player the
        // 2 starters a real run needs), then a boss that can't be beaten, to try the new team on.
        // Everything after the first battle can be skipped.

        // Party slots (see .team grid): 1 = front row bottom, 0 = front row top. The starter
        // stands bottom-front on its own; the monster recruited after battle 1 joins top-front.
        const TUTORIAL_LEAD_SLOT = 1;
        const TUTORIAL_RECRUIT_SLOT = 0;

        // Node positions in game-space pixels (the tutorial map spans the whole 1920x1080 screen).
        const TUTORIAL_MAP_NODES = [
            { type: 'start', x: 380, y: 640 },
            { type: 'combat', x: 960, y: 500 },
            { type: 'boss', x: 1540, y: 640 }
        ];

        // The tutorial boss isn't any real monster: a smoky shadow with long spindly arms, almost
        // invisible except for its glowing white features - a single staring eye
        // and a wide grin of jagged teeth. Drawn inline so it needs no art file.
        function buildTutorialBossSvg() {
            // Deterministic jitter so the teeth look hand-drawn but come out identical every time.
            let seed = 7;
            const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
            let teeth = '';
            for (let x = 168; x <= 336; x += 12.5) {
                const t = (x + 6 - 256) / 96;
                const open = Math.max(0, 1 - t * t);
                const top = 258 + 22 * open;         // upper gum line - the grin's corners curl up
                const bottom = top + 10 + 52 * open; // lower gum line
                const gap = bottom - top;
                const upper = gap * (0.42 + rand() * 0.22);
                const lower = gap * (0.38 + rand() * 0.22);
                const w = 10 + rand() * 2;
                teeth += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${upper.toFixed(1)}" rx="4"/>`;
                teeth += `<rect x="${(x + 4).toFixed(1)}" y="${(bottom - lower).toFixed(1)}" width="${w.toFixed(1)}" height="${lower.toFixed(1)}" rx="4"/>`;
            }
            const arm = side => `
                <g transform="${side < 0 ? '' : 'translate(512 0) scale(-1 1)'}">
                    <path d="M132 196 C86 240 62 320 54 420" stroke-width="15"/>
                    <path d="M54 418 L28 480 M54 418 L44 492 M54 418 L62 490 M54 418 L80 474" stroke-width="6"/>
                </g>`;
            return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                <defs>
                    <filter id="smoke" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4" result="noise"/>
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="24" xChannelSelector="R" yChannelSelector="G"/>
                        <feGaussianBlur stdDeviation="1.2"/>
                    </filter>
                    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="2.5" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                    <radialGradient id="shade" cx="50%" cy="42%" r="62%">
                        <stop offset="0.55" stop-color="#000"/>
                        <stop offset="1" stop-color="#000" stop-opacity="0.7"/>
                    </radialGradient>
                </defs>
                <g filter="url(#smoke)">
                    <g fill="none" stroke="#000" stroke-linecap="round">${arm(-1)}${arm(1)}</g>
                    <path fill="url(#shade)" d="M256 36 C350 36 400 120 398 220 C396 300 420 380 452 500 L410 478 L392 506 L360 476 L334 506 L306 478 L282 506 L256 480 L230 506 L206 478 L178 506 L152 476 L120 506 L102 478 L60 500 C92 380 116 300 114 220 C112 120 162 36 256 36 Z"/>
                </g>
                <g filter="url(#glow)" fill="#f2f2f2">
                    <path d="M206 178 Q256 144 306 178 Q256 210 206 178 Z" fill="none" stroke="#f2f2f2" stroke-width="5"/>
                    <circle cx="256" cy="178" r="11" fill="none" stroke="#f2f2f2" stroke-width="4"/>
                    <circle cx="256" cy="178" r="3.5"/>
                    ${teeth}
                </g>
            </svg>`;
        }
        const TUTORIAL_BOSS_ART = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(buildTutorialBossSvg());
        const TUT_EN_ICON = `<img src="Art/EN.png" class="tut-inline-icon" alt="EN" />`;
        const TUT_HP_ICON = `<img src="Art/HP.png" class="tut-inline-icon" alt="HP" />`;

        let tutorialState = null;
        let tutorialOverlay = null;

        function tutorialWait(ms) {
            return new Promise(r => setTimeout(r, ms));
        }

        function tutElementHtml(type) {
            return `<span class="tut-element">${getTypeIconHtml(type, 30)} ${type}</span>`;
        }

        // The tutorial foe is always the base starter the chosen one has the elemental edge over
        // (Wolf -> Slime, Slime -> Sentry, Sentry -> Wolf).
        function getTutorialEnemyId(starterId) {
            const beats = ELEMENT_STRONG_AGAINST[STARTERS[starterId].type];
            return ['wolf', 'slime', 'sentry'].find(id => STARTERS[id].type === beats);
        }

        function buildTutorialEnemy(base, overrides) {
            const unit = {
                ...JSON.parse(JSON.stringify(base)),
                baseId: base.id,
                isEnemy: true,
                energy: base.startingEnergy !== undefined ? base.startingEnergy : 1,
                atkMod: 0,
                spdMod: 0,
                defMod: 0,
                buffs: [],
                debuffs: [],
                stunned: 0,
                poison: 0,
                toxin: 0,
                ...overrides
            };
            unit.id = `enemy-${Date.now()}-tutorial`;
            unit.currentHp = unit.hp;
            return unit;
        }

        // ---------------------------------------------------------------------------------------
        // Blueprint backdrop: a scrolling perspective grid, wireframe cubes and annotation labels,
        // so the tutorial reads as a generated simulation rather than a real place.
        // ---------------------------------------------------------------------------------------
        function buildBlueprintLayer() {
            const cubes = [
                { x: 7, y: 16, size: 90, dur: 18, delay: 0 },
                { x: 84, y: 12, size: 130, dur: 26, delay: -7 },
                { x: 91, y: 58, size: 70, dur: 14, delay: -3 },
                { x: 3, y: 62, size: 110, dur: 22, delay: -11 },
                { x: 50, y: 4, size: 56, dur: 12, delay: -5 }
            ];
            const layer = document.createElement('div');
            layer.className = 'blueprint-layer';
            layer.innerHTML = `
                <div class="bp-grid"></div>
                <div class="bp-floor"></div>
                <div class="bp-horizon"></div>
                ${cubes.map((c, i) => `
                    <div class="bp-cube-wrap" style="left:${c.x}%; top:${c.y}%; --s:${c.size}px; --i:${i};">
                        <div class="bp-cube-float" style="animation-delay:${c.delay}s;">
                            <div class="bp-cube" style="animation-duration:${c.dur}s; animation-delay:${c.delay}s;">
                                <i class="f1"></i><i class="f2"></i><i class="f3"></i><i class="f4"></i><i class="f5"></i><i class="f6"></i>
                            </div>
                        </div>
                    </div>`).join('')}
                <div class="bp-scan"></div>
                <div class="bp-label bp-label-tl">SOUL-SIM // BUILD 0.1</div>
                <div class="bp-label bp-label-br">GRID 40u &middot; SCALE 1:1 &middot; RENDERING...</div>
            `;
            return layer;
        }

        // ---------------------------------------------------------------------------------------
        // Spotlight overlay: darkens the screen except for a hole around a target element, with an
        // arrow and a text box. Steps advance on NEXT, or (advance: 'click') when the player clicks
        // the target itself - only that element stays clickable through the overlay.
        // ---------------------------------------------------------------------------------------

        // Element bounds in unscaled 1920x1080 game space (#game-container is CSS-scaled to fit).
        function getGameRect(el) {
            const container = document.getElementById('game-container');
            const c = container.getBoundingClientRect();
            const scale = c.width / container.offsetWidth || 1;
            const r = el.getBoundingClientRect();
            return {
                left: (r.left - c.left) / scale - container.clientLeft,
                top: (r.top - c.top) / scale - container.clientTop,
                width: r.width / scale,
                height: r.height / scale
            };
        }

        function resolveTutorialTargets(step) {
            const t = typeof step.target === 'function' ? step.target() : step.target;
            const list = (Array.isArray(t) ? t : [t]).filter(Boolean);
            return list.length ? list : null;
        }

        function getTutorialTargetRect(els) {
            const rects = els.map(getGameRect).filter(r => r.width > 0 || r.height > 0);
            if (!rects.length) return null;
            const left = Math.min(...rects.map(r => r.left));
            const top = Math.min(...rects.map(r => r.top));
            const right = Math.max(...rects.map(r => r.left + r.width));
            const bottom = Math.max(...rects.map(r => r.top + r.height));
            return { left, top, width: right - left, height: bottom - top };
        }

        function setTutorialBox(el, r) {
            el.style.left = `${r.left}px`;
            el.style.top = `${r.top}px`;
            el.style.width = `${Math.max(0, r.width)}px`;
            el.style.height = `${Math.max(0, r.height)}px`;
        }

        function ensureTutorialOverlay() {
            if (tutorialOverlay) return tutorialOverlay;
            const root = document.createElement('div');
            root.id = 'tutorial-overlay';
            root.innerHTML = `
                <div class="tut-hole"></div>
                <div class="tut-block"></div><div class="tut-block"></div><div class="tut-block"></div><div class="tut-block"></div>
                <div class="tut-arrow"><div class="tut-arrow-img"></div></div>
                <div class="tut-box nine-cut-panel">
                    <div class="tut-title"></div>
                    <div class="tut-text move-description-text"></div>
                    <div class="tut-actions"><button class="nine-cut-button tut-next">NEXT</button></div>
                </div>`;
            document.getElementById('game-container').appendChild(root);
            void root.offsetWidth; // commit the full-screen starting hole so the first step animates in

            const o = {
                root,
                hole: root.querySelector('.tut-hole'),
                blocks: [...root.querySelectorAll('.tut-block')],
                arrow: root.querySelector('.tut-arrow'),
                box: root.querySelector('.tut-box'),
                title: root.querySelector('.tut-title'),
                text: root.querySelector('.tut-text'),
                actions: root.querySelector('.tut-actions'),
                next: root.querySelector('.tut-next'),
                step: null,
                cleanup: null,
                timer: null
            };
            o.onResize = () => layoutTutorialStep();
            window.addEventListener('resize', o.onResize);
            root.classList.add('visible');
            document.body.classList.add('tutorial-spotlight');
            tutorialOverlay = o;
            return o;
        }

        function hideTutorialOverlay() {
            const o = tutorialOverlay;
            if (!o) return;
            tutorialOverlay = null;
            document.body.classList.remove('tutorial-spotlight');
            if (o.cleanup) o.cleanup();
            clearInterval(o.timer);
            window.removeEventListener('resize', o.onResize);
            o.root.classList.remove('visible');
            setTimeout(() => o.root.remove(), 350);
        }

        function layoutTutorialStep() {
            const o = tutorialOverlay;
            if (!o || !o.step) return;
            const step = o.step;
            const W = 1920, H = 1080;
            const els = resolveTutorialTargets(step);
            const target = els ? getTutorialTargetRect(els) : null;
            // Skip the periodic re-layout unless the target really moved - small size wobbles
            // (pulsing buttons etc.) would otherwise make the spotlight chase them and look laggy.
            const last = o.lastTarget;
            if (last !== undefined && (!target) === (!last) &&
                (!target || ['left', 'top', 'width', 'height'].every(k => Math.abs(target[k] - last[k]) < 4))) {
                return;
            }
            o.lastTarget = target;
            const pad = step.pad !== undefined ? step.pad : 14;

            let hole = null;
            if (target) {
                hole = { left: target.left - pad, top: target.top - pad, width: target.width + pad * 2, height: target.height + pad * 2 };
                setTutorialBox(o.hole, hole);
            } else {
                setTutorialBox(o.hole, { left: W / 2, top: H / 2, width: 0, height: 0 });
            }
            o.hole.classList.toggle('no-target', !target);

            // Click steps leave exactly the target's own rect clickable; everything else is blocked.
            if (target && step.advance === 'click') {
                const t = target;
                setTutorialBox(o.blocks[0], { left: 0, top: 0, width: W, height: t.top });
                setTutorialBox(o.blocks[1], { left: 0, top: t.top + t.height, width: W, height: H - t.top - t.height });
                setTutorialBox(o.blocks[2], { left: 0, top: t.top, width: t.left, height: t.height });
                setTutorialBox(o.blocks[3], { left: t.left + t.width, top: t.top, width: W - t.left - t.width, height: t.height });
            } else {
                setTutorialBox(o.blocks[0], { left: 0, top: 0, width: W, height: H });
                for (let i = 1; i < 4; i++) setTutorialBox(o.blocks[i], { left: 0, top: 0, width: 0, height: 0 });
            }

            const boxW = step.width || 560;
            o.box.style.width = `${boxW}px`;
            const boxH = o.box.offsetHeight;
            const ARROW = 110, GAP = 10;
            let bx, by;

            if (!hole) {
                o.arrow.style.display = 'none';
                bx = (W - boxW) / 2;
                by = (H - boxH) / 2;
            } else {
                const space = {
                    bottom: H - (hole.top + hole.height),
                    top: hole.top,
                    left: hole.left,
                    right: W - (hole.left + hole.width)
                };
                const needV = ARROW + GAP + boxH + 30;
                let placement = step.placement;
                if (!placement) {
                    if (space.bottom >= needV) placement = 'bottom';
                    else if (space.top >= needV) placement = 'top';
                    else placement = space.left >= space.right ? 'left' : 'right';
                }
                const cx = hole.left + hole.width / 2;
                const cy = hole.top + hole.height / 2;
                let ax, ay, rot;
                if (placement === 'bottom') {
                    ax = cx; ay = hole.top + hole.height + GAP + ARROW / 2; rot = 0;
                    bx = cx - boxW / 2; by = hole.top + hole.height + GAP + ARROW;
                } else if (placement === 'top') {
                    ax = cx; ay = hole.top - GAP - ARROW / 2; rot = 180;
                    bx = cx - boxW / 2; by = hole.top - GAP - ARROW - boxH;
                } else if (placement === 'left') {
                    ax = hole.left - GAP - ARROW / 2; ay = cy; rot = 90;
                    bx = hole.left - GAP - ARROW - boxW; by = cy - boxH / 2;
                } else {
                    ax = hole.left + hole.width + GAP + ARROW / 2; ay = cy; rot = -90;
                    bx = hole.left + hole.width + GAP + ARROW; by = cy - boxH / 2;
                }
                o.arrow.style.display = '';
                o.arrow.style.left = `${ax}px`;
                o.arrow.style.top = `${ay}px`;
                o.arrow.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
            }

            o.box.style.left = `${Math.max(24, Math.min(W - boxW - 24, bx))}px`;
            o.box.style.top = `${Math.max(24, Math.min(H - boxH - 24, by))}px`;
        }

        function showTutorialStep(step) {
            const o = ensureTutorialOverlay();
            if (o.cleanup) { o.cleanup(); o.cleanup = null; }
            o.step = step;
            o.lastTarget = undefined; // force a full layout for the new step
            o.root.classList.remove('idle');
            o.title.innerHTML = step.title || '';
            o.title.style.display = step.title ? '' : 'none';
            o.text.innerHTML = step.text;
            const isClick = step.advance === 'click';
            o.actions.style.display = isClick ? 'none' : '';
            o.next.innerText = step.button || 'NEXT';

            o.box.classList.remove('pop');
            void o.box.offsetWidth;
            o.box.classList.add('pop');
            layoutTutorialStep();
            // Targets can shift while a step is up (combat UI re-renders, art finishing loading),
            // so keep the spotlight glued to them.
            clearInterval(o.timer);
            o.timer = setInterval(layoutTutorialStep, 250);

            return new Promise(resolve => {
                const done = () => {
                    if (o.cleanup) { o.cleanup(); o.cleanup = null; }
                    resolve();
                };
                if (isClick) {
                    const els = resolveTutorialTargets(step);
                    const el = els && els[0];
                    if (!el) { done(); return; }
                    // Let the element's own click handler run first, then move on.
                    const handler = () => setTimeout(done, 0);
                    el.addEventListener('click', handler, { capture: true, once: true });
                    o.cleanup = () => el.removeEventListener('click', handler, { capture: true });
                } else {
                    o.next.onclick = done;
                    o.cleanup = () => { o.next.onclick = null; };
                }
            });
        }

        // Plays steps in order. With keepOpen the screen stays dimmed (text box hidden) afterwards,
        // for when another sequence follows immediately and the overlay shouldn't flicker off and on.
        async function runTutorialSteps(steps, opts = {}) {
            for (const step of steps) {
                await showTutorialStep(step);
            }
            if (opts.keepOpen && tutorialOverlay) {
                tutorialOverlay.step = null;
                clearInterval(tutorialOverlay.timer);
                tutorialOverlay.root.classList.add('idle');
            } else {
                hideTutorialOverlay();
            }
        }

        // ---------------------------------------------------------------------------------------
        // Flow
        // ---------------------------------------------------------------------------------------

        // Called (behind a black screen) once the player confirms their first starter.
        window.startTutorial = function(starterId) {
            const base = STARTERS[starterId];
            tutorialState = {
                starterId,
                enemyId: getTutorialEnemyId(starterId),
                stage: 'map',
                playerTurns: 0,
                basicShown: false,
                utilityShown: false,
                busy: false
            };
            currentRun = {
                party: [null, { ...JSON.parse(JSON.stringify(base)), currentHp: base.hp }, null, null],
                arcId: 'tutorial',
                isTutorial: true,
                nodeIndex: 0,
                nodes: TUTORIAL_MAP_NODES.map(n => ({ type: n.type })),
                energy: 0,
                turnOrder: [],
                activeTurnIndex: 0
            };
            document.body.classList.add('tutorial-active');
            playSimulationBoot();
        };

        function playSimulationBoot() {
            const boot = document.createElement('div');
            boot.id = 'tutorial-boot';
            boot.innerHTML = `
                <div class="boot-title">SOUL SIMULATION</div>
                <div class="boot-line move-description-text"></div>
                <div class="boot-bar"><div class="boot-bar-fill"></div></div>`;
            document.getElementById('game-container').appendChild(boot);

            const screenMap = document.getElementById('screen-map');
            showScreen('screen-map');
            renderMap();
            screenMap.classList.add('tutorial-revealing');

            void boot.offsetWidth;
            boot.classList.add('run');
            typeText(boot.querySelector('.boot-line'), 'Generating training grounds...', 35);

            setTimeout(() => {
                boot.classList.add('done');
                screenMap.classList.remove('tutorial-revealing');
                screenMap.classList.add('tutorial-reveal');
                setTimeout(() => boot.remove(), 700);
                setTimeout(() => {
                    screenMap.classList.remove('tutorial-reveal');
                    runMapIntro();
                }, 2000);
            }, 2300);
        }

        function renderTutorialMap() {
            const screenMap = document.getElementById('screen-map');
            screenMap.classList.add('tutorial-mode');
            if (!screenMap.querySelector(':scope > .blueprint-layer')) screenMap.prepend(buildBlueprintLayer());
            document.getElementById('map-title').innerText = 'SOUL SIMULATION';
            document.getElementById('btn-continue-node').disabled = currentRun.nodeIndex >= currentRun.nodes.length - 1;

            const at = currentRun.nodeIndex;
            const pts = TUTORIAL_MAP_NODES;

            let paths = '';
            for (let i = 0; i < pts.length - 1; i++) {
                const a = pts[i], b = pts[i + 1];
                const d = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 140} ${b.x} ${b.y}`;
                const state = i < at ? 'done' : (i === at ? 'next' : 'todo');
                paths += `<path class="map-path map-path-${state}" d="${d}" />`;
            }
            document.getElementById('tutorial-map-path').innerHTML = paths;

            const nodesEl = document.getElementById('tutorial-map-nodes');
            nodesEl.innerHTML = '';
            pts.forEach((p, i) => {
                const state = i < at ? 'completed' : i === at ? 'current' : i === at + 1 ? 'next' : 'upcoming';
                const node = document.createElement('div');
                node.id = `tut-node-${i}`;
                node.className = `tut-node tut-node-${p.type} ${state}`;
                node.style.left = `${p.x}px`;
                node.style.top = `${p.y}px`;
                node.style.setProperty('--i', i);
                let label, inner;
                if (p.type === 'start') {
                    label = 'Start';
                    inner = `<div class="tut-start-ring"><div class="tut-start-core"></div></div>`;
                } else if (p.type === 'combat') {
                    label = 'Battle';
                    inner = `<img class="tut-node-icon" src="Art/Fight_Icon.png" draggable="false" />`;
                } else {
                    label = '???';
                    inner = `<img class="tut-node-icon" src="Art/Boss_Icon.png" draggable="false" />`;
                }
                const cleared = p.type !== 'start' && i <= at;
                node.innerHTML = `
                    ${inner}
                    ${cleared ? `<img class="tut-node-victory" src="Art/Victory.png" draggable="false" />` : ''}
                    <div class="tut-node-label">${label}</div>`;
                nodesEl.appendChild(node);
            });

            const lead = currentRun.party[TUTORIAL_LEAD_SLOT];
            nodesEl.appendChild(buildMapToken(lead, `${pts[at].x}px`, `${pts[at].y}px`));
        }

        // A map node plus its label (which hangs below the node's own box), and optionally the
        // player token standing on it.
        function tutNodeTarget(i, withToken = false) {
            const node = document.getElementById(`tut-node-${i}`);
            if (!node) return null;
            const els = [node, node.querySelector('.tut-node-label')];
            if (withToken) els.push(document.getElementById('map-token'));
            return els;
        }

        function runMapIntro() {
            runTutorialSteps([
                {
                    title: 'SOUL SIMULATION',
                    width: 660,
                    text: `Welcome, Soulbinder! This is a simulated run. Every run is a road of stages that you clear one at a time.`
                },
                {
                    target: () => tutNodeTarget(0, true),
                    title: 'YOU ARE HERE',
                    text: `This is where your journey begins. It's safe here &mdash; no fighting.`
                },
                {
                    target: () => tutNodeTarget(1),
                    title: "LET'S START YOUR ADVENTURE!",
                    text: `This is a <span class="tut-hl">Battle</span> stage. A wild monster is waiting &mdash; defeat it to move on.`
                },
                {
                    target: () => document.getElementById('btn-continue-node'),
                    text: `Press <span class="tut-hl">CONTINUE</span> to travel to the battle!`,
                    advance: 'click',
                    pad: 10
                }
            ]);
        }

        window.tutorialProceed = function() {
            if (!tutorialState || tutorialState.busy) return;
            const target = currentRun.nodeIndex + 1;
            if (target >= currentRun.nodes.length) return;
            tutorialState.busy = true;

            const dest = TUTORIAL_MAP_NODES[target];
            moveMapToken(`${dest.x}px`, `${dest.y}px`).then(() => {
                fadeThroughBlack(() => {
                    currentRun.nodeIndex = target;
                    tutorialState.busy = false;
                    if (currentRun.nodes[target].type === 'boss') startTutorialBoss();
                    else startTutorialBattle();
                });
            });
        };

        // ---------------------------------------------------------------------------------------
        // Battle 1: guided, unlosable
        // ---------------------------------------------------------------------------------------
        function startTutorialBattle() {
            tutorialState.stage = 'battle';
            tutorialState.playerTurns = 0;
            const base = STARTERS[tutorialState.enemyId];
            const lead = currentRun.party[TUTORIAL_LEAD_SLOT];
            const enemy = buildTutorialEnemy(base, {
                hp: Math.round(base.hp * 0.75),
                // Always slower than the player's monster, so the player moves first and more often.
                spd: Math.max(1, Math.min(base.spd, lead.spd - 3)),
                // Damaging moves only - no heals or stuns dragging the fight out.
                moves: base.moves.filter(m => m.p > 0),
                damageMult: 0.4
            });
            initCombat({ type: 'combat', enemies: [null, enemy, null, null], protectParty: true }, {
                beforeFirstTurn: () => tutorialWait(900).then(runBattleIntro)
            });
        }

        function runBattleIntro() {
            const player = currentRun.party[TUTORIAL_LEAD_SLOT];
            const enemy = combatState.enemies.find(Boolean);
            return runTutorialSteps([
                {
                    title: 'YOUR FIRST BATTLE',
                    width: 640,
                    text: `Monsters fight in turns. Defeat every enemy to win &mdash; but if all of your monsters faint, the battle is lost.`
                },
                {
                    target: () => getElementForUnit(player),
                    title: `YOUR ${player.name.toUpperCase()}`,
                    text: `The bar under your monster is its ${TUT_HP_ICON} <span class="tut-hl">HP</span> &mdash; if it reaches 0, it faints. The blue pips are its ${TUT_EN_ICON} <span class="tut-hl">Energy</span>.`
                },
                {
                    target: () => getElementForUnit(enemy),
                    title: `A WILD ${enemy.name.toUpperCase()}!`,
                    text: `Defeat it and its soul will be bound to you &mdash; it will join your team and your Collection.`
                },
                {
                    target: () => document.getElementById('turn-order'),
                    title: 'TURN ORDER',
                    text: `This bar shows who acts next, from left to right. Monsters with higher <span class="tut-hl">SPD</span> get their turns sooner and more often.`
                },
                {
                    target: () => document.querySelector('.element-triangle-top img'),
                    title: 'ELEMENTS',
                    width: 700,
                    text: `${tutElementHtml('Beast')} beats ${tutElementHtml('Nature')}, ${tutElementHtml('Nature')} beats ${tutElementHtml('Mech')}, ${tutElementHtml('Mech')} beats ${tutElementHtml('Beast')}.<br><br>Hitting a weakness deals ${moveDescPos('+25%')} damage. Hitting a strength deals ${moveDescNeg('25% less')}.<br><br>Your ${tutElementHtml(player.type)} ${player.name} has the edge over the ${tutElementHtml(enemy.type)} ${enemy.name}! Click this button during battle to see the chart.`
                }
            ], { keepOpen: true });
        }

        function findMoveButton(move) {
            return [...document.querySelectorAll('#move-controls .move-btn')].find(b => b.dataset.move === move.n);
        }

        function getTutorialEnemyEl() {
            return getElementForUnit(combatState.enemies.find(e => e && e.currentHp > 0));
        }

        function onTutorialPlayerTurn(unit) {
            if (!tutorialState || tutorialState.stage !== 'battle') {
                hideTutorialOverlay();
                return;
            }
            tutorialState.playerTurns++;
            const attackMove = unit.moves.find(m => m.p > 0 && m.c <= unit.energy);
            const canAffordAnyMove = unit.moves.some(m => m.c <= unit.energy);
            const utilityMove = unit.moves.find(m => !m.p);

            if (tutorialState.playerTurns === 1 && attackMove) {
                runFirstTurnGuide(unit, attackMove);
            } else if (!tutorialState.basicShown && !canAffordAnyMove) {
                runOutOfEnergyGuide(unit);
            } else if (!tutorialState.utilityShown && utilityMove) {
                runUtilityGuide(unit, utilityMove);
            } else {
                hideTutorialOverlay();
            }
        }

        function runFirstTurnGuide(unit, attackMove) {
            const enemyName = combatState.enemies.find(e => e && e.currentHp > 0).name;
            runTutorialSteps([
                {
                    target: () => document.getElementById('move-controls'),
                    title: 'MOVES',
                    width: 680,
                    text: `These are your <span class="tut-hl">Moves</span>. Each one costs ${TUT_EN_ICON} Energy, shown in its corner.<br><br><span style="color:#ff6b6b;">Melee</span> moves only reach the front row, <span style="color:#339af0;">Ranged</span> moves can hit anyone, and <span style="color:#ff9ff3;">Utility</span> moves buff, heal or disrupt.`
                },
                {
                    target: () => [document.getElementById('energy-display'), document.getElementById('btn-end-turn')],
                    title: 'ENERGY & BASIC ATTACK',
                    width: 620,
                    text: `Your ${unit.name} has ${unit.energy} ${TUT_EN_ICON}. Your turn keeps going until you run out of Energy.<br><br><span class="tut-hl">Basic Attack</span> is free: it deals a little damage, gives ${moveDescPos('+1')} ${TUT_EN_ICON} and ends your turn. Defeating an enemy also gives ${moveDescPos('+1')} ${TUT_EN_ICON}.`
                },
                {
                    target: () => findMoveButton(attackMove),
                    text: `Let's attack! Click <span class="tut-hl">${attackMove.n}</span>.`,
                    advance: 'click',
                    pad: 8
                },
                {
                    target: getTutorialEnemyEl,
                    text: `Now click the <span class="tut-hl">${enemyName}</span> to strike! Hovering over a target previews the damage &mdash; a gold <span style="color:#ffcc00;">&uarr;</span> means you're hitting its weakness.`,
                    advance: 'click'
                }
            ]);
        }

        function runOutOfEnergyGuide(unit) {
            tutorialState.basicShown = true;
            runTutorialSteps([
                {
                    target: () => document.getElementById('btn-end-turn'),
                    title: 'OUT OF ENERGY!',
                    text: `Your ${unit.name} spent its Energy. Use <span class="tut-hl">Basic Attack</span> to keep up the pressure and recharge ${moveDescPos('+1')} ${TUT_EN_ICON}!`,
                    advance: 'click',
                    pad: 8
                },
                {
                    target: getTutorialEnemyEl,
                    text: `Pick your target!`,
                    advance: 'click'
                }
            ]);
        }

        // Just explains the utility move - the player is free to use it or not.
        function runUtilityGuide(unit, util) {
            tutorialState.utilityShown = true;
            const canUse = unit.energy >= util.c;
            runTutorialSteps([
                {
                    target: () => findMoveButton(util),
                    title: util.n.toUpperCase(),
                    width: 640,
                    pad: 8,
                    button: 'GOT IT',
                    text: `<span class="tut-hl">${util.n}</span> is a <span style="color:#ff9ff3;">Utility</span> move. ${getMoveDescription(util)}<br><br>${canUse ? `You have enough ${TUT_EN_ICON} to use it right now.` : `It costs ${util.c} ${TUT_EN_ICON} &mdash; charge up with Basic Attacks first.`}<br><br>From here on, it's all you. Finish the fight!`
                }
            ]);
        }

        function onTutorialCombatEnd(isWin) {
            hideTutorialOverlay();
            if (!tutorialState) return;
            if (tutorialState.stage === 'battle') {
                if (isWin) {
                    onTutorialBattleWon();
                } else {
                    // Shouldn't be reachable (the party can't drop below 1 HP here), but never strand the player.
                    currentRun.party.forEach(p => { if (p) p.currentHp = p.hp; });
                    showGameAlert('SIMULATION RESET', "Let's try that again!", () => fadeThroughBlack(startTutorialBattle));
                }
            } else if (tutorialState.stage === 'boss') {
                playTutorialFinale();
            }
        }

        function onTutorialBattleWon() {
            const recruitBase = STARTERS[tutorialState.enemyId];
            [tutorialState.starterId, tutorialState.enemyId].forEach(id => {
                if (!gameState.unlockedStarters.includes(id)) gameState.unlockedStarters.push(id);
            });
            saveGame();

            const lead = currentRun.party[TUTORIAL_LEAD_SLOT];
            lead.currentHp = lead.hp;
            currentRun.party[TUTORIAL_RECRUIT_SLOT] = { ...JSON.parse(JSON.stringify(recruitBase)), isEnemy: false, currentHp: recruitBase.hp };
            tutorialState.stage = 'map';

            const html = `
                <div class="tut-soulbound">
                    <div class="tut-soulbound-rays"></div>
                    <div class="tut-soulbound-art">${renderFocusedArt(recruitBase.art)}</div>
                </div>
                <div class="tut-soulbound-sub">${getTypeIconHtml(recruitBase.type, 34)} NEW STARTER UNLOCKED</div>`;
            showGameAlert('SOUL BOUND!', `The ${recruitBase.name}'s soul is now bound to you. It joins your team and your Collection!`, () => {
                fadeThroughBlack(returnToTutorialMap);
            }, html);
            applyArtAutoFocus(document.getElementById('notif-html'));
        }

        function returnToTutorialMap() {
            showScreen('screen-map');
            renderMap();
            showTutorialSkipButton();
            const recruit = currentRun.party[TUTORIAL_RECRUIT_SLOT];
            setTimeout(() => {
                runTutorialSteps([
                    {
                        target: () => tutNodeTarget(1, true),
                        title: 'STAGE CLEARED!',
                        text: `The ${recruit.name} joined your team &mdash; you now have 2 starters to begin real runs with.`
                    },
                    {
                        target: () => tutNodeTarget(2),
                        title: 'ONE LAST STAGE...',
                        text: `A <span class="tut-hl">Boss</span> guards the end of every road, and it's far stronger than a normal monster. Bring your new team and see what they can do!`
                    }
                ]);
            }, 900);
        }

        // ---------------------------------------------------------------------------------------
        // Boss: unwinnable on purpose
        // ---------------------------------------------------------------------------------------
        function startTutorialBoss() {
            tutorialState.stage = 'boss';
            const boss = buildTutorialEnemy({
                id: 'tutorial_boss',
                name: '???',
                type: [],
                hp: 999,
                matk: 30,
                mdef: 30,
                ratk: 28,
                rdef: 30,
                spd: 12,
                startingEnergy: 2,
                art: TUTORIAL_BOSS_ART,
                moves: [
                    { n: 'Soul Devour', c: 1, t: 'Neutral', p: 1.1, melee: true },
                    { n: 'Void Shockwave', c: 2, t: 'Neutral', p: 0.85, ranged: true, effect: { type: 'atk_debuff_pct', value: 0.25, turns: 2, target: 'all_enemies' } }
                ]
            }, {
                isBoss: true,
                silhouette: true
            });
            initCombat({ type: 'boss', enemies: [boss], protectEnemies: true }, {
                beforeFirstTurn: () => tutorialWait(900)
                    .then(() => showBossDialogue({
                        art: TUTORIAL_BOSS_ART,
                        name: '???',
                        silhouette: true,
                        lines: ['Another little soulbinder, crawling out of the simulation...', 'Show me what your souls are worth.']
                    }))
                    .then(runBossIntro)
            });
        }

        function runBossIntro() {
            const boss = combatState.enemies[0];
            return runTutorialSteps([
                {
                    target: () => {
                        const el = getElementForUnit(boss);
                        return el && (el.querySelector('.art-content img') || el);
                    },
                    title: '???',
                    text: `Something ancient stirs inside the simulation... Bosses have far more HP, store up to 5 ${TUT_EN_ICON} Energy and hit hard.`
                },
                {
                    target: () => currentRun.party.filter(Boolean).map(getElementForUnit),
                    title: 'YOUR TEAM',
                    button: 'FIGHT!',
                    text: `Both of your monsters fight now, each taking its own turns. Use everything you've learned &mdash; give it all you've got!`
                }
            ]);
        }

        async function playTutorialFinale() {
            hideTutorialSkipButton();
            const lineup = [tutorialState.starterId, tutorialState.enemyId].map(id => STARTERS[id]);
            await showBossDialogue({
                art: TUTORIAL_BOSS_ART,
                name: '???',
                silhouette: true,
                lines: ['Hmph. Two little souls... is that all you have?', 'Go collect souls... and come back.']
            });

            const el = document.createElement('div');
            el.id = 'tutorial-finale';
            el.innerHTML = `
                <div class="finale-complete nine-cut-panel">
                    <h2>TUTORIAL COMPLETE</h2>
                    <div class="finale-team">
                        ${lineup.map(s => `
                            <div class="finale-card">
                                <div class="finale-card-art">${renderFocusedArt(s.art)}</div>
                                <strong>${s.name}</strong>
                            </div>`).join('')}
                    </div>
                    <p class="move-description-text">Both starters are now unlocked. Start a run, defeat monsters to bind their souls, merge them into stronger forms &mdash; then come back for that Boss.</p>
                    <button class="nine-cut-button">CONTINUE</button>
                </div>`;
            document.getElementById('game-container').appendChild(el);
            applyArtAutoFocus(el);
            el.querySelector('.finale-complete button').onclick = () => finishTutorial();
            void el.offsetWidth;
            el.classList.add('show', 'complete');
        }

        // ---------------------------------------------------------------------------------------
        // Skip / finish
        // ---------------------------------------------------------------------------------------
        function showTutorialSkipButton() {
            document.getElementById('btn-skip-tutorial').classList.add('visible');
        }

        function hideTutorialSkipButton() {
            document.getElementById('btn-skip-tutorial').classList.remove('visible');
        }

        window.skipTutorial = function() {
            showGameConfirm('SKIP TUTORIAL', 'Skip the rest of the tutorial? Your starters stay unlocked.', finishTutorial);
        };

        function finishTutorial() {
            combatState.ended = true; // stops a boss fight that's still in progress
            tutorialState = null;
            hideTutorialOverlay();
            hideTutorialSkipButton();
            fadeThroughBlack(() => {
                const finale = document.getElementById('tutorial-finale');
                if (finale) finale.remove();
                document.querySelectorAll('.boss-dialogue').forEach(d => d.remove());
                document.body.classList.remove('tutorial-active');
                document.getElementById('screen-map').classList.remove('tutorial-mode');
                document.querySelectorAll('.blueprint-layer').forEach(l => l.remove());
                currentRun = { party: [], nodeIndex: 0, nodes: [], energy: 0, turnOrder: [], activeTurnIndex: 0 };
                showScreen('screen-menu');
            }, 300);
        }
