// Sharp, accessible lettering above the fireworks; the sky remains interactive.
(() => {
  function text(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = value;
    return node;
  }
  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smoothstep = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;

  window.FinaleTribute = {
    // Load & frame the teacher's portrait at true 1:1 pixel aspect ratio (zero distortion).
    async loadPortrait() {
      const src = parent.GIFT_CONFIG?.finalePortrait || 'image/anh12.jpg';
      if (!src) return null;
      try {
        const image = new Image();
        image.src = new URL(src, new URL('../../', location.href)).href;
        await image.decode();
        const iw = image.naturalWidth || image.width;
        const ih = image.naturalHeight || image.height;
        if (!iw || !ih) return null;

        const isAnh12 = /anh12\./i.test(src);
        let sx, sy, sw, sh;
        if (isAnh12) {
          sx = Math.round(iw * 0.515);
          sw = iw - sx;
          sy = Math.round(ih * 0.142);
          sh = Math.min(ih - sy, Math.round(sw * 1.14));
        } else {
          sw = Math.round(Math.min(iw, ih * 0.82) * 0.72);
          sh = Math.min(ih, Math.round(sw * 1.14));
          sx = Math.round((iw - sw) * 0.5);
          sy = Math.round(Math.max(0, (ih - sh) * 0.28));
        }

        const w = 300;
        const h = Math.max(240, Math.round(w * (sh / sw)));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
        return {
          width: w,
          height: h,
          isAnh12,
          pixels: ctx.getImageData(0, 0, w, h).data
        };
      } catch (error) {
        console.warn('Could not load finale portrait', error);
        return null;
      }
    },

    createPortrait(THREE, photo) {
      if (!photo) return null;
      const w = photo.width, h = photo.height, total = w * h;
      const bR = new Float32Array(total), bG = new Float32Array(total), bB = new Float32Array(total);
      const tR = new Float32Array(total), tG = new Float32Array(total), tB = new Float32Array(total);
      for (let i = 0; i < total; i++) {
        bR[i] = photo.pixels[i * 4];
        bG[i] = photo.pixels[i * 4 + 1];
        bB[i] = photo.pixels[i * 4 + 2];
      }

      // 1. Edge-preserving bilateral filter: smooths skin texture softly while keeping eyes, smile & hair crisp.
      const spatialW = new Float32Array(25);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          spatialW[(dy + 2) * 5 + (dx + 2)] = Math.exp(-(dx * dx + dy * dy) / 5.0);
        }
      }
      const invRange = 1 / (26 * 26 * 3);
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i0 = y * w + x;
            const r0 = bR[i0], g0 = bG[i0], bl0 = bB[i0];
            let sr = 0, sg = 0, sb = 0, swt = 0;
            for (let dy = -2; dy <= 2; dy++) {
              const yy = y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy;
              const yOff = yy * w;
              const spRow = (dy + 2) * 5 + 2;
              for (let dx = -2; dx <= 2; dx++) {
                const xx = x + dx < 0 ? 0 : x + dx >= w ? w - 1 : x + dx;
                const ii = yOff + xx;
                const dr = bR[ii] - r0, dg = bG[ii] - g0, db = bB[ii] - bl0;
                const wt = spatialW[spRow + dx] * Math.exp(-(dr * dr + dg * dg + db * db) * invRange);
                sr += bR[ii] * wt;
                sg += bG[ii] * wt;
                sb += bB[ii] * wt;
                swt += wt;
              }
            }
            tR[i0] = sr / swt;
            tG[i0] = sg / swt;
            tB[i0] = sb / swt;
          }
        }
        bR.set(tR);
        bG.set(tG);
        bB.set(tB);
      }

      // 2. Clean subject segmentation + feathered oval cameo mask.
      const bg = new Uint8Array(total);
      if (photo.isAnh12) {
        const queue = new Int32Array(total);
        let qHead = 0, qTail = 0;
        const isLikelyBg = (x, y) => {
          const nx = x / w, ny = y / h, i = y * w + x;
          const r = bR[i], g = bG[i], b = bB[i];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const blueSweater = b > r + 24 && b > g + 6 && ny > 0.54;
          const goldButton = ny > 0.78 && ny < 0.89 && nx > 0.48 && nx < 0.58;
          if (blueSweater || goldButton) return false;

          const faceEll = ((nx - 0.508) / 0.175) ** 2 + ((ny - 0.425) / 0.215) ** 2;
          if (faceEll < 1.0 || (nx > 0.46 && nx < 0.73 && ny > 0.55 && ny < 0.80 && r - g > 16)) return false;

          const hairEll = ((nx - 0.568) / 0.268) ** 2 + ((ny - 0.352) / 0.282) ** 2;
          const inShoulders = ny > 0.57 && ny < 0.96 && nx > 0.22 && nx < 0.96;
          if (hairEll > 1.0 && !inShoulders) return true;
          if (ny > 0.49 && ny < 0.585 && nx > 0.765) return true;
          if (lum > 130 && nx > 0.58 && ny < 0.46 && b < r - 8) return true;
          if (nx < 0.44 && ny < 0.65 && r - b > 15 && r - g > 11 && r < 155) return true;
          if (ny < 0.15 && r - b > 18 && r - g > 12 && r < 155) return true;
          if (nx > 0.77 && ny < 0.60 && (r - b > 18 || lum > 105)) return true;
          if (nx < 0.47 && ny > 0.57 && ny < 0.67 && r - g < 20 && lum > 85 && !blueSweater) return true;
          if (nx < 0.46 && ny > 0.58 && !blueSweater && r - b > 12) return true;
          if (nx < 0.56 && ny > 0.54 && !blueSweater && (g > b - 5 || nx < 0.36)) return true;
          return false;
        };
        const pushBg = idx => {
          if (!bg[idx]) {
            bg[idx] = 1;
            queue[qTail++] = idx;
          }
        };
        for (let x = 0; x < w; x++) {
          if (isLikelyBg(x, 0)) pushBg(x);
          const ib = (h - 1) * w + x;
          if (x < (w >> 1) && isLikelyBg(x, h - 1)) pushBg(ib);
        }
        for (let y = 0; y < h; y++) {
          if (isLikelyBg(0, y)) pushBg(y * w);
          if (y < Math.floor(h * 0.62) && isLikelyBg(w - 1, y)) pushBg(y * w + w - 1);
        }
        for (let y = Math.floor(h * 0.58); y < Math.floor(h * 0.665); y++) {
          for (let x = Math.floor(w * 0.34); x < Math.floor(w * 0.46); x++) {
            if (isLikelyBg(x, y)) pushBg(y * w + x);
          }
        }
        while (qHead < qTail) {
          const cur = queue[qHead++];
          const cx = cur % w, cy = (cur / w) | 0;
          for (let dy = -1; dy <= 1; dy++) {
            const ny2 = cy + dy;
            if (ny2 < 0 || ny2 >= h) continue;
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              const nx2 = cx + dx;
              if (nx2 < 0 || nx2 >= w) continue;
              const ni = ny2 * w + nx2;
              if (!bg[ni] && isLikelyBg(nx2, ny2)) pushBg(ni);
            }
          }
        }
      }

      const cameoCx = photo.isAnh12 ? 0.558 : 0.5;
      const cameoCy = photo.isAnh12 ? 0.485 : 0.48;
      const cameoRx = photo.isAnh12 ? 0.375 : 0.40;
      const cameoRy = photo.isAnh12 ? 0.430 : 0.44;

      const sMask = new Float32Array(total);
      const tmpM = new Float32Array(total);
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          const ox = (nx - cameoCx) / cameoRx;
          const oy = (ny - cameoCy) / cameoRy;
          const cameo = 1 - smoothstep(0.75, 1.0, Math.hypot(ox, oy));
          sMask[y * w + x] = (bg[y * w + x] ? 0 : 1) * cameo;
        }
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let y = 2; y < h - 2; y++) {
          for (let x = 2; x < w - 2; x++) {
            let sum = 0;
            for (let dy = -2; dy <= 2; dy++) {
              const rowOff = (y + dy) * w + x;
              for (let dx = -2; dx <= 2; dx++) sum += sMask[rowOff + dx];
            }
            tmpM[y * w + x] = sum / 25;
          }
        }
        sMask.set(tmpM);
      }

      // 3. Keep the original eye detail in a finer, steadier particle grid.
      const portraitPts = [];
      const spacingNorm = 1.70 / w;
      const eyeBounds = { left: 0.30, right: 0.64, top: 0.34, bottom: 0.46 };
      const inEyeBounds = (x, y) => photo.isAnh12 && x >= eyeBounds.left && x < eyeBounds.right && y >= eyeBounds.top && y < eyeBounds.bottom;
      const sampleOriginal = (x, y, channel) => {
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const fx = x - x0, fy = y - y0;
        const top = mix(photo.pixels[(y0 * w + x0) * 4 + channel], photo.pixels[(y0 * w + x0 + 1) * 4 + channel], fx);
        const bottom = mix(photo.pixels[((y0 + 1) * w + x0) * 4 + channel], photo.pixels[((y0 + 1) * w + x0 + 1) * 4 + channel], fx);
        return mix(top, bottom, fy) / 255;
      };
      const grids = [{ fine: false, stepX: 1.72, stepY: 1.56 }];
      if (photo.isAnh12) grids.push({ fine: true, stepX: 0.80, stepY: 0.74 });
      for (const { fine, stepX, stepY } of grids) {
      let row = 0;
      const yStart = fine ? eyeBounds.top * h : 3;
      const yEnd = fine ? eyeBounds.bottom * h : h - 3;
      for (let py = yStart; py < yEnd; py += stepY, row++) {
        const xOff = (row & 1) * (stepX * 0.5);
        const xStart = fine ? eyeBounds.left * w : 3;
        const xEnd = fine ? eyeBounds.right * w : w - 3;
        for (let px = xStart + xOff; px < xEnd; px += stepX) {
          if (!fine && inEyeBounds(px / w, py / h)) continue;
          const jx = px + (fine ? 0 : (Math.random() - 0.5) * 0.85);
          const jy = py + (fine ? 0 : (Math.random() - 0.5) * 0.85);
          const ix = Math.max(2, Math.min(w - 3, Math.round(jx)));
          const iy = Math.max(2, Math.min(h - 3, Math.round(jy)));
          const idx = iy * w + ix;
          const m = sMask[idx];
          if (m < 0.05) continue;

          const nx = jx / w, ny = jy / h;
          let r = bR[idx] / 255, g = bG[idx] / 255, b = bB[idx] / 255;

          const rimGrad = Math.hypot(sMask[idx + 2] - sMask[idx - 2], sMask[idx + 2 * w] - sMask[idx - 2 * w]);
          const faceDist2 = ((nx - 0.508) / 0.17) ** 2 + ((ny - 0.425) / 0.19) ** 2;
          const inFace = photo.isAnh12 ? 1 - smoothstep(0.85, 1.15, faceDist2) : 0;
          const rim = clamp01(rimGrad * 0.82) * (1 - inFace) * (1 - smoothstep(0.58, 0.72, ny));

          // Feather into the surrounding face; do not brighten or redraw eyes.
          const eyeDetail = fine ? (smoothstep(0.30, 0.34, nx) * (1 - smoothstep(0.60, 0.64, nx))
            * smoothstep(0.34, 0.365, ny) * (1 - smoothstep(0.435, 0.46, ny))) : 0;
          if (fine) {
            r = mix(r, sampleOriginal(jx, jy, 0), eyeDetail);
            g = mix(g, sampleOriginal(jx, jy, 1), eyeDetail);
            b = mix(b, sampleOriginal(jx, jy, 2), eyeDetail);
          }
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Continuous branch-free celestial color grading
          const wBlue = photo.isAnh12
            ? smoothstep(0.04, 0.16, b - Math.max(r, g * 0.90)) * smoothstep(0.50, 0.58, ny)
            : 0;
          const glow = Math.pow(clamp01(lum), 0.77);
          const rosy = Math.max(0, r - g - 0.10) * (1 - wBlue);
          const wDark = (1 - smoothstep(0.06, 0.30, lum)) * (1 - wBlue);

          const warmR = mix(r, 1.00 * glow, 0.28) + rosy * 0.24 + wDark * (0.115 * (1 - inFace * 0.5));
          const warmG = mix(g, 0.91 * glow, 0.28) - rosy * 0.03 + wDark * (0.098 * (1 - inFace * 0.5));
          const warmB = mix(b, 0.76 * glow, 0.26) + rosy * 0.06 + wDark * (0.138 * (1 - inFace * 0.5));

          const blueLift = Math.pow(Math.max(0.04, lum), 0.76);
          const sapR = r * 0.62 + 0.24 * blueLift + 0.06;
          const sapG = g * 0.80 + 0.38 * blueLift + 0.09;
          const sapB = b * 0.96 + 0.36 * blueLift + 0.16;

          const outR = clamp01(mix(mix(warmR, sapR, wBlue) + rim * 0.54, r, eyeDetail));
          const outG = clamp01(mix(mix(warmG, sapG, wBlue) + rim * 0.44, g, eyeDetail));
          const outB = clamp01(mix(mix(warmB, sapB, wBlue) + rim * 0.28, b, eyeDetail));

          const tx = (jx - w * cameoCx) / w;
          const ty = (h * cameoCy - jy) / w;
          const tz = (glow - 0.5) * 0.015;
          const sizeMul = (2.86 + 0.56 * glow + 0.35 * rim) * (fine ? 0.48 : 1);
          const baseAlpha = (0.74 + 0.21 * glow) * m;

          portraitPts.push({
            sortKey: lum * 0.65 + rim * 0.35,
            tx, ty, tz,
            r: outR, g: outG, b: outB,
            alpha: baseAlpha,
            size: sizeMul,
            detail: eyeDetail,
            role: 0
          });
        }
      }
      }
      if (!portraitPts.length) return null;
      portraitPts.sort((a, b) => a.sortKey - b.sortKey);

      // Role 1 & 2: Graceful outer golden & sakura-rose stardust laurel + white-gold daisy clusters
      const haloRx = cameoRx * 1.075;
      const haloRy = cameoRy * (h / w) * 1.06;
      const accentPts = [];
      const wreathCount = 860;
      for (let i = 0; i < wreathCount; i++) {
        const u = i / wreathCount;
        const ang = u * Math.PI * 2;
        const wave = Math.sin(ang * 14) * 0.0085 * (i % 2 === 0 ? 1 : -1);
        const scatter = (Math.random() ** 2.0) * 0.052 * (Math.random() < 0.74 ? 1 : -0.28);
        const wx = Math.cos(ang) * (haloRx + wave + scatter);
        const wy = -Math.sin(ang) * (haloRy + wave + scatter);
        const cradle = 0.50 + 0.50 * Math.sin(ang);
        const fade = cradle * (1 - Math.min(1, Math.abs(scatter) / 0.06));
        const wa = fade * (0.48 + 0.48 * Math.random());
        if (wa < 0.08) continue;
        const rose = i % 5 === 0, pearl = i % 7 === 0;
        accentPts.push({
          tx: wx, ty: wy, tz: (Math.random() - 0.5) * 0.02,
          r: 1.0,
          g: pearl ? 0.97 : rose ? 0.78 : 0.89,
          b: pearl ? 0.92 : rose ? 0.86 : 0.63,
          alpha: wa,
          size: 1.45 + Math.random() * 1.85,
          role: 1
        });
      }

      // Delicate 6-petal daisy star blossoms cradling the bottom arc (echoing anh12.jpg's white daisies)
      const daisyAngles = [0.22, 0.36, 0.50, 0.64, 0.78];
      for (const frac of daisyAngles) {
        const ang = frac * Math.PI;
        const dcx = Math.cos(ang) * (haloRx + 0.006);
        const dcy = -Math.sin(ang) * (haloRy + 0.006);
        accentPts.push({
          tx: dcx, ty: dcy, tz: 0.015,
          r: 1.0, g: 0.86, b: 0.36,
          alpha: 0.96, size: 2.85, role: 1
        });
        for (let pet = 0; pet < 6; pet++) {
          const pa = (pet * Math.PI) / 3 + 0.2;
          for (let s = 1; s <= 2; s++) {
            const pr = s * 0.0066;
            accentPts.push({
              tx: dcx + Math.cos(pa) * pr,
              ty: dcy + Math.sin(pa) * pr,
              tz: 0.012,
              r: 1.0, g: 0.98, b: 0.94,
              alpha: 0.90, size: 2.35 - s * 0.35, role: 1
            });
          }
        }
      }

      // Soft ambient firefly stars breathing outside the laurel
      for (let i = 0; i < 260; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 1.08 + Math.random() * 0.28;
        accentPts.push({
          tx: Math.cos(ang) * haloRx * dist,
          ty: -Math.sin(ang) * haloRy * dist,
          tz: (Math.random() - 0.5) * 0.04,
          r: 1.0,
          g: i % 3 === 0 ? 0.82 : 0.92,
          b: i % 3 === 0 ? 0.88 : 0.70,
          alpha: 0.32 + Math.random() * 0.45,
          size: 1.25 + Math.random() * 1.65,
          role: 2
        });
      }

      // Role 3: Rising golden comet rocket & opening chrysanthemum burst crown
      const burstCount = 920;
      for (let i = 0; i < burstCount; i++) {
        const ang = (i * 2.39996323) % (Math.PI * 2);
        const rad = (0.35 + 0.95 * Math.sqrt((i + 0.5) / burstCount)) * Math.max(haloRx, haloRy);
        const rose = i % 6 === 0;
        accentPts.push({
          tx: Math.cos(ang) * rad,
          ty: Math.sin(ang) * rad,
          tz: (Math.random() - 0.5) * 0.08,
          r: 1.0,
          g: rose ? 0.74 : 0.88,
          b: rose ? 0.82 : 0.58,
          alpha: 0.88,
          size: 2.1 + Math.random() * 1.4,
          role: 3
        });
      }

      const all = portraitPts.concat(accentPts);
      const count = all.length;
      const targets = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const meta = new Float32Array(count * 3); // [alpha, sizeMul, role]
      const rnd = new Float32Array(count * 4);
      const detail = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        const p = all[i];
        targets[i * 3] = p.tx;
        targets[i * 3 + 1] = p.ty;
        targets[i * 3 + 2] = p.tz;
        colors[i * 3] = p.r;
        colors[i * 3 + 1] = p.g;
        colors[i * 3 + 2] = p.b;
        meta[i * 3] = p.alpha;
        meta[i * 3 + 1] = p.size;
        meta[i * 3 + 2] = p.role;
        detail[i] = p.detail || 0;
        rnd[i * 4] = (i % burstCount) / burstCount;
        rnd[i * 4 + 1] = Math.random();
        rnd[i * 4 + 2] = Math.random();
        rnd[i * 4 + 3] = Math.random();
      }

      const spanX = haloRx * 2.16;
      const spanY = haloRy * 2.16;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      geo.setAttribute('aTarget', new THREE.BufferAttribute(targets, 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('aMeta', new THREE.BufferAttribute(meta, 3));
      geo.setAttribute('aDetail', new THREE.BufferAttribute(detail, 1));
      geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));

      const uniforms = {
        uTime: { value: 0 },
        uSizeScale: { value: 1 },
        uT0: { value: 1e9 },
        uFlight: { value: 1.5 },
        uScale: { value: 20 },
        uSpacing: { value: 0.1 },
        uOrigin: { value: new THREE.Vector3() },
        uLaunch: { value: new THREE.Vector3() }
      };

      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          uniform float uTime, uSizeScale, uT0, uFlight, uScale, uSpacing;
          uniform vec3 uOrigin, uLaunch;
          attribute vec3 aTarget, aColor, aMeta;
          attribute vec4 aRnd;
          attribute float aDetail;
          varying vec3 vColor;
          varying float vAlpha, vSparkle, vDetail;

          void main() {
            float t = uTime - uT0;
            float baseAlpha = aMeta.x;
            float sizeMul = aMeta.y;
            float role = aMeta.z;

            vec3 p = uLaunch;
            vec3 col = aColor;
            float alpha = 0.0;
            float worldSize = 0.0;
            vSparkle = step(0.5, role);
            vDetail = aDetail;

            if (t > 0.0 && t < uFlight) {
              // Phase 1: Brilliant golden comet shell rising into the night sky
              if (role > 2.5) {
                float u = aRnd.y;
                float lag = u * 0.22;
                float kt = clamp((t - lag) / uFlight, 0.0, 1.0);
                float ease = 1.0 - pow(1.0 - kt, 1.85);
                p = mix(uLaunch, uOrigin, ease);
                p.x += sin(kt * 8.5) * 0.14 * (1.0 - kt) + (aRnd.z - 0.5) * u * 0.45;
                p.y -= u * u * 1.05;
                p.z += (aRnd.w - 0.5) * 0.2;
                float head = 1.0 - smoothstep(0.0, 0.08, u);
                float twinkle = 0.78 + 0.22 * sin(t * 28.0 + aRnd.w * 40.0);
                alpha = smoothstep(0.0, 0.05, t - lag) * pow(1.0 - u, 1.25) * twinkle * 0.95;
                col = mix(vec3(1.0, 0.52, 0.14), vec3(1.0, 0.97, 0.86), max(head, 1.0 - pow(u, 0.55)));
                worldSize = uSpacing * mix(1.8, 3.6, head);
              }
            } else if (t >= uFlight) {
              float age = t - uFlight;
              if (role > 2.5) {
                // Initial golden-rose chrysanthemum burst crown opening around the cameo
                float drag = 2.05;
                float travel = (1.0 - exp(-drag * age)) / drag;
                vec3 vel = vec3(aTarget.xy * uScale * 2.35, aTarget.z * uScale);
                p = uOrigin + vel * travel;
                p.y -= 0.55 * age * age;
                float fade = 1.0 - smoothstep(0.42, 1.45 + aRnd.y * 0.35, age);
                float tw = 0.75 + 0.25 * sin(age * 20.0 + aRnd.z * 50.0);
                alpha = smoothstep(0.0, 0.04, age) * fade * tw * 0.82;
                col = mix(vec3(1.0, 0.62, 0.24), aColor, smoothstep(0.0, 0.35, age));
                worldSize = uSpacing * sizeMul * mix(1.25, 0.65, clamp(age / 1.4, 0.0, 1.0));
              } else {
                // Phase 2: Chrysanthemum burst smoothly blooms into the teacher's stardust cameo
                vec3 dest = vec3(aTarget.xy * uScale, aTarget.z * uScale);
                float bloomDur = 0.74 + 0.22 * aRnd.y;
                float k = clamp(age / bloomDur, 0.0, 1.0);
                float bloom = 1.0 - pow(1.0 - k, 3.0);

                float swirlAng = (1.0 - bloom) * (0.42 * (aRnd.z - 0.5));
                float cs = cos(swirlAng), sn = sin(swirlAng);
                vec2 rotXY = vec2(dest.x * cs - dest.y * sn, dest.x * sn + dest.y * cs);
                p = uOrigin + vec3(rotXY * bloom, dest.z * bloom);

                // Coherent gentle sky breath during the hold (features stay 100% true)
                p.x += sin(age * 1.15) * uSpacing * 0.25 * bloom;
                p.y += cos(age * 0.95) * uSpacing * 0.25 * bloom;
                if (role > 0.5) {
                  p.x += sin(age * 1.8 + aRnd.z * 12.0) * uSpacing * 0.45 * bloom;
                  p.y += cos(age * 1.6 + aRnd.w * 12.0) * uSpacing * 0.45 * bloom;
                }

                // Phase 3: Graceful golden firefly release before the tribute card arrives
                float radialNorm = clamp(length(aTarget.xy) * 2.1, 0.0, 1.0);
                float releaseStart = 4.02 + (1.0 - radialNorm) * 0.30 + aRnd.y * 0.22;
                float rel = max(0.0, age - releaseStart);
                if (rel > 0.0) {
                  float rel2 = rel * rel;
                  p.x += (aTarget.x * 3.2 + (aRnd.z - 0.35) * 1.4) * rel2 * uSpacing * 9.0;
                  p.y += (0.55 * rel - 1.35 * rel2 * (0.7 + 0.6 * aRnd.w)) * uSpacing * 11.0;
                  p.z += (aRnd.w - 0.5) * rel * 0.6;
                }

                float appear = smoothstep(0.0, 0.14, age);
                float vanish = 1.0 - smoothstep(0.0, 0.92, rel);
                float shimmer = role < 0.5
                  ? (0.965 + 0.035 * sin(age * (5.5 + aRnd.y * 4.0) + aRnd.z * 30.0))
                  : (0.72 + 0.28 * sin(age * (7.5 + aRnd.y * 8.0) + aRnd.z * 45.0));

                // Sparks start golden-white at burst and reveal natural celestial portrait tones
                vec3 burstTint = vec3(1.0, 0.93, 0.76);
                col = mix(burstTint, aColor, smoothstep(0.10, 0.68, age));
                col = mix(col, vec3(1.0, 0.86, 0.56), smoothstep(0.05, 0.60, rel));

                alpha = appear * vanish * baseAlpha * shimmer;
                worldSize = uSpacing * sizeMul * mix(0.75, 1.0, bloom) * mix(1.0, 0.72, clamp(rel, 0.0, 1.0));
              }
            }

            vColor = col;
            vAlpha = alpha;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = alpha > 0.004 ? clamp(worldSize * uSizeScale / max(0.1, -mv.z), 1.5, 22.0) : 0.0;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha, vSparkle, vDetail;
          void main() {
            vec2 pc = (gl_PointCoord - 0.5) * 2.0;
            float d2 = dot(pc, pc);
            if (d2 > 1.0) discard;
            float core = exp(-d2 * mix(3.35, 5.2, vSparkle));
            float tip = exp(-d2 * 26.0);
            float alpha = min(0.95, (core * 0.86 + tip * mix(0.16, 0.34, vSparkle)) * vAlpha);
            if (alpha < 0.008) discard;
            vec3 color = mix(vColor, vec3(1.0, 0.98, 0.90), tip * mix(0.18, 0.42, vSparkle) * (1.0 - vDetail));
            gl_FragColor = vec4(color, alpha);
          }`,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending
      });

      const pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      pts.renderOrder = 10;

      return {
        geo,
        mat,
        pts,
        launch(time, width, height, sizeScale) {
          // Enlarge the whole cameo uniformly, keeping room for the floral halo.
          const scale = Math.min((width * 1.82) / spanX, (height * 0.80) / spanY);
          uniforms.uScale.value = scale;
          uniforms.uSpacing.value = spacingNorm * scale;
          uniforms.uOrigin.value.set(0, height * 0.035, 1);
          uniforms.uLaunch.value.set(0, -height * 0.55, 1);
          uniforms.uSizeScale.value = sizeScale;
          uniforms.uT0.value = time;
        }
      };
    },

    async loadFont() {
      try {
        await document.fonts.load('700 150px FireworkSerif', 'Cảm ơn cô Chúc mừng ngày Nhà giáo Việt Nam 20/11/2026');
      } catch {}
    },
    // A bold raster mask produces dense, complete strokes, including Vietnamese marks.
    textPoints(label, count) {
      const value = String(label || '').trim();
      const greeting = /ch\u00fac.*m\u1eebng/i.test(value);
      let lines = greeting
        ? innerWidth < 600
          ? ['Ch\u00fac m\u1eebng', 'ng\u00e0y nh\u00e0 gi\u00e1o', 'Vi\u1ec7t Nam']
          : ['Ch\u00fac m\u1eebng ng\u00e0y', 'nh\u00e0 gi\u00e1o Vi\u1ec7t Nam']
        : /tri.*c\u00f4/i.test(value)
          ? ['Tri \u00e2n', 'c\u00f4']
          : /ng\u01b0\u1eddi.*gieo/i.test(value)
            ? ['Ng\u01b0\u1eddi gieo', '\u01b0\u1edbc m\u01a1']
            : [value.replace(/20\.11/, '20/11')];
      if (lines.length === 1 && lines[0].length > 16) {
        const words = lines[0].split(/\s+/), middle = Math.ceil(words.length / 2);
        lines = [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
      }
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 440;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      let size = Math.min(lines.length > 1 ? 158 : 220, Math.floor(376 / (1 + (lines.length - 1) * 1.3)));
      do {
        ctx.font = '700 ' + size + 'px FireworkSerif, Georgia, serif';
        if (lines.every(line => ctx.measureText(line).width < 920)) break;
        size -= 4;
      } while (size > 40);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      const spacing = size * 1.3;
      lines.forEach((line, index) => {
        const y = 220 + (index - (lines.length - 1) / 2) * spacing;
        ctx.strokeText(line, 512, y);
        ctx.fillText(line, 512, y);
      });
      const pixels = ctx.getImageData(0, 0, 1024, 440).data, points = [];
      for (let y = 6; y < 434; y += 2) {
        for (let x = 20; x < 1004; x += 2) {
          if (pixels[(y * 1024 + x) * 4 + 3] > 130) points.push([x, y]);
        }
      }
      if (!points.length) return null;
      const result = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const point = points[Math.floor(((i + 0.5) / count) * points.length)];
        result[i * 3] = ((point[0] - 512) / 1024) * 20;
        result[i * 3 + 1] = ((220 - point[1]) / 1024) * 20;
        result[i * 3 + 2] = 0;
      }
      return result;
    },
    vertexShader: `
      uniform float uTime,uSizeScale,uT0,uFlight,uHold;
      uniform vec3 uOrigin,uLaunch,uColA,uColB;
      attribute vec3 aTarget;attribute vec4 aRnd;
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float t=uTime-uT0;vec3 p=uLaunch;float alpha=0.0;float size=0.0;
        if(t>0.0&&t<uFlight){
          float k=clamp(t/uFlight,0.0,1.0);p=mix(uLaunch,uOrigin,1.0-pow(1.0-k,2.0));
          alpha=aRnd.x<0.035?0.95:0.0;size=0.14;
        }else if(t>=uFlight){
          float bt=t-uFlight;
          vec3 dir=normalize(vec3(aRnd.x-.5,aRnd.y-.5,aRnd.z-.5)+.0001);
          vec3 burst=uOrigin+dir*(3.0+aRnd.w*3.0);
          float gather=smoothstep(.22,1.05,bt);
          p=mix(mix(uOrigin,burst,smoothstep(0.0,.24,bt)),uOrigin+aTarget,gather);
          p+=vec3(sin(uTime*1.3+aRnd.z*9.0),cos(uTime*1.2+aRnd.w*9.0),0.0)*.007*gather;
          float fall=max(0.0,bt-1.05-uHold);
          p.y-=fall*fall*(.8+aRnd.y);p.x+=fall*(aRnd.x-.5)*.45;
          alpha=(.9+.05*sin(uTime*2.0+aRnd.x*20.0))*(1.0-smoothstep(0.0,.8,fall));
          size=mix(.145,.105,smoothstep(0.0,1.0,bt));
        }
        vColor=mix(vec3(.95,.78,.47),vec3(1.0,.94,.77),aRnd.z);vAlpha=alpha;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_PointSize=alpha>.002?clamp(size*uSizeScale/-mv.z,2.6,4.2):0.0;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;varying float vAlpha;
      void main(){
        float d=length(gl_PointCoord-.5)*2.0;
        if(d>1.0)discard;
        float core=exp(-d*d*4.0);
        float alpha=(core+exp(-d*d*3.0)*.12)*vAlpha;
        if(alpha<.015)discard;
        gl_FragColor=vec4(vColor,min(.95,alpha));
      }`,
    mount(scene) {
      if (scene.querySelector('.tribute-hero')) return;
      const config = parent.GIFT_CONFIG || {};
      const hero = document.createElement('section');
      hero.className = 'tribute-hero';
      hero.setAttribute('aria-label', 'Lời tri ân ngày Nhà giáo Việt Nam');
      hero.append(text('p', 'tribute-eyebrow', 'CHÚC MỪNG NGÀY NHÀ GIÁO VIỆT NAM'));
      const date = document.createElement('h1');
      date.className = 'tribute-calendar';
      const calendar = document.createElement('time');
      calendar.dateTime = '2026-11-20';
      calendar.setAttribute('aria-label', 'Ngày 20 tháng 11 năm 2026');
      calendar.append(text('span', 'tribute-calendar-day', '20'),
        text('span', 'tribute-calendar-slash', '/'), text('span', 'tribute-calendar-month', '11'),
        text('span', 'tribute-calendar-slash', '/'), text('span', 'tribute-calendar-year', '2026'));
      date.append(calendar);
      hero.append(date);
      hero.append(text('div', 'tribute-rule', '✧'));
      const caption = text('p', 'tribute-caption', 'Cảm ơn cô');
      caption.setAttribute('aria-live', 'polite');
      hero.append(caption);
      hero.append(text('p', 'tribute-quote', config.finalMessage || 'Chúc cô thật nhiều sức khỏe, luôn vui vẻ và hạnh phúc.'));
      hero.append(text('p', 'tribute-signature', config.sender || 'Tập thể lớp 11 Tin'));
      scene.append(hero, text('div', 'tribute-sky-frame', ''));
    },
    showText(scene, label) {
      const caption = scene?.querySelector('.tribute-caption');
      if (!caption) return;
      const value = String(label || '').trim();
      caption.textContent = /20[./]11/.test(value) ? 'Ngày Nhà giáo Việt Nam' : value;
      if (caption.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        caption.animate(
          [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 500, easing: 'ease-out' }
        );
      }
    }
  };
})();
