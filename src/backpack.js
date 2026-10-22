// --- BACKPACK ---
// When the party is full, a defeated monster you recruit is saved here instead of replacing anyone.
// Backpack monsters keep their HP/energy, can be swapped into the party on the Team Formation,
// Merge and Last Changes screens, and can be used as merge parents.
const BACKPACK_SIZE = 3;

function getBackpack() {
    if (!currentRun) return [];
    if (!Array.isArray(currentRun.backpack)) currentRun.backpack = Array(BACKPACK_SIZE).fill(null);
    return currentRun.backpack;
}

function resetBackpack() {
    currentRun.backpack = Array(BACKPACK_SIZE).fill(null);
}

function getSlotList(kind) {
    return kind === 'backpack' ? getBackpack() : currentRun.party;
}

// Where a monster currently sits: { kind: 'party' | 'backpack', idx } or null.
function locateMonster(m) {
    if (!m) return null;
    let idx = currentRun.party.indexOf(m);
    if (idx !== -1) return { kind: 'party', idx };
    idx = getBackpack().indexOf(m);
    if (idx !== -1) return { kind: 'backpack', idx };
    return null;
}

// Swaps the contents of two slots (either list). Refuses a swap that would leave the party empty.
function swapSlots(a, b) {
    if (!a || !b || (a.kind === b.kind && a.idx === b.idx)) return false;
    const listA = getSlotList(a.kind), listB = getSlotList(b.kind);
    const temp = listA[a.idx];
    listA[a.idx] = listB[b.idx];
    listB[b.idx] = temp;
    if (!currentRun.party.some(Boolean)) {
        listB[b.idx] = listA[a.idx];
        listA[a.idx] = temp;
        showGameAlert('Party Empty', 'You need at least one monster in your party.');
        return false;
    }
    return true;
}

// Puts a monster in the first free backpack slot. Returns the slot index, or -1 when the backpack is full.
function saveToBackpack(monster) {
    const bp = getBackpack();
    const idx = bp.findIndex(m => !m);
    if (idx === -1) return -1;
    bp[idx] = monster;
    return idx;
}

// Draws one backpack slot. `exclude` lists monsters to hide (e.g. the ones sitting in the merge slots).
function renderBackpackSlot(slot, m, i, exclude) {
    if (!m || (exclude && exclude.includes(m))) {
        slot.innerHTML = '';
        slot.classList.remove('filled');
        return;
    }
    slot.classList.add('filled');
    const hpPerc = Math.max(0, Math.min(100, (m.currentHp / m.hp) * 100));
    const hpColor = hpPerc > 66 ? '#22c55e' : hpPerc > 33 ? '#eab308' : '#ef4444';
    const mEnergy = m.energy !== undefined ? m.energy : (m.startingEnergy !== undefined ? m.startingEnergy : 1);
    slot.innerHTML = `
        <div class="backpack-drag" draggable="true" ondragstart="dragStart(event, 'backpack', ${i})" onclick="openCollectionDetails(getBackpack()[${i}], true, false)"></div>
        <div class="backpack-art">${m.art.includes('.png') ? `<img src="${m.art}" draggable="false" />` : `<div style="font-size:70px; line-height:1;">${m.art}</div>`}</div>
        <div class="backpack-type">${getTypeIconHtml(m.type, 30)}</div>
        <div class="backpack-name">${m.name}</div>
        <div class="backpack-bars">
            <div class="backpack-hp"><div style="width:${hpPerc}%; background:${hpColor};"></div><span class="move-description-text">${Math.ceil(m.currentHp)}/${m.hp}</span></div>
            <div class="backpack-energy">${(m.isBoss ? [1, 2, 3, 4, 5] : [1, 2, 3]).map(n => `<div style="background:${mEnergy >= n ? '#00a8ff' : '#222'};"></div>`).join('')}</div>
        </div>
    `;
}

// Redraws every slot of one backpack column ('team' or 'merge') and hides it during the tutorial.
function renderBackpack(prefix, exclude) {
    const column = document.getElementById(`${prefix}-backpack`);
    if (column) column.style.display = currentRun.isTutorial ? 'none' : 'flex';
    const bp = getBackpack();
    for (let i = 0; i < BACKPACK_SIZE; i++) {
        const slot = document.getElementById(`${prefix}-backpack-slot-${i}`);
        if (slot) renderBackpackSlot(slot, bp[i], i, exclude);
    }
}

// Drop handler shared by the team formation screen's slots: party <-> party, backpack <-> party/backpack.
function dropIntoSlot(ev, targetKind, afterDrop) {
    ev.preventDefault();
    const source = ev.dataTransfer.getData('source') || 'party';
    const sourceIndex = parseInt(ev.dataTransfer.getData('index'));
    const targetSlot = ev.target.closest('.select-slot, .backpack-slot');
    if (!targetSlot || isNaN(sourceIndex) || source === 'merge') return;
    const targetIndex = parseInt(targetSlot.getAttribute('data-slot'));
    SFX.play('drop');
    swapSlots({ kind: source, idx: sourceIndex }, { kind: targetKind, idx: targetIndex });
    afterDrop();
}

// Shown when a recruit has nowhere to go: pick which backpack monster to release, or leave the recruit behind.
function openBackpackFullModal(recruit) {
    const modal = document.getElementById('modal-selection');
    const list = document.getElementById('modal-list');
    document.getElementById('modal-title').innerText = 'Backpack Full - choose one to leave behind';
    list.className = 'collection-grid';
    list.innerHTML = '';

    const leave = (monster) => {
        const bp = getBackpack();
        const idx = bp.indexOf(monster);
        if (idx !== -1) bp[idx] = recruit;
        closeModal('modal-selection');
        advanceRun();
    };

    const closeBtn = document.getElementById('modal-selection-close-btn');
    closeBtn.onclick = () => leave(recruit);

    [recruit, ...getBackpack().filter(Boolean)].forEach(m => {
        const card = document.createElement('div');
        card.className = 'collection-square';
        const isNew = m === recruit;
        card.innerHTML = `
            <div style="height:120px; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">${renderArt(m.art, 100)}</div>
            <strong>${m.name}</strong>
            <div style="width:100%; padding:0 6px; margin-top:6px;">${getMiniHpEnergyHtml(m)}</div>
            <div style="margin-top:5px; color:${isNew ? '#ffd700' : '#fff'}; text-shadow: var(--outline-thin);">${isNew ? 'NEW - leave it behind' : 'Release'}</div>
        `;
        card.onclick = () => leave(m);
        list.appendChild(card);
    });
    modal.style.display = 'flex';
}
