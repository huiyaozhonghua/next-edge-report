#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate the Pi Ecosystem listing icon for "Next Edge Report".

Design (pure Python stdlib, no Pillow):
  - Full-bleed diagonal gradient background (teal -> indigo). NO transparency,
    NO rounded cut-out: Pi requires the canvas to be fully filled.
  - One bold amber 45-degree rising arrow (war room / progress / crossing the edge).
  - One bold white horizontal baseline bar it rises from (the "edge").
  - Everything inside the central ~80% safe area; readable at 48 px.

Avoids Pi Network's official blue/white branding and the Greek letter pi.
"""
import struct, zlib, math, os

S = 2                      # supersampling factor
W = H = 1024               # final output size
AW = AH = W * S            # render size

OUT = "G:/WORKBUDDY/2026-11-20-09-48-20/pi-next-app/listing-assets/logo-1024.png"

TEAL = (13, 148, 136)      # #0D9488
INDIGO = (55, 71, 181)     # #374BB5
AMBER = (245, 158, 11)     # #F59E0B
WHITE = (255, 255, 255)

buf = bytearray(AW * AH * 3)


def setpx(x, y, rgb):
    if 0 <= x < AW and 0 <= y < AH:
        i = (y * AW + x) * 3
        buf[i], buf[i + 1], buf[i + 2] = rgb


def lerp(a, b, t):
    return (int(a[0] + (b[0] - a[0]) * t),
            int(a[1] + (b[1] - a[1]) * t),
            int(a[2] + (b[2] - a[2]) * t))


def point_in_poly(x, y, pts):
    n = len(pts)
    c = False
    j = n - 1
    for i in range(n):
        xi, yi = pts[i]
        xj, yj = pts[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            c = not c
        j = i
    return c


def rounded_mask(cx, cy, hw, hh, r):
    """Correct rounded-rect test (SDF). Returns True when the point is inside."""
    def inside(x, y):
        qx = abs(x - cx) - (hw - r)
        qy = abs(y - cy) - (hh - r)
        if qx <= 0 and qy <= 0:
            return True
        ox = qx if qx > 0 else 0.0
        oy = qy if qy > 0 else 0.0
        return ox * ox + oy * oy <= r * r
    return inside


# ---------------- background: full-bleed diagonal gradient ----------------
for y in range(AH):
    ty = y / (AH - 1)
    for x in range(AW):
        t = (x / (AW - 1) + ty) / 2.0
        r, g, b = lerp(TEAL, INDIGO, t)
        i = (y * AW + x) * 3
        buf[i], buf[i + 1], buf[i + 2] = r, g, b

# ---------------- geometry (in 1024 space, scaled by S) ----------------
R = math.sqrt(0.5)
d = (R, -R)                # arrow direction (up-right)
p = (R, R)                 # perpendicular

T = (250, 780)             # tail center
A = (800, 230)             # apex
HL = 250                   # head length
B = (A[0] - HL * d[0], A[1] - HL * d[1])
HW = 45                    # shaft half width
HHW = 155                  # head half width (barb span)

P1 = (T[0] + HW * p[0], T[1] + HW * p[1])
P2 = (B[0] + HW * p[0], B[1] + HW * p[1])
P3 = (B[0] + HHW * p[0], B[1] + HHW * p[1])
P5 = (B[0] - HHW * p[0], B[1] - HHW * p[1])
P6 = (B[0] - HW * p[0], B[1] - HW * p[1])
P7 = (T[0] - HW * p[0], T[1] - HW * p[1])
ARROW = [P1, P2, P3, A, P5, P6, P7]

BASE = rounded_mask(512, 842, 296, 30, 30)   # white baseline bar ("the edge")

# ---------------- draw ----------------
# 1) white baseline bar first (the "edge"), fully inside the safe area
for y in range(int(780 * S), int(900 * S)):
    for x in range(int(180 * S), int(850 * S)):
        if BASE(x / S, y / S):
            setpx(x, y, WHITE)

# 2) amber arrow on top
for y in range(int(190 * S), int(840 * S)):
    for x in range(int(190 * S), int(840 * S)):
        if point_in_poly(x / S, y / S, ARROW):
            setpx(x, y, AMBER)

# ---------------- downsample (box filter) to 1024 ----------------
out = bytearray(W * H * 3)
n = S * S
for y in range(H):
    for x in range(W):
        rs = gs = bs = 0
        for dy in range(S):
            row = (y * S + dy) * AW
            for dx in range(S):
                i = (row + x * S + dx) * 3
                rs += buf[i]
                gs += buf[i + 1]
                bs += buf[i + 2]
        o = (y * W + x) * 3
        out[o] = rs // n
        out[o + 1] = gs // n
        out[o + 2] = bs // n


def chunk(tag, data):
    c = struct.pack(">I", len(data)) + tag + data
    return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


raw = bytearray()
for y in range(H):
    raw.append(0)
    raw += out[y * W * 3:(y + 1) * W * 3]

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "wb") as f:
    f.write(png)
print("WROTE", OUT, len(png), "bytes")
