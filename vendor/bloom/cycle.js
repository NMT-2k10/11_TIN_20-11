// Keep the reference palette at the start, then play one complete colour cycle.
(() => {
  const COLOUR_CYCLE_MS = 6000;
  const ENTRANCE_MS = 800;
  const CUES = [
    { at: 800, stage: 'bloom' }, { at: 1800, stage: 'spiral' },
    { at: 2900, stage: 'halo' }, { at: 3900, stage: 'heart' },
    { at: 5100, stage: 'finale' }
  ];
  window.BloomCycle = {
    stage: 'bloom',
    start(setHue, burst = () => {}) {
      let frame = 0, cancelled = false, elapsed = 0, previous = null, complete = false, nextBurst = 0;
      const sendComplete = () => {
        if (complete || cancelled) return;
        complete = true;
        parent.postMessage({ type: 'bloom-cycle-complete' }, location.origin);
      };
      const tick = now => {
        if (cancelled) return;
        if (document.hidden) { previous = null; frame = requestAnimationFrame(tick); return; }
        if (previous !== null) elapsed += Math.min(64, Math.max(0, now - previous));
        previous = now;
        const progress = Math.max(0, Math.min(1, (elapsed - ENTRANCE_MS) / COLOUR_CYCLE_MS));
        const hue = progress * 360;
        document.documentElement.style.setProperty('--bloom-hue', `${hue}deg`);
        window.BloomShow?.setHue(hue);
        if (nextBurst < CUES.length && elapsed >= CUES[nextBurst].at) {
          window.BloomCycle.stage = CUES[nextBurst].stage;
          parent.postMessage({ type: 'bloom-stage', stage: CUES[nextBurst].stage }, location.origin);
          burst();
          nextBurst++;
        }
        if (progress >= 1) { setHue(360); sendComplete(); return; }
        frame = requestAnimationFrame(tick);
      };
      setHue(0);
      // Wait for the locally stored flower layers before starting the colour clock.
      frame = requestAnimationFrame(() => {
        const images = [...document.querySelectorAll('#root img')];
        const ready = Promise.all(images.map(image => image.decode ? image.decode().catch(() => {}) : Promise.resolve()));
        let timeout;
        Promise.race([ready, new Promise(resolve => { timeout = setTimeout(resolve, 5000); })]).then(() => {
          clearTimeout(timeout);
          if (!cancelled) frame = requestAnimationFrame(tick);
        });
      });
      return () => { cancelled = true; cancelAnimationFrame(frame); };
    }
  };
})();
