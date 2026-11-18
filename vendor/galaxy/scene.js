/* Galaxy visuals adapted from the public browser source at
 * https://love-galaxy-pro.netlify.app/ (author credit: Luc Thien Phong).
 * Local integration: symbol-triggered cinematic intro, no letter/help, local photo viewer.
 * Three.js license is preserved in vendor/LICENSE.
 */

        import { createGalaxyCinematic } from "./cinematic.js";
        import { createKnowledgeSymbol } from "./knowledge-symbol.js";
        import { galaxyViewport, canvasPointer } from "./layout.js";
        import * as THREE from "./vendor/three.module.js";
        import { OrbitControls } from "./vendor/examples/jsm/controls/OrbitControls.js";
        import { EffectComposer } from "./vendor/examples/jsm/postprocessing/EffectComposer.js";
        import { RenderPass } from "./vendor/examples/jsm/postprocessing/RenderPass.js";
        import { AfterimagePass } from "./vendor/examples/jsm/postprocessing/AfterimagePass.js";

        // Chờ config từ pre-script (nếu có ?id= thì đợi API trả về, ngược lại resolve null ngay)
        const gift = window.parent.GIFT_CONFIG || {};
        const configuredPhotos = gift.galaxy?.photos || gift.photos || [];
        const root = new URL('../../', location.href);
        const galleryPhotos = (configuredPhotos.length ? configuredPhotos : [{src:'assets/images/class-1.jpg',caption:'Kỷ niệm bên cô'}]).map(photo => {
            const item = typeof photo === 'string' ? {src:photo} : photo;
            return {...item, src:new URL(item.src,root).href};
        });
        const __APP_CONFIG__ = {
            title: gift.galaxy?.title || 'Chúc mừng ngày Nhà giáo Việt Nam',
            messages: gift.galaxy?.messages,
            images: galleryPhotos.map(photo => photo.src),
        };
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let scene = new THREE.Scene();
        // scene.background = null → canvas trong suốt, hiện gradient CSS phía sau
        let viewport = galaxyViewport(innerWidth, innerHeight);
        let camera = new THREE.PerspectiveCamera(60, viewport.width / viewport.height, 0.1, 1000);
        // Start inside the photo annulus, just above the image plane.
        const defaultCameraPosition = new THREE.Vector3(0, 9, innerWidth < 768 ? 56 : 39);
        const defaultCameraTarget = new THREE.Vector3(0, 11, 0);
        camera.position.copy(defaultCameraPosition);
        camera.lookAt(defaultCameraTarget);
        let renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setClearColor(0x000000, 0);
        // QUAN TRỌNG: render ở DPR thật của thiết bị → hạt sao sắc nét trên mobile
        // Mobile cap 1.5 (DPR=3 trên S22+/S23 → 4× fragment, mid-range Mali tụt fps);
        // hạt có glow nên 1.5 nhìn vẫn mượt. Desktop cap 2 cho màn retina.
        const IS_MOBILE = innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
        const PIXEL_RATIO = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);
        renderer.setPixelRatio(PIXEL_RATIO);
        renderer.setSize(viewport.width, viewport.height);
        document.body.appendChild(renderer.domElement);

        // === Shooting Stars (CSS DOM, bê từ trai_tim-tiktok_mua/index.main.js:177-211) ===
        const shootingStarsContainer = document.createElement('div');
        shootingStarsContainer.className = 'shooting-stars';
        shootingStarsContainer.id = 'shooting-stars';
        document.body.appendChild(shootingStarsContainer);
        (function createShootingStars() {
            const numShootingStars = reducedMotion ? 0 : (IS_MOBILE ? 5 : 9);
            for (let i = 0; i < numShootingStars; i++) {
                const shootingStar = document.createElement('div');
                shootingStar.className = 'shooting-star';
                // Vị trí bắt đầu: nửa phải + 1/3 trên của màn hình
                const startX = Math.random() * (window.innerWidth * 0.8) + (window.innerWidth * 0.2);
                const startY = Math.random() * (window.innerHeight * 0.3);
                shootingStar.style.left = startX + 'px';
                shootingStar.style.top  = startY + 'px';
                shootingStar.style.animationDelay = (Math.random() * 10) + 's';
                const size = 6 + Math.random() * 6;  // 6-12px (gấp đôi gốc)
                shootingStar.style.width  = size + 'px';
                shootingStar.style.height = size + 'px';
                shootingStarsContainer.appendChild(shootingStar);
            }
        })();
        window.addEventListener("resize", event => {
            viewport = galaxyViewport(innerWidth, innerHeight);
                camera.aspect = viewport.width / viewport.height;
            camera.updateProjectionMatrix();
            renderer.setPixelRatio(PIXEL_RATIO);
            renderer.setSize(viewport.width, viewport.height);
            if (composer) {
                composer.setPixelRatio(PIXEL_RATIO);
                composer.setSize(viewport.width, viewport.height);
            }
        })
        let controls = new OrbitControls(camera, renderer.domElement);
        // Apply each drag immediately; releasing the pointer stops the camera.
        controls.enableDamping = false;
        controls.enableRotate = true;
        controls.rotateSpeed = 1;
        controls.enablePan = false;
        controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
        controls.mouseButtons.RIGHT = null;
        controls.minDistance = 8;
        controls.maxDistance = 200;
        controls.target.copy(defaultCameraTarget);
        controls.update();
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };

        const keys = {};
        window.addEventListener('keydown', e => {
            if (document.querySelector('dialog[open]')) return;
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
            keys[e.key] = true;
        });
        window.addEventListener('keyup', e => { keys[e.key] = false; });

        let gu = {
            time: { value: 0 }
        }
        let sizes = [];
        let shift = [];
        let partType = [];   // 0 = cầu (đỏ hồng), 1 = đĩa (đỏ đậm maroon), 2 = ring (đỏ tươi)
        let pushShift = () => {
            shift.push(
                Math.random() * Math.PI,
                Math.random() * Math.PI * 2,
                (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
                Math.random() * 0.9 + 0.1
            );
        }
        let pts = new Array(IS_MOBILE ? 26000 : 50000).fill().map(p => {
            sizes.push(Math.random() * 1.5 + 0.5);
            pushShift();
            partType.push(0);
            return new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5);
        })
        for (let i = 0; i < (IS_MOBILE ? 55000 : 100000); i++) {
            let r = 10, R = 85;
            let rand = Math.pow(Math.random(), 1.5);
            let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
            pts.push(new THREE.Vector3().setFromCylindricalCoords(radius, Math.random() * 2 * Math.PI, (Math.random() - 0.5) * 2));
            sizes.push(Math.random() * 1.5 + 0.5);
            pushShift();
            partType.push(1);
        }

        let g = new THREE.BufferGeometry().setFromPoints(pts);
        g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
        g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
        g.setAttribute("partType", new THREE.Float32BufferAttribute(partType, 1));
        let m = new THREE.PointsMaterial({
            size: 0.12,
            transparent: true,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            onBeforeCompile: shader => {
                shader.uniforms.time = gu.time;
                shader.vertexShader = `
                    uniform float time;
                    attribute float sizes;
                    attribute vec4 shift;
                    attribute float partType;
                    varying vec3 vColor;
                    varying float vLayerOpacity;
                    ${shader.vertexShader}
                `.replace(
                    `gl_PointSize = size;`,
                    `gl_PointSize = size * sizes;`
                ).replace(
                    `#include <color_vertex>`,
                    `#include <color_vertex>
                    vLayerOpacity = partType < 0.5 ? 0.48 : 0.60;
                    if (partType > 1.5) {
                        vColor = vec3(227., 159., 119.) / 255.; // warm copper ring
                    } else if (partType > 0.5) {
                        vColor = vec3(125., 72., 78.) / 255.;   // muted rose galaxy disc
                    } else {
                        vColor = vec3(245., 179., 132.) / 255.; // warm light shared with the book
                    }
                `).replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                    float t = time;
                    float moveT = mod(shift.x + shift.z * t, PI2);
                    float moveS = mod(shift.y + shift.z * t, PI2);
                    transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.a;
                `);
                // console.log(shader.vertexShader);
                shader.fragmentShader = `
                varying vec3 vColor;
                varying float vLayerOpacity;
                ${shader.fragmentShader}
                `.replace(
                    `#include <clipping_planes_fragment>`,
                    `#include <clipping_planes_fragment>
                    float d = length(gl_PointCoord.xy - 0.5);
                    if (d > 0.5) discard;
                `).replace(
                        `vec4 diffuseColor = vec4( diffuse, opacity );`,
                        `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d) * vLayerOpacity );`
                    );
                // console.log(shader.fragmentShader);
            }
        });
        let p = new THREE.Points(g, m);
        p.rotation.order = "ZYX";
        scene.add(p)

        // === Bầu trời sao nền (kiểu galaxy_yeuthuong: 20K sao rải khắp khối 900³) ===
        const STAR_COUNT = IS_MOBILE ? 9000 : 20000;
        const starPositions = new Float32Array(STAR_COUNT * 3);
        for (let i = 0; i < STAR_COUNT; i++) {
            starPositions[i * 3]     = (Math.random() - 0.5) * 900;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
            starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        const starMat = new THREE.PointsMaterial({
            color: 0xe9c6ad,
            size: 0.7,
            transparent: true,
            opacity: 0.7,
            depthWrite: false,
        });
        const stars = new THREE.Points(starGeo, starMat);
        stars.name = 'starfield';
        stars.renderOrder = 999;
        scene.add(stars);

        // =================================================================
        // === Trái tim hạt (bê nguyên từ trai_tim-tiktok_mua/assets) ===
        // =================================================================

        // --- makeMat: bê từ mins.js ---
        function makeMat({
            map = null,
            color = 0xffffff,
            transparent = true,
            vertexColors = true,
            sizeAttenuation = true,
            alphaSupport = false,
            clipBandWidth = 0,
            vClipSlope = 0,
            clipFrontZ = 0.1,
            blending = THREE.NormalBlending,
            opacity = 1,
            depthWrite = true,
        } = {}) {
            const material = new THREE.PointsMaterial({
                map, color, transparent, vertexColors, sizeAttenuation,
                blending, opacity, depthWrite,
            });
            material.onBeforeCompile = (shader) => {
                shader.vertexShader = shader.vertexShader.replace(
                    "uniform float size;",
                    "attribute float size;" +
                    (alphaSupport ? "\nattribute float alpha;\nvarying float vAlpha;" : "") +
                    (clipBandWidth > 0 || vClipSlope > 0 ? "\nvarying vec3 vViewPos;" : "")
                );
                let vertexShaderAddition = "";
                if (clipBandWidth > 0 || vClipSlope > 0) vertexShaderAddition += "  vViewPos = mvPosition.xyz;\n";
                if (alphaSupport) vertexShaderAddition += "  vAlpha = alpha;\n";
                if (vertexShaderAddition) {
                    shader.vertexShader = shader.vertexShader.replace(
                        "#include <project_vertex>",
                        "#include <project_vertex>\n" + vertexShaderAddition
                    );
                }
                if (alphaSupport) {
                    shader.fragmentShader = shader.fragmentShader
                        .replace("void main() {", "varying float vAlpha;\nvoid main() {")
                        .replace(
                            "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
                            "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
                        );
                }
                if (clipBandWidth > 0 || vClipSlope > 0) {
                    shader.fragmentShader = shader.fragmentShader.replace(
                        "void main() {",
                        "varying vec3 vViewPos;\nvoid main() {"
                    );
                    let clippingCode = "";
                    if (clipBandWidth > 0) {
                        clippingCode += "\n  if (vViewPos.z < -" + clipBandWidth.toFixed(3) +
                            " && abs(vViewPos.x) < " + clipFrontZ.toFixed(3) + ") discard;";
                    }
                    if (vClipSlope > 0) {
                        clippingCode += "if (abs(vViewPos.x) < " + clipFrontZ.toFixed(3) +
                            " && vViewPos.z < -" + vClipSlope.toFixed(3) + " * (-vViewPos.z)) discard;";
                    }
                    const insertionPoint = alphaSupport
                        ? "gl_FragColor = vec4( outgoingLight, diffuseColor.a * vAlpha );"
                        : "gl_FragColor = vec4( outgoingLight, diffuseColor.a );";
                    if (clippingCode) {
                        shader.fragmentShader = shader.fragmentShader.replace(
                            insertionPoint, clippingCode + "\n  " + insertionPoint
                        );
                    }
                }
            };
            return material;
        }

        // --- generateGlowCircleTexture (L546-579) ---
        function generateGlowCircleTexture() {
            const e = document.createElement("canvas");
            e.width = 256; e.height = 256;
            const o = e.getContext("2d");
            const s = o.createRadialGradient(128, 128, 50.800000000000004, 128, 128, 127);
            s.addColorStop(0, "rgba(255,255,255,0.6)");
            s.addColorStop(1, "rgba(255,255,255,0)");
            o.fillStyle = s;
            o.beginPath(); o.arc(128, 128, 127, 0, 2 * Math.PI); o.closePath(); o.fill();
            const r = o.createRadialGradient(128, 128, 0, 128, 128, 76.2);
            r.addColorStop(0, "rgba(255,255,255,1)");
            r.addColorStop(1, "rgba(255,255,255,0)");
            o.fillStyle = r;
            o.beginPath(); o.arc(128, 128, 76.2, 0, 2 * Math.PI); o.closePath(); o.fill();
            const n = new THREE.CanvasTexture(e);
            n.minFilter = THREE.LinearFilter;
            n.magFilter = THREE.LinearFilter;
            n.needsUpdate = true;
            return n;
        }

        const circleTexture = generateGlowCircleTexture();
        const SYMBOL_SCALE = innerWidth < 768 ? 0.96 : 1.28;
        const SYMBOL_Y = 19;
        const knowledgeSymbol = createKnowledgeSymbol({
            THREE, makeMat, texture: circleTexture, mobile: IS_MOBILE, reducedMotion
        });
        const symbolGroup = knowledgeSymbol.group;
        symbolGroup.scale.setScalar(SYMBOL_SCALE);
        symbolGroup.position.set(0, SYMBOL_Y, 0);
        scene.add(symbolGroup);

        // Restore the greeting to its original world position, with a dark
        // feathered halo and a crisp outline instead of a full-width panel.
        function greetingSprite(width, height, worldWidth, y) {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const texture = new THREE.CanvasTexture(canvas);
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            const material = new THREE.SpriteMaterial({map:texture, transparent:true, depthTest:false, depthWrite:false});
            material.toneMapped = false;
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(worldWidth, worldWidth * height / width, 1);
            sprite.position.set(0, y, 12);
            sprite.renderOrder = 1200;
            scene.add(sprite);
            return {canvas, texture, context:canvas.getContext('2d')};
        }
        const titleGreeting = greetingSprite(1536, 220, innerWidth < 768 ? 10.8 : 15, 8.8);
        const messageGreeting = greetingSprite(1024, 160, innerWidth < 768 ? 9.8 : 13.6, 7.1);
        function paintGreeting(target, text, family, maxSize, color) {
            const {canvas, context:c, texture} = target;
            c.clearRect(0, 0, canvas.width, canvas.height);
            let size = maxSize;
            do { c.font = '500 ' + size + 'px ' + family; size -= 2; }
            while (c.measureText(text).width > canvas.width - 100 && size > 24);
            const textWidth = c.measureText(text).width;
            c.save();
            c.translate(canvas.width / 2, canvas.height / 2);
            c.scale(Math.min(canvas.width / 2, textWidth / 2 + 90), canvas.height * 0.48);
            const halo = c.createRadialGradient(0, 0, 0.25, 0, 0, 1);
            halo.addColorStop(0, 'rgba(4,5,13,0.86)');
            halo.addColorStop(0.58, 'rgba(4,5,13,0.62)');
            halo.addColorStop(1, 'rgba(4,5,13,0)');
            c.fillStyle = halo; c.fillRect(-1, -1, 2, 2); c.restore();
            c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
            c.strokeStyle = 'rgba(3,4,12,0.95)'; c.lineWidth = maxSize > 60 ? 7 : 5;
            c.strokeText(text, canvas.width / 2, canvas.height / 2);
            c.fillStyle = color;
            c.shadowColor = '#000'; c.shadowBlur = 3;
            c.fillText(text, canvas.width / 2, canvas.height / 2);
            c.shadowBlur = 0; texture.needsUpdate = true;
        }
        const messages = __APP_CONFIG__.messages?.length ? __APP_CONFIG__.messages : [__APP_CONFIG__.title];
        let lastGreeting = -1;
        function repaintGreeting() {
            paintGreeting(titleGreeting, __APP_CONFIG__.title, '"Pacifico", cursive', 86, '#ffe2a8');
            paintGreeting(messageGreeting, messages[Math.max(0, lastGreeting)], '"Mali", sans-serif', 46, '#fff3df');
        }
        repaintGreeting();
        document.fonts?.ready.then(repaintGreeting);
        function updateMessageSprite(elapsed) {
            const index = Math.floor(elapsed / 5) % messages.length;
            if (index === lastGreeting) return;
            lastGreeting = index;
            paintGreeting(messageGreeting, messages[index], '"Mali", sans-serif', 46, '#fff3df');
        }

        // Particles gather from the galaxy core into the lotus garden.
        const REVEAL_DURATION = 5.5;
        let revealStart = null;
        let revealDone = false;
        const revealData = symbolGroup.children.filter(h => h.isPoints).map(h => {
            const posAttr = h.geometry.attributes.position;
            const target = new Float32Array(posAttr.array);
            const start = new Float32Array(target.length);
            const n = target.length / 3;
            for (let i = 0; i < n; i++) {
                // điểm ngẫu nhiên trên vỏ cầu world (khớp lõi galaxy L85-88)
                const phi = Math.acos(2 * Math.random() - 1);
                const theta = Math.random() * 2 * Math.PI;
                const r = 9.5 + Math.random() * 0.5;
                const wx = r * Math.sin(phi) * Math.cos(theta);
                const wy = r * Math.cos(phi);
                const wz = r * Math.sin(phi) * Math.sin(theta);
                // world → child local: inverse group (translate + scale), rồi inverse child rotation.z=PI
                start[i * 3]     = wx / SYMBOL_SCALE;
                start[i * 3 + 1] = (wy - SYMBOL_Y) / SYMBOL_SCALE;
                start[i * 3 + 2] =  (wz / SYMBOL_SCALE);
            }
            // khởi tạo vị trí ở sphere để frame đầu không flash
            posAttr.array.set(start);
            posAttr.needsUpdate = true;
            return { posAttr, target, start };
        });

        // --- Post-processing: AfterimagePass tạo trail cho tim đập ---
        // Mobile bỏ hẳn composer (3 full-screen pass/frame quá nặng cho Mali mid-range) → render thẳng
        let composer = null;
        if (!IS_MOBILE && !reducedMotion) {
            composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            const afterimagePass = new AfterimagePass();
            afterimagePass.uniforms['damp'].value = 0.82;
            composer.addPass(afterimagePass);
            composer.setSize(viewport.width, viewport.height);
        }

        // === Rải thưa ảnh vào đĩa xoáy (L88-95): tổng ~100 ảnh ===
        const photoFiles = (Array.isArray(__APP_CONFIG__.images) && __APP_CONFIG__.images.length)
            ? __APP_CONFIG__.images
            : ['anh1.jpeg', 'anh2.jpeg', 'anh3.jpeg', 'anh4.jpeg', 'anh5.jpeg', 'anh6.jpeg', 'anh7.jpeg'];
        const resolvePhotoSrc = (file) => file;
        const numPhotos = photoFiles.length;
        const totalPhotoInstances = IS_MOBILE ? 700 : 1600;
        const pointsPerPhoto = Math.max(3, Math.ceil(totalPhotoInstances / numPhotos));

        function createRoundedTexture(img, size = 256) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d');
            const aspect = img.width / img.height;
            let dw, dh, ox, oy;
            if (aspect > 1) { dw = size; dh = size / aspect; ox = 0; oy = (size - dh) / 2; }
            else { dh = size; dw = size * aspect; ox = (size - dw) / 2; oy = 0; }
            const r = size * 0.15;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ox + r, oy);
            ctx.arcTo(ox + dw, oy, ox + dw, oy + r, r);
            ctx.arcTo(ox + dw, oy + dh, ox + dw - r, oy + dh, r);
            ctx.arcTo(ox, oy + dh, ox, oy + dh - r, r);
            ctx.arcTo(ox, oy, ox + r, oy, r);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, ox, oy, dw, dh);
            ctx.restore();
            const tex = new THREE.CanvasTexture(canvas);
            if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        }

        const photoClouds = [];
        photoFiles.forEach((file, fileIdx) => {
            const positions = new Float32Array(pointsPerPhoto * 3);
            const rIn = 16, rOut = 85;
            const slice = Math.PI * 2 / pointsPerPhoto;
            for (let i = 0; i < pointsPerPhoto; i++) {
                const radius = Math.sqrt(rIn * rIn + Math.random() * (rOut * rOut - rIn * rIn));
                const theta = (i + fileIdx / numPhotos + Math.random()) * slice;
                positions[i * 3] = Math.cos(theta) * radius;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
                positions[i * 3 + 2] = Math.sin(theta) * radius;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const img = new window.Image();
            img.crossOrigin = 'Anonymous';
            img.src = resolvePhotoSrc(file);
            img.onload = () => {
                const tex = createRoundedTexture(img, 256);
                const baseSize = Math.max(2.0, Math.min(3.5, innerWidth / 600));
                const mat = new THREE.PointsMaterial({
                    size: baseSize,
                    map: tex,
                    color: 0xffffff,
                    transparent: true,
                    alphaTest: 0.25,
                    depthWrite: false,
                    sizeAttenuation: true
                });
                const photoPoints = new THREE.Points(geo, mat);
                photoPoints.userData.fileIndex = fileIdx;
                photoPoints.name = `galaxy-photos-${fileIdx}`;
                photoClouds.push(photoPoints);
                p.add(photoPoints);
            };
        });

        window.addEventListener('resize', () => {
            const baseSize = Math.max(2.0, Math.min(3.5, innerWidth / 600));
            p.children.forEach(child => {
                if (child.material && child.material.map && child.material.size !== undefined) {
                    child.material.size = baseSize;
                }
            });
        });


// Photo picking uses the same rotating point clouds that are visible on screen.
const viewer = document.getElementById('photo-viewer');
const viewerImage = document.getElementById('viewer-image');
const viewerCount = document.getElementById('viewer-count');
const viewerCaption = document.getElementById('viewer-caption');
let selectedPhoto = 0;
let previousFocus = null;
function displayPhoto(index) {
    selectedPhoto = (index + galleryPhotos.length) % galleryPhotos.length;
    const photo = galleryPhotos[selectedPhoto];
    viewerImage.src = photo.src;
    viewerImage.alt = photo.alt || `Kỷ niệm ${selectedPhoto + 1}`;
    viewerCount.textContent = `${String(selectedPhoto + 1).padStart(2, '0')} / ${String(galleryPhotos.length).padStart(2, '0')}`;
    viewerCaption.textContent = photo.wish || photo.caption || '';
}
function openPhoto(index) {
    cinematic.cancel();
    previousFocus = document.activeElement;
    displayPhoto(index);
    controls.enabled = false;
    controls.autoRotate = false;
    if (!viewer.open) viewer.showModal();
}
viewer.addEventListener('close', () => {
    controls.enabled = true;
    resetIdleTimer();
    previousFocus?.focus({preventScroll: true});
});
document.getElementById('viewer-close').addEventListener('click', () => viewer.close());
document.getElementById('viewer-prev').addEventListener('click', () => displayPhoto(selectedPhoto - 1));
document.getElementById('viewer-next').addEventListener('click', () => displayPhoto(selectedPhoto + 1));
// A tap opens the dialog on pointerup. Its following synthetic click must not
// immediately close it as a backdrop click on touch devices.
let startedOnBackdrop = false;
viewer.addEventListener('pointerdown', event => { startedOnBackdrop = event.target === viewer; });
viewer.addEventListener('pointerup', event => {
    if (startedOnBackdrop && event.target === viewer) viewer.close();
    startedOnBackdrop = false;
});
viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        displayPhoto(selectedPhoto + (event.key === 'ArrowLeft' ? -1 : 1));
    }
});
document.getElementById('gallery-open').addEventListener('click', () => openPhoto(0));
const cinematic = createGalaxyCinematic({
    THREE, scene, camera, controls, symbolGroup, canvas: renderer.domElement, reducedMotion,
    onStart() { clearTimeout(idleTimer); controls.autoRotate = false; },
    onEnd() { resetIdleTimer(); },
});


const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 1.25;
const pointer = new THREE.Vector2();
function photoAt(clientX, clientY) {
    const point = canvasPointer(clientX, clientY, renderer.domElement.getBoundingClientRect());
    if (!point) return null;
    pointer.set(point.x, point.y);
    camera.updateMatrixWorld();
    p.updateWorldMatrix(true, true);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(photoClouds, false)[0];
}
const activePointers = new Set();
let tapStart = null;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Ngân hà ảnh tương tác');
renderer.domElement.addEventListener('pointerdown', event => {
    activePointers.add(event.pointerId);
    renderer.domElement.style.cursor = 'grabbing';
    if (activePointers.size === 1) tapStart = {id: event.pointerId, x: event.clientX, y: event.clientY, dragged: false};
    else if (tapStart) tapStart.dragged = true;
    resetIdleTimer();
});
renderer.domElement.addEventListener('pointermove', event => {
    if (tapStart && Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) > 7) tapStart.dragged = true;
    if (!activePointers.size && event.pointerType !== 'touch') {
        renderer.domElement.style.cursor = cinematic.pick(event.clientX, event.clientY) || photoAt(event.clientX, event.clientY) ? 'pointer' : 'grab';
    }
});
renderer.domElement.addEventListener('pointerup', event => {
    activePointers.delete(event.pointerId);
    if (tapStart?.id === event.pointerId && !tapStart.dragged && !viewer.open) {
        const cinematicHit = cinematic.pick(event.clientX, event.clientY);
        const hit = photoAt(event.clientX, event.clientY);
        if (cinematicHit && (!hit || cinematicHit.distance <= hit.distance)) cinematic.start();
        else if (hit) openPhoto(hit.object.userData.fileIndex);
    }
    if (!activePointers.size) {
        tapStart = null;
        renderer.domElement.style.cursor = 'grab';
        resetIdleTimer();
    }
});
renderer.domElement.addEventListener('pointercancel', event => {
    activePointers.delete(event.pointerId);
    tapStart = null;
    renderer.domElement.style.cursor = 'grab';
    resetIdleTimer();
});
window.addEventListener('blur', () => {
    activePointers.clear(); tapStart = null;
    for (const key of Object.keys(keys)) keys[key] = false;
});

controls.autoRotateSpeed = 0.35;
controls.autoRotate = false;
let idleTimer;
function resetIdleTimer() {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
    if (!reducedMotion) idleTimer = setTimeout(() => {
        if (controls.enabled && !activePointers.size && !viewer.open && !cinematic.active) controls.autoRotate = true;
    }, 5000);
}
controls.addEventListener('start', resetIdleTimer);
controls.addEventListener('end', resetIdleTimer);
resetIdleTimer();
document.getElementById('view-reset').addEventListener('click', () => {
    cinematic.cancel();
    controls.autoRotate = false;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    camera.position.copy(defaultCameraPosition);
    controls.target.copy(defaultCameraTarget);
    controls.update();
    controls.enableDamping = damping;
    resetIdleTimer();
});

const clock = new THREE.Clock();
let sceneElapsed = 0;
let rotOffset = 0;
const PHOTO_DRIFT_RADIANS_PER_SECOND = 0.05; // Twice the previous 0.025 rad/s.
renderer.setAnimationLoop(() => {
    const frameDelta = Math.min(clock.getDelta(), 0.25);
    const delta = Math.min(frameDelta, 0.05);
    if (document.hidden) return;
    if (!viewer.open) {
        sceneElapsed += delta;
        if (!cinematic.active) {
        if (keys.ArrowLeft) rotOffset -= delta * 0.9;
        if (keys.ArrowRight) rotOffset += delta * 0.9;
        if (keys.ArrowUp) camera.position.y = Math.min(camera.position.y + delta * 12, 90);
        if (keys.ArrowDown) camera.position.y = Math.max(camera.position.y - delta * 12, -70);
        controls.update();
        }
    }
    const elapsed = sceneElapsed;
    const time = reducedMotion ? 0 : elapsed * 0.5;
    gu.time.value = time * Math.PI;
    p.rotation.y = (reducedMotion ? 0 : elapsed * PHOTO_DRIFT_RADIANS_PER_SECOND) + rotOffset;
    updateMessageSprite(elapsed);
    if (!revealDone) {
        if (revealStart === null) revealStart = elapsed;
        const progress = reducedMotion ? 1 : Math.min(1, (elapsed - revealStart) / REVEAL_DURATION);
        const eased = 1 - Math.pow(1 - progress, 3);
        revealData.forEach(({posAttr, target, start}) => {
            const array = posAttr.array;
            for (let i = 0; i < array.length; i++) array[i] = start[i] + (target[i] - start[i]) * eased;
            posAttr.needsUpdate = true;
        });
        if (progress >= 1) revealDone = true;
    }
    knowledgeSymbol.update(elapsed);
    cinematic.update(viewer.open ? 0 : frameDelta);
    if (composer) composer.render();
    else renderer.render(scene, camera);
    if (!window.__firstRendered) {
        window.__firstRendered = true;
        document.getElementById('galaxy-loading').hidden = true;
        document.body.dataset.ready = 'true';
    }
});
window.addEventListener('pagehide', () => {
    clearTimeout(idleTimer);
    renderer.setAnimationLoop(null);
    cinematic.dispose();
    controls.dispose();
    const textures = new Set();
    scene.traverse(object => {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        for (const material of materials) {
            if (material.map) textures.add(material.map);
            material.dispose();
        }
    });
    textures.forEach(texture => texture.dispose());
    if (composer) {
        composer.renderTarget1.dispose();
        composer.renderTarget2.dispose();
        composer.copyPass.material.dispose();
        composer.copyPass.fsQuad.dispose();
        for (const pass of composer.passes) {
            pass.textureComp?.dispose();
            pass.textureOld?.dispose();
            pass.compFsQuad?.material.dispose();
            pass.compFsQuad?.dispose();
            pass.copyFsQuad?.material.dispose();
            pass.copyFsQuad?.dispose();
        }
    }
    renderer.dispose();
    renderer.forceContextLoss();
}, {once: true});
