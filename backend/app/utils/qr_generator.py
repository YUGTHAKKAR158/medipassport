import qrcode
import base64
from io import BytesIO

def generate_qr(url):
    img = qrcode.make(url)
    buf = BytesIO()
    img.save(buf, format='PNG')
    return base64.b64encode(buf.getvalue()).decode()