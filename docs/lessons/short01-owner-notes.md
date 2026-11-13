# Short 1 (Clever Hans): what the owner flagged, so it never happens again (2026-11-09)

The owner shipped Short 1 as it was, but asked that these never appear in a future Short. Check every one in review, before rendering.

## Picture
1. **Nothing too close to the camera.** At 0:10 a set wall or prop sat in front of the lens: a black shape across the top-left corner.
   Render the first, middle and last frame of every moving shot and look at the corners, not only the subject.
2. **No back of a head filling the frame.** Over-the-shoulder shots let the back of Hans's head or a crowd head cover a third of the
   picture. A foreground head may take at most a sliver at the frame edge (under 15% of the frame), or frame the shot without it.
   The viewer should always see a face.
3. **Dark grades must keep faces bright.** In the violet "You see" section, crowd faces went dim and darker skin tones read poorly.
   Add a face fill light (or a rim light) on characters in night and violet grades. Check every skin tone on the cast sheet is readable
   in every grade; measure face luminance, don't guess.
4. **Keep the approved proportions on new characters.** Hans's long neck made him read like a giraffe. Check each new character
   (animals included) from front, three-quarter and side before building shots, and keep the head big and the neck short, like the cast sheet.
5. **No blurry foreground opening a shot.** An out-of-focus leg or table edge in the first half second wastes the beat. The subject must
   read in the first frames of every shot.

## Sound
6. **Music must be heard.** The first mix had the music 29 dB under the voice: inaudible on a phone. The owner set **15 dB under the
   voice** (average RMS of the music against the voice) as the level for Shorts. Measure it: render the mix and a voice-only mix and
   subtract them, as in the Short 1 session. Note that `mix.py`'s `rel_db` for a music bed is not the same thing (`-6.2` with
   `MUSIC_DUCK_DB = 6` gave 15 dB for this track); always measure.
7. **Real reactions, not just synthesised ones.** Laughs, cheers, applause, gasps, neighs and stings are now in `sfx/library/`
   (Mixkit, see `library_index.md`). Give every story beat the sound a viewer expects: a laugh on a joke, a cheer on a win, a buzz on a
   wrong answer, the animal's real voice when it appears.
