// --- AUDIO (sample-based sound effects, Web Audio API) ---
// Usage: SFX.play('name', optionalArg). Safe to call anywhere: it no-ops until the first user
// gesture unlocks the AudioContext, until samples have loaded, and while muted. Preferences persist
// in localStorage. Samples live in Sounds/ (CC0: RPG Sound Pack by artisticdude, Kenney Impact
// Sounds + Sci-fi Sounds - see Sounds/kenney/LICENSE-*.txt). test_sounds.html auditions everything.
const SFX = (() => {
    const PREF_KEY = 'soulbound_audio';
    // volume = sound effects knob, musicVolume = music / ambience knob. Both start low (20%) for a new player; once a player touches a slider their setting is saved and wins.
    const prefs = { muted: false, volume: 0.2, musicVolume: 0.2 };
    try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF_KEY)) || {}); } catch (e) {}

    let ctx = null, master = null, ambOut = null, analyser = null, unlocked = false;
    const lastPlayed = {};
    const lastPick = {};

    // ---------------------------------------------------------------- sample pools
    // Named groups used by the UI/event table below (U); a play picks one at random. Per-move
    // sounds (M) reference exact files instead. Files live under Sounds/.
    const kn = (base, n = 5) => Array.from({ length: n }, (_, i) => `kenney/${base}_${String(i).padStart(3, '0')}.ogg`);
    const POOLS = {
        // Only the pools the enabled event sounds use (everything else was removed to keep the project small). RPG Sound Pack (artisticdude, CC0)
        swing3: ['rpg/swing3.wav'],
        bubble: ['rpg/bubble.wav', 'rpg/bubble2.wav', 'rpg/bubble3.wav'],
        ui1: ['rpg/interface1.wav'], ui6: ['rpg/interface6.wav'],
        coinB: ['rpg/coin2.wav'],
        metalRing: ['rpg/metal-ringing.wav'],
        metalSmall: ['rpg/metal-small1.wav', 'rpg/metal-small2.wav', 'rpg/metal-small3.wav'],
        bottle: ['rpg/bottle.wav'], cloth: ['rpg/cloth.wav'],
        // Kenney Impact Sounds (CC0)
        woodL: kn('impactWood_light'), step: kn('footstep_concrete'), stepGrass: kn('footstep_grass'),
        ambience: ['ambience/forest.ogg', 'ambience/cave.ogg', 'ambience/menu_music.mp3', 'ambience/combat_cave.mp3', 'ambience/combat_boss.mp3', 'ambience/combat_forest.mp3', 'ambience/combat_treant.mp3', 'ambience/combat_lab.mp3', 'ambience/combat_lab_boss.mp3', 'ambience/campfire.mp3'],   // looped beds (see AMBIENCES); listed here so they get preloaded
    };

    // ---------------------------------------------------------------- layers
    // A layer is [pool, volume=1, rate=1, delaySec=0, opts]. A sound is a list of layers played together.
    // rate > 1 is higher/shorter, < 1 is deeper/longer. opts.dur fades the sample out after dur seconds.
    const U = {
        click: [['ui1', .55, 1, 0, { start: .024 }]],   // the sample has 25 ms of near-silence before its tick: skip it so the click is instant
        // Choosing a skill in combat: a deeper, weightier two-tone "select" than the plain button click.
        ability: [['ui6', .6, .8, 0, { start: .0 }]],
        // Hover over a button: a very soft, low "pulse" (a short rounded thump of a note), barely there.
        hover: [['synth:pulse', 1, 1, 0, {}]],
        confirm: [['ui6', .6]],
        select: [['ui1', .5, 1.3]],
        drop: [['woodL', .8]],                                                       // dropping a monster into a slot: just the thud
        blip: [['ui1', .6, 2.4]],                      // typewriter tick for dialogue text (very short; it's quiet by design)
        // Walking to the next node (the token takes ~1 s): four footsteps. Act II (the forest) walks on grass, the others on stone.
        travel: [['step', .85, 1, 0], ['step', .7, 1, .25], ['step', .85, 1, .5], ['step', .7, 1, .75]],
        travelForest: [['stepGrass', .9, 1, 0], ['stepGrass', .75, 1, .25], ['stepGrass', .9, 1, .5], ['stepGrass', .75, 1, .75]],
        buttonPress: [['metalSmall', .8, 1.5], ['woodL', .35, 1.3, .02]],            // the red / green buttons on the map table
        coin: [['coinB', .8]],
        candle: [['swing3', .6, .55]],
        compass: [['metalSmall', .8, 1.2], ['metalSmall', .6, 1, .07]],            // the lid's hinge: click-click
        mushroom: [['bubble', .8, 1.4]],
        leaf: [['cloth', .6, 1.3]],
        vial: [['bottle', .9]],
        valve: [['metalRing', .5, 1.5], ['metalSmall', .5, .8, .05]],
        scrap: [['metalSmall', .8, .9], ['metalSmall', .6, 1.1, .1]],
        // counter / thorns / guardBlock / poison / toxin reuse their skill's sound (assigned below, once M is defined)
        // Heal: one soft, warm, positive note: a mellow tone that lifts slightly into pitch and fades gently. Quiet and non-intrusive.
        heal: [['synth:chime', 1.1, 1, 0, { notes: [659.25], decay: .9, wet: .45, bright: .2, attack: .03, lift: .94 }]],
        // Energy gained: a short, muffled "bling" (one high-ish note, rounded off by a lowpass; no sharp edge). It happens a lot, so it stays small.
        energy: [['synth:chime', 1.0, 1, 0, { notes: [987.77], decay: .42, bright: .3, attack: .008, wet: .2, lp: 1700 }]],
        stun: [['synth:chirp', 1.4, 1, 0, {}]],                                           // a stunned unit loses its turn: dizzy birds chirping
        sleep: [['creature/snore.ogg', 1, 1, 0, { dur: 1.5 }]],                            // an asleep unit loses its turn: a snore
        // An enemy dies and its energy is taken: a dark magic burst over a sinking energy-drain.
        enemyDeath: [['dark/fout-02.flac', .9], ['dark/powerdrain.ogg', .75, 1, 0, { dur: 1.3 }]],
        // Victory: three rising trumpet notes (C - E - G) that grow louder, the last one held: "tuu, TUU, TUUUU".
        victory: [['synth:horn', .8, 1, 0, { notes: [[261.63, 0, .5, .7], [329.63, .55, .5, .85], [392, 1.1, 1.5, 1]], attack: .07, bright: 1.35, wet: .6 }]],
        // Defeat: three falling notes (G - E-flat - C, a minor fall) that sag and fade: "tuu, tuu, tuuuu...".
        defeat: [['synth:horn', .8, 1, 0, { notes: [[392, 0, .55, 1], [311.13, .6, .55, .85], [261.63, 1.2, 1.7, .7]], attack: .09, bright: .8, droop: .035, wet: .65 }]],
        // Enter Map: a horn call as the run begins (it plays over the act title card).
        // A warm, natural brass horn call: two notes a fifth apart (F3 then C4), soft attack, over the act title card.
        enterMap: [['synth:horn', .8, 1, 0, { notes: [[174.61, 0, 1.15], [261.63, 1.0, 1.7]], wet: .55 }]],
        // A monster joins your party: a short, friendly rising three-note greeting.
        recruit: [['synth:chime', .85, 1, 0, { notes: [659.25, 880, 1108.73], step: .09, decay: .9, pad: 329.63, wet: .6, bright: .7 }]],
        // Merge: two monsters fusing. A rising swell of notes that resolves on a deep thump as the new monster appears.
        merge: [['synth:chime', .72, 1, 0, { notes: [392, 493.88, 587.33, 783.99], step: .09, decay: 1.6, pad: 196, glide: [150, 900], wet: .85, bright: .6, sparkle: true }],
                ['kenney/lowFrequency_explosion_001.ogg', .6, 1.3, .3]],
        // New starter unlocked: a little "lock opening" click, then a bright rising fanfare with a glow.
        unlock: [['metalSmall', .7, 1.3], ['synth:chime', .78, 1, .1, { notes: [587.33, 739.99, 880, 1174.66], step: .08, decay: 1.4, pad: 293.66, wet: .85, bright: .9, sparkle: true }]]
    };

    // ---------------------------------------------------------------- per-move sounds
    // ONE sound per skill, played at the moment its animation lands (once per hit for multi-hit
    // moves, once per target for buffs/debuffs). An entry is one layer [file, volume=1, rate=1,
    // delaySec=0, {start, dur}] or a list of layers heard together as a single effect. A fixed
    // file, no randomness. rate < 1 is deeper/heavier; {start, dur} cut a segment out of a long
    // recording. No entry = silent (e.g. Heal: the heal event plays its own sparkle).
    const K = n => `kenney/${n}.ogg`;
    const R = n => `rpg/${n}.wav`;
    const C = n => `creature/${n}.ogg`;
    const H = n => `hits/hit${n}.flac`;        // Independent.nu hits & punches
    const GK = n => `gunkurt/${n}.wav`;        // gunshot recordings by kurt (several clean shots per file)
    const SN = n => `snarl/${n}.ogg`;          // Monster Snarls by Darsycho
    const FA = n => `firearm/${n}.wav`;        // single rifle shots cut from the Free Firearm Sound Library
    const BG = n => `bang/${n}.ogg`;           // "25 CC0 bang / firework SFX" by rubberduck: game-style bangs
    const E = n => `electric/${n}.wav`;        // faxcorp electricity pack
    const P = n => `pop/pop${n}.ogg`;
    const S = n => `splat/${n}.flac`;          // Independent.nu extreme splatter (wet cracks)
    // Shared sounds: Bulletstorm repeats Snipe's shot once per bullet, Shockwave repeats Zap's once per enemy hit.
    const SNIPE = [BG('bang_01')];                                        // game-style bang (25 CC0 bang SFX); Bulletstorm repeats it
    const ZAP = [E('teleport_1')];
    const M = {
        'Basic Attack':       ['synth:thud', .9, 1, 0, { size: 1 }],   // plain, clean thud (synthesised)
        // Beast
        'Bite':               [[R('mnstr12'), 1], [R('bite-small'), .6]],                  // wolf bite: snarl + snap
        'Alpha Bite':         [[R('mnstr9'), 1, .85], [R('bite-small'), .7, .8]],          // same combo, bigger and deeper
        'Maul':               [[R('swing'), 1], [S('crack12'), .7, 1, 0, { dur: .35 }]],                   // claws tearing: whoosh + wet rip
        'Elder Maul':         [[R('swing'), 1, .85], [S('crack12'), .8, .85, 0, { dur: .4 }]],
        'Devour':             [[R('swing2'), 1, .85], [S('crack11'), .8, .9, 0, { dur: .45 }]],      // one heavy slash (single impact)
        'Echo':               [K('forceField_000')],                   // expanding sonic rings
        'Crimson Echo':       [K('forceField_002'), 1, .85],
        'Hemorrhage':         [[K('lowFrequency_explosion_001'), .7, 1.3], [C('burble_01'), 1, 1.1]],   // liquid explosion
        'Howl':               [C('howl')],                             // the one vocal skill: it IS a howl
        'Alpha Howl':         [C('howl'), 1, .8],
        'Intimidate':         [K('impactBell_heavy_001'), 1, .55],     // ominous toll
        'Guard':              [K('impactPlate_heavy_002')],            // shield plate clang
        'Elder Guard':        [K('impactPlate_heavy_004'), 1, .8],
        'Lifesteal':          [C('bug_03')],                           // bat-like chirp
        'Crimson Lifesteal':  [C('bug_03'), 1, .8],
        'Savage Stance':      [K('impactPunch_heavy_002'), 1, .7],
        // Nature
        'Slam':               [H('33')],                               // falling-object thud
        'Colossal Slam':      [H('35'), 1.2, .75],
        'Root Crush':         ['creak/tree_creak.ogg', 1, .9, 0, { start: .2, dur: 1.4 }],   // roots creaking and tightening
        'Spit':               [C('spit_03'), 1, .85],                  // slime spit
        'King Spit':          [C('spit_03'), 1, .65],
        'Slumber Sludge':     [C('spit_01'), 1, .8],
        'Spore':              [P(5)],                                  // pop
        'Giant Spore':        [P(1)],
        'Poison Cloud':       [R('bubble2'), 1, .8],                   // bubbles; Poison Cloud and Toxin are a family
        'Giant Poison Cloud': [R('bubble2'), 1, .6],
        'Toxin':              [R('bubble2'), 1, 1],
        'Renewal Spores':     [[R('spell'), .8, 1, 0, { dur: 1.7 }], [R('magic1'), .6, 1.1]],   // healing aura
        'Thorns':             [K('impactPlank_medium_003')],
        'Colossal Thorns':    [K('impactPlank_medium_003'), 1, .75],
        // Mech
        'Punch':              [H('14')],                               // robot fist (the metal "ding" layer was removed)
        'Heavy Punch':        [H('10'), 1, .85],
        'Snipe':              SNIPE,                                                       // rifle shot
        'Elite Snipe':        [BG('cannon_02'), 1, 1, 0, { dur: .9 }],                           // the same kind of bang, bigger and boomier
        'Bulletstorm':        SNIPE,                                                       // Snipe's shot, once per bullet (3 hits per target)
        'Stun Bolt':          [[E('groundhit'), 1], [E('snaploop'), 1, 1, 0, { start: 2.2, dur: 1 }], [E('snaploop'), .9, 1, 0, { start: 3.4, dur: 1 }]],   // two crackle cuts layered: denser, so it carries as much weight as the other skills
        'Elite Stun Bolt':    [[E('snaploop'), 1, 1, 0, { start: 2.4, dur: 1 }], [E('groundhit'), .9, .8], [E('shieldhit'), .5, 1.1, 0, { dur: .8 }]],
        'Zap':                ZAP,
        'Ultimate Zap':       [[E('teleport_1'), 1, .8], [E('groundhit'), .7, .9]],
        'Shockwave':          ZAP,                                                         // Zap's sound, once per enemy struck
        'Void Shockwave':     ZAP,                                                         // the tutorial boss's Shockwave (defined in tutorial.js, not data.json)
        'Soul Devour':        [[R('swing2'), 1, .85], [S('crack11'), .8, .9, 0, { dur: .45 }]],   // the tutorial boss's Devour
        'Counter':            [[R('sword-unsheathe3'), 1], [R('sword-unsheathe5'), .8]],                                  // swords clashing: two blades meeting on one impact
        'Heavy Counter':      [[R('sword-unsheathe'), 1, .85], [R('sword-unsheathe4'), 1, .8], [R('sword-unsheathe2'), .8, .9]],   // heavier clash, all blades on one impact
        'Taunt':              [[C('scream_02'), .75, .55, 0, { ring: 45, ringMix: .55 }], [C('roar_02'), .5]],   // a big robot screaming: deep, ring-modulated scream + low roar
        'Overcharge':         [E('powerup'), 1, 1, 0, { start: .2, dur: .9 }],   // buff spell (the slow build-up is trimmed so its swell lands on the animation)
        'Full Throttle':      [[E('powerup'), 1, .75, 0, { start: .2, dur: 1.5 }], [R('spell'), .7, 1, 0, { start: .15, dur: 1.65 }]],     // the grand version
        'Ultimate Overcharge': [[E('powerup'), 1, .85, 0, { start: .2, dur: 1.2 }], [R('magic1'), .6, 1.2]]
    };

    // ---------------------------------------------------------------- engine
    const buffers = new Map();   // file -> { buf, gain } once decoded
    let loading = false;

    function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) {} }
    // x1.4 mostly makes up for the 0.6 headroom factor on every sound (TRIM_MASTER): same balance, about 1.5 dB quieter overall, with room below clipping.
    // Two independent knobs: sound effects go through `master`, every music / ambience bed through `ambOut`; both end in the same safety limiter.
    function applyVolume() {
        if (master) master.gain.value = prefs.muted ? 0 : Math.pow(prefs.volume, 1.5) * 1.4;
        if (ambOut) ambOut.gain.value = prefs.muted ? 0 : Math.pow(prefs.musicVolume, 1.5) * 1.4;
    }

    function ensureCtx() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            const comp = ctx.createDynamicsCompressor();
            // a safety limiter only (it must not squash sounds to the same height, or loudness can't be balanced per sound)
            comp.threshold.value = -3; comp.knee.value = 3; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.12;
            master = ctx.createGain();
            master.connect(comp);
            comp.connect(ctx.destination);
            ambOut = ctx.createGain(); ambOut.connect(comp);   // all music / ambience beds go through this: its own volume knob, not the sound-effects one
            analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0; comp.connect(analyser);   // taps the final output: used by test_sounds.html to measure loudness
            applyVolume();
            preload();
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // Fetch + decode every sample in the background. Each is loudness-normalised (RMS target,
    // peak-capped) so per-layer volumes in the tables above are comparable across packs.
    function preload() {
        if (loading) return;
        loading = true;
        const files = allFiles();
        let i = 0;
        const worker = async () => {
            while (i < files.length) {
                const f = files[i++];
                try {
                    const res = await fetch('Sounds/' + f);
                    if (!res.ok) throw new Error(res.status);
                    const buf = await ctx.decodeAudioData(await res.arrayBuffer());
                    let sum = 0, n = 0, peak = 0;
                    for (let c = 0; c < buf.numberOfChannels; c++) {
                        const d = buf.getChannelData(c);
                        for (let k = 0; k < d.length; k += 4) { const a = Math.abs(d[k]); sum += a * a; n++; if (a > peak) peak = a; }
                    }
                    const rms = Math.sqrt(sum / Math.max(1, n)) || 0.05;
                    buffers.set(f, { buf, file: f, gain: Math.min(0.2 / rms, 0.95 / (peak || 1), 6) });
                } catch (e) { console.warn('[SFX] failed to load', f, e); }
            }
        };
        Promise.all([worker(), worker(), worker(), worker()]);
    }

    // Every file the game can play: the named pools plus the fixed per-move files.
    const extraFiles = new Set();   // extra samples registered by test_sounds.html for auditioning
    // A move entry is one layer [file, vol, rate, delay, {start, dur}] or a list of layers.
    const moveLayers = e => Array.isArray(e[0]) ? e : [e];
    // Reactions and ticks reuse their skill's sound exactly.
    U.counter = moveLayers(M['Counter']);          // a counter triggers
    U.thorns = moveLayers(M['Thorns']);            // thorns reflect damage
    U.guardBlock = moveLayers(M['Guard']);         // a guard absorbs a hit
    U.poison = moveLayers(M['Poison Cloud']);      // poison damage tick
    U.toxin = moveLayers(M['Toxin']);              // toxin damage tick
    // The stronger ("evolved") versions of those skills have their own sound, and so do their reactions:
    U.counterHeavy = moveLayers(M['Heavy Counter']);     // a Heavy Counter triggers
    U.thornsColossal = moveLayers(M['Colossal Thorns']); // Colossal Thorns reflect damage
    U.guardBlockElder = moveLayers(M['Elder Guard']);    // an Elder Guard absorbs a hit
    U.poisonGiant = moveLayers(M['Giant Poison Cloud']); // Giant Poison Cloud damage tick
    function allFiles() {
        const moveFiles = Object.values(M).flatMap(e => moveLayers(e).map(l => l[0])).filter(f => !f.startsWith('synth:'));
        const eventFiles = Object.values(U).flat().map(l => l[0]).filter(f => f.includes('/') && !f.startsWith('synth:'));   // events that name a file directly
        return [...new Set([...Object.values(POOLS).flat(), ...moveFiles, ...eventFiles, ...[...extraFiles].filter(f => !f.startsWith('synth:'))])];
    }

    // Loudness gain for just the part of a long recording that actually plays (a single gunshot
    // cut out of a 15 s file must not be normalised against the silence around it).
    const segGains = new Map();
    function segGain(s, key, start, dur) {
        const k = key + '@' + start + '+' + dur;
        if (!segGains.has(k)) {
            const d = s.buf.getChannelData(0), sr = s.buf.sampleRate;
            const a = Math.floor(start * sr), b = Math.min(d.length, Math.floor((start + dur) * sr));
            let sum = 0, n = 0, peak = 0;
            for (let i = a; i < b; i += 2) { const x = Math.abs(d[i]); sum += x * x; n++; if (x > peak) peak = x; }
            const rms = Math.sqrt(sum / Math.max(1, n)) || 0.05;
            segGains.set(k, Math.min(0.2 / rms, 0.95 / (peak || 1), 6));
        }
        return segGains.get(k);
    }

    // `pool` is either a pool name (random pick, used by UI sounds) or a direct file path.
    function pick(pool) {
        if (pool.includes('/')) return buffers.get(pool) || null;
        const files = POOLS[pool];
        if (!files) { console.warn('[SFX] unknown pool', pool); return null; }
        let idx = Math.floor(Math.random() * files.length);
        if (files.length > 1 && idx === lastPick[pool]) idx = (idx + 1) % files.length;
        lastPick[pool] = idx;
        return buffers.get(files[idx]) || null;
    }

    // --- synthesised sounds: layer file name 'synth:<name>' instead of a sample ---
    let noiseBuf = null;
    function noiseBuffer() {
        if (!noiseBuf) {
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        return noiseBuf;
    }
    const SYNTHS = {
        // A gunshot built the way real ones are layered: a needle-sharp click, the supersonic crack,
        // the muzzle blast, a chest-level thump, a sub boom, and a room echo (generated reverb).
        // opts.size: ~.7 small/sharp rifle .. ~1.6 heavy boom. opts.wet: echo amount. opts.bolt: add a
        // bolt-action "ch-chk" after the shot. rate shifts the whole thing up/down. Fully deterministic.
        bang(t, v, rate, o) {
            const size = o.size ?? 1, wet = o.wet ?? 0.5;
            const bus = ctx.createGain(); bus.gain.value = v;
            bus.connect(master);
            const send = ctx.createGain(); send.gain.value = wet;
            bus.connect(send); send.connect(reverbBus());

            // short filtered noise burst at time `at` (seconds after t)
            const burst = (at, dur, type, f0, f1, q, gain, off = 0.137) => {
                const s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
                const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
                f.frequency.setValueAtTime(f0 * rate, t + at);
                f.frequency.exponentialRampToValueAtTime(Math.max(40, f1 * rate), t + at + dur);
                const g = ctx.createGain();
                g.gain.setValueAtTime(gain, t + at);
                g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
                s.connect(f); f.connect(g); g.connect(bus);
                s.start(t + at, off); s.stop(t + at + dur + 0.02);
            };
            const tone = (at, f0, f1, dur, gain) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(f0 * rate, t + at);
                osc.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
                const g = ctx.createGain();
                g.gain.setValueAtTime(gain, t + at);
                g.gain.exponentialRampToValueAtTime(0.001, t + at + dur);
                osc.connect(g); g.connect(bus);
                osc.start(t + at); osc.stop(t + at + dur + 0.02);
            };

            burst(0, 0.008, 'highpass', 2600, 2000, 0.7, 1.0);                       // needle-sharp initial click
            burst(0, 0.040, 'bandpass', 5400, 2600, 1.1, 0.85);                      // supersonic crack
            burst(0, 0.10 + 0.07 * size, 'lowpass', 3800, 300, 0.7, 1.0);            // muzzle blast
            burst(0.004, 0.24 + 0.14 * size, 'lowpass', 800, 90, 0.6, 0.75);         // chest thump
            tone(0, 150 / Math.sqrt(size), 36, 0.22 + 0.18 * size, 0.9);             // sub boom
            tone(0, 300 / Math.sqrt(size), 70, 0.10, 0.25);                          // its 2nd harmonic, adds punch
            if (o.bolt) {                                                            // working the bolt
                burst(0.62, 0.025, 'bandpass', 2300, 1800, 4, 0.30, 0.31);
                burst(0.74, 0.030, 'bandpass', 3100, 2200, 4, 0.35, 0.77);
            }
        }
    };

    // Generated room echo shared by the synths: a dark, exponentially decaying stereo noise tail.
    let reverb = null;
    function reverbBus() {
        if (!reverb) {
            const sr = ctx.sampleRate, len = Math.floor(sr * 1.7);
            const ir = ctx.createBuffer(2, len, sr);
            let seed = 20240607;
            const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
            for (let c = 0; c < 2; c++) {
                const d = ir.getChannelData(c); let lp = 0;
                for (let i = 0; i < len; i++) {
                    const sec = i / sr;
                    lp += (rnd() - lp) * Math.max(0.05, 0.6 - sec * 0.4);          // tail gets darker over time
                    d[i] = lp * Math.exp(-sec / 0.30) * (sec < 0.012 ? sec / 0.012 : 1);
                }
            }
            reverb = ctx.createConvolver();
            reverb.buffer = ir;
            reverb.connect(master);
        }
        return reverb;
    }

    // Satisfying "pickup" sound: bell-like notes (a sine plus two quiet overtones) played as a rising
    // run, with a soft echo. opts: notes (Hz), step (s between notes), decay (s), wet (echo amount),
    // pad (Hz, a warm swell underneath), glide ([from,to] Hz rising whoosh), sparkle (airy shimmer on top).
    SYNTHS.chime = function (t, v, rate, o) {
        const bus = ctx.createGain(); bus.gain.value = v;
        let tail = bus;
        if (o.lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = 0.5; bus.connect(f); tail = f; }   // lp = muffled
        tail.connect(master);
        const send = ctx.createGain(); send.gain.value = o.wet ?? 0.6; tail.connect(send); send.connect(reverbBus());
        const step = o.step ?? 0.07, decay = o.decay ?? 0.9, last = (o.notes.length - 1) * step;
        o.notes.forEach((f, i) => {
            const at = t + i * step;
            const bright = o.bright ?? 1, attack = o.attack ?? 0.004;   // bright scales the overtones (lower = softer, rounder)
            [[1, 1, 1], [2.01, 0.35 * bright, 0.6], [3.99, 0.14 * bright, 0.35]].forEach(([mult, amp, life]) => {   // fundamental + bell overtones
                const osc = ctx.createOscillator(); osc.type = 'sine';
                const hz = f * rate * mult;
                if (o.lift) {                                              // start slightly flat and lift into the note: a warm, positive feel
                    osc.frequency.setValueAtTime(hz * o.lift, at);
                    osc.frequency.exponentialRampToValueAtTime(hz, at + 0.09);
                } else osc.frequency.value = hz;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, at);
                g.gain.linearRampToValueAtTime(amp * 0.55, at + attack);
                g.gain.exponentialRampToValueAtTime(0.0001, at + decay * life);
                osc.connect(g); g.connect(bus);
                osc.start(at); osc.stop(at + decay * life + 0.05);
            });
        });
        if (o.pad) {                                                              // warm swell under the run
            const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.value = o.pad * rate;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.22, t + 0.12 + last / 2);
            g.gain.exponentialRampToValueAtTime(0.0001, t + decay * 1.1 + last);
            osc.connect(g); g.connect(bus);
            osc.start(t); osc.stop(t + decay * 1.1 + last + 0.05);
        }
        if (o.glide) {                                                            // rising whoosh: the soul being drawn in
            const osc = ctx.createOscillator(); osc.type = 'sine';
            osc.frequency.setValueAtTime(o.glide[0] * rate, t);
            osc.frequency.exponentialRampToValueAtTime(o.glide[1] * rate, t + last + 0.1);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.16, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + last + 0.16);
            osc.connect(g); g.connect(bus);
            osc.start(t); osc.stop(t + last + 0.2);
        }
        if (o.sparkle) {                                                          // airy shimmer as the last note lands
            const s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
            const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000 * rate; f.Q.value = 0.5;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t + last);
            g.gain.linearRampToValueAtTime(0.09, t + last + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + last + 0.4);
            s.connect(f); f.connect(g); g.connect(bus);
            s.start(t + last, 0.31); s.stop(t + last + 0.45);
        }
    };

    // A warm brass horn call: each note is two slightly detuned sawtooth voices through a lowpass that opens as the note
    // swells (that's what makes brass sound brassy), with a soft attack, a little scoop up into the pitch, a gentle vibrato
    // and a room echo. opts.notes = [[Hz, startSec, lengthSec, loudness = 1], ...]; opts.wet = echo amount;
    // opts.attack = swell time (default .22 s; a trumpet call uses ~.07); opts.bright = brightness (1 = horn, >1 = trumpet);
    // opts.droop = how far each note sags in pitch toward its end (0 = steady; ~.03 = a sad, drooping note).
    SYNTHS.horn = function (t, v, rate, o) {
        const bus = ctx.createGain(); bus.gain.value = v; bus.connect(master);
        const send = ctx.createGain(); send.gain.value = o.wet ?? 0.5; bus.connect(send); send.connect(reverbBus());
        const attack = o.attack ?? 0.22, bright = o.bright ?? 1, droop = o.droop ?? 0;
        (o.notes || []).forEach(([hz, at, len, gn = 1]) => {
            const s = t + at, f0 = hz * rate;
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2;
            lp.frequency.setValueAtTime(f0 * 1.6, s);
            lp.frequency.linearRampToValueAtTime(f0 * 7 * bright, s + Math.min(0.28, attack + 0.06));   // the filter opens as the note swells
            lp.frequency.linearRampToValueAtTime(f0 * 4.5 * bright, s + len);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, s);
            g.gain.linearRampToValueAtTime(0.5 * gn, s + attack);                   // attack
            g.gain.setValueAtTime(0.5 * gn, s + Math.max(attack + 0.01, len - 0.45));
            g.gain.linearRampToValueAtTime(0.0001, s + len + 0.35);                 // release
            lp.connect(g); g.connect(bus);
            [-6, 6].forEach(cents => {
                const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.detune.value = cents;
                osc.frequency.setValueAtTime(f0 * 0.94, s); osc.frequency.exponentialRampToValueAtTime(f0, s + 0.09);   // scoop up into the note
                if (droop) { osc.frequency.setValueAtTime(f0, s + Math.max(0.1, len - 0.3)); osc.frequency.exponentialRampToValueAtTime(f0 * (1 - droop), s + len); }   // sag at the end
                const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;     // vibrato, fades in after the attack
                const lg = ctx.createGain(); lg.gain.setValueAtTime(0, s); lg.gain.linearRampToValueAtTime(f0 * 0.006, s + 0.5);
                lfo.connect(lg); lg.connect(osc.frequency);
                osc.connect(lp); osc.start(s); osc.stop(s + len + 0.4); lfo.start(s); lfo.stop(s + len + 0.4);
            });
            const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = f0 / 2;   // a little weight an octave down
            const sg = ctx.createGain(); sg.gain.value = 0.35; sub.connect(sg); sg.connect(g);
            sub.start(s); sub.stop(s + len + 0.4);
        });
    };

    // A very soft "pulse" for hovering over buttons: a short, rounded sine note (230 Hz sagging a touch) with a gentle attack.
    SYNTHS.pulse = function (t, v, rate) {
        // a slow-ish rise (45 ms) and a lowpass keep the onset completely soft: no "tick" or click edge, just a gentle swell and fade
        const o = ctx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(230 * rate, t); o.frequency.exponentialRampToValueAtTime(205 * rate, t + 0.16);
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5 * v, t + 0.045); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + 0.25);
    };

    // Dizzy birds: a little flock of chirps, each a quick pitch up-and-down sine with a thin overtone.
    SYNTHS.chirp = function (t, v, rate) {
        const bus = ctx.createGain(); bus.gain.value = v; bus.connect(master);
        const chirps = [[0, 3200, 4200], [0.085, 2800, 3900], [0.30, 3400, 4500], [0.385, 3000, 4100], [0.60, 3300, 4400], [0.685, 2900, 4000]];   // [seconds, start Hz, peak Hz]
        chirps.forEach(([at, f0, f1]) => {
            const s = t + at;
            [[1, 1], [2, 0.18]].forEach(([mult, amp]) => {
                const osc = ctx.createOscillator(); osc.type = 'sine';
                osc.frequency.setValueAtTime(f0 * rate * mult, s);
                osc.frequency.exponentialRampToValueAtTime(f1 * rate * mult, s + 0.035);
                osc.frequency.exponentialRampToValueAtTime(f0 * 0.85 * rate * mult, s + 0.075);
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.0001, s);
                g.gain.linearRampToValueAtTime(0.5 * amp, s + 0.008);
                g.gain.exponentialRampToValueAtTime(0.0001, s + 0.085);
                osc.connect(g); g.connect(bus);
                osc.start(s); osc.stop(s + 0.1);
            });
        });
    };

    // A plain, clean "thud": a short low sine drop plus a soft slap. Used for the basic attack.
    // opts.size: ~.8 light .. ~1.3 heavier. Its impact is at t=0 (no lead-in), so it needs no pre-roll.
    SYNTHS.thud = function (t, v, rate, o) {
        const size = o.size ?? 1;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.setValueAtTime(170 * rate / Math.sqrt(size), t);
        osc.frequency.exponentialRampToValueAtTime(46, t + 0.14 + 0.05 * size);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.95 * v, t + 0.003);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.20 + 0.06 * size);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 0.3 + 0.06 * size);
        const s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7;
        f.frequency.setValueAtTime(2400 * rate, t);                   // the "slap" carries the hit on small speakers that can't reproduce the deep thump
        f.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(1.0 * v, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        s.connect(f); f.connect(ng); ng.connect(master);
        s.start(t, 0.137); s.stop(t + 0.07);
    };

    // Where a sample's real "impact" sits: the first moment it reaches half of its peak level,
    // measured on the segment that actually plays (so a growl that swells, or a recording with a
    // lead-in, reports when it really hits, not when the file starts). Seconds, capped at .6.
    const onsets = new Map();
    function onsetOf(s, start, dur) {
        const k = s.file + '@' + start + '+' + dur;
        if (!onsets.has(k)) {
            const d = s.buf.getChannelData(0), sr = s.buf.sampleRate;
            const a = Math.floor(start * sr), b = Math.min(d.length, Math.floor((start + (dur || 1.2)) * sr));
            const w = Math.max(1, Math.floor(sr * 0.003));
            let max = 0; const env = [];
            for (let i = a; i < b; i += w) {
                let m = 0;
                for (let j = i; j < Math.min(b, i + w); j++) { const x = Math.abs(d[j]); if (x > m) m = x; }
                env.push(m); if (m > max) max = m;
            }
            const idx = Math.max(0, env.findIndex(m => m >= max * 0.5));
            onsets.set(k, Math.min(0.6, idx * w / sr));
        }
        return onsets.get(k);
    }

    // Schedules one layer. `impactIn` (seconds, moves only) is how long until the animation's impact;
    // the layer is started early enough that its own impact point (onsetOf) lands exactly then.
    // `at` is an authored extra delay after the impact. Without `impactIn` the layer just starts now.
    const schedule = [];   // last scheduled layers, for debugging/verification (SFX.catalog.schedule)
    // Audio reaches the speakers a little after ctx.currentTime (output latency, ~20-60 ms). To make
    // a sound be HEARD `sec` seconds from now, convert through the browser's output clock instead
    // of ctx.currentTime. Falls back to currentTime where getOutputTimestamp isn't supported.
    function heardAt(sec) {
        const ts = ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null;
        if (ts && ts.performanceTime > 0) return ts.contextTime + (performance.now() - ts.performanceTime) / 1000 + sec;
        return ctx.currentTime + sec;
    }

    function layer(l, vMul = 1, rMul = 1, lp = 0, impactIn) {
        const [pool, v = 1, rate = 1, at = 0, o = {}] = l;
        const align = impactIn !== undefined;
        if (pool.startsWith('synth:')) {
            const target = heardAt((align ? impactIn : 0) + at);          // synths have their impact at t=0
            const when = align ? Math.max(ctx.currentTime, target) : ctx.currentTime + at;
            SYNTHS[pool.slice(6)](when, v * vMul, rate * rMul, o);
            schedule.push({ file: pool, when, impact: when, late: align ? Math.max(0, ctx.currentTime - target) : 0 });
            return;
        }
        const s = pick(pool);
        if (!s) return;
        const r = rate * rMul;
        const start = o.start || 0;
        const lead = align ? onsetOf(s, start, o.dur) / r : 0;     // wall-clock seconds from sample start to its impact
        const wanted = (align ? impactIn : 0) + at - lead;          // when playback should begin, relative to now
        const target = align ? heardAt(wanted) : 0;
        const t = align ? Math.max(ctx.currentTime, target) : ctx.currentTime + Math.max(0, wanted);
        schedule.push({ file: s.file, when: t, impact: t + lead, late: align ? Math.max(0, ctx.currentTime - target) : Math.max(0, -wanted) });
        if (schedule.length > 60) schedule.shift();
        const src = ctx.createBufferSource();
        src.buffer = s.buf;
        src.playbackRate.value = r;
        const base = (o.dur || o.start) ? segGain(s, s.file, start, o.dur || s.buf.duration - start) : s.gain;
        const gain = v * vMul * base;
        const g = ctx.createGain();
        if (o.fadeIn) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + o.fadeIn); }   // ease in instead of starting at full volume
        else g.gain.setValueAtTime(gain, t);
        let node = src;
        if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
        if (o.ring) {
            // Robot voice: ring modulation (multiply the sound by a low sine). opts.ring = modulator Hz,
            // opts.ringMix = how much of the result is robotic (0 = untouched .. 1 = fully robotic).
            const mix = o.ringMix ?? 0.6;
            const dry = ctx.createGain(); dry.gain.value = 1 - mix;
            const rg = ctx.createGain(); rg.gain.value = 0;
            const mod = ctx.createOscillator(); mod.type = 'sine'; mod.frequency.value = o.ring;
            mod.connect(rg.gain);
            const wet = ctx.createGain(); wet.gain.value = mix * 1.6;      // ring mod loses some level
            node.connect(dry); dry.connect(g);
            node.connect(rg); rg.connect(wet); wet.connect(g);
            mod.start(t); mod.stop(t + (o.dur || s.buf.duration - start) / r + 0.05);
        } else {
            node.connect(g);
        }
        g.connect(master);
        if (o.dur) {
            const len = o.dur / r;   // wall-clock length of the cut segment
            g.gain.setValueAtTime(gain, t + Math.max(0, len - 0.12));
            g.gain.linearRampToValueAtTime(0.0001, t + len);
            src.start(t, start); src.stop(t + len + 0.02);
        } else {
            src.start(t, start);
        }
    }
    const layers = (list, vMul, rMul, lp) => list.forEach(l => layer(l, vMul, rMul, lp));

    const MIN_GAP = { hover: 60, click: 40, blip: 70, energy: 70, move: 35 };

    // Loudness balance: a volume multiplier per skill name / event name, measured with the "Measure
    // loudness" button on test_sounds.html (loudest 200 ms of each sound at the final output, with deep
    // bass discounted the way our ears do) so every sound lands at about the same perceived level, and no
    // trim is allowed to push a sound's peak past ~0.9. Small ones (heal, energy, steps, props...) are
    // deliberately kept ~4 dB under the rest. 1 = untouched. Re-run the tool after changing any sound.
    const TRIM = {
        // skills
        'Root Crush': 1.42, Lifesteal: 1.09, 'Giant Spore': 0.85, Spit: 1.2, 'Heavy Counter': 0.58, Counter: 0.67, Howl: 0.42, 'Ultimate Zap': 1.21,
        'Crimson Lifesteal': 1.18, 'King Spit': 1.04, 'Slumber Sludge': 1.36, Toxin: 1.07, Bulletstorm: 0.92, 'Alpha Bite': 0.86, 'Renewal Spores': 1.09,
        Shockwave: 1.48, 'Void Shockwave': 1.48, 'Soul Devour': 1.07, Bite: 0.9, Zap: 1.71, 'Alpha Howl': 0.46, 'Elite Snipe': 0.89, Maul: 1.09, 'Poison Cloud': 1.18, Punch: 1.14, 'Stun Bolt': 1.5,
        Taunt: 0.88, Echo: 0.45, 'Crimson Echo': 0.47, Overcharge: 0.85, 'Ultimate Overcharge': 0.78, Hemorrhage: 0.74, 'Full Throttle': 0.82,
        'Elder Maul': 0.97, 'Heavy Punch': 1.11, Devour: 1.07, Thorns: 1.32, Intimidate: 1.21, 'Elite Stun Bolt': 1.4, 'Basic Attack': 1, Spore: 0.77,
        'Colossal Thorns': 1.26, 'Elder Guard': 1.42, Slam: 0.87, 'Savage Stance': 1.27, Guard: 1.55, 'Colossal Slam': 0.62,
        // events
        scrap: 1.33, counterHeavy: 0.56, energy: 0.54, coin: 0.89, compass: 1.44, valve: 0.69, enemyDeath: 0.47, counter: 0.7, heal: 0.41, victory: 0.34,
        sleep: 0.57, toxin: 1.03, unlock: 0.48, stun: 0.7, buttonPress: 1.8, merge: 0.5, defeat: 0.25, mushroom: 0.78, candle: 1.12, travel: 2,
        travelForest: 1.8, vial: 0.57, poison: 1.18, leaf: 1.2, drop: 1.64, poisonGiant: 1.11, thorns: 1.22, thornsColossal: 1.25, enterMap: 0.37,
        guardBlock: 1.53, guardBlockElder: 1.43, click: 1.76, hover: 0.49, blip: 1.3, ability: 0.95
    };
    // Headroom: every trim above is scaled by this, and the master level is raised by the same amount again (see applyVolume),
    // so the balance is unchanged but nothing sits at full scale where the output limiter would have to squash it.
    const TRIM_MASTER = 0.6;
    const trimOf = key => (TRIM[key] ?? 1) * TRIM_MASTER;

    // Which named event sounds (the U table) are switched ON in the game. Skill sounds (M) always
    // play. Everything else in U is parked until approved: add its name here to turn it back on
    // (SFX.play(name, {force: true}) still plays it, which is what test_sounds.html uses).
    // 'heal' stays on because it is the sound of the Heal / King Heal skills.
    const ENABLED = new Set(['heal', 'enemyDeath', 'energy', 'victory', 'defeat', 'stun', 'sleep', 'poison', 'toxin', 'counter', 'thorns', 'guardBlock', 'counterHeavy', 'thornsColossal', 'guardBlockElder', 'poisonGiant',
        // map, team and rewards
        'travel', 'travelForest', 'coin', 'candle', 'compass', 'mushroom', 'leaf', 'vial', 'valve', 'scrap', 'buttonPress', 'drop', 'merge', 'unlock', 'enterMap', 'click', 'hover', 'blip', 'ability']);   // (recruit is parked: removed on request)

    function play(name, arg = {}) {
        if (prefs.muted || !unlocked) return;
        try {
            if (!ensureCtx() || ctx.state !== 'running') return;
            const now = performance.now();
            const key = name === 'move' ? 'move:' + (arg.name || '') : name;
            if (!arg.noGap && now - (lastPlayed[key] || 0) < (MIN_GAP[name] ?? 20)) return;
            lastPlayed[key] = now;

            if (name === 'move') {
                const m = M[arg.name];
                // arg.delay = seconds until the animation's impact (0 = it is happening now)
                if (m) moveLayers(m).forEach(l => layer(l, trimOf(arg.name), 1, 0, arg.delay || 0));
            } else if (U[name] && (ENABLED.has(name) || arg.force)) {
                layers(U[name], trimOf(name));
            }
        } catch (e) { console.warn('[SFX]', name, e); }   // audio must never break the game
    }

    // ================================================================ ambience
    // A continuous background bed per place, crossfaded when the scene changes. It runs through the same master volume
    // and mute as every other sound. Each builder creates its nodes, connects them to `out`, and returns {stop()}.
    //   forest / cave / town : real recordings (Sounds/ambience), looped with an equal-power crossfade so the loop point is inaudible
    //   music / muffled      : the menu soundtrack (Sounds/ambience/menu_music.mp3); "muffled" is the same music behind a 420 Hz lowpass, i.e. heard through a wall
    //   lab / sim     : procedural machine hum with faint beeps / an airy digital "simulation" pad
    let ambNoise = null;
    function longNoise() {   // 8 s of noise so repeating filtered noise never sounds like a loop
        if (!ambNoise) {
            ambNoise = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
            const d = ambNoise.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        return ambNoise;
    }
    // small helpers that also remember every node that must be stopped later
    function ambKit() {
        const live = []; const timers = []; let alive = true;
        const kit = {
            get alive() { return alive; },
            noise(offset) { const s = ctx.createBufferSource(); s.buffer = longNoise(); s.loop = true; s.start(0, offset ?? Math.random() * 7); live.push(s); return s; },
            osc(type, hz) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz; o.start(); live.push(o); return o; },
            filter(type, hz, q = 1) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = hz; f.Q.value = q; return f; },
            gain(v = 1) { const g = ctx.createGain(); g.gain.value = v; return g; },
            // slow wobble on an AudioParam: param = base + depth * sine(rate)
            wobble(param, rate, depth) { const l = kit.osc('sine', rate); const lg = kit.gain(depth); l.connect(lg); lg.connect(param); },
            every(ms, fn) { timers.push(setInterval(() => { if (alive) fn(); }, ms)); },
            stop() { alive = false; timers.forEach(clearInterval); live.forEach(n => { try { n.stop(); } catch (e) {} }); }
        };
        return kit;
    }

    function sampleLoop(file, xfade = 2.5) {
        return out => {
            const s = buffers.get(file); if (!s) return null;
            let alive = true; const dur = s.buf.duration;
            const up = new Float32Array(64), down = new Float32Array(64);
            for (let i = 0; i < 64; i++) { up[i] = Math.sin(i / 63 * Math.PI / 2); down[i] = Math.cos(i / 63 * Math.PI / 2); }   // equal-power curves
            const startOne = (t, first) => {
                const src = ctx.createBufferSource(); src.buffer = s.buf;
                const g = ctx.createGain();
                if (!first) g.gain.setValueAtTime(0.0001, t);
                if (!first) g.gain.setValueCurveAtTime(up, t, xfade);
                g.gain.setValueAtTime(1, t + (first ? 0 : xfade) + 0.001);
                g.gain.setValueCurveAtTime(down, t + dur - xfade, xfade);
                src.connect(g); g.connect(out); src.start(t); src.stop(t + dur + 0.1);
            };
            let next = ctx.currentTime; startOne(next, true); next += dur - xfade;
            const timer = setInterval(() => { if (!alive) return; while (next - ctx.currentTime < 4) { startOne(next, false); next += dur - xfade; } }, 500);
            return { gainScale: s.gain, stop() { alive = false; clearInterval(timer); } };
        };
    }

    // Laboratory: a low electrical hum (50 Hz and its harmonics, slightly detuned so they slowly beat), a soft air hiss, and a faint beep now and then.
    function labAmbience(out) {
        const k = ambKit();
        const lp = k.filter('lowpass', 700), mix = k.gain(0.6); lp.connect(mix); mix.connect(out);
        [[50, 0.5], [50.35, 0.4], [100, 0.3], [150, 0.14], [200, 0.06]].forEach(([hz, a]) => { const o = k.osc('sine', hz), g = k.gain(a); o.connect(g); g.connect(lp); });
        const air = k.filter('lowpass', 520, 0.6), ag = k.gain(0.22); k.wobble(ag.gain, 0.07, 0.06); k.noise().connect(air); air.connect(ag); ag.connect(mix);
        k.every(2400, () => {
            if (Math.random() < 0.5) return;
            const t = ctx.currentTime + 0.05, hz = [1318.5, 1760, 2093, 987.8][Math.floor(Math.random() * 4)];
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
            const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
            o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.15);
        });
        return { stop: () => k.stop() };
    }

    // Tutorial "simulation": a quiet airy pad of slowly breathing notes (A minor-ish), a faint high shimmer and rare tiny data blips.
    function simAmbience(out) {
        const k = ambKit();
        const lp = k.filter('lowpass', 1300), mix = k.gain(0.5); lp.connect(mix); mix.connect(out);
        [110, 164.81, 220, 277.18, 329.63].forEach((hz, i) => {
            [-4, 4].forEach(c => { const o = k.osc('triangle', hz); o.detune.value = c; const g = k.gain(0.1); k.wobble(g.gain, 0.1 + i * 0.037, 0.06); o.connect(g); g.connect(lp); });
        });
        const hp = k.filter('highpass', 5200), sg = k.gain(0.035); k.wobble(sg.gain, 0.09, 0.02); k.noise().connect(hp); hp.connect(sg); sg.connect(mix);
        k.every(1900, () => {
            if (Math.random() < 0.5) return;
            const t = ctx.currentTime + 0.05, o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 1800 + Math.random() * 1500;
            const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
            o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.1);
        });
        return { stop: () => k.stop() };
    }

    // level = how loud the bed sits (all beds are meant to sit well under the sound effects). muffle = lowpass Hz (a wall in between).
    const MENU_MUSIC = 'ambience/menu_music.mp3';
    const AMBIENCES = {
        // levels are measured (ear-weighted, at the output) so every bed sits about 14 dB under the sound effects; the collection and tutorial are quieter still
        forest:  { build: sampleLoop('ambience/forest.ogg'), level: 0.8 },
        cave:    { build: sampleLoop('ambience/cave.ogg'), level: 0.63 },
        // The menu soundtrack (first 3 minutes of "A Warmful Day"), looped with a 4 s crossfade. "music" and "muffled" share ONE running bed (same `bed`
        // key): switching between them doesn't restart the track, it only closes / opens the lowpass and eases the level (collection, team select).
        music:   { bed: 'music', build: sampleLoop(MENU_MUSIC, 4), level: 0.3, muffle: 20000 },
        muffled: { bed: 'music', build: sampleLoop(MENU_MUSIC, 4), level: 0.2, muffle: 420 },
        // Act I fights only (the cave bed plays everywhere else in the act): the normal-fight track and the boss-fight track, first 3 minutes of each, 4 s crossfade loops
        caveFight: { build: sampleLoop('ambience/combat_cave.mp3', 4), level: 0.27 },
        caveBoss:  { build: sampleLoop('ambience/combat_boss.mp3', 4), level: 0.34 },
        // Act II fights: the orc track for normal fights, the demon track for the Colossal Treant. After any win (all acts) the campfire track plays until the next screen.
        forestFight: { build: sampleLoop('ambience/combat_forest.mp3', 4), level: 0.38 },
        forestBoss:  { build: sampleLoop('ambience/combat_treant.mp3', 4), level: 0.3 },
        // Act III fights: Clockwork Dragon for normal fights, Eberron Brawl for the final boss
        labFight:    { build: sampleLoop('ambience/combat_lab.mp3', 4), level: 0.42 },
        labBoss:     { build: sampleLoop('ambience/combat_lab_boss.mp3', 4), level: 0.42 },
        campfire:    { build: sampleLoop('ambience/campfire.mp3', 4), level: 0.3 },
        lab:     { build: labAmbience, level: 0.18 },
        sim:     { build: simAmbience, level: 0.19 }
    };
    let fightIsBoss = false;   // set by combat.js (SFX.fightIsBoss(true/false)) just before the combat screen opens, so sceneFor can pick the boss track
    // Which bed plays on which screen. undefined = leave whatever is playing (the title screen can't play anything before the first click).
    function sceneFor(screenId) {
        switch (screenId) {
            case 'screen-first-time': return 'forest';                       // choosing your first starter
            case 'screen-title': case 'screen-menu': case 'screen-arcs': return 'music';   // main menu, the city, act select (the title's music starts with the first click: browsers allow no sound before one)
            case 'screen-collection': case 'screen-selection': return 'muffled';           // collection and team select / ENTER MAP: the same music heard through a wall
            case 'screen-map': case 'screen-combat': case 'screen-merge': case 'screen-team': {
                const arc = (typeof currentRun !== 'undefined' && currentRun) ? currentRun.arcId : null;
                if (screenId === 'screen-combat' && arc === 'arc1') return fightIsBoss ? 'caveBoss' : 'caveFight';       // Acts I and II: fights have their own music
                if (screenId === 'screen-combat' && arc === 'arc2') return fightIsBoss ? 'forestBoss' : 'forestFight';
                if (screenId === 'screen-combat' && arc === 'arc3') return fightIsBoss ? 'labBoss' : 'labFight';
                return { arc1: 'cave', arc2: 'forest', arc3: 'lab', tutorial: 'sim' }[arc] ?? null;
            }
            default: return undefined;
        }
    }
    let ambCurrent = null, ambWanted = null, ambRetry = 0;
    function applyAmbience() {
        if (!unlocked || !ensureCtx()) return;
        if (ambCurrent && ambCurrent.name === ambWanted) return;
        const next = AMBIENCES[ambWanted];
        if (ambCurrent && next && next.bed && ambCurrent.bedKey === next.bed) {   // same recording, different state: keep it playing, just move the filter and the level
            const t = ctx.currentTime, cur = ambCurrent;
            cur.filter.frequency.cancelScheduledValues(t); cur.filter.frequency.setValueAtTime(cur.filter.frequency.value, t);
            cur.filter.frequency.exponentialRampToValueAtTime(next.muffle, t + 1.2);
            cur.out.gain.cancelScheduledValues(t); cur.out.gain.setValueAtTime(cur.out.gain.value, t);
            cur.out.gain.linearRampToValueAtTime(next.level * (cur.bed.gainScale ?? 1), t + 1.2);
            cur.name = ambWanted;
            return;
        }
        if (ambCurrent) {                                                    // fade the old bed out and tidy up after it
            const old = ambCurrent; ambCurrent = null;
            old.out.gain.cancelScheduledValues(ctx.currentTime); old.out.gain.setValueAtTime(old.out.gain.value, ctx.currentTime);
            old.out.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
            setTimeout(() => { old.bed.stop(); try { old.chain.disconnect(); } catch (e) {} }, 1600);
        }
        const def = AMBIENCES[ambWanted];
        if (!def) return;
        const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, ctx.currentTime);
        let chain = out, filter = null;
        if (def.muffle) { filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = def.muffle; filter.Q.value = 0.5; out.connect(filter); chain = filter; }
        chain.connect(ambOut);
        const bed = def.build(out);
        if (!bed) {                                                          // sample not decoded yet: try again shortly
            try { chain.disconnect(); } catch (e) {}
            if (ambRetry++ < 40) setTimeout(applyAmbience, 400);
            return;
        }
        ambRetry = 0;
        out.gain.linearRampToValueAtTime(def.level * (bed.gainScale ?? 1), ctx.currentTime + 2.2);   // ease in
        ambCurrent = { name: ambWanted, bedKey: def.bed || null, out, chain, filter, bed };
    }
    function setAmbience(name) { ambWanted = name || null; applyAmbience(); }
    function setScene(screenId) { const s = sceneFor(screenId); if (s !== undefined) setAmbience(s); }

    // Browsers block audio until a user gesture; the first one unlocks the context.
    const unlock = () => {
        unlocked = true;
        ensureCtx();
        applyAmbience();
        if (ctx && ctx.state === 'running') {
            ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.removeEventListener(ev, unlock, true));
        }
    };
    ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, unlock, true));

    // --- settings controls: any [data-sfx-volume] (sound effects) / [data-music-volume] (music and ambience) range input; a [data-sfx-toggle] button is still honoured if a page has one ---
    function refreshControls() {
        document.querySelectorAll('[data-sfx-toggle]').forEach(b => { b.textContent = prefs.muted ? 'SOUND: OFF' : 'SOUND: ON'; });
        document.querySelectorAll('[data-sfx-volume]').forEach(r => { r.value = Math.round(prefs.volume * 100); });
        document.querySelectorAll('[data-music-volume]').forEach(r => { r.value = Math.round(prefs.musicVolume * 100); });
    }
    function setMuted(m) { prefs.muted = !!m; applyVolume(); savePrefs(); refreshControls(); }
    function setVolume(v) { prefs.volume = Math.min(1, Math.max(0, v)); applyVolume(); savePrefs(); refreshControls(); }
    function setMusicVolume(v) { prefs.musicVolume = Math.min(1, Math.max(0, v)); applyVolume(); savePrefs(); refreshControls(); }

    document.addEventListener('DOMContentLoaded', refreshControls);
    document.addEventListener('input', e => {
        if (!e.target.matches) return;
        if (e.target.matches('[data-sfx-volume]')) {
            setVolume(e.target.value / 100);
            if (prefs.muted && prefs.volume > 0) setMuted(false);
            play('select');
        } else if (e.target.matches('[data-music-volume]')) {
            setMusicVolume(e.target.value / 100);
            if (prefs.muted && prefs.musicVolume > 0) setMuted(false);
        }
    });

    // --- global UI wiring: click / hover sounds for every button ---
    // Things that act like buttons: real buttons, anything with an onclick, combat targets and the collection squares.
    const CLICKABLE = 'button, [onclick], .targetable, .collection-square';
    // The sound starts on the press (pointerdown), not on the release (click), so it is heard the moment the button is pressed.
    // Keyboard activation (Enter / Space on a focused button) has no press, so it still goes through the click event (detail 0).
    function buttonSound(e) {
        const t = e.target.closest && e.target.closest(CLICKABLE);
        if (!t || t.disabled || t.matches('[data-sfx-volume], [data-sfx-toggle]')) return;
        play(t.matches('.move-btn, .targetable') ? 'ability' : 'click');   // one sound for every button (BACK / CLOSE / RESUME and the collection squares included); choosing a skill and then clicking its target share their own
    }
    document.addEventListener('pointerdown', e => { if (e.button === 0 || e.pointerType === 'touch') buttonSound(e); }, true);
    document.addEventListener('click', e => { if (e.detail === 0) buttonSound(e); }, true);
    let lastHoverEl = null, lastHoverAt = 0;
    document.addEventListener('pointerover', e => {
        const t = e.target.closest && e.target.closest('.nine-cut-button, [id^="hitbox-"], .collection-square');   // (no hover sound on monsters in a fight: only choosing a skill and clicking a target make a sound)
        if (!t || t.disabled || (e.relatedTarget && t.contains(e.relatedTarget))) return;
        const now = performance.now();
        // one soft pulse per hover: ignore the same element re-entering within 0.5 s (cursor jiggling at a button's edge) and any other hover within 0.15 s
        if ((t === lastHoverEl && now - lastHoverAt < 500) || now - lastHoverAt < 150) return;
        lastHoverEl = t; lastHoverAt = now;
        play('hover');
    }, true);

    // Audition helpers for test_sounds.html: register extra files before the first click, then play any file.
    const registerExtra = list => list.forEach(f => extraFiles.add(f));
    const playFile = (file, v = 1, rate = 1, opts = {}) => {
        if (prefs.muted || !unlocked || !ensureCtx() || ctx.state !== 'running') return;
        layer([file, v, rate, 0, opts]);
    };

    return {
        play, setMuted, setVolume, setMusicVolume, registerExtra, playFile,
        fightIsBoss: b => { fightIsBoss = !!b; },
        ambience: setAmbience, scene: setScene,    // ambience('forest' | 'music' | 'cave' | 'lab' | 'sim' | 'muffled' | null), scene(screenId) picks the bed for a screen
        get ambienceNow() { return ambCurrent ? ambCurrent.name : null; },
        ambienceDef: name => AMBIENCES[name],
        toggleMuted: () => setMuted(!prefs.muted),
        get muted() { return prefs.muted; },
        get volume() { return prefs.volume; },
        get musicVolume() { return prefs.musicVolume; },
        get ready() { return buffers.size; },
        get total() { return allFiles().length; },
        // for test_sounds.html and for pruning unused sample files
        catalog: { sounds: Object.keys(U), enabled: [...ENABLED], analyser: () => analyser, trim: TRIM, schedule, ctxTime: () => ctx && ctx.getOutputTimestamp ? ctx.getOutputTimestamp() : null, moves: Object.keys(M), moveFile: n => moveLayers(M[n]).map(l => l[0].replace(/^.*\//, '')).join(' + '), files: allFiles }
    };
})();
