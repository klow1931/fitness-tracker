"""Repackage the existing Loadnote icon into platform assets; no new artwork."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'icon-512.png').convert('RGBA')

def icon(size, opaque=True, inset=False):
    canvas = Image.new('RGBA', (size, size), '#4f46e5' if opaque else (0, 0, 0, 0))
    edge = round(size * .62) if inset else size
    mark = source.resize((edge, edge), Image.Resampling.LANCZOS)
    canvas.alpha_composite(mark, ((size-edge)//2, (size-edge)//2))
    return canvas.convert('RGB') if opaque else canvas

for path in (root / 'android/app/src/main/res').glob('mipmap-*/*.png'):
    size = Image.open(path).width
    icon(size, opaque=path.stem!='ic_launcher_foreground', inset=path.stem=='ic_launcher_foreground').save(path)
icon(1024).save(root / 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
paths = list((root / 'android/app/src/main/res').glob('drawable*/splash.png'))
paths += list((root / 'ios/App/App/Assets.xcassets/Splash.imageset').glob('*.png'))
for path in paths:
    width, height = Image.open(path).size
    canvas = Image.new('RGB', (width, height), '#f8fafc')
    size = max(48, min(width, height)//5)
    canvas.paste(icon(size), ((width-size)//2, (height-size)//2))
    canvas.save(path)
print('Rebuilt native icons and launch images from icon-512.png')
