if(window.parent!==window)document.querySelector('.galaxy-actions').hidden=true;
document.getElementById('galaxy-back').addEventListener('click', () => {
  if (window.parent !== window) window.parent.postMessage({type: 'teachers-day:close-galaxy'}, window.location.origin);
  else window.location.assign('../../?scene=memories');
});
try {
  await import('./scene.js');
} catch (error) {
  console.error('Galaxy could not start:', error);
  document.getElementById('galaxy-loading').textContent = 'Kỷ niệm bên thầy cô';
  const grid = document.createElement('div');
  grid.className = 'galaxy-fallback';
  const gift = window.parent.GIFT_CONFIG || {};
  const root = new URL('../../',location.href);
  const photos = gift.galaxy?.photos || gift.photos || [{src:'assets/images/class-1.jpg'}];
  // Keep photos accessible even on a device without a working WebGL context.
  for (const photo of photos) {
    const link = document.createElement('a');
    link.href = new URL(typeof photo === 'string' ? photo : photo.src,root).href;
    link.target = '_blank'; link.rel = 'noopener';
    const image = document.createElement('img');
    image.src = link.href; image.alt = 'Ảnh kỷ niệm';
    link.append(image); grid.append(link);
  }
  document.body.append(grid);
  document.querySelector('.galaxy-bottom-actions').hidden = true;
}
