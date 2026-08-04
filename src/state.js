// --- STATE ---
        let gameState = {
            unlockedStarters: [],
            discoveredMerges: [],
            maxActReached: 1
        };

        function getMapRoadBackground(arcId) {
            if (arcId === 'arc2') return "url('Art/Forest_Road_red_dots.png')";
            if (arcId === 'arc3') return "url('Art/Laboratory_Road_red_dots.png')";
            return "url('Art/Cave_Road_red_dots.png')";
        }

        function getMapRoadName(arcId) {
            if (arcId === 'arc2') return 'FOREST ROAD';
            if (arcId === 'arc3') return 'LABORATORY ROAD';
            return 'CAVE ROAD';
        }

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