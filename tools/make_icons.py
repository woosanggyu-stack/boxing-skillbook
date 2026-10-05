"""앱 아이콘 생성: icon.svg와 같은 모양(빨간 바탕 + 흰 글러브)을 PIL로 그려 PNG로 저장.
실행: python tools/make_icons.py"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RED, DARK, WHITE = (179, 38, 30), (122, 23, 18), (255, 255, 255)
SS = 4  # 4배로 그린 뒤 줄여서 가장자리를 부드럽게


def bezier(p0, p1, p2, n=40):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1])
            for t in (i / n for i in range(n + 1))]


def draw_icon(size, maskable=False):
    big = size * SS
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    s = big / 512
    if maskable:
        d.rectangle([0, 0, big, big], fill=RED)
        k, off = 0.8, 512 * 0.1  # 마스크 안전 영역 안에 들어오게 줄임
    else:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=112 * s, fill=RED)
        k, off = 1.0, 0

    def P(x, y):
        return ((x * k + off) * s, (y * k + off) * s)

    def R(x0, y0, x1, y1):
        return [*P(x0, y0), *P(x1, y1)]

    w = lambda v: max(1, round(v * k * s))
    d.rounded_rectangle(R(180, 330, 360, 426), radius=20 * k * s, fill=WHITE)          # 손목 커프
    d.rectangle(R(180, 362, 360, 384), fill=DARK)                                     # 커프 띠
    d.rounded_rectangle(R(150, 96, 380, 346), radius=110 * k * s, fill=WHITE)         # 주먹
    d.ellipse(R(110, 195, 220, 345), fill=WHITE)                                      # 엄지
    d.line([P(*q) for q in bezier((212, 218), (188, 280), (222, 332))], fill=RED, width=w(12), joint="curve")
    d.line([P(180, 340), P(360, 340)], fill=RED, width=w(10))
    return img.resize((size, size), Image.LANCZOS)


for name, size, mask in [("icon-180.png", 180, False), ("icon-192.png", 192, False),
                         ("icon-512.png", 512, False), ("icon-maskable-512.png", 512, True)]:
    draw_icon(size, mask).save(os.path.join(ROOT, name))
    print("saved", name)
