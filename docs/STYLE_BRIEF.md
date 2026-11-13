# Shorts style brief: the "pill people" story Short (from the owner's three references, 2026-11-08)

References (in `inbox/reference_shorts/`):
1. `3_prison_LIKED.mp4` (Celyxi — the owner's channel, "He Begged to Stay in Prison for 5 More Years!"): **the style the owner likes**. 1080×1920, 70 s.
2. `1_sailors_noses.mp4` (Celyxi — the owner's channel, "Why Sailors Stitched Noses Back On?"): the same formula with 2D outlined characters. 64 s.
3. `2_roller_coaster.mp4` (Ricks Clips, "This Shape Saved Roller Coasters"): 2D outlined characters inside 3D game-like scenes. 63 s.
5. `5_celyxi_pharaoh_thief.mp4` (Celyxi — the owner's channel): source for the owner's narrator voice sample in `voice_auditions/owner.wav`.

## The formula (all three)
- **60-70 s, vertical, one narrator, no dialogue voices.** 218-240 words at **187-225 words a minute** (fast; our films run at about 150).
- **Story shape:** (1) a strange hook stated as fact in the first sentence ("A prisoner was offered early release, and he begged the judge to let him stay"); (2) everyone laughs or doubts him; (3) clues the viewer can't solve; (4) a parallel mystery ("Meanwhile, the bank next door had a problem"); (5) **"You see, ..."**, the reveal with logic that makes sense in the story's world (made-up stories are the default); (6) a one-line payoff; (7) the last line loops back into the first ("Which is exactly why..." → "A prisoner was offered early release").
- **A new picture about every 1-1.5 s.** Most "cuts" are fast whip-pans with heavy motion blur, or a continuous move to the next set-up, not hard cuts (the scene detector found only 10 hard cuts in 70 s).
- **Captions:** one or two words at a time, white, heavy rounded sans with a dark outline and shadow, at about 60% of the frame height, timed to the words.
- **Pop-in graphics** on the beats: "+5 YEARS" in 3D letters, tally marks on the wall, a calendar "MONDAY 7", sparkles, sweat drops, thought bubbles "1, 2, 3...?", "Z" for sleep, sound-wave arcs for the scraping.

## The look of the liked one (3)
- **Characters:** a big round head (about 40% of the height) on a short **pill/capsule body**, with **thin black stick legs** and small rounded feet. The arms are thin too, mostly hidden.
  - Clothes are just the body's colour or pattern: stripes for the prisoner, a dark suit with a red tie, a green uniform with a cap.
  - Every character has a **skin tone** (light to dark brown) and simple hair caps: a bob, buns, a side part, a moustache.
- **Faces:** drawn on, very expressive and readable at phone size.
  - **Eyes:** big white eyes with black pupils, or closed "^ ^" arcs, or a smug half-lid.
  - **Brows and mouths:** angled brows; mouths that are wobbly, grinning, gritted teeth or a smirk.
  - **Extras:** tears, sweat drops, blush. Each beat gets a new expression.
- **Shading:** soft, matte, slightly toon-shaded 3D (warm key light, gentle bounce, soft shadows), **no outlines** on the 3D version. Lots of warm practical lights (string lights, desk lamps, candles).
- **Sets:** small, dense, cosy dioramas full of props and readable signs (NO LAUGHING, CITY BANK, OUR VAULT 100% SAFE, MENU MON MUSH TUE MUSH). A cutaway cross-section view (the tunnel under the wall into the vault) tells the reveal.
- **Camera:** close and low, always moving (slow push, orbit or crane), with whip transitions. Depth of field is used sometimes.

## What we have / what we need
- **Have:** Three.js in Remotion, sets, lighting, camera moves, Fish narrator, Whisper word timing (so word-by-word captions come for free), the mixer, the `video/src/short` Short format.
- **Need (one-time, about 1-2 building sessions):**
  1. **An original "pill" character rig** (`cam3d/Pill3D.tsx`): a capsule body with a pattern or outfit texture, a sphere head, stick legs that walk, simple stick arms with hands for props, hair caps and hats. Skin tones from a palette. It must be our own design (not the reference's proportions or faces) and approved by the owner on a character sheet first.
  2. **A face kit:** drawn on a canvas texture per expression (eyes with pupils and lids, brows, about 12 mouths, tears, sweat, blush), swapped per beat, with blinking and mouth flaps on the narrator's words.
  3. **The Shorts kit** (`video/src/shortkit/`): 1080×1920, a word caption track, whip-pan transitions with motion blur, pop-in 3D words and icons, a cross-section view helper, and a 50-70 s timing template.
  4. **The cast:** the owner chose the trend's style for this channel (2026-11-08): an original Beanfolk cast in that style, every
     character with a skin tone and a readable face. Design our own characters; never copy third-party channels' characters.
- **Per Short after that:** a script of 200-230 words (the owner writes in ChatGPT; we give them this shape), voice at a faster delivery, about 45 picture set-ups, about 1,900 frames. Renders in about 15 minutes on one session, or a few minutes on 5-10 sessions.

## Styles 1 and 2
- **1 (2D outlined):** the same kit with flat shading and a thick black outline (inverted-hull outline on the meshes) plus painted, blurred backgrounds.
- **2 (2D characters in 3D scenes):** flat outlined characters on billboards inside our 3D sets.
- Both reuse the Shorts kit; the liked 3D style comes first.
