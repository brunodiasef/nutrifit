"""Corta a logo original (marca/nutrifit-logo.png) em camadas para a animação de abertura.
As camadas são recortes da própria imagem: empilhadas na posição original, refazem a logo
pixel a pixel. Gera a versão grande (vídeo) e a reduzida (app)."""
import numpy as np, os, json
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = np.array(Image.open(f'{RAIZ}/marca/nutrifit-logo.png').convert('RGBA'))
H, W = im.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]

CORTE_TEXTO = 858                      # abaixo disto: BRUNO PERSONAL, NUTRIFIT, DIETA & NUTRIÇÃO
emblema = yy < CORTE_TEXTO

# halter = discos (elipse do disco de dentro + discos de fora) + trechos visíveis da barra
def elipse(cx, cy, rx, ry): return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
disco_esq = ((xx <= 484) & (yy >= 574) | elipse(430, 708, 62, 146) & (yy >= 574)) & emblema
disco_dir = ((xx >= 1042) & (yy >= 562) | elipse(1100, 706, 62, 146) & (yy >= 566)) & emblema
barra = ((xx >= 420) & (xx <= 675) & (yy >= 668) & (yy <= 735)) | ((xx >= 420) & (xx <= 482) & (yy > 735) & (yy <= 760)) \
      | ((xx >= 856) & (xx <= 1080) & (yy >= 668) & (yy <= 752))
halter = (disco_esq | disco_dir) & emblema   # a barra é desenhada na animação
letras = emblema & ~halter

def camada(mascara, preenche=None):
    out = np.zeros_like(im); out[mascara] = im[mascara]
    if preenche is not None:            # buracos que a barra deixa nas letras: fundo preto da arte
        out[preenche] = [0, 0, 0, 255]
    return out

# preto só onde a barra passava por dentro das letras (miolo do B e sombra do P)
dentro = barra & emblema & (((xx >= 492) & (xx <= 668)) | ((xx >= 856) & (xx <= 1040)))
L = camada(letras, dentro)
D = camada(halter)
T = camada(~emblema)

def caixa(a):
    ys, xs = np.nonzero(a[..., 3]); return [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]

# mapa de deformação (feDisplacementMap): "barriga" nos arcos do B e do P
def mapa(box, escala_max):
    x0, y0, x1, y1 = box
    gy, gx = np.mgrid[y0:y1, x0:x1].astype(float)
    dx = np.zeros_like(gx); dy = np.zeros_like(gy)
    for cx, cy, R, peso in [(578, 418, 230, 0.9), (604, 652, 270, 1.0), (940, 428, 270, 0.95), (770, 640, 170, 0.5)]:
        r = np.hypot(gx - cx, gy - cy) / R
        g = np.where(r < 1, (1 - r ** 2) ** 2, 0) * peso
        dx += -(gx - cx) * g * 0.55; dy += -(gy - cy) * g * 0.55   # amostra mais perto do centro = incha
    R_ = np.clip(0.5 + dx / escala_max, 0, 1); G_ = np.clip(0.5 + dy / escala_max, 0, 1)
    m = np.stack([R_ * 255, G_ * 255, np.full_like(R_, 128), np.full_like(R_, 255)], -1).astype(np.uint8)
    return Image.fromarray(m).filter(ImageFilter.GaussianBlur(2))

meta = {'logo': [W, H]}
for nome, a in [('letras', L), ('halter', D), ('textos', T)]:
    meta[nome] = caixa(a)

ESC_MAPA = 260   # deslocamento máximo representável (px na escala original)
for sufixo, k in [('', 1.0), ('-app', 0.5)]:
    pasta = f'{RAIZ}/video/public/camadas' if sufixo == '' else f'{RAIZ}/abertura'
    os.makedirs(pasta, exist_ok=True)
    for nome, a in [('letras', L), ('halter', D), ('textos', T)]:
        x0, y0, x1, y1 = meta[nome]
        img = Image.fromarray(a[y0:y1, x0:x1])
        if k != 1: img = img.resize((round((x1 - x0) * k), round((y1 - y0) * k)), Image.LANCZOS)
        if sufixo: img.save(f'{pasta}/{nome}.webp', quality=88, method=6)   # app: WebP leve
        else: img.save(f'{pasta}/{nome}.png', optimize=True)
    mp = mapa(meta['letras'], ESC_MAPA)
    mp = mp.resize((mp.width // 2, mp.height // 2), Image.BILINEAR)   # mapa suave: meia resolução basta
    mp.save(f'{pasta}/mapa.png', optimize=True)   # o mapa precisa ser exato (sem compressão com perda)
    orig = Image.open(f'{RAIZ}/marca/nutrifit-logo.png')
    if k != 1: orig = orig.resize((round(W * k), round(H * k)), Image.LANCZOS)
    if sufixo: orig.save(f'{pasta}/logo.webp', quality=92, method=6)
    else: orig.save(f'{pasta}/logo.png', optimize=True)
meta['escalaMapa'] = ESC_MAPA
json.dump(meta, open(f'{RAIZ}/abertura/camadas.json', 'w'))

# conferência: as camadas empilhadas refazem a logo?
print('camadas:', meta)
