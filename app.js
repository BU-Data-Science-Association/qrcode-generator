let qrInstance = null;
let logoDataURL = null;
let currentSize = 300;

// ── Size buttons ──────────────────────────────────────────────────────────────
document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSize = parseInt(btn.dataset.size);
    });
});

// ── Color pickers ─────────────────────────────────────────────────────────────
document.getElementById('color-dark').addEventListener('input', function () {
    document.getElementById('hex-dark').textContent = this.value;
});
document.getElementById('color-light').addEventListener('input', function () {
    document.getElementById('hex-light').textContent = this.value;
});

// ── Logo upload ───────────────────────────────────────────────────────────────
document.getElementById('logo-upload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        logoDataURL = ev.target.result;
        const prev = document.getElementById('logo-preview');
        prev.src = logoDataURL;
        prev.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// ── Generate ──────────────────────────────────────────────────────────────────
document.getElementById('btn-generate').addEventListener('click', generate);
document.getElementById('qr-content').addEventListener('keydown', e => {
    if (e.key === 'Enter') generate();
});

function generate() {
    const content = document.getElementById('qr-content').value.trim();
    if (!content) {
        const input = document.getElementById('qr-content');
        input.focus();
        input.style.borderColor = 'var(--accent)';
        setTimeout(() => input.style.borderColor = '', 1000);
        return;
    }

    const darkColor = document.getElementById('color-dark').value;
    const lightColor = document.getElementById('color-light').value;
    const caption = document.getElementById('qr-caption').value.trim();

    const output = document.getElementById('qr-output');
    output.innerHTML = '';

    qrInstance = new QRCode(output, {
        text: content,
        width: currentSize,
        height: currentSize,
        colorDark: darkColor,
        colorLight: lightColor,
        correctLevel: QRCode.CorrectLevel.H    // high error correction for logo overlay
    });

    // Logo overlay
    const overlay = document.getElementById('qr-logo-overlay');
    const logoImg = document.getElementById('qr-logo-img');
    if (logoDataURL) {
        const logoSize = Math.round(currentSize * 0.22);
        logoImg.src = logoDataURL;
        logoImg.style.width = logoSize + 'px';
        logoImg.style.height = logoSize + 'px';
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }

    // Caption
    document.getElementById('qr-caption-display').textContent = caption;

    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('qr-wrapper').style.display = 'flex';
}

// ── PNG Download ──────────────────────────────────────────────────────────────
document.getElementById('btn-png').addEventListener('click', () => {
    const container = document.getElementById('qr-canvas-container');
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    const caption = document.getElementById('qr-caption').value.trim();
    const padding = 20;
    const captionHeight = caption ? 36 : 0;

    const out = document.createElement('canvas');
    out.width = canvas.width + padding * 2;
    out.height = canvas.height + padding * 2 + captionHeight;
    const ctx = out.getContext('2d');

    // Background
    ctx.fillStyle = document.getElementById('color-light').value;
    ctx.fillRect(0, 0, out.width, out.height);

    // QR code
    ctx.drawImage(canvas, padding, padding);

    // Logo overlay
    const overlay = document.getElementById('qr-logo-overlay');
    if (overlay.style.display !== 'none') {
        const logoImg = document.getElementById('qr-logo-img');
        const logoSize = Math.round(canvas.width * 0.22);
        const lx = (out.width - logoSize) / 2;
        const ly = padding + (canvas.height - logoSize) / 2;
        ctx.fillStyle = 'white';
        ctx.fillRect(lx - 4, ly - 4, logoSize + 8, logoSize + 8);
        ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
    }

    // Caption text
    if (caption) {
        ctx.fillStyle = document.getElementById('color-dark').value;
        ctx.font = '500 14px DM Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(caption, out.width / 2, out.height - 10);
    }

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = out.toDataURL('image/png');
    link.click();
});

// ── SVG Download ──────────────────────────────────────────────────────────────
document.getElementById('btn-svg').addEventListener('click', () => {
    const container = document.getElementById('qr-output');
    const img = container.querySelector('img');
    const canvas = container.querySelector('canvas');

    const darkColor = document.getElementById('color-dark').value;
    const lightColor = document.getElementById('color-light').value;
    const caption = document.getElementById('qr-caption').value.trim();
    const size = currentSize;

    // Embed QR canvas as a base64 image inside SVG
    const src = canvas ? canvas.toDataURL() : (img ? img.src : '');
    const captionTag = caption
        ? `<text x="${size / 2 + 20}" y="${size + 50}" text-anchor="middle" font-family="monospace" font-size="14" fill="${darkColor}">${caption}</text>`
        : '';
    const totalH = size + 40 + (caption ? 36 : 0);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size + 40}" height="${totalH}">
    <rect width="${size + 40}" height="${totalH}" fill="${lightColor}"/>
    <image x="20" y="20" width="${size}" height="${size}" xlink:href="${src}"/>
    ${captionTag}
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'qrcode.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
});