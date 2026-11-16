// Word reveal adapted from flower-garden/src/gift-experience.js (eN).
// Same 50ms stagger, 400ms blur/rise, and word-count paragraph timing.
(() => {
  const readers = new WeakMap();
  window.GiftLetterParagraphs = {
    start(container, text, options = {}) {
      readers.get(container)?.cancel();
      options.cursor?.remove();
      container.replaceChildren();
      container.classList.remove('typing-complete');
      const scroll = container.closest('.letter-scroll') || container;
      scroll.scrollTop = 0;
      const animations = new Set(), timers = new Set();
      let cancelled = false, completed = false, at = options.reduced ? 0 : 1800;
      const schedule = (fn, delay) => {
        const id = setTimeout(() => { timers.delete(id); if (!cancelled) fn(); }, delay);
        timers.add(id);
      };
      const clear = () => { timers.forEach(clearTimeout); timers.clear(); };
      function done() {
        if (cancelled || completed || readers.get(container) !== controller) return;
        completed = true; readers.delete(container);
        container.classList.add('typing-complete');
        options.onComplete?.();
      }
      const controller = {
        finish() {
          if (cancelled || completed) return;
          clear();
          for (const animation of animations) animation.finish();
          schedule(done, 0);
        },
        cancel() {
          cancelled = true; clear();
          for (const animation of animations) animation.cancel();
          animations.clear();
          if (readers.get(container) === controller) readers.delete(container);
        }
      };
      readers.set(container, controller);
      const paragraphs = String(text ?? '').replace(/\r\n?/g, '\n')
        .split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
      for (const value of paragraphs) {
        const paragraph = document.createElement('p');
        paragraph.className = 'letter-paragraph';
        const words = value.split(/\s+/);
        words.forEach((word, index) => {
          const span = document.createElement('span');
          span.className = 'letter-word'; span.textContent = word + (index < words.length - 1 ? ' ' : '');
          paragraph.appendChild(span);
          if (!options.reduced && span.animate) {
            const animation = span.animate([
              { opacity: 0, transform: 'translateY(4px)', filter: 'blur(3px)' },
              { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' }
            ], { duration: 400, delay: at + index * 50, easing: 'ease-out', fill: 'both' });
            animations.add(animation);
            animation.finished.then(() => { animations.delete(animation); animation.cancel(); }, () => animations.delete(animation));
          }
        });
        container.appendChild(paragraph);
        schedule(() => {
          const top = paragraph.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
          const bottom = top + paragraph.offsetHeight + 24;
          if (bottom > scroll.scrollTop + scroll.clientHeight) scroll.scrollTo({
            top: Math.max(0, Math.min(bottom - scroll.clientHeight, top - 16)),
            behavior: options.reduced ? 'auto' : 'smooth'
          });
        }, options.reduced ? 0 : at);
        if (!options.reduced) at += words.length * 50 + 500;
      }
      schedule(done, options.reduced ? 0 : at + 200);
      return controller;
    }
  };
})();
