# Soulbound Monsters — playtest, bug hunt and balance report

Last updated after the balance tweaks agreed in review (all numbers below are measured on the **current** `data.json`).

Scope: I played the real game in a browser (tutorial, a full Act I run, boss fights for all three acts, merge screen with real drag-and-drop,
loss flow, pause/abandon, settings), read `src/*.js` + `data.json`, then built a headless copy of the combat/run engine to rank all 54 monsters
(9 starters + 45 merges) and to find strong strategies.

How much to trust the numbers
- The headless engine was checked against the real game: `calculateDamage` matched on **51,840 / 51,840** attacker × move × target combinations
  (element multipliers, dual types, ATK buffs, Guard) and **20 / 20** scripted multi-move scenarios (guard, counter, thorns vs multi-hit, lifesteal,
  poison/toxin, stacking buff durations, kill energy, heals, regen, taunt…) gave identical HP / energy / buff / debuff state to the real `executeMove`.
  Turn-meter order, buff decay, enemy AI and boss AI are literal ports of the source (not separately diffed against the live game).
- Every strategy number comes from a *scripted player* (heuristic policy, perfect information). A human will be worse at some things and better at others,
  so read them as "what the rules reward", not as human win rates. Sample sizes: 6,000–12,000 runs per condition (± ~1 pt), 400,000 battles per rating.
- Not tested: audio quality, art/animation polish, touch/mobile, other browsers, low-end performance, and the production `art-fixed` art overlay
  (the checkout has no root `Art/`; everything referenced resolves under `public/Art`).

---

## 1. Changes made during this review (all uncommitted)

Code
- `src/pause.js` — **Abandon Run now stops a fight in progress** (bug 1).
- `src/combat.js` — new `lockPlayerTurn()` closes the 500 ms window after a turn ends, so no free second action / lost turn (bug 2); your own Taunt no longer
  restricts who you can heal or buff (bug 3); HP text is clamped at 0 (bug 4).
- `src/combat.js` (also) — combat-log name colouring is a single pass (no nested spans); removed the dead `atk` field reads on bosses and recruits; enemy AI skips Heal when its team is at full HP.
- `src/core.js` — removed the one-time "temporary" save wipe; Unlock All is hidden; it appears with `?debug` in the URL, with localStorage `soulbound_debug` = `1`, or by clicking the "SFX" label in the settings menu 5 times within 3 seconds (that last reveal lasts until the page reloads).
- `index.html` — Unlock All button now has `id="btn-unlock-all"` and starts hidden. Reset Progress stays visible.
- `src/map.js` — **run-start loading screen with tips**: after the fade to black, a loading bar fills (~3.6 s) under a random tip (13 tips, never the same twice in a row); the tip then fades and the act title ("ACT I: THE CAVE" etc.) shows exactly as before, then the game begins. Run start takes about 4 s longer (≈8 s total, was ≈4 s). Tips: merge at every merge stage; HP doesn't recover between fights; energy carries over; the boss is the last fight, spend all your energy; kills give +1 energy; element triangle; melee only hits the front row; SPD = more turns; recruit with merges in mind; Guard lasts until hit; Counter reflects a hit with any stun/poison; poison ticks at the start of the victim's turn; rearrange the party on the team screen.

Data (`data.json` **and** the `public/data.json` mirror, kept identical)
- **Act II boss (Colossal Treant):** Root Crush is now ranged, power 1.2, boss RATK 0 → 15 — i.e. exactly the player Colossal Treant's Root Crush.
- **Bosses (your calls):** Crimson Bat RATK 15 → 18; the Act II boss's Colossal Thorns 8 → 6 (the player's Colossal Treant keeps 8); boss HP: Colossal Treant 220 → 200, Heavy Robot 200 → 220. Run win rate after these: Act I 83.5%, Act II 71.4%, Act III 67.2% (overall 74.4%) — an escalating ladder. Hemorrhage (boss and player Crimson Bat: cost 2, power 1.2, -25% ATK for 2 turns on one target) is a net handicap for the boss: its debuff is worth ~2 pts of win rate, but the extra energy vs Crimson Echo costs ~10 pts (removing it makes the boss win-rate-harder by ~9 pts; making it cost 1 makes Act I 70%).
- **Starters:** Drone RATK 24 → 22; Treant SPD 5 → 6; Bear RDEF 12 → 14; Slime RATK 16 → 18.
- **Healing:** Heal 10 → 15 on every player monster that has it (Slime, Slimy Wolf, Mossy Bear, Bio-Tank, Pulse Slime, Vampiric Slime, Grappler Slime, Blight Wood);
  King Heal 25 → 30. The Act II boss's Heal stays at 10.
- **Merges:** Bio-Tank RATK 18 → 20; Blight Wood HP 105 → 110, SPD 5 → 6, MATK/RATK 16 → 18; Elder Bear SPD 6 → 7; Elite Sentry RATK 22 → 24;
  Timber Wolf starting energy 2 → 1; Thorn Bear MATK 24 → 26.

---

## 2. How the game goes

Structure: 10 nodes — fight, fight, **merge**, fight (2 enemies), fight (2), fight (3), **merge**, fight (3), fight (3), **boss**. You start with 2 monsters, recruit at most
one defeated enemy per fight, can hold 4, and **nothing heals except merging and recruiting** (a merged/recruited monster arrives at full HP). Energy carries over between fights.

What a competent scripted run looks like (all 9 starters unlocked, 74.9% overall win rate):
- Average party HP left after each fight: 80 → 82 → 71 → 73 → 68 → 58 → 61 → **44%** (the boss fight). Average party size 2–3.8.
- Deaths happen late: of failed runs ~72% die to the boss, ~24% in the three 3-enemy fights, only ~4% in the first four fights.
- Act difficulty (run win rate): Act I **87%** · Act III **72%** · Act II **64%**. Boss deaths: Act I 5.5%, Act III 21%, Act II 28%. Act II is clearly the hardest and Act I the easiest.
- Regular enemies barely threaten a full-health party. The challenge is arriving at the boss with HP left.

Real-play log (UI): the tutorial is clear and well paced; the first real run (Wolf + Slime) cleared Act I, recruited Drone/Bear/Mushroom/Slime, merged Wolf+Drone → Spark Wolf
and Bear+Drone → Plasma Bear by drag-and-drop, beat Crimson Bat, unlocked Bat and Act II. Acts II and III bosses (intro dialogue → fight → outro → win screen → Treant / Robot unlock)
all completed with no console errors and no failed network requests once the server served `public/` like Vite does.

---

## 3. Bugs and rough edges

| # | Status | Severity | What | Where |
|---|---|---|---|---|
| 1 | **Fixed** | Medium | Abandoning a run mid-combat left the fight running (enemy kept attacking behind the main menu; "YOU DIED" could pop over it). | `src/pause.js` |
| 2 | **Fixed** | Medium | For 500 ms after a unit's last energy was spent, BASIC ATTACK stayed clickable: a free second action, and the extra `advanceTurn` also skipped another unit's turn. | `src/combat.js` (`lockPlayerTurn`) |
| 3 | **Fixed** | Low–Med | Your own Heavy Robot's Taunt made Heal targetable only on the Robot. | `src/combat.js` (`updateCombatantEl`) |
| 4 | **Fixed** | Low | Fallen monsters showed negative HP text ("-4/55"). | `src/combat.js` |
| 5 | **Decided** | Low | Player Colossal Treant's Root Crush is ranged by design. The boss's was melee; it now matches (see §1). | `data.json` |
| 6 | **Fixed** | Low | Dev leftovers: one-time save wipe removed; Unlock All hidden behind `?debug`. | `src/core.js`, `index.html` |
| 7 | **Fixed** | Low | Combat log colours names by substring: with an enemy "Wolf" in the fight, an ally "Spark Wolf" rendered as nested ally/enemy spans. Now a single longest-name-first pass. | `colorizeCombatLogMessage`, `src/combat.js` |
| 8 | **Fixed** | Low | `base.atk` / `recruit.atk` read a field that doesn't exist (harmless dead code) — removed. | `src/combat.js` (boss creation, `recruitMonster`) |
| 9 | **Decided** | UX | Showing each move's raw Power number tells the player little, and "merges arrive at full HP" is an intentional choice, so neither was added (both were tried and reverted). Not surfaced: the energy-carry/banking system itself — the strongest lever in the game. | – |
| 10 | **Fixed** | Low | Enemy AI no longer casts Heal when nobody on its team is hurt (it used to burn whole turns healing 0). Measured: no change to run win rate (73.8% → 73.7%). Targeting is still random and buffs can be re-cast; the boss AI is smarter. | `enemyAI`, `src/combat.js` |
| 11 | Info | – | A few merges have **less HP than a parent** (Root Cyborg 80 and Bark Hunter 70 vs Treant 85; Timber Wolf 76). Reads like a mistake in a "merge = upgrade" game, though scores aren't hurt much. | `data.json` |

Checked and fine: first-run safeguard (node-1 pool restricted to Wolf/Slime/Sentry works on a clean profile), tutorial flow, merge drag-and-drop, recruit/replace/auto-merge prompts, loss flow,
Act II/III bosses, asset coverage (every monster, portrait, VFX frame and move sound resolves), targeting rules (melee→front row, taunt) in the live UI.

---

## 4. Power rankings

### How the score is built
Score = 50 + 15 × (average z-score of the lenses below). 70+ = S, 60–69 = A, 50–59 = B, 40–49 = C, <40 = D.
- **Fresh-fight rating**: Bradley-Terry fit of 400,000 random 4v4 team battles (both sides played by the same policy). Units begin at their starting energy.
- **Run win** and **uplift** (merges): 1,800 full runs per merge, starting with its two parents, merging them at the first merge node (plus a normal merge policy at the second),
  versus the same pair never merging.
- Starters also use "average run win over all 8 partners" and "merge potential" (average uplift of the merges they feed).

### Starters

| # | Starter | Tier | Score | Type | HP / ATK / SPD | Fresh-fight duel rating (starters only) | Run win with it (avg over 8 partners) | Merge potential |
|---|---|---|---|---|---|---|---|---|
| 1 | Bat | A | 67 | Beast | 60 / 21 / 9 | +0.49 | 82% | +54 pts |
| 2 | Robot | A | 64 | Mech | 70 / 22 / 8 | +0.24 | 84% | +50 pts |
| 3 | Drone | A | 61 | Mech | 55 / 22 / 9 | +0.44 | 80% | +47 pts |
| 4 | Treant | B | 59 | Nature | 85 / 20 / 6 | +0.22 | 79% | +47 pts |
| 5 | Mushroom | B | 54 | Nature | 65 / 23 / 8 | +0.30 | 71% | +42 pts |
| 6 | Bear | C | 40 | Beast | 75 / 22 / 6 | +0.03 | 66% | +35 pts |
| 7 | Sentry | D | 37 | Mech | 60 / 20 / 7 | -0.84 | 70% | +44 pts |
| 8 | Wolf | D | 35 | Beast | 55 / 23 / 8 | -0.14 | 68% | +36 pts |
| 9 | Slime | D | 33 | Nature | 65 / 18 / 6 | -0.75 | 71% | +40 pts |

Against the intended design (Slime/Sentry/Wolf weak · Drone/Bear/Mushroom mid · Bat/Treant/Robot strong): Bat, Robot, Treant and the three weak starters line up. **Drone (61) still scores
above Treant (59)** and **Bear (40) scores like the weak tier**; Mushroom (54) is the only starter squarely in the middle. Bear's problem is its merges (lowest merge potential, +35) and SPD 6,
not its stat line — its fresh-fight duel rating is on par with Mushroom's.

Best opening pairs (run win, all merges allowed): Bat + Treant 91%, Bat + Robot 89%, Drone + Bat 88%, Drone + Robot 86%, Sentry + Robot 86%.
Worst: Sentry + Bear 53%, Wolf + Bear 54%, Wolf + Sentry 58%, Bear + Mushroom 59%, Wolf + Mushroom 61%, Slime + Sentry / Slime + Bear 62%, Wolf + Slime 63%.

### Merges (all 45)

| # | Merge | Parents | Tier | Score | Type | HP / ATK / SPD / start EN | Fresh-fight rating (merges only) | Run win if you make it | Same pair, no merge | Uplift |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Forest Stalker | Bat+Treant | S | 85 | Beast/Nature | 92 / 32 / 10 / 1 | +0.96 | 88% | 14% | +66 pts |
| 2 | Hitman Robot | Sentry+Robot | S | 75 | Mech | 80 / 30 / 10 / 1 | +0.73 | 83% | 14% | +51 pts |
| 3 | Skyreaver Bat | Bat+Drone | S | 74 | Beast/Mech | 65 / 26 / 12 / 1 | +0.72 | 90% | 31% | +44 pts |
| 4 | Bark Hunter | Sentry+Treant | S | 70 | Mech/Nature | 70 / 32 / 9 / 1 | +0.52 | 78% | 11% | +48 pts |
| 5 | Crimson Bat | Bat+Bat | A | 68 | Beast | 70 / 25 / 12 / 1 | +0.24 | 85% | 22% | +46 pts |
| 6 | Berserker Bat | Bat+Robot | A | 68 | Beast/Mech | 75 / 23 / 13 / 1 | +0.61 | 78% | 20% | +41 pts |
| 7 | Enforcer Robot | Drone+Robot | A | 66 | Mech | 80 / 30 / 10 / 1 | +0.42 | 77% | 20% | +42 pts |
| 8 | Hybrid Titan | Treant+Robot | A | 65 | Nature/Mech | 100 / 26 / 8 / 1 | +0.57 | 69% | 9% | +42 pts |
| 9 | Grappler Slime | Slime+Robot | A | 62 | Nature/Mech | 77 / 24 / 9 / 1 | +0.15 | 73% | 12% | +44 pts |
| 10 | Doom Bat | Bat+Sentry | A | 62 | Beast/Mech | 77 / 24 / 9 / 1 | -0.12 | 84% | 22% | +41 pts |
| 11 | Fighter Wolf | Wolf+Robot | A | 62 | Beast/Mech | 76 / 28 / 11 / 1 | +0.51 | 68% | 18% | +35 pts |
| 12 | Root Cyborg | Drone+Treant | A | 61 | Mech/Nature | 80 / 24 / 9 / 1 | +0.26 | 74% | 16% | +37 pts |
| 13 | Bloodcap | Bat+Mushroom | B | 59 | Beast/Nature | 66 / 30 / 9 / 1 | +0.41 | 71% | 18% | +29 pts |
| 14 | Assault Mech | Sentry+Drone | B | 58 | Mech | 65 / 26 / 10 / 2 | +0.95 | 64% | 22% | +17 pts |
| 15 | Mycelium Ooze | Slime+Mushroom | B | 58 | Nature | 75 / 23 / 7 / 2 | +0.16 | 64% | 16% | +39 pts |
| 16 | King Slime | Slime+Slime | B | 55 | Nature | 80 / 19 / 7 / 2 | +0.19 | 57% | 12% | +37 pts |
| 17 | Spark Wolf | Wolf+Drone | B | 54 | Beast/Mech | 70 / 25 / 10 / 1 | +0.10 | 70% | 28% | +27 pts |
| 18 | Timber Wolf | Wolf+Treant | B | 54 | Beast/Nature | 76 / 26 / 9 / 1 | +0.00 | 62% | 12% | +36 pts |
| 19 | Neon Shroom | Mushroom+Drone | B | 54 | Nature/Mech | 65 / 26 / 10 / 1 | +0.30 | 68% | 24% | +21 pts |
| 20 | Pulse Slime | Slime+Drone | B | 53 | Nature/Mech | 65 / 22 / 10 / 1 | -0.07 | 69% | 22% | +28 pts |
| 21 | Plasma Bear | Bear+Drone | B | 52 | Beast/Mech | 75 / 25 / 9 / 1 | -0.10 | 67% | 23% | +29 pts |
| 22 | Wrestler Bear | Bear+Robot | B | 51 | Beast/Mech | 88 / 26 / 8 / 1 | -0.03 | 59% | 11% | +32 pts |
| 23 | Giant Mushroom | Mushroom+Mushroom | C | 48 | Nature | 75 / 25 / 9 / 1 | -0.47 | 62% | 13% | +34 pts |
| 24 | Ultimate Drone | Drone+Drone | C | 48 | Mech | 60 / 26 / 11 / 1 | +0.00 | 64% | 27% | +17 pts |
| 25 | Batwolf | Bat+Wolf | C | 47 | Beast | 65 / 26 / 11 / 1 | -0.04 | 57% | 21% | +22 pts |
| 26 | Rooted Cannon | Mushroom+Sentry | C | 45 | Nature/Mech | 70 / 28 / 8 / 1 | -0.05 | 58% | 18% | +17 pts |
| 27 | Spore Wolf | Wolf+Mushroom | C | 42 | Beast/Nature | 68 / 26 / 9 / 1 | -0.01 | 50% | 17% | +16 pts |
| 28 | Alpha Wolf | Wolf+Wolf | C | 42 | Beast | 65 / 25 / 10 / 1 | +0.29 | 40% | 16% | +15 pts |
| 29 | Punk Mushroom | Mushroom+Robot | C | 42 | Nature/Mech | 80 / 27 / 8 / 1 | -0.06 | 49% | 15% | +16 pts |
| 30 | Iron Wolf | Wolf+Sentry | C | 41 | Beast/Mech | 70 / 20 / 10 / 1 | -0.29 | 52% | 16% | +18 pts |
| 31 | Vampiric Slime | Bat+Slime | C | 41 | Beast/Nature | 80 / 23 / 8 / 1 | -0.34 | 58% | 20% | +13 pts |
| 32 | Nocturne Bear | Bat+Bear | C | 40 | Beast | 76 / 26 / 8 / 1 | -0.50 | 52% | 15% | +22 pts |
| 33 | Slimy Wolf | Wolf+Slime | D | 39 | Beast/Nature | 75 / 22 / 9 / 1 | -0.45 | 53% | 16% | +18 pts |
| 34 | Fungal Bear | Bear+Mushroom | D | 39 | Beast/Nature | 80 / 25 / 8 / 1 | -0.17 | 46% | 13% | +16 pts |
| 35 | Thorn Bear | Bear+Treant | D | 39 | Beast/Nature | 90 / 26 / 6 / 1 | -0.38 | 44% | 9% | +23 pts |
| 36 | Deathcap Wood | Mushroom+Treant | D | 38 | Nature | 86 / 26 / 7 / 1 | -0.12 | 42% | 10% | +16 pts |
| 37 | Colossal Treant | Treant+Treant | D | 37 | Nature | 95 / 25 / 6 / 1 | -0.36 | 42% | 6% | +18 pts |
| 38 | Heavy Robot | Robot+Robot | D | 36 | Mech | 80 / 26 / 8 / 1 | -0.46 | 44% | 10% | +19 pts |
| 39 | Bearwolf | Wolf+Bear | D | 35 | Beast | 78 / 26 / 8 / 1 | -0.50 | 44% | 13% | +17 pts |
| 40 | Elite Sentry | Sentry+Sentry | D | 34 | Mech | 70 / 24 / 8 / 1 | -0.60 | 49% | 15% | +13 pts |
| 41 | Mossy Bear | Bear+Slime | D | 32 | Beast/Nature | 90 / 24 / 6 / 1 | -0.59 | 41% | 11% | +15 pts |
| 42 | Artillery Bear | Bear+Sentry | D | 32 | Beast/Mech | 78 / 27 / 7 / 1 | -0.63 | 44% | 13% | +12 pts |
| 43 | Elder Bear | Bear+Bear | D | 32 | Beast | 85 / 26 / 7 / 1 | -0.61 | 38% | 10% | +15 pts |
| 44 | Blight Wood | Slime+Treant | D | 28 | Nature | 110 / 18 / 6 / 1 | -0.38 | 30% | 9% | +5 pts |
| 45 | Bio-Tank | Slime+Sentry | D | 27 | Nature/Mech | 85 / 20 / 6 / 1 | -0.80 | 39% | 14% | +8 pts |

("Run win if you make it" is confounded by how strong the starting pair is — read it together with the no-merge baseline and the uplift.)

Patterns
- **Bat, Robot and Treant parents make the good merges** (the four S-tier merges and most of the A tier); **Bear parents make most of the bad ones** (Elder, Mossy, Thorn, Artillery, Bearwolf, Fungal all D).
- **Speed and attack decide the tiers.** The top merges have SPD 9–13 and ATK 24–32; the bottom ones have SPD 5–7 and/or ATK 16–20 (Blight Wood, Bio-Tank, Elder Bear, Mossy/Thorn Bear).
- **Same-species merges (X+X) are mostly weak** — average score 44 vs 50 overall — even though they need a duplicate recruit. Crimson Bat (68) is the exception.
- **Blight Wood and Bio-Tank are still the two lowest** after their buffs: they barely beat not merging at all.
- **Timber Wolf** was the top duel-rating merge purely because it started fights with 2 energy; at 1 it now sits mid-table (54, rank 18).
- Counter / Taunt / Thorns kits underperform: valuing them ×4 or ×10 in the policy dropped run win rates by 10–57 pts, so it isn't just my AI ignoring them — they cost a turn for too little.

---

## 5. Strategies that actually win (scripted-player win rates, ±1 pt)

| Strategy | Win rate |
|---|---|
| Don't merge at all | 17% |
| Merge only at the second merge node | 38% |
| Merge only at the first node (up to 2) | 61% |
| Merge once per node | 63% |
| **Merge at both nodes, up to 2 per node (best pair by rating)** | **75%** |
| …same, but spend energy greedily every turn (no banking) | 40% |
| …bank energy in every fight including the boss | 67% |
| …no energy carry-over at all (best case) | 44% |

1. **Merge as early and as often as possible.** The merge screen lets you keep merging. A merge is a full heal plus an upgrade and frees a slot for another recruit. The first node matters most.
2. **Bank energy across fights.** Energy carries over. The best policy spends freely in the first two fights, keeps units topped up through the middle (Basic Attack to refill, skills on kills/AoE), then
   **goes all-in on the boss**: 40% (spend as you go) → 67% (bank every fight incl. boss) → 75% (bank, dump on the boss). Remove the carry-over and even the best play only reaches 26–44%.
3. **Pick the opener by merge potential**, not raw starter power (Bat / Robot / Treant / Drone combos).
4. **Recruit for future merges.** Rating-plus-synergy recruiting 75% vs random 71% vs worst-first 65%. Replacing party members with recruits never helped (75.2% vs 74.9%).
5. Things that **don't** matter much: formation (HP-sorted was worst at 70%, the others within ~2 pts of each other), element choice beyond the usual ±25%.
6. **Traps:** casting Heal / King Heal, Counter, Taunt, Thorns, Guard-spam. Even at Heal 15 / King Heal 30 a heal loses to a Basic Attack (5 dmg and +1 energy) for the scripted player; in my test
   Heal 25 / King Heal 40 is roughly where healing starts to be worth a turn.

---

## 6. What I would still look at

1. **Attrition is the whole difficulty.** Out-of-combat healing swings the run enormously: +2% max HP per fight → 79%, +4% → 85%, +8% → 92% (from 75%). Keep any rest/heal mechanic tiny, or make
   Heal/Renewal strong enough that support builds fill that role.
2. **Boss ladder is inverted** (before the boss tweaks: Act I 86% · Act II 63% · Act III 71%; now 83.5% · 71.4% · 67.2%). Measured options (scripted player, ±0.6 pts):
   - Act I Crimson Bat: HP barely matters (180 → 220: 88% → 86%); raising its RATK 15 → 18 / 20 / 22 gives 84% / 81% / 79%.
   - Act II Colossal Treant: HP 220 → 200 gives 69.5%; HP 200 + Thorns 8 → 6 gives 72.4%; HP 190 + Thorns 6 gives 74.2%.
   - Act III Heavy Robot: **Shockwave has RATK 0, so it deals 1 damage to everything** (3 energy, hits all, 20% stun) and the boss AI prefers it whenever it has the energy. Giving the boss RATK 15 makes it
     ~14 per hero (Act III 70.6% → 69.2%); 20–22 gives ~68%.
   A gentle escalating curve would be roughly Act I ≈ 81% (Bat RATK 20), Act II ≈ 72% (Treant HP 200, Thorns 6), Act III ≈ 69% (Robot RATK 15).
3. **Bear** still scores in the weak band; its merges are the weak spot, not its stats.
4. **Bottom merges** (Bio-Tank, Blight Wood, Elder/Mossy/Artillery Bear) are still D tier; speed is the missing ingredient on most of them. The X+X merges would benefit from a bigger reward.
5. **Energy banking** is worth ~25–30 win-rate points and nothing in the UI hints at it. Surface it, or cap/reset it per fight — but retune everything if you do.
6. Surface move power and the Guard / merge-energy-reset rules in the UI.

---

## 7. Method notes

- No Node/Python was available on this machine, so I served the repo with a small PowerShell `HttpListener` static server (root + `public/`, like Vite) and ran everything in the browser pane: the real game for
  playing/UI testing, and Web Workers (8 threads) for the simulations.
- Engine port: `sim.js` (battle), `campaign.js` (run flow, enemy generation, recruit/merge), `worker.js` + `pool.js` (parallel jobs, Bradley-Terry fit), `bot.js` (drives the real UI by DOM clicks).
  They live in the session scratchpad, not the repo; they can be moved into the repo (e.g. `tools/balance-sim/`) so rankings can be re-run after every balance change.
- Player policy: 1-ply heuristic (expected damage + status values − an "energy price" λ, kill bonuses, front-row/taunt targeting rules identical to the game). For a single fight λ≈8 is best; for a whole
  run the best schedule was λ = 6, 6 (first two fights), 15 (middle), 3 (boss). Policy variants were compared head-to-head and in full-run play before ranking.
