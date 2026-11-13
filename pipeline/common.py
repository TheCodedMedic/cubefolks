"""Shared helpers for the cast pipeline (fish_cast, assemble_cast, align_cast, sfx_gen).

An episode folder holds script.txt (one beat per paragraph), speakers.json (one tag per beat), episode.json
(voice settings: lead, gaps, gap_default, tail, level_match_db) and audio/para_NNN.mp3 (one clip per beat).

Clip numbering: the 3D episodes (04, 05) number clips from para_001 (beat 1 = first paragraph, like timing.json's
1-based beats); the older Short numbers from para_000. `clip(ep, i)` detects which convention a folder uses
so a script never re-voices an episode because it looked for the wrong file name. New episodes are 1-based.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent


def paras(ep):
    """The beats: one per paragraph of script.txt."""
    return [p.strip() for p in (pathlib.Path(ep) / "script.txt").read_text().split("\n\n") if p.strip()]


def speakers(ep):
    return json.loads((pathlib.Path(ep) / "speakers.json").read_text())


def clip_base(ep):
    """1 if clips are para_001..., 0 if para_000... (an empty audio folder means 1-based: the current convention)."""
    audio = pathlib.Path(ep) / "audio"
    if (audio / "para_000.mp3").exists() and not (audio / "para_001.mp3").exists():
        return 0
    if any(audio.glob("para_*.mp3")):
        return 0 if (audio / "para_000.mp3").exists() else 1
    return 1


def clip(ep, i, base=None):
    """Path of the clip for 0-based beat index i."""
    base = clip_base(ep) if base is None else base
    return pathlib.Path(ep) / "audio" / f"para_{i + base:03d}.mp3"


def voice_settings(ep, n_beats):
    """lead / per-beat gaps / tail / level_match_db from episode.json (gaps.json and defaults as fallbacks)."""
    ep = pathlib.Path(ep)
    v = {}
    if (ep / "episode.json").exists():
        v = json.loads((ep / "episode.json").read_text()).get("voice", {}) or {}
    gap_default = float(v.get("gap_default", 0.45))
    gaps = v.get("gaps")
    if isinstance(gaps, list):
        assert len(gaps) == n_beats, f"episode.json voice.gaps has {len(gaps)} entries for {n_beats} beats"
        gaps = [float(g) for g in gaps]
    else:
        gaps = [gap_default] * n_beats
        gp = ep / "gaps.json"
        if gp.exists():
            for k, g in json.loads(gp.read_text()).items():
                gaps[int(k)] = float(g)
    return {
        "lead": float(v.get("lead", 0.3)),
        "gaps": gaps,
        "tail": float(v.get("tail", 3.0)),
        "level_match_db": float(v.get("level_match_db", 6.0)),
        "narrator": v.get("narrator", "N"),
    }


def bean_env():
    """BEAN_* variables: config/keys.env (kept in this private repo), then the git-ignored .env, then the environment
    (later wins). Never print the values."""
    import os
    e = {}
    for p in (ROOT / "config" / "keys.env", ROOT / ".env"):
        if p.exists():
            e.update(dict(l.strip().split("=", 1) for l in p.read_text().splitlines() if "=" in l and not l.strip().startswith("#")))
    e.update({k: v for k, v in os.environ.items() if k.startswith("BEAN_")})
    return e
