                const btn = document.createElement('div');
                btn.className = 'collection-square combatant';
                btn.style.cursor = 'grab';
                btn.setAttribute('draggable', 'true');
                btn.ondragstart = (e) => dragStartSelection(e, id, null);
                const elementIcon = getElementIcon(s.type);
                btn.innerHTML = `
                    <div class="monster-art-container" style="pointer-events: none; margin-bottom: 5px;">
                        ${renderArt(s.art, 120)}
                    </div>
                    <div class="stats-container" style="position: relative; z-index: 10; width: 100%; padding: 0 10px; box-sizing: border-box; pointer-events: none;">
                        <div class="name" style="text-align: center; color: white; font-weight: bold; font-size: 14px; text-shadow: 1px 1px 2px black; margin-bottom: 4px;">
                            <img src="${elementIcon}" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;">${s.name}
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/HP.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="HP" />
                            <div class="hp-bar" style="flex: 1; position: relative; width: 100%; height: 10px; background: #222; border-radius: 5px; margin-top: 5px; overflow: hidden;">
                                <div class="hp-fill" style="width:100%; height: 100%; background-color:#22c55e;"></div>
                                <div class="hp-text" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; text-shadow: 1px 1px 2px black;">
                                    ${s.hp}/${s.hp}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                            <img src="Art/EN.png" style="width: 20px; height: 20px; filter: drop-shadow(1px 1px 1px black);" alt="EN" />
                            <div class="energy-blocks" style="display: flex; gap: 4px; flex: 1;">
                                ${[1, 2, 3].map(idx => `<div style="flex: 1; height: 6px; background-color: #222; border-radius: 2px;"></div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
                list.appendChild(btn);
