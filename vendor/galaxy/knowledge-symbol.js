// A sculpted lotus made entirely of luminous particles, like the galaxy core.
export const LOTUS_TIERS = [
    { name: 'outer-rose-petals', petals: 10, radius: 10.6, height: 3.1, width: 3.8, base: -2.6, root: 1.0, offset: Math.PI / 10 },
    { name: 'middle-blush-petals', petals: 8, radius: 7.8, height: 4.4, width: 3.2, base: -1.8, root: 1.2, offset: 0 },
    { name: 'inner-ivory-petals', petals: 6, radius: 4.8, height: 5.1, width: 2.35, base: -0.9, root: 1.4, offset: Math.PI / 6 },
    { name: 'lower-rose-petals', petals: 10, radius: 8.8, height: 1.6, width: 3.7, base: -3.2, root: 0.7, offset: 0 }
];

export function lotusPetalPoint(tier, petal, t, across) {
    const angle = tier.offset + petal * Math.PI * 2 / tier.petals;
    const radial = tier.root + tier.radius * Math.sin(t * Math.PI / 2);
    const width = tier.width * Math.pow(Math.sin(t * Math.PI), 0.66);
    const lateral = across * width;
    // Broad petals arch outward and roll down at their tips, rather than
    // converging into an upright cup. Each tier has its own attachment ring.
    const y = tier.base + tier.height * Math.sin(t * Math.PI * 0.88)
        + 0.30 * across * across * Math.sin(t * Math.PI)
        - 0.18 * (1 - across * across) * Math.sin(t * Math.PI);
    return [Math.cos(angle) * radial - Math.sin(angle) * lateral,
        y, Math.sin(angle) * radial + Math.cos(angle) * lateral];
}

export function buildKnowledgeParticles({ mobile = false, detail = 1, random = Math.random } = {}) {
    const layers = [];
    const count = n => Math.max(2, Math.round(n * (mobile ? 0.5 : 1) * detail));
    const layer = name => {
        const result = { name, positions: [], colors: [], sizes: [], travel: [] };
        layers.push(result);
        return result;
    };
    const add = (data, p, color, size, travel) => {
        // Tilt the open bloom toward the default low camera to expose its center.
        const tilt = 0.38;
        data.positions.push(p[0], p[1] * Math.cos(tilt) - p[2] * Math.sin(tilt),
            p[1] * Math.sin(tilt) + p[2] * Math.cos(tilt));
        data.colors.push(...color);
        data.sizes.push(size); data.travel.push(travel);
    };
    LOTUS_TIERS.forEach((tier, ring) => {
        const surface = layer(tier.name);
        const rim = layer(tier.name + '-gold-rim');
        for (let petal = 0; petal < tier.petals; petal++) {
            for (let i = 0; i < count(ring === 2 ? 1300 : 1600); i++) {
                const t = 0.12 + random() * 0.875, across = random() * 2 - 1;
                const p = lotusPetalPoint(tier, petal, t, across);
                p[1] += (random() - 0.5) * 0.10;
                const glow = 0.88 + 0.12 * t;
                const color = ring === 2 ? [glow, glow * (0.60 + t * 0.17), glow * (0.57 + t * 0.12)]
                    : [glow, glow * (0.30 + t * 0.24), glow * (0.43 + t * 0.18)];
                add(surface, p, color, 0.135 + random() * 0.065, t);
            }
            // Trace both edges in a continuous curve; tips stay fine and pointed.
            for (let i = 0; i < count(130); i++) {
                const t = (i + random() * 0.25) / count(130);
                for (const side of [-1, 1]) {
                    if (t > 0.12) add(rim, lotusPetalPoint(tier, petal, t, side),
                        [1, 0.67 + t * 0.17, 0.67 + t * 0.09], 0.105 + random() * 0.025, t);
                }
            }
            // Fine branching veins follow the actual curved petal surface.
            for (const branch of [-0.65, -0.32, 0, 0.32, 0.65]) {
                for (let i = 0; i < count(42); i++) {
                    const t = 0.19 + i / count(42) * 0.72;
                    const p = lotusPetalPoint(tier, petal, t, branch * Math.sin(t * Math.PI / 2));
                    p[1] += 0.025;
                    add(rim, p, [0.85, 0.43 + t * 0.17, 0.53], 0.075, t);
                }
            }
        }
    });
    // A scalloped calyx fills the underside without a bright pedestal or stem.
    const calyx = layer('lotus-sculpted-calyx');
    for (let i = 0; i < count(2400); i++) {
        const angle = random() * Math.PI * 2, t = Math.sqrt(random());
        const radius = t * (3.5 + Math.cos(angle * 8) * 0.35);
        add(calyx, [Math.cos(angle) * radius, -3.6 + Math.sin(t * Math.PI) * 0.65,
            Math.sin(angle) * radius], [0.33 + t * 0.15, 0.49 + t * 0.08, 0.34],
            0.12 + random() * 0.045, t);
    }
    const sepals = layer('lotus-calyx-sepals');
    const sepalTier = { petals: 8, radius: 4.9, height: 1.05, width: 1.5,
        base: -3.55, root: 0.5, offset: Math.PI / 8 };
    for (let sepal = 0; sepal < 8; sepal++) {
        for (let i = 0; i < count(240); i++) {
            const t = 0.12 + random() * 0.87;
            add(sepals, lotusPetalPoint(sepalTier, sepal, t, random() * 2 - 1),
                [0.34 + t * 0.16, 0.61, 0.43], 0.12, t);
        }
    }
    const center = layer('lotus-seedpod');
    for (let i = 0; i < count(1800); i++) {
        const angle = random() * Math.PI * 2, r = Math.sqrt(random()) * 1.45;
        add(center, [Math.cos(angle) * r, 1.25 + 0.32 * (1 - r * r / 2.1), Math.sin(angle) * r],
            [0.86, 0.69 + random() * 0.12, 0.30], 0.11, r / 1.45);
    }
    const stamens = layer('golden-lotus-stamens');
    for (let i = 0; i < 80; i++) {
        const angle = i / 80 * Math.PI * 2, r = 1.6 + random() * 0.60;
        const length = 0.65 + random() * 0.65;
        for (let j = 0; j < count(32); j++) {
            const t = j / (count(32) - 1), radius = r + t * 0.22;
            add(stamens, [Math.cos(angle) * radius, 0.45 + t * length, Math.sin(angle) * radius],
                [1, 0.80, 0.38], 0.075 + t * 0.045, t);
        }
        add(stamens, [Math.cos(angle) * (r + 0.22), 0.45 + length, Math.sin(angle) * (r + 0.22)],
            [1, 0.94, 0.65], 0.22, 1);
    }
    const seeds = layer('lotus-seed-details');
    for (let i = 0; i < 13; i++) {
        const r = i === 0 ? 0 : i < 5 ? 0.55 : 1.05;
        const angle = i * 2.39996, x = Math.cos(angle) * r, z = Math.sin(angle) * r;
        for (let j = 0; j < count(36); j++) {
            const a = j / count(36) * Math.PI * 2;
            add(seeds, [x + Math.cos(a) * 0.12, 1.60 - r * r * 0.15, z + Math.sin(a) * 0.12],
                [0.98, 0.89, 0.54], 0.065, r);
        }
    }
    const leaves = layer('lotus-leaves');
    const leafVeins = layer('lotus-leaf-veins');
    const leafPoint = (side, angle, r) => [side * 6.5 + Math.cos(angle) * r * 4.9,
        -3.15 + r * r * 0.45 + Math.sin(angle * 3) * r * 0.10,
        -2.4 + Math.sin(angle) * r * 3.4];
    for (const side of [-1, 1]) {
        for (let i = 0; i < count(1900); i++) {
            const angle = 0.20 + random() * (Math.PI * 2 - 0.4), r = Math.sqrt(random());
            add(leaves, leafPoint(side, angle, r), [0.26, 0.57 + r * 0.13, 0.45],
                0.115 + random() * 0.045, r);
        }
        for (let vein = 0; vein < 12; vein++) {
            const angle = 0.23 + vein / 12 * (Math.PI * 2 - 0.46);
            for (let j = 0; j < count(55); j++) {
                const r = 0.08 + j / count(55) * 0.88;
                const p = leafPoint(side, angle, r);
                p[1] += 0.025;
                add(leafVeins, p, [0.48, 0.76, 0.52], 0.075, r);
            }
        }
    }
    const dew = layer('lotus-dewdrops');
    for (let i = 0; i < 36; i++) {
        const tier = LOTUS_TIERS[i % LOTUS_TIERS.length], petal = i % tier.petals;
        const p = lotusPetalPoint(tier, petal, 0.55 + random() * 0.25, (random() - 0.5) * 0.8);
        p[1] += 0.12;
        for (let j = 0; j < count(18); j++) {
            const a = random() * Math.PI * 2, r = random() * 0.09;
            add(dew, [p[0] + Math.cos(a) * r, p[1] + random() * 0.06, p[2] + Math.sin(a) * r],
                [0.80, 0.94, 1], 0.11 + random() * 0.04, random());
        }
    }
    return layers;
}

export function buildLotusGarden({ mobile = false, random = Math.random } = {}) {
    const layers = buildKnowledgeParticles({ mobile, random });
    const companions = [
        { x: mobile ? -8.2 : -11.8, y: -1.6, z: -4.8, scale: 0.35, angle: -0.32, light: 0.78 },
        { x: mobile ? 9.2 : 12.4, y: 0.4, z: -6.5, scale: 0.50, angle: 0.38, light: 0.88 }
    ];
    for (const flower of companions) {
        const details = buildKnowledgeParticles({ mobile, detail: flower.scale, random });
        details.forEach((source, index) => {
            const target = layers[index];
            const cs = Math.cos(flower.angle), sn = Math.sin(flower.angle);
            for (let i = 0; i < source.sizes.length; i++) {
                const x = source.positions[i * 3], y = source.positions[i * 3 + 1], z = source.positions[i * 3 + 2];
                target.positions.push((x * cs + z * sn) * flower.scale + flower.x,
                    y * flower.scale + flower.y, (z * cs - x * sn) * flower.scale + flower.z);
                target.colors.push(source.colors[i * 3] * flower.light,
                    source.colors[i * 3 + 1] * flower.light, source.colors[i * 3 + 2] * flower.light);
                target.sizes.push(source.sizes[i] * Math.sqrt(flower.scale));
                target.travel.push(source.travel[i]);
            }
        });
    }
    return layers;
}

// Split the memories into two rear arcs, leaving the flower and title clear.
export function memoryArcPoint(side, progress, band = 0.5) {
    const angle = side < 0 ? Math.PI + 0.18 + progress * 0.95 : Math.PI * 2 - 0.18 - progress * 0.95;
    const radius = 27 + band * 24;
    return [Math.cos(angle) * radius, 2.3 + Math.sin(progress * Math.PI) * 4.2 + (band - 0.5) * 1.2,
        Math.sin(angle) * radius];
}

export function createKnowledgeSymbol({ THREE, makeMat, texture, mobile, reducedMotion }) {
    const group = new THREE.Group();
    group.name = 'lotus-garden-of-gratitude';
    const viewBounds = { radius: 0, height: 0 };
    group.userData.viewBounds = viewBounds;
    const clock = { value: 0 };
    for (const layer of buildLotusGarden({ mobile })) {
        for (let i = 0; i < layer.positions.length; i += 3) {
            viewBounds.radius = Math.max(viewBounds.radius, Math.hypot(layer.positions[i], layer.positions[i + 2]));
            viewBounds.height = Math.max(viewBounds.height, Math.abs(layer.positions[i + 1]));
        }
        const geometry = new THREE.BufferGeometry();
        for (const [name, values, size] of [
            ['position', layer.positions, 3], ['color', layer.colors, 3],
            ['size', layer.sizes, 1], ['aTravel', layer.travel, 1]
        ]) geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, size));
        const material = makeMat({ map: texture, depthWrite: false,
            blending: THREE.AdditiveBlending, opacity: layer.name.includes('rim') ? 0.38
                : ['lotus-leaves', 'lotus-sculpted-calyx', 'lotus-calyx-sepals'].includes(layer.name) ? 0.50 : 0.76 });
        const compile = material.onBeforeCompile;
        material.onBeforeCompile = shader => {
            compile(shader);
            shader.uniforms.uLotusTime = clock;
            shader.vertexShader = 'uniform float uLotusTime;\nattribute float aTravel;\nvarying float vLotusGlow;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
                '#include <begin_vertex>\nfloat wave = pow(0.5 + 0.5 * cos(aTravel * 4.0 - uLotusTime * 0.55), 4.0);\nvLotusGlow = 0.91 + wave * 0.13;');
            shader.fragmentShader = 'varying float vLotusGlow;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                'gl_FragColor = vec4( outgoingLight * vLotusGlow, diffuseColor.a );');
        };
        material.customProgramCacheKey = () => 'lotus-particles-v1';
        const points = new THREE.Points(geometry, material);
        points.name = layer.name;
        points.frustumCulled = false;
        group.add(points);
    }
    return { group, update(elapsed) { clock.value = reducedMotion ? 0 : elapsed; } };
}
