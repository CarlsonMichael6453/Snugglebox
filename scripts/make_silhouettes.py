#!/usr/bin/env python3
"""Build dex silhouettes from the real creature webps.

The pack art sits on a peach studio backdrop. Locked entries keep the creature
shape and drop that backdrop. Near-white fur is left in the shape.
"""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets" / "creatures"
SIL = ROOT / "silhouettes"
TINT = (186, 158, 136, 255)


def is_backdrop(r: int, g: int, b: int) -> bool:
    if min(r, g, b) > 215 and (max(r, g, b) - min(r, g, b)) < 40:
        return False
    if r < 215 or g < 180 or b < 150:
        return False
    if r - g < 12:
        return False
    return 28 <= (r - b) <= 90


def knock_out(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    seen = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def push(x: int, y: int) -> None:
        index = y * width + x
        if seen[index]:
            return
        red, green, blue, _alpha = pixels[x, y]
        if not is_backdrop(red, green, blue):
            return
        seen[index] = 1
        queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)
    for y in range(height):
        push(0, y)
        push(width - 1, y)
    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                push(nx, ny)
    return image


def main() -> None:
    SIL.mkdir(exist_ok=True)
    for path in sorted(ROOT.rglob("*.webp")):
        if "silhouettes" in path.parts:
            continue
        cut = knock_out(Image.open(path))
        solid = Image.new("RGBA", cut.size, TINT)
        solid.putalpha(cut.getchannel("A"))
        if path.parent.name == "mochi-colors":
            if path.name == "vanilla-mochi.webp":
                solid.save(SIL / "mochi.webp", "WEBP", quality=82, method=4)
            continue
        solid.save(SIL / path.name, "WEBP", quality=82, method=4)
        print(path.name)


if __name__ == "__main__":
    main()
