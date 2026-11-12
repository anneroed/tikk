#!/usr/bin/env python3
"""Tegner app-ikonene (en klokke med lime ring og to visere) uten eksterne avhengigheter.

Kjør fra prosjektroten: python3 tools/make_icons.py
"""
import math
import struct
import zlib
from pathlib import Path

BACKGROUND = (10, 12, 16)
FACE = (21, 24, 30)
RING = (200, 245, 96)
HOUR = (255, 181, 71)
MINUTE = (98, 214, 255)
CAP = (242, 244, 247)


def capsule(px, py, x1, y1, x2, y2, radius):
    dx, dy = x2 - x1, y2 - y1
    length_squared = dx * dx + dy * dy
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / length_squared))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)) - radius


def hand(angle, length, width, tail=0.04):
    radians = math.radians(angle)
    sx, sy = math.sin(radians), -math.cos(radians)
    return lambda x, y: capsule(x, y, 0.5 - sx * tail, 0.5 - sy * tail, 0.5 + sx * length, 0.5 + sy * length, width)


# Lag i tegnerekkefølge: (avstandsfunksjon, farge). Klokka viser 10:10.
LAYERS = [
    (lambda x, y: math.hypot(x - 0.5, y - 0.5) - 0.34, FACE),
    (lambda x, y: abs(math.hypot(x - 0.5, y - 0.5) - 0.34) - 0.028, RING),
    (hand(305, 0.17, 0.034), HOUR),
    (hand(60, 0.25, 0.024), MINUTE),
    (lambda x, y: math.hypot(x - 0.5, y - 0.5) - 0.032, CAP),
]


def render(size, scale):
    """scale < 1 krymper figuren mot midten, slik maskable-ikoner krever."""
    rows = []
    for row in range(size):
        line = bytearray([0])
        for column in range(size):
            x = 0.5 + ((column + 0.5) / size - 0.5) / scale
            y = 0.5 + ((row + 0.5) / size - 0.5) / scale
            color = BACKGROUND
            for distance, layer_color in LAYERS:
                coverage = max(0.0, min(1.0, 0.5 - distance(x, y) * size * scale))
                if coverage:
                    color = tuple(c + (l - c) * coverage for c, l in zip(color, layer_color))
            line.extend(round(c) for c in color)
        rows.append(bytes(line))
    return b"".join(rows)


def write_png(path, size, raw):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    )


if __name__ == "__main__":
    icons = Path(__file__).resolve().parent.parent / "icons"
    for name, size, scale in [
        ("icon-180.png", 180, 1.25),
        ("icon-192.png", 192, 1.25),
        ("icon-512.png", 512, 1.25),
        ("icon-maskable-512.png", 512, 1.0),
    ]:
        write_png(icons / name, size, render(size, scale))
        print("skrev", name)
