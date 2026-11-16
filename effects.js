/* Các hiệu ứng được triển khai bằng Canvas 2D và SVG, không cần thư viện/CDN. */
(() => {
  'use strict';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fitCanvas(canvas) {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(bounds.width * dpr));
    canvas.height = Math.max(1, Math.round(bounds.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: bounds.width, height: bounds.height, dpr };
  }

  async function collage(canvas, photos) {
    const images = await Promise.all(photos.map(photo => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = photo.src;
    })));
    const valid = images.filter(Boolean);
    if (!valid.length || canvas.closest('[hidden]')) return;
    const { ctx, width, height } = fitCanvas(canvas);
    if (!width || !height) return;
    const fontSize = Math.min(height * 1.05, width / 2.85);
    ctx.font = `900 ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a75b72';
    ctx.fillText('20/11', width / 2, height / 2 + fontSize * .07);
    ctx.globalCompositeOperation = 'source-in';
    const mosaic = document.createElement('canvas');
    mosaic.width = canvas.width; mosaic.height = canvas.height;
    const m = mosaic.getContext('2d');
    const tile = Math.max(40, canvas.height / 2.6);
    let index = 0;
    for (let y = 0; y < mosaic.height; y += tile) {
      for (let x = 0; x < mosaic.width; x += tile) {
        const img = valid[index++ % valid.length];
        const side = Math.min(img.width, img.height);
        m.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, x, y, tile, tile);
        m.strokeStyle = '#fff1d9'; m.lineWidth = 2; m.strokeRect(x, y, tile, tile);
      }
    }
    ctx.drawImage(mosaic, 0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fff4e3'; ctx.lineWidth = 1.3;
    ctx.strokeText('20/11', width / 2, height / 2 + fontSize * .07);
    canvas.parentElement.classList.add('loaded');
  }

  window.GiftEffects = { collage, reducedMotion };
})();
