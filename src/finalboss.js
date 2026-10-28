// --- FINAL BOSS ---
        // The endgame. Beating the Act III boss unlocks the small robot and opens a portal to the dark
        // dimension, a second version of the start screen (the collection door is sealed, only START RUN works).
        // START RUN there skips the acts: you pick 4 merged monsters (no starters) and face the shadow from the
        // tutorial. Its first form (200 HP) knows every starter move; when it falls it evolves, mid-fight, into a
        // 400 HP horror that can use every move any merge has. Winning shows a popup (the first win says so).

        const FINAL_TEAM_SIZE = 4;

        // Whether the player is currently looking at the dark version of the start screen. Not saved: after a
        // reload you are back in the city, with the portal to step through again.
        let inDarkDimension = false;
        let portalBusy = false;

        // Unlocked by the Act III boss, the same fight that hands you the small robot.
        function isFinalBossUnlocked() {
            return gameState.unlockedStarters.includes('mech_melee');
        }

        function getFinalBossMerges() {
            return MERGES.filter(m => gameState.discoveredMerges.includes(m.name));
        }

        // ---------------------------------------------------------------------------------------
        // The two start screens and the portal between them
        // ---------------------------------------------------------------------------------------
        function refreshMenuDimension() {
            const unlocked = isFinalBossUnlocked();
            if (!unlocked) inDarkDimension = false;
            const dark = inDarkDimension;
            document.getElementById('screen-menu').classList.toggle('dark-dimension', dark);
            document.getElementById('menu-bg').style.backgroundImage = `url('Art/${dark ? 'Final Boss Start Run' : 'Start Run'}.png')`;
            // The collection door is sealed in the dark dimension; START RUN is the only way on.
            document.getElementById('menu-btn-collection').style.display = dark ? 'none' : '';
            document.getElementById('hitbox-collection').style.display = dark ? 'none' : '';
            document.getElementById('hitbox-sealed').style.display = dark ? '' : 'none';

            // The way in is open once the Act III boss is beaten. The way back out only opens after the final boss has been
            // fought to the end (won or lost): until then the dark dimension is a one-way door.
            const portal = document.getElementById('menu-portal');
            const showPortal = unlocked && (!dark || !!gameState.finalBossAttempted);
            const wasHidden = portal.style.display === 'none';
            portal.style.display = showPortal ? '' : 'none';
            if (showPortal && wasHidden && dark) {
                portal.classList.remove('portal-appear');
                void portal.offsetWidth;
                portal.classList.add('portal-appear');
                setTimeout(() => portal.classList.remove('portal-appear'), 1600);
            }
            portal.classList.toggle('return', dark);
            portal.querySelector('.menu-portal-label').innerText = dark ? 'RETURN' : 'DARK DIMENSION';
        }

        window.usePortal = function() {
            if (portalBusy) return;
            const toDark = !inDarkDimension;
            playPortalTransition(document.getElementById('menu-portal'), () => {
                inDarkDimension = toDark;
                showScreen('screen-menu');
            }).then(() => {
                if (toDark) showDimensionCaption('THE DARK DIMENSION', 'Something has been waiting for you here...');
            });
        };

        // Beating the Act III boss for the first time tears the portal open on its own and drops you inside.
        function enterDarkDimensionFirstTime() {
            playPortalTransition(null, () => {
                inDarkDimension = true;
                showScreen('screen-menu');
            }).then(() => showDimensionCaption('THE DARK DIMENSION', 'A portal has opened. Something has been waiting for you...'));
        }

        function showDimensionCaption(title, sub) {
            const el = document.createElement('div');
            el.className = 'dimension-caption';
            el.innerHTML = `<div class="dimension-caption-title">${title}</div><div class="dimension-caption-sub move-description-text">${sub}</div>`;
            document.getElementById('game-container').appendChild(el);
            setTimeout(() => el.remove(), 4600);
        }

        // The camera zooms into the portal: it grows from the widget to the middle of the screen (no spinning yet), then
        // it spins up while sparks of light are pulled in, and finally the camera falls into its eye; `mid` swaps the
        // scene while the screen is white, then the light drains away. `fromEl` is the small portal widget it grows out
        // of (null = the portal tears open mid-screen). Only transforms and opacities are animated (each on its own
        // layer, with a pre-scaled copy of the art and no animated filters) so it stays smooth.
        function playPortalTransition(fromEl, mid) {
            portalBusy = true;
            const W = 1920, H = 1080;
            const SIZE = 720;
            const fx = document.createElement('div');
            fx.id = 'portal-fx';
            fx.innerHTML = `
                <div class="portal-fx-dim"></div>
                <div class="portal-fx-glow"></div>
                <div class="portal-fx-swirl"></div>
                <img class="portal-fx-portal" src="Art/Portal_1024.png" draggable="false" />
                <div class="portal-fx-flash"></div>`;
            document.getElementById('game-container').appendChild(fx);
            const dim = fx.querySelector('.portal-fx-dim');
            const glow = fx.querySelector('.portal-fx-glow');
            const swirl = fx.querySelector('.portal-fx-swirl');
            const portal = fx.querySelector('.portal-fx-portal');
            const flash = fx.querySelector('.portal-fx-flash');
            const wait = ms => new Promise(r => setTimeout(r, ms));
            SFX.play('portal');

            // The portal image is positioned by its centre so it can grow from the widget to the screen centre.
            const start = fromEl ? getGameRect(fromEl) : { left: W / 2, top: H / 2, width: 0, height: 0 };
            const startSize = fromEl ? start.width : 40;
            portal.style.width = `${SIZE}px`;
            portal.style.height = `${SIZE}px`;
            portal.style.left = `${W / 2 - SIZE / 2}px`;
            portal.style.top = `${H / 2 - SIZE / 2}px`;
            const dx = start.left + start.width / 2 - W / 2;
            const dy = start.top + start.height / 2 - H / 2;
            const s0 = startSize / SIZE;
            if (fromEl) fromEl.style.visibility = 'hidden';

            // 1. ZOOM: the portal comes forward, perfectly still.
            dim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, fill: 'forwards' });
            glow.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1100, fill: 'forwards' });
            const zoom = portal.animate([
                { transform: `translate(${dx}px, ${dy}px) scale(${s0})`, opacity: fromEl ? 1 : 0 },
                { transform: 'translate(0, 0) scale(1)', opacity: 1 }
            ], { duration: 1100, easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)', fill: 'forwards' });

            return zoom.finished.then(async () => {
                // 2. SPIN: it starts to turn, faster and faster, and draws sparks of light in.
                const SPIN_MS = 1500;
                const spin = portal.animate([
                    { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
                    { transform: 'translate(0, 0) scale(1.05) rotate(720deg)' }
                ], { duration: SPIN_MS, easing: 'cubic-bezier(0.5, 0, 0.8, 0.6)', fill: 'forwards' });
                swirl.animate([{ opacity: 0, transform: 'scale(0.3) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(300deg)' }],
                    { duration: SPIN_MS + 900, easing: 'ease-out', fill: 'forwards' });
                glow.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }], { duration: SPIN_MS, easing: 'ease-in', fill: 'forwards' });
                for (let i = 0; i < 18; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = 520 + Math.random() * 380;
                    const spark = document.createElement('div');
                    spark.className = 'portal-fx-spark';
                    spark.style.left = `${W / 2}px`;
                    spark.style.top = `${H / 2}px`;
                    fx.insertBefore(spark, flash);
                    spark.animate([
                        { transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px) scale(1)`, opacity: 0 },
                        { opacity: 1, offset: 0.25 },
                        { transform: 'translate(0, 0) scale(0.2)', opacity: 0.9 }
                    ], { duration: 700 + Math.random() * 500, delay: Math.random() * 700, easing: 'ease-in', fill: 'both' }).onfinish = () => spark.remove();
                }
                await spin.finished;

                // 3. FALL: into the eye, which sits at the centre of the swirl, a touch above the middle of the image.
                portal.style.transformOrigin = '50% 49%';
                portal.animate([
                    { transform: 'translate(0, 0) scale(1.05) rotate(720deg)' },
                    { transform: 'translate(0, 0) scale(14) rotate(900deg)' }
                ], { duration: 900, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)', fill: 'forwards' });
                flash.animate([{ opacity: 0 }, { opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-in', fill: 'forwards' });
                await wait(900);

                mid();
                portal.remove();
                swirl.remove();
                glow.remove();
                dim.remove();
                await wait(250);
                const fade = flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: 'ease-out', fill: 'forwards' });
                await fade.finished;
                if (fromEl) fromEl.style.visibility = '';
                fx.remove();
                portalBusy = false;
            });
        }

        // ---------------------------------------------------------------------------------------
        // Team select and the title card
        // ---------------------------------------------------------------------------------------
        function openFinalBossSelection() {
            selectionMode = 'final';
            document.getElementById('selection-bg').style.backgroundImage = getMapBackground('final');
            showScreen('screen-selection');
        }

        function startFinalBossFight() {
            const startBtn = document.getElementById('btn-start-run');
            if (startBtn) startBtn.disabled = true;
            SFX.play('enterMap');

            const overlay = document.createElement('div');
            overlay.className = 'final-title-overlay';
            overlay.innerHTML = `
                <div class="final-title-small">THE DARK DIMENSION</div>
                <div class="final-title-big">FINAL BATTLE</div>`;
            document.body.appendChild(overlay);
            void overlay.offsetWidth;
            overlay.classList.add('show');

            // The fight is set up behind the black card, but nothing may act until the card is gone.
            let resolveCardGone;
            const cardGone = new Promise(resolve => { resolveCardGone = resolve; });

            setTimeout(() => {
                currentRun = {
                    party: selectionSlots.map(s => s ? { ...JSON.parse(JSON.stringify(s)), currentHp: s.hp } : null),
                    arcId: 'final',
                    isFinalBoss: true,
                    nodeIndex: 0,
                    nodes: [{ type: 'boss' }],
                    energy: 0,
                    turnOrder: [],
                    activeTurnIndex: 0
                };
                resetBackpack();
                finalBossPhaseBreaking = false;
                initCombat({ type: 'boss', enemies: [buildFinalBossUnit(1)] }, { deferStart: cardGone, beforeFirstTurn: playFinalBossIntro });

                setTimeout(() => {
                    overlay.classList.remove('show');
                    setTimeout(() => {
                        overlay.remove();
                        resolveCardGone();
                    }, 900);
                }, 2800);
            }, 900);
        }

        // ---------------------------------------------------------------------------------------
        // The boss: two forms of the same shadow
        // ---------------------------------------------------------------------------------------
        // Every move of the monsters it can use, nothing of its own: stage 1 uses the starters' moves, stage 2 the merges'.
        // Where several monsters share a move name, the strongest version is kept.
        function collectUniqueMoves(monsters) {
            const byName = new Map();
            monsters.forEach(m => (m.moves || []).forEach(move => {
                const old = byName.get(move.n);
                if (!old || (move.p || 0) > (old.p || 0) || ((move.p || 0) === (old.p || 0) && move.c < old.c)) byName.set(move.n, move);
            }));
            return [...byName.values()].map(m => JSON.parse(JSON.stringify(m)));
        }

        // HP is fixed by design (200 / 400); the rest are the owner's numbers (ATK 20, DEF 15, SPD 12 / 14). On a headless copy of the
        // fight, a scripted team beat the first form ~95-100% of the time but never the second: its damage is spread over area
        // moves that hit all four monsters, so SPD is by far the strongest lever (SPD 7 at ATK 18 / DEF 10 was ~40-100% by team).
        const FINAL_BOSS_STAGES = {
            1: {
                name: 'Void Shade',
                art: 'Art/First Stage.png',
                portrait: 'Art/First_Stage_Boss_Portrait.png',
                hp: 200, matk: 20, mdef: 15, ratk: 20, rdef: 15, spd: 12, startingEnergy: 2,
                getMoves: () => collectUniqueMoves(Object.values(STARTERS)),
                sizeClass: 'boss-small'
            },
            2: {
                name: 'Void Devourer',
                art: 'Art/Second Stage.png',
                portrait: 'Art/Second_Stage_Boss_Portrait.png',
                hp: 400, matk: 20, mdef: 15, ratk: 20, rdef: 15, spd: 14, startingEnergy: 3,
                getMoves: () => collectUniqueMoves(MERGES)
            }
        };

        // A poison cloud that hits all four monsters at once is worth several times what it is on a single target, so the
        // boss's copies of the flat poison moves tick for half as much as the monsters' own. Toxin is an exact copy (12% of max HP).
        const FINAL_BOSS_DOT_SCALE = 0.5;
        function softenDamageOverTime(moves) {
            moves.forEach(m => {
                const eff = m.effect;
                if (eff && eff.type === 'poison_flat') eff.value = Math.max(1, Math.round(eff.value * FINAL_BOSS_DOT_SCALE));
            });
            return moves;
        }

        function buildFinalBossUnit(stage) {
            const def = FINAL_BOSS_STAGES[stage];
            const unit = buildTutorialEnemy({
                id: `void_boss_${stage}`,
                name: def.name,
                type: [],
                hp: def.hp,
                matk: def.matk, mdef: def.mdef, ratk: def.ratk, rdef: def.rdef,
                spd: def.spd,
                startingEnergy: def.startingEnergy,
                art: def.art,
                moves: softenDamageOverTime(def.getMoves())
            }, { isBoss: true, finalBossStage: stage, portrait: def.portrait, sizeClass: def.sizeClass });
            unit.id = `enemy-${Date.now()}-void-${stage}`;
            return unit;
        }

        const FINAL_BOSS_INTRO_LINES = [
            'We meet again, little soulbinder.',
            'Back in the simulation I let you crawl away. A kindness. I will not make that mistake twice.',
            'You have grown. Souls bound, souls merged into stronger shapes... how delightful.',
            'Come, then. Show me what your merged souls are worth!'
        ];
        const FINAL_BOSS_PHASE_LINES = [
            'Impossible... this shell was never meant to break.',
            'But you have only cracked the surface. I am the dark that hungers beneath it.'
        ];
        const FINAL_BOSS_STAGE_TWO_LINES = [
            'Behold my true form.',
            'A thousand eyes. A thousand mouths. Every one of them hungry for your souls.',
            'Now... let the real fight begin!'
        ];
        const FINAL_BOSS_DEFEAT_LINES = [
            'No... how can mere souls...',
            'The dark... it is fading...',
            'Hah... perhaps the souls you bound burn brighter than the shadow after all.'
        ];

        function playFinalBossIntro() {
            const def = FINAL_BOSS_STAGES[1];
            return new Promise(r => setTimeout(r, 700))
                .then(() => showBossDialogue({ art: def.art, name: def.name, lines: FINAL_BOSS_INTRO_LINES }));
        }

        // ---------------------------------------------------------------------------------------
        // Phase change: the first form falls, the second rises in its place and the fight goes on
        // ---------------------------------------------------------------------------------------
        let finalBossPhaseBreaking = false;

        // Called by endCombat when the player has "won". True means it took over (the first form fell).
        function finalBossPhaseBreak() {
            if (finalBossPhaseBreaking) return true;
            const old = combatState.enemies.find(e => e && e.finalBossStage === 1);
            if (!old) return false;
            finalBossPhaseBreaking = true;
            runFinalBossEvolution(old);
            return true;
        }

        async function runFinalBossEvolution(old) {
            const wait = ms => new Promise(r => setTimeout(r, ms));
            await wait(900);   // let the killing blow land
            if (combatState.ended) return;

            const def1 = FINAL_BOSS_STAGES[1];
            const def2 = FINAL_BOSS_STAGES[2];
            const next = buildFinalBossUnit(2);
            next.turnMeter = old.turnMeter || 0;   // it keeps the first form's place in the turn order

            await showBossDialogue({
                art: def1.art,
                name: def1.name,
                lines: FINAL_BOSS_PHASE_LINES,
                evolveTo: {
                    art: def2.art,
                    name: def2.name,
                    lines: FINAL_BOSS_STAGE_TWO_LINES,
                    // Swapped at the peak of the flash, so the arena already shows the new form when the dialogue ends.
                    onEvolve: () => {
                        const idx = combatState.enemies.indexOf(old);
                        combatState.enemies[idx] = next;
                        combatState.killedEnemies = [];
                        SFX.ambience('finalFight2');   // the second form has its own track
                        const el = document.getElementById('enemy-team').children[idx];
                        if (el) updateCombatantEl(el, next, idx);
                    }
                }
            });
            finalBossPhaseBreaking = false;
            if (combatState.ended) return;

            // Pick the fight back up where it stopped.
            isExecutingMove = false;
            const active = combatState.activeUnit;
            const hero = active && !active.isEnemy && active.currentHp > 0 ? active : null;
            if (!hero) combatState.activeUnit = null;
            calculateTimeline(combatState.activeUnit);
            if (!hero) {
                nextTurn();
            } else if (combatState.lastMove && combatState.lastMove.isBasicAttack || hero.energy <= 0) {
                advanceTurn();   // their turn was over anyway
            } else {
                // The hero struck the killing blow with energy to spare: they carry on.
                combatState.isPlayerTurn = true;
                updateCombatUI();
                renderMoveControls(hero);
            }
        }

        // ---------------------------------------------------------------------------------------
        // The end of the fight
        // ---------------------------------------------------------------------------------------
        async function onFinalBossCombatEnd(isWin) {
            // Fought to the end, win or lose: from now on the portal works both ways.
            const firstAttempt = !gameState.finalBossAttempted;
            gameState.finalBossAttempted = true;
            saveGame();
            if (!isWin) {
                showGameAlert('DEFEATED', 'The darkness swallows your team. Pick your merges again, and face it once more.', () => {
                    currentRun = { party: [], nodeIndex: 0, nodes: [], energy: 0, turnOrder: [], activeTurnIndex: 0 };
                    showScreen('screen-menu');
                    if (firstAttempt) setTimeout(() => showDimensionCaption('THE PORTAL HAS OPENED', 'You can leave the dark dimension now.'), 600);
                });
                return;
            }
            const boss = combatState.enemies.find(e => e && e.finalBossStage);
            await showBossDialogue({ art: boss.art, name: boss.name, lines: FINAL_BOSS_DEFEAT_LINES, defeated: true });
            showFinalVictory();
        }

        function showFinalVictory() {
            const firstTime = !gameState.finalBossBeaten;
            gameState.finalBossBeaten = true;
            saveGame();
            SFX.play('unlock');

            const team = currentRun.party.filter(Boolean);
            const el = document.createElement('div');
            el.id = 'final-victory';
            el.innerHTML = `
                <div class="fv-rays"></div>
                <div class="fv-panel nine-cut-panel">
                    <h2>${firstTime ? 'YOU WIN THE GAME!' : 'YOU WIN AGAIN!'}</h2>
                    <div class="finale-team">
                        ${team.map(m => `
                            <div class="finale-card">
                                <div class="finale-card-art">${renderFocusedArt(m.art)}</div>
                                <strong>${m.name}</strong>
                            </div>`).join('')}
                    </div>
                    <p class="move-description-text">${firstTime
                        ? 'Congratulations, Soulbinder! The Void Devourer is no more and the dark dimension falls silent. Every soul you bound and every monster you merged led to this moment. Thank you for playing!'
                        : 'The Void stirred once more, and once more your merged souls sent it back into the dark. The portal stays open whenever you want another go.'}</p>
                    <button class="nine-cut-button">CONTINUE</button>
                </div>`;
            document.getElementById('game-container').appendChild(el);
            applyArtAutoFocus(el);
            spawnVictoryConfetti(el);
            void el.offsetWidth;
            el.classList.add('show');
            el.querySelector('button').onclick = () => {
                fadeThroughBlack(() => {
                    el.remove();
                    currentRun = { party: [], nodeIndex: 0, nodes: [], energy: 0, turnOrder: [], activeTurnIndex: 0 };
                    // The run ends back in the normal menu; the portal in its corner is the way back in.
                    inDarkDimension = false;
                    showScreen('screen-menu');
                    if (firstTime) setTimeout(showDarkDimensionUnlockedPopup, 1200);
                });
            };
        }

        // A spotlight popup on the portal, shown the first time the final boss is beaten and the player is back in the city.
        function showDarkDimensionUnlockedPopup() {
            runTutorialSteps([{
                target: () => document.getElementById('menu-portal'),
                title: 'DARK DIMENSION UNLOCKED!',
                instant: true,
                width: 640,
                pad: 10,
                button: 'GOT IT',
                text: `The <span class="tut-hl">portal</span> in the corner stays open. Step through it whenever you want to face the Void again.`
            }]);
        }

        function spawnVictoryConfetti(host) {
            const colors = ['#ffd700', '#ff6b6b', '#74c0fc', '#b197fc', '#69db7c', '#ffffff'];
            for (let i = 0; i < 90; i++) {
                const bit = document.createElement('div');
                bit.className = 'fv-confetti';
                bit.style.left = `${Math.random() * 100}%`;
                bit.style.background = colors[i % colors.length];
                bit.style.width = `${8 + Math.random() * 10}px`;
                bit.style.height = `${12 + Math.random() * 14}px`;
                host.appendChild(bit);
                bit.animate([
                    { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
                    { transform: `translate(${(Math.random() - 0.5) * 300}px, 1150px) rotate(${360 + Math.random() * 720}deg)`, opacity: 1 }
                ], { duration: 2800 + Math.random() * 2600, delay: Math.random() * 2400, iterations: Infinity, easing: 'linear' });
            }
        }

        // ---------------------------------------------------------------------------------------
        // The boss's brain. It has far more moves than any other enemy, so instead of a fixed priority list it scores
        // every move it can afford (and every target for it) in "HP worth of value" - damage, kills, healing, buffs on
        // itself, debuffs, stuns and poison on the party - minus what the energy is worth, and plays the best one.
        // Basic Attack is the fallback: it hits for little but refunds 2 energy.
        // ---------------------------------------------------------------------------------------
        const FINAL_BOSS_EN_VALUE = 10;   // one energy, in HP

        // Roughly the damage a unit deals per turn: how much it matters to take it out or slow it down.
        function finalBossThreat(p) {
            const atk = Math.max(p.matk || 0, p.ratk || 0) * (1 + (p.atkMod || 0));
            const speed = Math.max(0.6, Math.min(1.6, (p.spd * (1 + (p.spdMod || 0))) / 10));
            return Math.max(4, atk * 1.0 * speed);
        }

        function finalBossHasStatus(unit, list, type) {
            return !!(unit[list] && unit[list].some(b => b.type === type));
        }

        // Who the boss may hit with `move`: Taunting monsters first, the front row for melee, otherwise anyone.
        function finalBossValidTargets(move) {
            const alive = currentRun.party.filter(p => p && p.currentHp > 0);
            const taunters = alive.filter(p => finalBossHasStatus(p, 'buffs', 'taunt'));
            if (taunters.length) return taunters;
            if (move.melee) {
                const front = currentRun.party.slice(0, 2).filter(p => p && p.currentHp > 0);
                if (front.length) return front;
            }
            return alive;
        }

        // Value of the side effect of `eff` landing on party member `t` (before the chance of it landing is applied
        // by the caller where needed).
        function finalBossEffectValue(eff, t) {
            const turns = eff.turns || 1;
            switch (eff.type) {
                case 'atk_debuff_pct':
                    return finalBossHasStatus(t, 'debuffs', 'atk_debuff_pct') ? 0 : finalBossThreat(t) * eff.value * Math.min(turns, 2);
                case 'spd_debuff_pct':
                    return finalBossHasStatus(t, 'debuffs', 'spd_debuff_pct') ? 0 : finalBossThreat(t) * eff.value * Math.min(turns, 2) * 0.8;
                case 'stun':
                    return (t.stunned > 0 || t.sleep > 0) ? 0 : eff.chance * turns * finalBossThreat(t) * 1.1;
                case 'sleep':
                    return (t.stunned > 0 || t.sleep > 0) ? 0 : eff.chance * turns * finalBossThreat(t) * 0.7;
                case 'poison_flat':
                case 'poison_pct': {
                    const dmg = eff.type === 'poison_pct' ? Math.floor(t.hp * eff.value) : (eff.value || 8);
                    if (t.poison >= dmg && t.poisonTurns > 1) return 0;
                    return Math.min(dmg * turns, t.currentHp) * 0.5;
                }
                case 'toxin_pct': {
                    if (t.toxin > 0 && t.toxinTurns > 1) return 0;
                    return Math.min(Math.floor(t.hp * eff.value) * turns, t.currentHp) * 0.5;
                }
                default:
                    return 0;
            }
        }

        // Value of hitting `t` with a damaging `move`: damage (a kill is worth extra), minus anything it reflects back.
        function finalBossHitValue(unit, move, t) {
            const hits = move.hits || 1;
            const counter = t.buffs && t.buffs.find(b => b.type === 'counter');
            if (counter) {
                // The hit is negated and part of it comes back (and any status bounces onto the boss too).
                return -Math.floor(calculateDamage(unit, move, t) * hits * counter.value);
            }
            const raw = calculateDamage(unit, move, t) * hits;
            let value = Math.min(raw, t.currentHp);
            if (raw >= t.currentHp) value += 20 + finalBossThreat(t) * 2;   // a kill removes all its future turns
            const thorns = activeBuffs(t).find(b => b.type === 'brambles');
            if (thorns) value -= thorns.value * hits;
            return value;
        }

        // Which statuses a self-buff move leaves active on the boss, so the planner knows it is already up for the next move of the turn.
        const FINAL_BOSS_ACTIVE_KEYS = {
            atk_buff_pct: ['atk_buff_pct'], savage_stance_pct: ['atk_buff_pct', 'guard_pct'], guard_pct: ['guard_pct'], counter: ['counter'],
            brambles: ['brambles'], lifesteal_buff: ['lifesteal_buff'], regen_flat: ['regen'], regen_pct: ['regen'],
            overcharge_buff: ['overcharge_buff'], taunt: ['taunt'], heal_flat: ['healed'], heal_pct: ['healed']
        };

        // Value of a move that only affects the boss itself (buffs, heals, regen...). `sim` holds the statuses (and 'healed')
        // that earlier moves of the turn being planned will already have put in place.
        function finalBossSelfValue(unit, move, sim) {
            const eff = move.effect;
            if (!eff) return 0;
            const hurt = unit.currentHp / unit.hp;
            const out = Math.max(unit.matk, unit.ratk) * 0.9;   // what one of its attacks does, roughly
            const actions = 1.6;                                 // attacks it gets in a turn
            const turns = Math.min(eff.turns || 1, 3);
            const active = type => finalBossHasStatus(unit, 'buffs', type) || sim.has(type);
            const guarded = unit.defMod > 0 || sim.has('guard_pct');
            const party = currentRun.party.filter(p => p && p.currentHp > 0);
            switch (eff.type) {
                case 'atk_buff_pct':
                    return active('atk_buff_pct') ? 0 : out * eff.value * actions * turns * 0.75;
                case 'guard_pct':
                    return guarded ? 0 : out * eff.value * (hurt < 0.5 ? 1.8 : 1);
                case 'savage_stance_pct':
                    return (active('atk_buff_pct') ? 0 : out * eff.atk_value * actions * Math.min(eff.atk_turns, 3) * 0.75) +
                           (guarded ? 0 : out * eff.guard_value * (hurt < 0.5 ? 1.8 : 1));
                case 'counter':
                    return active('counter') ? 0 : out * (1 + eff.value) * 0.8;
                case 'brambles':
                    return active('brambles') ? 0 : eff.value * 2.4 * turns * 0.6;
                case 'lifesteal_buff':
                    return active('lifesteal_buff') ? 0 : eff.value * out * actions * turns * 0.7 * (hurt < 0.6 ? 1.4 : 1);
                case 'regen_flat':
                case 'regen_pct': {
                    if (active('regen')) return 0;
                    const per = eff.type === 'regen_pct' ? Math.floor(unit.hp * eff.value) : eff.value;
                    return per * (eff.turns || 1) * (hurt < 0.95 ? 1 : 0.2);
                }
                case 'overcharge_buff':
                    return active('overcharge_buff') ? 0 : eff.value * FINAL_BOSS_EN_VALUE * actions * turns * 0.75;
                case 'taunt': {
                    if (active('taunt') || unit.tauntCooldown > 0) return 0;
                    // Taunt locks Basic Attack and every non-damaging move, so a team out of energy can't act at all.
                    return party.reduce((sum, p) => {
                        const cheapest = Math.min(...p.moves.map(m => m.c));
                        return sum + (p.energy < cheapest ? 0.6 : 0.15) * finalBossThreat(p);
                    }, 0);
                }
                case 'heal_flat':
                case 'heal_pct': {
                    const amount = eff.type === 'heal_pct' ? Math.floor(unit.hp * eff.value) : eff.value;
                    return Math.min(amount, unit.hp - unit.currentHp) * (hurt < 0.5 ? 1.3 : 1) * (sim.has('healed') ? 0.3 : 1);
                }
                default:
                    return 0;
            }
        }

        // The best way to play `move`: { value, target } (target undefined for self/AoE moves), or null if it is pointless.
        function finalBossEvaluate(unit, move, sim) {
            const eff = move.effect;
            const targetKind = eff ? eff.target : 'enemy';
            const damaging = move.p > 0;

            if (targetKind === 'self' || targetKind === 'all_allies' || targetKind === 'ally') {
                return { value: finalBossSelfValue(unit, move, sim), target: undefined };
            }

            if (targetKind === 'all_enemies') {
                const victims = currentRun.party.filter(p => p && p.currentHp > 0);
                let value = 0;
                victims.forEach(t => {
                    if (damaging) value += finalBossHitValue(unit, move, t);
                    if (eff && !(t.buffs && t.buffs.some(b => b.type === 'counter'))) value += finalBossEffectValue(eff, t);
                });
                return { value, target: undefined };
            }

            let best = null;
            finalBossValidTargets(move).forEach(t => {
                let value = damaging ? finalBossHitValue(unit, move, t) : 0;
                if (eff && !(t.buffs && t.buffs.some(b => b.type === 'counter'))) value += finalBossEffectValue(eff, t);
                if (!best || value > best.value) best = { value, target: t };
            });
            return best;
        }

        // The order a turn's moves are played in: set up first (buffs, lifesteal, guard...), then heal, then status moves
        // (stuns, debuffs), and only then the attacks - so every buff is already working when the attack lands.
        function finalBossActionRank(move) {
            const type = move.effect && move.effect.type;
            if (!(move.p > 0)) {
                if (type && type.includes('heal')) return 1;
                if (type && FINAL_BOSS_ACTIVE_KEYS[type]) return 0;
                return 2;
            }
            return 3;
        }

        // Plans the whole turn: keeps adding the move with the best net value that the remaining energy can pay for (a buff
        // that is already up, or a heal at full HP, is worth nothing, so it is "willing" to buff only when it pays off), then
        // returns the first move of that plan in play order. It re-plans after every move, so the rest follows.
        function finalBossChooseAction(unit) {
            const noise = new Map(unit.moves.map(m => [m, 0.9 + Math.random() * 0.2]));   // so it does not play the same turn every time
            const sim = new Set();
            const usedStatus = new Set();
            const plan = [];
            let energy = unit.energy;
            for (let step = 0; step < 5; step++) {
                let best = null;
                unit.moves.forEach(move => {
                    if (move.c > energy || (!(move.p > 0) && usedStatus.has(move.n))) return;
                    const result = finalBossEvaluate(unit, move, sim);
                    if (!result) return;
                    const net = (result.value - move.c * FINAL_BOSS_EN_VALUE) * noise.get(move);
                    if (net > 0 && (!best || net > best.net)) best = { move, target: result.target, net };
                });
                if (!best) break;
                plan.push(best);
                energy -= best.move.c;
                if (!(best.move.p > 0)) usedStatus.add(best.move.n);
                const type = best.move.effect && best.move.effect.type;
                (FINAL_BOSS_ACTIVE_KEYS[type] || []).forEach(key => sim.add(key));
            }
            if (plan.length) {
                plan.sort((a, b) => finalBossActionRank(a.move) - finalBossActionRank(b.move) || b.net - a.net);
                return plan[0];
            }

            // Nothing is worth its energy: Basic Attack, on whoever is the biggest threat that won't punish it.
            const targets = finalBossValidTargets(BASIC_ATTACK_MOVE).filter(t => !finalBossHasStatus(t, 'buffs', 'counter'));
            const pool = targets.length ? targets : finalBossValidTargets(BASIC_ATTACK_MOVE);
            const target = pool.reduce((a, b) => (finalBossThreat(b) / b.currentHp > finalBossThreat(a) / a.currentHp ? b : a), pool[0]);
            return { move: BASIC_ATTACK_MOVE, target };
        }

        // Taunt locks Basic Attack and every non-damaging move, so a team that is out of energy cannot act at all; cast every
        // turn it would lock them out for good. It goes on a cooldown of three of the boss's turns (counted at turn ends).
        function finalBossNoteAction(unit, move) {
            if (move.effect && move.effect.type === 'taunt') unit.tauntCooldown = 3;
            if (move.isBasicAttack || unit.energy - move.c <= 0) unit.tauntCooldown = Math.max(0, (unit.tauntCooldown || 0) - 1);
        }

        function finalBossAI(unit) {
            const { move, target } = finalBossChooseAction(unit);
            finalBossNoteAction(unit, move);
            executeMove(unit, move, target);
        }
