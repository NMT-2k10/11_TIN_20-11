// Five different movements, composed as a short tribute rather than repeated bursts.
(() => {
  const TAU = Math.PI * 2;
  const random = (a, b) => a + Math.random() * (b - a);
  let activeRenderer = null;
  window.BloomShow = {
    setHue(value) { activeRenderer?.setHue(value); },
    create(canvas, petalUrls, originRef) {
      const ctx = canvas.getContext('2d');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const images = petalUrls.map(url => { const image = new Image(); image.src = url; return image; });
      const sprites = new Map(), stars = new Map();
      function petalSprite(image, tint = hue) {
        if (!image?.complete || !image.naturalWidth) return null;
        const shade = Math.round(tint / 10) * 10 % 360;
        const key = `${images.indexOf(image)}:${shade}`;
        if (sprites.has(key)) return sprites.get(key);
        const sprite = document.createElement('canvas');
        const scale = 128 / Math.max(image.naturalWidth, image.naturalHeight);
        sprite.width = Math.max(1, Math.round(image.naturalWidth * scale));
        sprite.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const paint = sprite.getContext('2d');
        paint.filter = `hue-rotate(${shade}deg)`;
        paint.drawImage(image, 0, 0, sprite.width, sprite.height);
        sprites.set(key, sprite); return sprite;
      }
      function starSprite(color) {
        if (stars.has(color)) return stars.get(color);
        const sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
        const paint = sprite.getContext('2d'); paint.translate(32, 32);
        paint.fillStyle = color; paint.shadowColor = color; paint.shadowBlur = 12;
        paint.beginPath(); paint.moveTo(0,-10); paint.quadraticCurveTo(2,-2,10,0);
        paint.quadraticCurveTo(2,2,0,10); paint.quadraticCurveTo(-2,2,-10,0);
        paint.quadraticCurveTo(-2,-2,0,-10); paint.fill(); stars.set(color,sprite); return sprite;
      }
      let particles = [], waves = [], hearts = [], heartTexture, frame, previous, width, height, dpr, hue = 0, alive = true;
      const heartPoint = angle => ({
        x: 16 * Math.sin(angle) ** 3 / 18,
        y: -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 18
      });
      const heartPulse = age => reduced ? 1 : 1 + Math.sin(Math.max(0,age-.5)*TAU*1.9)*.035*Math.min(1,age*2);
      function heartSprite() {
        if (heartTexture) return heartTexture;
        const sprite = document.createElement('canvas'); sprite.width = sprite.height = 640;
        const paint = sprite.getContext('2d');
        const gradient = paint.createLinearGradient(100,100,500,540);
        gradient.addColorStop(0,'#ffe6ab'); gradient.addColorStop(.45,'#f9a8c4'); gradient.addColorStop(1,'#ffe8bd');
        paint.beginPath();
        for(let i=0;i<=160;i++) {
          const point=heartPoint(i/160*TAU), x=320+point.x*256, y=300+point.y*256;
          if(i===0) paint.moveTo(x,y); else paint.lineTo(x,y);
        }
        paint.closePath();
        paint.fillStyle='rgba(255,186,204,.035)'; paint.fill();
        // Draw the glow once; each animation frame reuses this small texture.
        paint.strokeStyle='#f2a6bd'; paint.lineWidth=13; paint.globalAlpha=.23;
        paint.shadowColor='#ffa8c6'; paint.shadowBlur=24; paint.stroke();
        paint.shadowBlur=0; paint.globalAlpha=1; paint.strokeStyle=gradient; paint.lineWidth=3; paint.stroke();
        paint.strokeStyle='#fff4d7'; paint.globalAlpha=.8; paint.lineWidth=.8; paint.stroke();
        paint.globalAlpha=1;
        for(let i=0;i<18;i++) {
          const point=heartPoint(i/18*TAU);
          paint.fillStyle=i%2?'#ffdca0':'#ffe5ed';
          paint.beginPath(); paint.arc(320+point.x*256,300+point.y*256,i%3===0?3:1.8,0,TAU); paint.fill();
        }
        heartTexture=sprite; return sprite;
      }
      function resize() {
        width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = width * dpr; canvas.height = height * dpr;
        canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
      }
      function origin() {
        const rect = originRef.current?.getBoundingClientRect();
        return rect ? { x: rect.left + rect.width * .5, y: rect.top + rect.height * .43 } : { x: width * .5, y: height * .46 };
      }
      function burst(stage) {
        const center = origin();
        const scale = Math.min(width, height);
        let count = stage === 'finale' ? 130 : stage === 'heart' ? 100 : 62;
        if (width < 768) count = Math.round(count * .65);
        if (reduced) count = Math.round(count * .45);
        if(stage==='heart') {
          heartSprite();
          hearts.push({...center,age:0,life:2.15,radius:scale*.48});
        }
        if (stage === 'halo' || stage === 'finale') {
          waves.push({ ...center, age: 0, life: 1.2, radius: scale * .52, color: '#ffe1a0' });
          waves.push({ ...center, age: -.16, life: 1.3, radius: scale * .66, color: '#edb6c2' });
        }
        for (let i = 0; i < count; i++) {
          const angle = i / count * TAU;
          const speed = stage === 'bloom' ? random(480, 950) : stage === 'finale' ? random(250, 800) : random(250, 480);
          const direction = stage === 'bloom' ? -Math.PI / 2 + random(-1.2, 1.2) : angle;
          const heartX = 16 * Math.sin(angle) ** 3 / 18;
          const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) / 18;
          particles.push({
            ...center, ox: center.x, oy: center.y, age: 0,
            life: stage === 'heart' ? 2.15 : stage === 'spiral' ? 1.6 : random(1.1, 1.9),
            kind: stage, angle, vx: Math.cos(direction) * speed, vy: Math.sin(direction) * speed,
            size: stage === 'heart' ? random(18, 30) : random(30, 78),
            rotation: random(0, TAU), spin: random(-4, 4), image: images[i % images.length],
            sparkle: stage === 'halo' || (stage === 'heart' ? i % 3 === 0 : i % 5 === 0),
            targetX: heartX * scale * .48, targetY: heartY * scale * .48,
            color: i % 3 === 0 ? '#f7bdcc' : '#ffe8b0'
          });
        }
        if (particles.length > 330) particles.splice(0, particles.length - 330);
      }
      function star(p, opacity) {
        const r = p.kind === 'heart' ? 5+Math.sin(p.age*9+p.angle)*1.2 : 5 + Math.sin(p.age * 14) * 2;
        const size = r * 6.4;
        ctx.globalAlpha = opacity; ctx.drawImage(starSprite(p.color),-size/2,-size/2,size,size);
      }
      function tick(now) {
        if (!alive) return;
        const dt = document.hidden ? 0 : previous == null ? 0 : Math.min(.05, (now - previous) / 1000);
        previous = now;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
        waves = waves.filter(wave => {
          wave.age += dt; if (wave.age < 0) return true;
          const t = wave.age / wave.life; if (t >= 1) return false;
          ctx.save(); ctx.globalAlpha = (1 - t) * .55; ctx.strokeStyle = wave.color; ctx.lineWidth = 2 * (1 - t) + .3;
          ctx.beginPath(); ctx.ellipse(wave.x, wave.y, 20 + t * wave.radius, 12 + t * wave.radius * .7, -.15, 0, TAU); ctx.stroke(); ctx.restore();
          return true;
        });
        hearts = hearts.filter(heart => {
          heart.age+=dt; if(heart.age>=heart.life)return false;
          const formed=Math.min(1,Math.max(0,(heart.age-.25)/.45));
          const fade=Math.min(1,(heart.life-heart.age)/.5);
          const pulse=heartPulse(heart.age), expansion=1+Math.max(0,heart.age-1.5)*.9;
          const size=heart.radius*2.5*pulse*expansion;
          ctx.save(); ctx.globalAlpha=formed*fade*.9;
          ctx.drawImage(heartSprite(),heart.x-size/2,heart.y-size*300/640,size,size);
          ctx.restore();return true;
        });
        particles = particles.filter(p => {
          p.age += dt; const t = p.age / p.life; if (t >= 1) return false;
          if (p.kind === 'spiral') {
            const radius = (20 + p.age * Math.min(width, height) * .3) * Math.min(1,p.age/.12);
            p.x = p.ox + Math.cos(p.angle + p.age * 5) * radius;
            p.y = p.oy + Math.sin(p.angle + p.age * 5) * radius * .55 - p.age * 60;
          } else if (p.kind === 'heart') {
            const reach = 1 - (1 - Math.min(1, p.age / .65)) ** 3;
            const expansion=1+Math.max(0,p.age-1.5)*.9;
            const pulse=heartPulse(p.age);
            const curl=(1-reach)*Math.sin(p.angle+p.age*8)*35;
            p.x = p.ox + p.targetX * reach * pulse * expansion + curl;
            p.y = p.oy + p.targetY * reach * pulse * expansion;
          } else {
            const gravity = p.kind === 'bloom' ? 680 : p.kind === 'halo' ? 30 : 150;
            p.x = p.ox + p.vx * p.age;
            p.y = p.oy + p.vy * p.age + .5 * gravity * p.age * p.age;
          }
          p.rotation += p.spin * dt;
          const opacity = Math.min(1, p.age * 12) * Math.min(1, (1 - t) * 4);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.globalAlpha = opacity;
          if (p.sparkle) star(p, opacity);
          else {
            const sprite = petalSprite(p.image,p.kind==='heart'?0:hue);
            if (sprite) {
              const h = p.size / (sprite.width / sprite.height);
              ctx.drawImage(sprite, -p.size / 2, -h / 2, p.size, h);
            } else { ctx.fillStyle = '#edb1c3'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * .3, p.size * .5, .3, 0, TAU); ctx.fill(); }
          }
          ctx.restore(); return true;
        });
        frame = requestAnimationFrame(tick);
      }
      resize(); addEventListener('resize', resize); frame = requestAnimationFrame(tick);
      const renderer = { burst, setHue(value) { hue = value; }, destroy() { alive = false; cancelAnimationFrame(frame); removeEventListener('resize', resize); sprites.clear(); stars.clear(); if(activeRenderer===renderer)activeRenderer=null; } };
      activeRenderer = renderer;
      return renderer;
    }
  };
})();
