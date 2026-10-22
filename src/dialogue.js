// --- BOSS DIALOGUE ---
        // Cinematic speech overlay for bosses: darkens the screen, raises the boss's art and types
        // out its lines one at a time. Clicking finishes the current line, or moves to the next.
        // Resolves once the last line is dismissed. `defeated` makes the boss tremble and dissolve
        // into light as it leaves; `silhouette` styles it as the tutorial's mystery boss.
        // `evolveTo` ({ art, name, lines, onEvolve }) makes the boss transform on the spot once its first
        // lines are done - it charges up, bursts into light and comes out as the new form, which then speaks
        // its own lines. `onEvolve` runs at the peak of the flash, while the swap is hidden.
        function showBossDialogue({ art, name, lines, silhouette = false, defeated = false, evolveTo = null }) {
            return new Promise(resolve => {
                const el = document.createElement('div');
                el.className = `boss-dialogue${silhouette ? ' silhouette' : ''}${defeated ? ' defeated' : ''}`;
                el.innerHTML = `
                    <div class="boss-dialogue-art"><img src="${art}" draggable="false" /></div>
                    <div class="boss-dialogue-speech">
                        <div class="boss-dialogue-name">${name}</div>
                        <div class="boss-dialogue-line move-description-text"></div>
                        <div class="boss-dialogue-hint">Click to continue</div>
                    </div>`;
                document.getElementById('game-container').appendChild(el);
                SFX.play(defeated ? 'bossOutro' : 'bossIntro');   // both are parked (no sound yet)
                void el.offsetWidth;
                el.classList.add('show');

                const lineEl = el.querySelector('.boss-dialogue-line');
                const nameEl = el.querySelector('.boss-dialogue-name');
                let index = -1;
                let typing = false;
                let ready = false;
                let closed = false;

                const close = () => {
                    if (closed) return;
                    closed = true;
                    el.classList.add('closing');
                    setTimeout(() => {
                        el.remove();
                        resolve();
                    }, defeated ? 1100 : 600);
                };

                const wait = ms => new Promise(r => setTimeout(r, ms));

                const evolve = async (to) => {
                    ready = false;
                    el.classList.remove('can-continue');
                    el.classList.add('evolving');
                    await Promise.race([preloadSprite(to.art), wait(1500)]);   // the new art must be ready for the swap, but never hold the scene up

                    const artBox = el.querySelector('.boss-dialogue-art');
                    const img = artBox.querySelector('img');
                    const rays = document.createElement('div');
                    rays.className = 'boss-evolve-rays';
                    artBox.prepend(rays);
                    const flash = document.createElement('div');
                    flash.className = 'boss-evolve-flash';
                    el.appendChild(flash);
                    SFX.play('evolve');

                    // Charge up: the body shakes harder and harder while the art glows white.
                    artBox.animate([
                        { transform: 'translate(0, 0) scale(1)' },
                        { transform: 'translate(-3px, 2px) scale(1.01)', offset: 0.2 },
                        { transform: 'translate(4px, -3px) scale(1.03)', offset: 0.4 },
                        { transform: 'translate(-6px, 4px) scale(1.05)', offset: 0.6 },
                        { transform: 'translate(7px, -5px) scale(1.08)', offset: 0.8 },
                        { transform: 'translate(-9px, 6px) scale(1.12)' }
                    ], { duration: 1800, easing: 'ease-in', iterations: 1 });
                    img.animate([
                        { filter: 'brightness(1) drop-shadow(0 0 22px rgba(255, 50, 60, 0.7))' },
                        { filter: 'brightness(1.6) drop-shadow(0 0 40px rgba(190, 110, 255, 0.95))', offset: 0.6 },
                        { filter: 'brightness(5) saturate(0.2) drop-shadow(0 0 80px rgba(255, 255, 255, 1))' }
                    ], { duration: 1800, easing: 'ease-in', fill: 'forwards' });
                    rays.animate([{ opacity: 0, transform: 'scale(0.2) rotate(0deg)' }, { opacity: 1, transform: 'scale(1) rotate(160deg)' }],
                        { duration: 1800, easing: 'ease-in', fill: 'forwards' });
                    await wait(1700);

                    // The burst. At its peak the old body is gone and the new one takes its place.
                    flash.classList.add('burst');
                    await wait(220);
                    img.getAnimations().forEach(a => a.cancel());
                    img.src = to.art;
                    nameEl.textContent = to.name;
                    el.classList.remove('silhouette');
                    if (to.onEvolve) to.onEvolve();
                    artBox.animate([
                        { transform: 'scale(0.6)', opacity: 0.2 },
                        { transform: 'scale(1.14)', opacity: 1, offset: 0.55 },
                        { transform: 'scale(1)', opacity: 1 }
                    ], { duration: 800, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
                    for (let i = 0; i < 3; i++) {
                        const ring = document.createElement('div');
                        ring.className = 'boss-evolve-ring';
                        artBox.appendChild(ring);
                        ring.animate([
                            { transform: 'translate(-50%, -50%) scale(0.15)', opacity: 1 },
                            { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 }
                        ], { duration: 1200, delay: i * 180, easing: 'ease-out', fill: 'both' }).onfinish = () => ring.remove();
                    }
                    await wait(1100);
                    rays.remove();
                    flash.remove();
                    el.classList.remove('evolving');
                    ready = true;
                };

                const nextLine = async () => {
                    index++;
                    if (index >= lines.length) {
                        if (evolveTo) {
                            const to = evolveTo;
                            evolveTo = null;
                            await evolve(to);
                            lines = to.lines;
                            index = -1;
                            nextLine();
                            return;
                        }
                        close();
                        return;
                    }
                    el.classList.remove('can-continue');
                    typing = true;
                    await typeText(lineEl, lines[index], 40);
                    typing = false;
                    el.classList.add('can-continue');
                };

                el.onclick = () => {
                    if (!ready || closed) return;
                    if (typing) {
                        lineEl._typeToken = null;
                        lineEl.textContent = lines[index];
                        return;
                    }
                    nextLine();
                };

                // Let the art rise into view before the first line starts.
                setTimeout(() => {
                    ready = true;
                    nextLine();
                }, 1100);
            });
        }
