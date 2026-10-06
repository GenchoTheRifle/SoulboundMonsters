// --- BOSS DIALOGUE ---
        // Cinematic speech overlay for bosses: darkens the screen, raises the boss's art and types
        // out its lines one at a time. Clicking finishes the current line, or moves to the next.
        // Resolves once the last line is dismissed. `defeated` makes the boss tremble and dissolve
        // into light as it leaves; `silhouette` styles it as the tutorial's mystery boss.
        function showBossDialogue({ art, name, lines, silhouette = false, defeated = false }) {
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
                void el.offsetWidth;
                el.classList.add('show');

                const lineEl = el.querySelector('.boss-dialogue-line');
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

                const nextLine = async () => {
                    index++;
                    if (index >= lines.length) {
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
