// --- STATE ---
        let gameState = {
            unlockedStarters: [],
            discoveredMerges: [],
            maxActReached: 1
        };

        let currentRun = {
            party: [],
            nodeIndex: 0,
            nodes: [],
            energy: 0,
            turnOrder: [],
            activeTurnIndex: 0
        };

        let selectionSlots = [null, null, null, null];
        let mergeSlots = [null, null];