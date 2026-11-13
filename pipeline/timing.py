"""Word-anchored times for an episode (Python side; mirrors video/src/timing.ts).

    from timing import Timing
    T = Timing("episodes/head_start")
    T.at(2, "caught")      # start of the word in beat 2
    T.end(1, "hand")       # end of the word
    T.PS(5), T.PE(5), T.PG(5)   # beat start, end, end + designed gap
Never type a second: every cue comes from a word or a beat edge.
"""
import json
import pathlib
import re


class Timing:
    def __init__(self, episode_dir):
        ep = pathlib.Path(episode_dir)
        self.words = json.loads((ep / "words.json").read_text())
        self.chunks = json.loads((ep / "timeline_chunks.json").read_text())

    @staticmethod
    def _n(w):
        return re.sub(r"[^a-z0-9']", "", w.lower())

    def _find(self, para, word, nth):
        hits = [w for w in self.words if w["para"] == para and self._n(w["word"]) == self._n(word)]
        if len(hits) < nth:
            raise KeyError(f'word "{word}"#{nth} not in beat {para}')
        return hits[nth - 1]

    def at(self, para, word, nth=1, off=0.0):
        return self._find(para, word, nth)["start"] + off

    def end(self, para, word, nth=1, off=0.0):
        return self._find(para, word, nth)["end"] + off

    def PS(self, para):
        return self.chunks[para]["start"]

    def PE(self, para):
        return self.chunks[para]["end"]

    def PG(self, para):
        return self.chunks[para]["end"] + self.chunks[para]["gap_after"]
