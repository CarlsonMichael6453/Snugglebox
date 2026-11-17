#!/usr/bin/env python3
"""Soft little tones for box taps, pops, and reveals."""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "sounds"
SR = 22050


def tone(freq: float, dur: float, vol: float = 0.25, decay: float = 6.0, harm: float = 0.0) -> list[float]:
    n = int(SR * dur)
    data = []
    for i in range(n):
        t = i / SR
        attack = min(1.0, i / 30)
        env = math.exp(-decay * t) * attack
        sample = math.sin(2 * math.pi * freq * t)
        if harm:
            sample += harm * math.sin(2 * math.pi * freq * 2 * t)
        data.append(sample * vol * env)
    return data


def noise(dur: float, vol: float = 0.08) -> list[float]:
    rng = random.Random(3)
    n = int(SR * dur)
    data = []
    for i in range(n):
        t = i / SR
        env = math.exp(-10 * t) * min(1.0, i / 20)
        data.append((rng.random() * 2 - 1) * vol * env)
    return data


def mix(*tracks: list[float]) -> list[float]:
    length = max(len(t) for t in tracks)
    out = [0.0] * length
    for track in tracks:
        for i, sample in enumerate(track):
            out[i] += sample
    peak = max(1e-6, max(abs(s) for s in out))
    if peak > 0.95:
        scale = 0.95 / peak
        out = [s * scale for s in out]
    return out


def save(name: str, samples: list[float]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        frames = b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in samples)
        handle.writeframes(frames)
    print(path.relative_to(ROOT))


def sequence(notes: list[tuple[float, float, float]], gap: float = 0.02) -> list[float]:
    out: list[float] = []
    for freq, dur, vol in notes:
        out.extend(tone(freq, dur, vol=vol, decay=7, harm=0.15))
        out.extend([0.0] * int(SR * gap))
    return out


def main() -> None:
    save("tap", tone(740, 0.07, vol=0.18, decay=18))
    save("shake", mix(noise(0.28, 0.12), tone(180, 0.28, vol=0.08, decay=8)))
    save("pop", mix(tone(320, 0.12, vol=0.2, decay=10), tone(640, 0.16, vol=0.22, decay=8)))
    save("common", sequence([(523, 0.12, 0.2), (659, 0.18, 0.2)]))
    save("rare", sequence([(523, 0.1, 0.2), (659, 0.1, 0.2), (784, 0.2, 0.22)]))
    save("epic", sequence([(523, 0.09, 0.2), (659, 0.09, 0.2), (784, 0.09, 0.22), (1046, 0.24, 0.24)]))
    save("legendary", sequence([(523, 0.1, 0.2), (659, 0.1, 0.22), (784, 0.1, 0.22), (1046, 0.12, 0.24), (1318, 0.32, 0.22)]))
    save("dupe", sequence([(988, 0.08, 0.18), (1318, 0.16, 0.2)], gap=0.01))
    save("sparkle", sequence([(659, 0.1, 0.18), (880, 0.1, 0.2), (1174, 0.22, 0.2)]))
    save("ui", tone(880, 0.05, vol=0.12, decay=22))


if __name__ == "__main__":
    main()
