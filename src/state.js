// --- STATE ---
        let gameState = {
            unlockedStarters: ['wolf', 'slime'],
            discoveredMerges: []
        };

        let currentRun = {
            party: [],
            nodeIndex: 0,
            nodes: [],
            energy: 0,
            turnOrder: [],
            activeTurnIndex: 0
        };

        let selectionSlots = [null, null];
        let mergeSlots = [null, null];