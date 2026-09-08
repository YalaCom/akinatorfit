from pathlib import Path
from PIL import Image
import numpy as np
import cv2

root = Path(__file__).resolve().parent.parent / 'assets'
for name in ('confused', 'thinking', 'solved'):
    path = root / (name + '.webp')
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    distance = 255 - src.min(axis=2)
    alpha = np.clip((distance - 7) / 42, 0, 1)
    sure = (distance > 55).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(sure, 8)
    if count > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        core = (labels == largest).astype(np.uint8)
        core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        filled = cv2.floodFill(core.copy(), np.zeros((core.shape[0]+2, core.shape[1]+2), np.uint8), (0, 0), 2)[1]
        alpha = np.maximum(alpha, (filled == 0).astype(np.uint8))
    alpha = cv2.GaussianBlur(alpha, (3, 3), .45)
    a = np.maximum(alpha[..., None], .001)
    rgb = np.clip((src - (1-a)*255) / a, 0, 255)
    rgba = np.dstack([rgb, np.round(alpha*255)]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bbox = im.getbbox()
    if bbox:
        l,t,r,b = bbox
        im = im.crop((max(0,l-3),max(0,t-3),min(im.width,r+3),min(im.height,b+3)))
    im.save(path, format='WEBP', lossless=True)
    im.save(root / (name + '.png'))
    assert im.getchannel('A').getextrema() == (0,255)
    print(name, im.size)
