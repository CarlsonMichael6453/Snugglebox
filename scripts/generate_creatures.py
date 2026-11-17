#!/usr/bin/env python3
"""Draw the Snugglebox sticker set.

The original 512px webp pack was not present in this environment, so this
script draws a matching folder layout:

  assets/creatures/common|rare|epic|legendary/<slug>-1.webp
  assets/creatures/common|rare|epic|legendary/<slug>-2.webp
  assets/creatures/mochi-colors/<color>-mochi.webp
  assets/creatures/silhouettes/...

Pose 1 sits. Pose 2 is the same friend, tipped and delighted.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "creatures"
SIZE = 512

INK = (74, 49, 40, 255)
BLUSH = (242, 154, 166, 150)


def rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def rgba(hex_color: str, a: int = 255) -> tuple[int, int, int, int]:
    r, g, b = rgb(hex_color)
    return (r, g, b, a)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))  # type: ignore[return-value]


def dark(hex_color: str, t: float = 0.72) -> tuple[int, int, int]:
    return mix(rgb(hex_color), (40, 24, 20), 1 - t)


def light(hex_color: str, t: float = 0.55) -> tuple[int, int, int]:
    return mix(rgb(hex_color), (255, 255, 255), t)


def lum(hex_color: str) -> float:
    r, g, b = rgb(hex_color)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


class Board:
    def __init__(self) -> None:
        self.img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    def ellipse(self, cx: float, cy: float, rx: float, ry: float, fill, blur: int = 0) -> None:
        layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=fill)
        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        self.img.alpha_composite(layer)

    def polygon(self, pts, fill) -> None:
        layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ImageDraw.Draw(layer).polygon(pts, fill=fill)
        self.img.alpha_composite(layer)

    def clip_ellipse(self, layer: Image.Image, cx, cy, rx, ry) -> None:
        mask = Image.new("L", (SIZE, SIZE), 0)
        ImageDraw.Draw(mask).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
        self.img.alpha_composite(layer)

    def pen(self) -> ImageDraw.ImageDraw:
        return ImageDraw.Draw(self.img)


def blob(board: Board, cx, cy, rx, ry, color: str) -> None:
    outline = dark(color, 0.55)
    board.ellipse(cx, cy + 4, rx + 7, ry + 7, (*outline, 255))
    board.ellipse(cx, cy, rx, ry, rgba(color))
    shade = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(shade).ellipse(
        (cx - rx * 0.82, cy + ry * 0.05, cx + rx * 0.82, cy + ry * 1.05),
        fill=(*dark(color, 0.62), 80),
    )
    board.clip_ellipse(shade, cx, cy, rx, ry)
    board.ellipse(cx - rx * 0.32, cy - ry * 0.42, rx * 0.28, ry * 0.18, (*light(color, 0.8), 90), blur=2)


def ear(board: Board, cx, cy, rx, ry, fill: str, inner: str, angle: float = 0) -> None:
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(*dark(fill, 0.55), 255))
    d.ellipse((cx - rx + 4, cy - ry + 5, cx + rx - 4, cy + ry - 3), fill=rgba(fill))
    d.ellipse((cx - rx * 0.45, cy - ry * 0.15, cx + rx * 0.45, cy + ry * 0.55), fill=rgba(inner))
    if angle:
        layer = layer.rotate(angle, resample=Image.Resampling.BICUBIC, center=(cx, cy))
    board.img.alpha_composite(layer)


def star(board: Board, x, y, r, fill) -> None:
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = r if i % 2 == 0 else r * 0.45
        pts.append((x + rad * math.cos(ang), y + rad * math.sin(ang)))
    board.polygon(pts, fill)


def face(board: Board, cx, cy, scale, happy: bool, sleepy: bool = False, iris: str = "#4A342C") -> None:
    d = board.pen()
    gap = 26 * scale
    if sleepy:
        for s in (-1, 1):
            x = cx + s * gap
            d.arc(
                (x - 14 * scale, cy - 8 * scale, x + 14 * scale, cy + 10 * scale),
                200,
                340,
                fill=INK,
                width=max(3, int(4 * scale)),
            )
    elif happy:
        for s in (-1, 1):
            x = cx + s * gap
            d.arc(
                (x - 16 * scale, cy - 12 * scale, x + 16 * scale, cy + 14 * scale),
                200,
                345,
                fill=INK,
                width=max(3, int(4 * scale)),
            )
    else:
        for s in (-1, 1):
            x = cx + s * gap
            board.ellipse(x, cy, 16 * scale, 18 * scale, (255, 255, 255, 255))
            board.ellipse(x, cy + 2 * scale, 10 * scale, 11 * scale, rgba(iris))
            board.ellipse(x - 4 * scale, cy - 5 * scale, 4 * scale, 4 * scale, (255, 255, 255, 240))
    board.ellipse(cx - 48 * scale, cy + 16 * scale, 14 * scale, 9 * scale, BLUSH)
    board.ellipse(cx + 48 * scale, cy + 16 * scale, 14 * scale, 9 * scale, BLUSH)
    d = board.pen()
    if happy:
        board.ellipse(cx, cy + 28 * scale, 12 * scale, 9 * scale, (90, 52, 48, 255))
        board.ellipse(cx, cy + 32 * scale, 7 * scale, 5 * scale, (232, 140, 150, 255))
    elif sleepy:
        d.arc(
            (cx - 8 * scale, cy + 18 * scale, cx + 8 * scale, cy + 30 * scale),
            20,
            160,
            fill=INK,
            width=max(2, int(3 * scale)),
        )
    else:
        d.arc(
            (cx - 14 * scale, cy + 16 * scale, cx + 14 * scale, cy + 34 * scale),
            25,
            155,
            fill=INK,
            width=max(2, int(3 * scale)),
        )


def paws(board: Board, cx, cy, color: str, spread: float = 22, size: float = 16) -> None:
    for s in (-1, 1):
        blob_color = light(color, 0.25)
        board.ellipse(cx + s * spread, cy, size, size * 0.85, (*blob_color, 255))


def pattern(board: Board, cx, cy, rx, ry, kind: str) -> None:
    if kind in ("", "none"):
        return
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if kind == "stripes":
        bands = ["#F7A8B8", "#F8D58A", "#B7E0A8", "#9FD0F6", "#D2C0F4"]
        top = cy - ry
        h = (ry * 2) / len(bands)
        for i, col in enumerate(bands):
            d.rectangle((0, top + i * h, SIZE, top + (i + 1) * h + 1), fill=rgba(col, 210))
    elif kind == "swirl":
        d.ellipse((cx - rx, cy - ry * 0.2, cx + rx * 0.2, cy + ry), fill=rgba("#F7A8D0", 150))
        d.ellipse((cx - rx * 0.2, cy - ry, cx + rx, cy + ry * 0.35), fill=rgba("#A9D8F8", 140))
    elif kind == "chips":
        rng = random.Random(4)
        for _ in range(8):
            x = cx + rng.randint(int(-rx * 0.55), int(rx * 0.55))
            y = cy + rng.randint(int(-ry * 0.45), int(ry * 0.5))
            d.ellipse((x - 11, y - 8, x + 11, y + 8), fill=rgba("#6B4128", 230))
    elif kind == "stars":
        rng = random.Random(11)
        for _ in range(12):
            x = cx + rng.randint(int(-rx * 0.7), int(rx * 0.7))
            y = cy + rng.randint(int(-ry * 0.65), int(ry * 0.6))
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 0.72:
                continue
            rr = rng.choice((4, 5, 7))
            pts = []
            for i in range(10):
                ang = -math.pi / 2 + i * math.pi / 5
                rad = rr if i % 2 == 0 else rr * 0.45
                pts.append((x + rad * math.cos(ang), y + rad * math.sin(ang)))
            d.polygon(pts, fill=rgba("#FFE7A3", 230))
    elif kind == "petals":
        for ang in (30, 150, 260):
            rad = math.radians(ang)
            x = cx + math.cos(rad) * rx * 0.42
            y = cy + math.sin(rad) * ry * 0.28
            d.ellipse((x - 16, y - 10, x + 16, y + 10), fill=rgba("#F4A8C0", 200))
            d.ellipse((x - 8, y - 14, x + 8, y + 8), fill=rgba("#F8C4D4", 200))
    elif kind == "specks":
        rng = random.Random(6)
        for _ in range(16):
            x = cx + rng.randint(int(-rx * 0.7), int(rx * 0.7))
            y = cy + rng.randint(int(-ry * 0.65), int(ry * 0.55))
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 0.8:
                continue
            d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(230, 220, 200, 180))
    board.clip_ellipse(layer, cx, cy, rx - 6, ry - 6)


def mochi(board: Board, happy: bool, color: str = "#F4EFE6", pat: str = "none") -> None:
    cx, cy, rx, ry = 256, 292, 118, 108
    ear(board, cx - 58, cy - 108, 28, 36, color, "#F6C9D2", angle=18)
    ear(board, cx + 58, cy - 108, 28, 36, color, "#F6C9D2", angle=-18)
    blob(board, cx, cy, rx, ry, color)
    pattern(board, cx, cy, rx, ry, pat)
    if lum(color) < 90:
        board.ellipse(cx, cy + 8, 46, 34, (255, 244, 236, 230))
    paws(board, cx, cy + 78, color, 18, 18)
    face(board, cx, cy - 4, 1.05, happy, iris="#3A2A24" if lum(color) > 80 else "#1A1420")


def puffin(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    blob(board, cx, cy, 108, 112, "#3E4A66")
    board.ellipse(cx, cy + 18, 62, 58, rgba("#F7E7D2"))
    # beak
    board.polygon([(cx - 22, cy + 8), (cx + 22, cy + 8), (cx, cy + 42)], rgba("#F0A05A"))
    board.polygon([(cx - 12, cy + 18), (cx + 12, cy + 18), (cx, cy + 34)], rgba("#E07A3A"))
    ear(board, cx - 70, cy - 20, 22, 16, "#5C6A88", "#8AA0C0", angle=20)  # wing nubs
    ear(board, cx + 70, cy - 10, 22, 16, "#5C6A88", "#8AA0C0", angle=-16)
    face(board, cx, cy - 36, 1.0, happy, iris="#2C3348")


def corgi(board: Board, happy: bool) -> None:
    cx, cy = 256, 318
    # tail
    board.ellipse(cx + 108, cy + 8, 28, 18, rgba("#E7A15A"))
    blob(board, cx, cy, 132, 78, "#E7A15A")
    board.ellipse(cx, cy + 18, 70, 36, rgba("#F8D7A8"))
    ear(board, cx - 70, cy - 70, 32, 44, "#E7A15A", "#F3C2B0", angle=24)
    ear(board, cx + 70, cy - 70, 32, 44, "#E7A15A", "#F3C2B0", angle=-24)
    for x in (-78, -28, 28, 78):
        board.ellipse(cx + x, cy + 70, 16, 12, rgba("#C9844A"))
    face(board, cx, cy - 8, 0.92, happy)


def potato(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    blob(board, cx, cy, 112, 124, "#C9956A")
    # spikes
    rng = random.Random(2)
    for i in range(9):
        ang = rng.random() * math.tau
        x = cx + math.cos(ang) * 100
        y = cy + math.sin(ang) * 108
        board.polygon(
            [(x, y - 18), (x - 8, y + 6), (x + 8, y + 6)],
            rgba("#8D6A48"),
        )
    board.ellipse(cx + 36, cy - 128, 16, 22, rgba("#7DAA62"))
    board.ellipse(cx + 48, cy - 118, 12, 16, rgba("#6E9A55"))
    for dx, dy in ((-40, 10), (30, 30), (-10, 50)):
        board.ellipse(cx + dx, cy + dy, 8, 6, rgba("#B07E52", 180))
    face(board, cx, cy - 10, 1.0, happy)


def penguin(board: Board, happy: bool) -> None:
    cx, cy = 256, 308
    blob(board, cx, cy, 96, 124, "#2C3344")
    board.ellipse(cx, cy + 24, 58, 78, rgba("#F4EDE4"))
    board.ellipse(cx - 18, cy + 118, 22, 12, rgba("#F0A05A"))
    board.ellipse(cx + 18, cy + 118, 22, 12, rgba("#F0A05A"))
    board.polygon([(cx - 16, cy + 10), (cx + 16, cy + 10), (cx, cy + 32)], rgba("#F0A05A"))
    # eggshell hat
    board.ellipse(cx, cy - 132, 54, 36, rgba("#F7F1E4"))
    board.ellipse(cx, cy - 118, 48, 18, rgba("#E7D3B4"))
    d = board.pen()
    d.arc((cx - 40, cy - 150, cx + 10, cy - 110), 200, 20, fill=rgba("#E7D3B4"), width=4)
    face(board, cx, cy - 16, 0.95, happy, iris="#243044")


def hamster(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    blob(board, cx, cy, 112, 108, "#E7C39A")
    board.ellipse(cx - 78, cy + 10, 36, 32, rgba("#F0D2B4"))
    board.ellipse(cx + 78, cy + 10, 36, 32, rgba("#F0D2B4"))
    star(board, cx + 78, cy + 6, 10, rgba("#F2C14E"))
    ear(board, cx - 62, cy - 100, 26, 28, "#E7C39A", "#F3B7C0")
    ear(board, cx + 62, cy - 100, 26, 28, "#E7C39A", "#F3B7C0")
    face(board, cx, cy - 8, 1.05, happy)


def frog(board: Board, happy: bool) -> None:
    cx, cy = 256, 318
    # lily umbrella
    board.ellipse(cx + 8, cy - 168, 78, 28, rgba("#7EBF6A"))
    board.ellipse(cx + 70, cy - 168, 8, 22, rgba("#F7C96A"))
    d = board.pen()
    d.line((cx, cy - 150, cx + 10, cy - 70), fill=rgba("#6E8A48"), width=5)
    blob(board, cx, cy, 124, 90, "#8FCB78")
    board.ellipse(cx, cy + 16, 70, 42, rgba("#E7F6C8"))
    # bulging eyes
    board.ellipse(cx - 58, cy - 78, 28, 26, (255, 255, 255, 255))
    board.ellipse(cx + 58, cy - 78, 28, 26, (255, 255, 255, 255))
    board.ellipse(cx - 58, cy - 76, 14, 14, rgba("#2C3A28"))
    board.ellipse(cx + 58, cy - 76, 14, 14, rgba("#2C3A28"))
    board.ellipse(cx - 64, cy - 82, 5, 5, (255, 255, 255, 230))
    board.ellipse(cx + 52, cy - 82, 5, 5, (255, 255, 255, 230))
    board.ellipse(cx - 70, cy + 8, 16, 10, BLUSH)
    board.ellipse(cx + 70, cy + 8, 16, 10, BLUSH)
    d = board.pen()
    if happy:
        board.ellipse(cx, cy + 18, 16, 12, rgba("#C45B58"))
    else:
        d.arc((cx - 18, cy + 4, cx + 18, cy + 28), 20, 160, fill=INK, width=3)


def otter(board: Board, happy: bool) -> None:
    cx, cy = 256, 328
    board.ellipse(cx - 130, cy + 10, 36, 16, rgba("#8A5A3C"))
    blob(board, cx, cy, 140, 64, "#C4845A")
    board.ellipse(cx + 10, cy + 10, 78, 32, rgba("#F3D2B0"))
    ear(board, cx + 40, cy - 62, 18, 16, "#C4845A", "#F3B7C0")
    ear(board, cx + 86, cy - 52, 18, 16, "#C4845A", "#F3B7C0")
    face(board, cx + 62, cy - 8, 0.82, happy)
    d = board.pen()
    d.line((cx + 110, cy - 4, cx + 146, cy - 10), fill=INK, width=2)
    d.line((cx + 110, cy + 6, cx + 148, cy + 8), fill=INK, width=2)


def yarn(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    blob(board, cx, cy, 116, 110, "#F3B7C8")
    d = board.pen()
    for i, col in enumerate(("#E89AAD", "#F7C6D2", "#E7A0C0")):
        d.arc((cx - 90 + i * 8, cy - 80, cx + 90, cy + 70), 200, 40, fill=rgba(col), width=8)
    d.line((cx + 90, cy + 20, cx + 150, cy + 70), fill=rgba("#E89AAD"), width=6)
    board.ellipse(cx + 156, cy + 78, 8, 8, rgba("#E89AAD"))
    face(board, cx - 6, cy - 6, 0.9, happy)


def snorfle(board: Board, happy: bool) -> None:
    cx, cy = 256, 310
    board.ellipse(cx - 120, cy - 20, 36, 24, rgba("#F7F4EE", 230))
    board.ellipse(cx + 124, cy + 10, 30, 20, rgba("#F7F4EE", 220))
    blob(board, cx, cy, 108, 100, "#D7CBE8")
    board.ellipse(cx, cy + 20, 60, 40, rgba("#F4EEF8"))
    ear(board, cx - 60, cy - 90, 22, 26, "#D7CBE8", "#F6C9D4")
    ear(board, cx + 60, cy - 90, 22, 26, "#D7CBE8", "#F6C9D4")
    face(board, cx, cy - 6, 1.0, False, sleepy=not happy)
    if not happy:
        d = board.pen()
        d.text((cx + 70, cy - 120), "z", fill=rgba("#8A74B0"))


def mossling(board: Board, happy: bool) -> None:
    cx, cy = 270, 320
    blob(board, cx, cy, 90, 100, "#8FBF78")
    # mushroom cap
    board.ellipse(cx - 8, cy - 120, 78, 48, rgba("#E07A62"))
    board.ellipse(cx - 30, cy - 132, 10, 8, rgba("#F4E2C8"))
    board.ellipse(cx + 16, cy - 140, 8, 6, rgba("#F4E2C8"))
    board.ellipse(cx + 28, cy - 118, 7, 6, rgba("#F4E2C8"))
    for dx, dy in ((-30, 10), (20, 40), (-10, 50)):
        board.ellipse(cx + dx, cy + dy, 10, 8, rgba("#6E9A55", 160))
    face(board, cx, cy - 4, 0.9, happy, iris="#2E4A28")


def axolotl(board: Board, happy: bool) -> None:
    cx, cy = 256, 310
    blob(board, cx, cy + 20, 100, 70, "#F3B7C8")
    blob(board, cx, cy - 20, 90, 72, "#F7C9D4")
    # gills
    for s in (-1, 1):
        for i, off in enumerate((-18, 4, 26)):
            board.ellipse(cx + s * 96, cy - 30 + off, 22, 8, rgba("#E07090"))
    board.ellipse(cx + 110, cy + 40, 28, 14, rgba("#F3B7C8"))  # tail
    face(board, cx, cy - 16, 1.0, happy, iris="#6A3040")


def drizzle(board: Board, happy: bool) -> None:
    cx, cy = 256, 280
    for dx, dy, rx, ry, col in (
        (-50, 10, 58, 42, "#F7FBFF"),
        (48, 16, 62, 46, "#E7F2FB"),
        (0, -20, 70, 50, "#FFFFFF"),
        (10, 24, 80, 40, "#D5E8F6"),
    ):
        board.ellipse(cx + dx, cy + dy, rx, ry, rgba(col))
    for i, x in enumerate((-40, 0, 36)):
        board.ellipse(x + cx, cy + 90 + (i % 2) * 16, 6, 10, rgba("#8EC8F0"))
    face(board, cx, cy - 4, 0.85, happy, iris="#5A7A90")


def bear(board: Board, happy: bool) -> None:
    cx, cy = 256, 304
    blob(board, cx, cy, 112, 108, "#C4846A")
    board.ellipse(cx, cy + 28, 62, 46, rgba("#F0D2BE"))
    ear(board, cx - 78, cy - 90, 32, 32, "#C4846A", "#E7B2A4")
    ear(board, cx + 78, cy - 90, 32, 32, "#C4846A", "#E7B2A4")
    # scarf
    board.ellipse(cx, cy + 48, 80, 16, rgba("#7E9A6A"))
    board.ellipse(cx + 40, cy + 78, 14, 28, rgba("#7E9A6A"))
    board.ellipse(cx - 36, cy + 6, 8, 8, rgba("#C45B6A"))
    face(board, cx, cy - 10, 0.95, happy)


def owlcup(board: Board, happy: bool) -> None:
    cx, cy = 256, 330
    # cup
    board.polygon(
        [(cx - 90, cy - 10), (cx + 90, cy - 10), (cx + 70, cy + 110), (cx - 70, cy + 110)],
        rgba("#F4E7D4"),
    )
    board.ellipse(cx + 108, cy + 30, 22, 14, (0, 0, 0, 0))
    d = board.pen()
    d.arc((cx + 78, cy + 8, cx + 130, cy + 64), 280, 80, fill=rgba("#E2CDB4"), width=8)
    board.ellipse(cx, cy + 108, 74, 16, rgba("#E7D3B8"))
    blob(board, cx, cy - 40, 78, 70, "#C9B4E4")
    ear(board, cx - 48, cy - 108, 16, 28, "#C9B4E4", "#E7D4F4", angle=16)
    ear(board, cx + 48, cy - 108, 16, 28, "#C9B4E4", "#E7D4F4", angle=-16)
    # big owl eyes override a bit
    face(board, cx, cy - 46, 1.15, happy, iris="#3A3058")
    board.polygon([(cx - 10, cy - 10), (cx + 10, cy - 10), (cx, cy + 6)], rgba("#F0A05A"))


def seal(board: Board, happy: bool) -> None:
    cx, cy = 256, 306
    blob(board, cx, cy, 124, 112, "#C5D5DE")
    board.ellipse(cx, cy + 30, 70, 52, rgba("#F4F7F8"))
    board.ellipse(cx - 90, cy + 70, 28, 16, rgba("#A9BCC8"))
    board.ellipse(cx + 90, cy + 70, 28, 16, rgba("#A9BCC8"))
    board.ellipse(cx, cy + 8, 10, 8, rgba("#6A5348"))
    d = board.pen()
    d.line((cx - 20, cy + 6, cx - 52, cy - 2), fill=INK, width=2)
    d.line((cx + 20, cy + 6, cx + 52, cy - 2), fill=INK, width=2)
    face(board, cx, cy - 28, 0.95, happy, iris="#3A4650")


def mallow(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    d = board.pen()
    d.rounded_rectangle((cx - 78, cy - 120, cx + 78, cy + 120), radius=70, fill=rgba("#F7F1E8"), outline=(*dark("#F7F1E8", 0.5), 255), width=8)
    d.rounded_rectangle((cx - 78, cy - 120, cx + 78, cy - 48), radius=40, fill=rgba("#E0A15A"))
    board.ellipse(cx - 40, cy + 90, 16, 12, rgba("#F7F1E8"))
    board.ellipse(cx + 40, cy + 90, 16, 12, rgba("#F7F1E8"))
    face(board, cx, cy + 4, 0.95, happy)


def cloudpaw(board: Board, happy: bool) -> None:
    cx, cy = 256, 306
    for dx, dy, rx, ry in ((-60, 16, 60, 46), (60, 20, 64, 48), (0, -16, 78, 56), (0, 30, 90, 40)):
        board.ellipse(cx + dx, cy + dy, rx, ry, rgba("#F7FBFF"))
    ear(board, cx - 40, cy - 78, 22, 26, "#F7FBFF", "#F6C9D4")
    ear(board, cx + 36, cy - 82, 22, 26, "#F7FBFF", "#F6C9D4")
    board.ellipse(cx + 110, cy + 36, 28, 16, rgba("#E7F1FA"))
    face(board, cx, cy - 8, 0.9, happy, iris="#7A8CA0")


def fox(board: Board, happy: bool) -> None:
    cx, cy = 250, 310
    # flame tail
    board.ellipse(cx + 108, cy + 10, 36, 22, rgba("#F08A3A"))
    board.ellipse(cx + 132, cy - 8, 22, 26, rgba("#F6C14E"))
    board.ellipse(cx + 142, cy - 28, 12, 16, rgba("#FFF1C4"))
    blob(board, cx, cy, 100, 96, "#E8884A")
    board.ellipse(cx, cy + 28, 52, 40, rgba("#F8E2C8"))
    ear(board, cx - 48, cy - 100, 22, 40, "#E8884A", "#F3B7A4", angle=12)
    ear(board, cx + 48, cy - 100, 22, 40, "#E8884A", "#F3B7A4", angle=-12)
    face(board, cx, cy - 8, 0.95, happy)


def moth(board: Board, happy: bool) -> None:
    cx, cy = 256, 300
    # wings
    board.ellipse(cx - 100, cy - 10, 78, 90, rgba("#E7D6F6"))
    board.ellipse(cx + 100, cy - 10, 78, 90, rgba("#E7D6F6"))
    board.ellipse(cx - 108, cy + 50, 58, 50, rgba("#C9B4E4"))
    board.ellipse(cx + 108, cy + 50, 58, 50, rgba("#C9B4E4"))
    board.ellipse(cx - 90, cy - 20, 16, 16, rgba("#F7E7A8"))
    board.ellipse(cx + 90, cy - 20, 16, 16, rgba("#F7E7A8"))
    blob(board, cx, cy + 10, 48, 70, "#F7F1E8")
    d = board.pen()
    d.line((cx - 16, cy - 70, cx - 36, cy - 120), fill=INK, width=3)
    d.line((cx + 16, cy - 70, cx + 36, cy - 120), fill=INK, width=3)
    board.ellipse(cx - 38, cy - 124, 5, 5, rgba("#F2C14E"))
    board.ellipse(cx + 38, cy - 124, 5, 5, rgba("#F2C14E"))
    face(board, cx, cy - 8, 0.72, happy, iris="#5A4878")


def snow(board: Board, happy: bool) -> None:
    cx, cy = 256, 304
    blob(board, cx, cy, 112, 108, "#F4FBFF")
    board.ellipse(cx, cy + 24, 60, 44, rgba("#E7F4FB"))
    ear(board, cx - 64, cy - 96, 24, 26, "#F4FBFF", "#D5EAF6")
    ear(board, cx + 64, cy - 96, 24, 26, "#F4FBFF", "#D5EAF6")
    board.ellipse(cx, cy + 46, 74, 14, rgba("#A9D4F2"))
    star(board, cx, cy - 8, 14, rgba("#9FD0F2"))
    face(board, cx, cy - 24, 0.9, happy, iris="#6A90A8")


def shroom(board: Board, happy: bool) -> None:
    cx, cy = 256, 330
    blob(board, cx, cy + 10, 70, 86, "#F6E7C8")
    board.ellipse(cx, cy - 90, 120, 64, rgba("#E07A62"))
    board.ellipse(cx - 40, cy - 108, 14, 12, rgba("#F7F1E4"))
    board.ellipse(cx + 30, cy - 116, 12, 10, rgba("#F7F1E4"))
    board.ellipse(cx + 48, cy - 80, 10, 9, rgba("#F7F1E4"))
    board.ellipse(cx - 70, cy + 40, 14, 18, rgba("#F6E7C8"))
    board.ellipse(cx + 70, cy + 40, 14, 18, rgba("#F6E7C8"))
    face(board, cx, cy + 6, 0.85, happy)


def pup(board: Board, happy: bool) -> None:
    cx, cy = 256, 308
    blob(board, cx, cy, 108, 104, "#F2C98A")
    board.ellipse(cx, cy + 30, 58, 40, rgba("#FFF6E6"))
    ear(board, cx - 78, cy - 40, 30, 48, "#E7B56A", "#F3C2B0", angle=28)
    ear(board, cx + 78, cy - 40, 30, 48, "#E7B56A", "#F3C2B0", angle=-28)
    star(board, cx, cy - 48, 12, rgba("#F2C14E"))
    face(board, cx, cy - 4, 0.95, happy or True)


def nebby(board: Board, happy: bool) -> None:
    cx, cy = 256, 306
    # tail
    board.ellipse(cx + 120, cy + 40, 46, 22, rgba("#3A2E78"))
    board.ellipse(cx + 156, cy + 24, 18, 14, rgba("#F2C14E"))
    blob(board, cx, cy, 112, 108, "#2A2158")
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    rng = random.Random(7)
    dd = ImageDraw.Draw(layer)
    for _ in range(28):
        x = cx + rng.randint(-90, 90)
        y = cy + rng.randint(-80, 80)
        if ((x - cx) / 100) ** 2 + ((y - cy) / 96) ** 2 > 0.85:
            continue
        rr = rng.choice((2, 2, 3, 4))
        col = rng.choice((rgba("#FFF6D0", 230), rgba("#C9C4F8", 200), rgba("#F2C14E", 220)))
        dd.ellipse((x - rr, y - rr, x + rr, y + rr), fill=col)
    board.clip_ellipse(layer, cx, cy, 104, 100)
    ear(board, cx - 62, cy - 104, 28, 36, "#2A2158", "#F2C14E", angle=12)
    ear(board, cx + 62, cy - 104, 28, 36, "#2A2158", "#F2C14E", angle=-12)
    # crescent
    d = board.pen()
    d.arc((cx - 18, cy + 36, cx + 22, cy + 76), 300, 120, fill=rgba("#F2C14E"), width=4)
    face(board, cx, cy - 12, 1.05, happy, iris="#E2A322")


def dragon(board: Board, happy: bool) -> None:
    cx, cy = 256, 314
    # wings
    board.polygon(
        [(cx - 40, cy - 20), (cx - 150, cy - 70), (cx - 120, cy + 20), (cx - 70, cy + 10)],
        rgba("#F6D58A"),
    )
    board.polygon(
        [(cx + 40, cy - 20), (cx + 150, cy - 80), (cx + 130, cy + 16), (cx + 70, cy + 8)],
        rgba("#F8E2A4"),
    )
    blob(board, cx, cy, 100, 96, "#F2C14E")
    board.ellipse(cx, cy + 28, 52, 40, rgba("#FFF3C4"))
    # horns
    board.polygon([(cx - 36, cy - 90), (cx - 48, cy - 148), (cx - 16, cy - 96)], rgba("#E7A322"))
    board.polygon([(cx + 36, cy - 90), (cx + 52, cy - 150), (cx + 18, cy - 96)], rgba("#E7A322"))
    # scales
    d = board.pen()
    for i in range(3):
        d.arc((cx - 30, cy + 8 + i * 12, cx + 30, cy + 28 + i * 12), 20, 160, fill=rgba("#E0A322"), width=2)
    board.ellipse(cx + 108, cy + 48, 22, 14, rgba("#F2C14E"))
    face(board, cx, cy - 10, 0.95, happy, iris="#6A4020")


DRAW = {
    "mochi": lambda b, h: mochi(b, h),
    "puffin": puffin,
    "corgi": corgi,
    "potato": potato,
    "penguin": penguin,
    "hamster": hamster,
    "frog": frog,
    "otter": otter,
    "yarn": yarn,
    "snorfle": snorfle,
    "mossling": mossling,
    "axolotl": axolotl,
    "drizzle": drizzle,
    "bear": bear,
    "owlcup": owlcup,
    "seal": seal,
    "mallow": mallow,
    "cloudpaw": cloudpaw,
    "fox": fox,
    "moth": moth,
    "snow": snow,
    "shroom": shroom,
    "pup": pup,
    "nebby": nebby,
    "dragon": dragon,
}

CREATURES = [
    ("mochi-bun", "common", "mochi"),
    ("pip-the-puffling", "common", "puffin"),
    ("toastie", "common", "corgi"),
    ("hedgy-spud", "common", "potato"),
    ("waddlebean", "common", "penguin"),
    ("nibbles", "common", "hamster"),
    ("puddle-frog", "common", "frog"),
    ("pancake-the-otter", "common", "otter"),
    ("pom-pom", "common", "yarn"),
    ("snorfle", "rare", "snorfle"),
    ("mossling", "rare", "mossling"),
    ("bubbles-the-axolotl", "rare", "axolotl"),
    ("drizzle", "rare", "drizzle"),
    ("bramble-bear", "rare", "bear"),
    ("teacup-owl", "rare", "owlcup"),
    ("squishmallow-seal", "rare", "seal"),
    ("marsh-mellow", "rare", "mallow"),
    ("cloudpaw", "epic", "cloudpaw"),
    ("fennix", "epic", "fox"),
    ("lumi", "epic", "moth"),
    ("frostfluff", "epic", "snow"),
    ("shroomkin", "epic", "shroom"),
    ("glimmerpup", "epic", "pup"),
    ("nebby", "legendary", "nebby"),
    ("goldie-dragonling", "legendary", "dragon"),
]

MOCHI = [
    ("vanilla", "#F6F1E8", "none"),
    ("strawberry", "#F4B6C8", "none"),
    ("matcha", "#A8C48A", "none"),
    ("taro", "#CDB4E0", "none"),
    ("mango", "#F6D365", "none"),
    ("sky", "#A9D4F5", "none"),
    ("chocolate", "#8A5A3C", "none"),
    ("black-sesame", "#3E3A3A", "specks"),
    ("peach", "#F6C1A8", "none"),
    ("mint", "#B7E4D8", "none"),
    ("lavender", "#C9C4F2", "none"),
    ("caramel", "#E0A15A", "none"),
    ("cotton-candy", "#F7D0E4", "swirl"),
    ("lemon", "#F8EE9A", "none"),
    ("coral", "#F29B90", "none"),
    ("cloudy", "#E4E6EA", "none"),
    ("cookie-dough", "#E6C48A", "chips"),
    ("rainbow", "#F7F1E8", "stripes"),
    ("midnight", "#1C2454", "stars"),
    ("sakura", "#F8D5E0", "petals"),
]


def render_layer(draw_fn, happy: bool) -> Image.Image:
    layer = Board()
    draw_fn(layer, happy)
    return layer.img


def compose(character: Image.Image, pose: int) -> Image.Image:
    board = Board()
    board.ellipse(256, 448, 108, 20, (150, 108, 78, 48), blur=5)
    img = character
    if pose == 2:
        img = img.rotate(12, resample=Image.Resampling.BICUBIC, center=(256, 300))
        moved = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        moved.paste(img, (10, -34), img)
        img = moved
        d = ImageDraw.Draw(board.img)
        d.arc((48, 250, 190, 400), 210, 340, fill=(214, 170, 140, 150), width=7)
        d.arc((28, 290, 160, 430), 220, 330, fill=(214, 170, 140, 90), width=4)
    board.img.alpha_composite(img)
    return board.img


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=84, method=4)


def to_silhouette(img: Image.Image) -> Image.Image:
    solid = Image.new("RGBA", img.size, (186, 158, 136, 255))
    solid.putalpha(img.getchannel("A"))
    return solid


def icon() -> None:
    assets = ROOT / "assets"
    canvas = Image.new("RGBA", (1024, 1024), (251, 246, 238, 255))
    d = ImageDraw.Draw(canvas)
    # gift
    d.rounded_rectangle((250, 430, 774, 860), radius=48, fill=(233, 137, 154, 255))
    d.rounded_rectangle((250, 300, 774, 470), radius=40, fill=(246, 184, 196, 255))
    d.rectangle((470, 300, 554, 860), fill=(247, 236, 214, 255))
    d.rectangle((250, 400, 774, 470), fill=(247, 236, 214, 255))
    d.ellipse((360, 210, 500, 360), fill=(247, 236, 214, 255))
    d.ellipse((524, 210, 664, 360), fill=(247, 236, 214, 255))
    d.ellipse((452, 250, 572, 360), fill=(233, 137, 154, 255))
    canvas.save(assets / "icon.png", "PNG")
    canvas.resize((48, 48), Image.Resampling.LANCZOS).save(assets / "favicon.png", "PNG")
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    ImageDraw.Draw(fg).rounded_rectangle((212, 392, 812, 860), radius=60, fill=(255, 255, 255, 255))
    ImageDraw.Draw(fg).rounded_rectangle((212, 250, 812, 450), radius=48, fill=(255, 255, 255, 255))
    fg.save(assets / "android-icon-foreground.png", "PNG")
    Image.new("RGBA", (1024, 1024), (251, 246, 238, 255)).save(assets / "android-icon-background.png", "PNG")
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    ImageDraw.Draw(mono).rounded_rectangle((250, 430, 774, 860), radius=48, fill=(255, 255, 255, 255))
    ImageDraw.Draw(mono).rounded_rectangle((250, 300, 774, 470), radius=40, fill=(255, 255, 255, 255))
    mono.save(assets / "android-icon-monochrome.png", "PNG")


def main() -> None:
    sil_dir = OUT / "silhouettes"
    for slug, tier, kind in CREATURES:
        fn = DRAW[kind]
        sitting = render_layer(fn, False)
        flying = render_layer(fn, True)
        for pose, layer in ((1, sitting), (2, flying)):
            img = compose(layer, pose)
            path = OUT / tier / f"{slug}-{pose}.webp"
            save(img, path)
            save(to_silhouette(img), sil_dir / f"{slug}-{pose}.webp")
            print(path.relative_to(ROOT))
    for slug, color, pat in MOCHI:
        layer = Board()
        mochi(layer, False, color, pat)
        img = compose(layer.img, 1)
        path = OUT / "mochi-colors" / f"{slug}-mochi.webp"
        save(img, path)
        print(path.relative_to(ROOT))
    # one shared locked shape so color patterns stay a surprise
    vanilla = Image.open(OUT / "mochi-colors" / "vanilla-mochi.webp")
    save(to_silhouette(vanilla), sil_dir / "mochi.webp")
    icon()
    print("done", len(CREATURES) * 2, "poses +", len(MOCHI), "colors")


if __name__ == "__main__":
    main()
