"""Reproducible CPU PSF comparison; no post-blur is applied to the PSFs."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from dataclasses import replace
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from optics.core import Settings, make_psf


def main():
    settings = Settings(focus_m=.5, source_m=5, iris_mm=8.55,
                        soften_internal_cutoff=False, iris_softness=0)
    cases = [settings, replace(settings, soften_internal_cutoff=True),
             replace(settings, soften_internal_cutoff=True, iris_softness=.1)]
    canvas = Image.new('RGB', (960, 750), '#111813')
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 18)
    small = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 14)
    draw.text((20, 15), 'Bordas do bokeh · traçado CPU', font=font, fill='#e0ece3')
    for i, title in enumerate(['Recortes desligados', 'Recortes suavizados', 'Suavizados + íris 0,10']):
        draw.text((20+i*320, 50), title, font=font, fill='#b9efc8')
    for row, field in enumerate([(0, 0), (14, 0)]):
        data = [make_psf(field, 5, s, 1600, 32768)[0] for s in cases]
        peak = max(float(psf.max()) for psf in data)
        for col, psf in enumerate(data):
            # Same intensity scale and pixel scale for all panels in the row.
            rgb = np.uint8(np.clip(psf/peak, 0, 1)**.6*255)
            image = Image.fromarray(rgb).resize((280, 280), Image.Resampling.NEAREST)
            canvas.paste(image, (20+col*320, 90+row*310))
        draw.text((20, 375+row*310), 'Centro' if row == 0 else 'Campo 14 mm · clipping fora do eixo', font=small, fill='#aebfb1')
    draw.text((20, 720), 'Mesma escala por linha; PSF normalizada; visualização de intensidade com expoente 0,6. Não é a prévia GPU.', font=small, fill='#aebfb1')
    output = Path(__file__).resolve().parents[2]/'Bokeh-Bordas-0.7.4.png'
    canvas.save(output)
    print(output)


if __name__ == '__main__':
    main()
