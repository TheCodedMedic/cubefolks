# 06. How to study more channels and videos (the method we used)

Use this whenever the user names channels or videos to learn from. It is how the hooks guide (`../STORYTELLING_HOOKS_GUIDE.md`) was made.

## 1. Consent and scope
- Only study channels the user names. Say what you will download, how much, and where it will go; wait for a clear yes (the downloads rule in `CLAUDE.md`). **Captions only** (text) are usually enough for script study: about 50-300 KB per video. Download video or audio only when you also need to study the picture or the sound, and ask separately.
- Transcripts are for study. Do not publish them, bundle them, or reuse their wording. Write findings in your own words; quote at most a few words to name a device.

## 2. Steps
```bash
# 1. list the channel (metadata only, no download)
yt-dlp --flat-playlist --print "%(id)s|%(view_count)s|%(duration)s|%(upload_date)s|%(title)s" "https://www.youtube.com/@CHANNEL/videos" > research/channels/CHANNEL_videos.txt
# 2. check captions exist (no download): yt-dlp --skip-download --list-subs <url>
# 3. after the user's yes: captions only
yt-dlp --skip-download --write-auto-subs --sub-langs en --sub-format vtt -o "research/channels/CHANNEL/%(id)s" -a <(cut -d'|' -f1 research/channels/CHANNEL_videos.txt | sed 's#^#https://youtu.be/#')
# 4. clean, timed transcripts
# then strip the VTT timing lines into plain text per video (a few lines of Python)
```
If a video has no captions, transcribe its audio with Whisper instead (that needs an audio download: ask).

## 3. What to measure (per video, then per channel)
- words, duration, **words per minute**, words in the first 30 s, average sentence length;
- **spoken character turns** (auto-captions mark speaker changes with `>>`), share of "you/your";
- how many numbers, questions, signpost phrases ("here's how it works", "but here's the thing", "remember that");
- views per video (to compare what works; correlation only).

## 4. What to read for (by hand, every script, start to end)
1. The first 30 s: what is shown, what is said, when the title question is spoken.
2. The structure: mark each block (setup, rules, montage, problems, turn, climax, tag, hook, coda, CTA) with a timestamp.
3. Devices: setups and payoffs, callbacks, repeated words, the planted limit, signposts, numbers, animals/records, dialogue functions (reaction, twist, joke), silences.
4. The ending: how the main loop closes, what loop opens next, the CTA wording pattern, any brand line.
5. Across videos: what repeats (that is the channel's format) and what changes (that is the craft).

## 5. Write it up
A file in `knowledge/craft/` with: the source list and date, a numbers table, the shared machine (a table of blocks with times and why each works), what each channel does differently, devices to adopt (each mapped to our pipeline), a script skeleton, and **what not to copy**. Then update `knowledge/SHORTS_PLAYBOOK.md` (or the Short's brief) to use it.

## 6. Sources by genre worth suggesting to the user (study only with their yes)
Animated true-story and history Shorts; invention and gadget stories; science explainers with strong visual metaphors; animated history; documentary storytelling channels; sketch comedy animation; kids' story channels. Ask the user for the specific channels they admire rather than picking for them.
