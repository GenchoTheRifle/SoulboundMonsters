// --- STATE ---
        let gameState = {
            unlockedStarters: [],
            discoveredMerges: [],
            maxActReached: 1
        };

        function getMapBackground(arcId) {
            if (arcId === 'arc2') return "url('Art/Forest Map.png')";
            if (arcId === 'arc3') return "url('Art/Laboratory Map.png')";
            return "url('Art/Cave Map.png')";
        }

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