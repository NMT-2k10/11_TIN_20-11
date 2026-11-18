/* Camera tour adapted from the public reference's cinematic intro:
 * core reveal -> symbol arc/panorama -> spiral descent -> fly-through.
 * One timeline is updated by the scene loop; dragging, zooming or Escape
 * cancels it immediately so orbit controls never fight the camera animation.
 */
import { canvasPointer } from './layout.js';

export function createGalaxyCinematic({THREE, scene, camera, controls, symbolGroup, canvas, reducedMotion, onStart, onEnd}) {
    const abort = new AbortController();
    const listen = (element, type, handler, options = {}) => element.addEventListener(type, handler, {...options, signal: abort.signal});
    const target = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({visible: false}));
    const targetRadius = innerWidth < 768 ? 14.8 : 23.5;
    target.scale.set(targetRadius, 9, innerWidth < 768 ? 13 : 17);
    target.name = 'galaxy-symbol-target';
    target.position.copy(symbolGroup.position).add(new THREE.Vector3(0, -1, 0));
    scene.add(target);
    const coreTarget = new THREE.Mesh(new THREE.SphereGeometry(10.5, 24, 16), new THREE.MeshBasicMaterial({visible: false}));
    coreTarget.name = 'galaxy-core-target';
    scene.add(coreTarget);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const origin = new THREE.Vector3();
    const symbol = symbolGroup.position.clone();
    const pose = new THREE.Vector3();
    const look = new THREE.Vector3();
    const baseFov = camera.fov;
    let running = false;
    let segments = [];
    let index = 0;
    let elapsed = 0;
    let damping = controls.enableDamping;
    const sine = t => .5 - .5 * Math.cos(Math.PI * t);
    const smooth = t => t * t * (3 - 2 * t);
    const cubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const vector = (x, y, z) => new THREE.Vector3(x, y, z);
    function bridge(name, from, to, fromLook, toLook, duration) {
        return {name, duration, sample(t) {
            pose.lerpVectors(from, to, sine(t));
            look.lerpVectors(fromLook, toLook, sine(t));
        }};
    }
    function pause(position, lookAt, duration) {
        return {name: 'pause', duration, sample() {pose.copy(position); look.copy(lookAt);}};
    }
    function setState() {
        document.body.dataset.cinematicState = running ? 'playing' : 'idle';
        document.body.dataset.cinematicPhase = running ? segments[index].name : 'idle';
    }
    function stop() {
        if (!running) return;
        running = false;
        camera.fov = baseFov;
        camera.updateProjectionMatrix();
        controls.enableDamping = damping;
        controls.enabled = true;
        controls.update();
        segments = [];
        setState();
        onEnd();
    }
    function start() {
        if (running || document.querySelector('dialog[open]')) return;
        onStart();
        controls.autoRotate = false;
        damping = controls.enableDamping;
        controls.enableDamping = false;
        controls.update();
        const current = camera.position.clone();
        const currentLook = controls.target.clone();
        controls.enabled = false;
        const home = innerWidth < 768 ? vector(0, 9, 56) : vector(0, 9, 39);
        const homeLook = vector(0, 11, 0);
        const core = vector(0, 0, 3);
        // Frame the whole asymmetrical lotus garden in the closest orbit.
        const bounds = symbolGroup.userData.viewBounds;
        const worldScale = symbolGroup.scale.x;
        const halfFov = baseFov * Math.PI / 360;
        const horizontalFov = Math.atan(Math.tan(halfFov) * camera.aspect);
        const radius = bounds.radius * worldScale, height = bounds.height * worldScale;
        const symbolDistance = Math.max(radius / Math.sin(horizontalFov), radius + height / Math.tan(halfFov)) * 1.08;
        const symbolFront = vector(0, symbol.y, symbolDistance);
        const symbolBack = vector(0, symbol.y, -symbolDistance);
        const panorama = vector(0, 40, -55);
        const panoramaLook = vector(0, 8, 0);
        const sky = vector(-30, 80, 0);
        const descentEnd = vector(0, 19, 18);
        const flyStart = vector(0, 5, 40);
        const flyPath = new THREE.CatmullRomCurve3([flyStart, vector(0, -5, 5), symbolFront]);
        segments = [
            bridge('enter-core', current, core, currentLook, origin, .9),
            {name: 'zoom-out', duration: 13, sample(t) {
                const progress = t * 1.15;
                if (progress < .2) pose.lerpVectors(core, vector(0, 0, 20), progress / .2);
                else if (progress < .75) pose.lerpVectors(vector(0, 0, 20), vector(0, 0, 60), (progress - .2) / .55);
                else pose.lerpVectors(vector(0, 0, 60), home, sine((progress - .75) / .4));
                if (progress < .75) look.copy(origin);
                else look.lerpVectors(origin, homeLook, sine(Math.min(1, (progress - .75) / .4)));
            }},
            pause(home, homeLook, .4),
            bridge('approach-symbol', home, symbolFront, homeLook, symbol, 2.5),
            {name: 'panorama', duration: 10, sample(t) {
                if (t < .5) {
                    const angle = Math.PI / 2 + Math.PI * smooth(t * 2);
                    pose.set(Math.cos(angle) * symbolDistance, symbol.y, Math.sin(angle) * symbolDistance);
                    look.copy(symbol);
                } else {
                    const progress = smooth((t - .5) * 2);
                    pose.lerpVectors(symbolBack, panorama, progress);
                    look.lerpVectors(symbol, panoramaLook, progress);
                }
            }},
            pause(panorama, panoramaLook, .4),
            bridge('rise', panorama, sky, panoramaLook, origin, 3),
            {name: 'spiral-descent', duration: 12, sample(t) {
                const progress = cubic(t);
                const angle = Math.PI + Math.PI * 1.5 * progress;
                const radius = 30 - 12 * progress;
                pose.set(Math.cos(angle) * radius, 80 - 61 * progress, Math.sin(angle) * radius);
                look.lerpVectors(origin, symbol, progress);
            }},
            bridge('return-home', descentEnd, home, symbol, homeLook, 4),
            pause(home, homeLook, .4),
            bridge('approach-disc', home, flyStart, homeLook, origin, 1.8),
            {name: 'fly-through', duration: 11, sample(t) {
                const progress = t + .35 * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
                flyPath.getPoint(progress, pose);
                look.lerpVectors(origin, symbol, progress * progress);
                camera.fov = baseFov + 15 * Math.sin(t * Math.PI);
            }},
        ];
        if (reducedMotion) {
            // Keep a gentle overview transition instead of fast orbit/warp motion.
            const overview = vector(0, 40, 65);
            segments = [
                bridge('overview', current, overview, currentLook, panoramaLook, 1.2),
                bridge('return-view', overview, current, panoramaLook, currentLook, 1.2),
            ];
        }
        index = 0; elapsed = 0; running = true;
        setState();
    }
    function update(delta) {
        if (!running) return;
        elapsed += delta;
        while (elapsed >= segments[index].duration) {
            const segment = segments[index];
            segment.sample(1);
            camera.position.copy(pose);
            controls.target.copy(look);
            camera.lookAt(look);
            elapsed -= segment.duration;
            index++;
            if (index === segments.length) { stop(); return; }
            setState();
        }
        camera.fov = baseFov;
        const segment = segments[index];
        segment.sample(Math.min(1, elapsed / segment.duration));
        camera.position.copy(pose);
        controls.target.copy(look);
        camera.lookAt(look);
        camera.updateProjectionMatrix();
    }
    function pick(x, y) {
        const point = canvasPointer(x, y, canvas.getBoundingClientRect());
        if (!point) return null;
        pointer.set(point.x, point.y);
        camera.updateMatrixWorld();
        target.updateWorldMatrix(true, false);
        coreTarget.updateWorldMatrix(true, false);
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObjects([target, coreTarget], false)[0] || null;
    }
    listen(canvas, 'keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault(); start();
        }
    });
    listen(canvas, 'pointerdown', stop, {capture: true});
    listen(canvas, 'wheel', stop, {capture: true, passive: true});
    listen(window, 'keydown', event => {
        if (['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) stop();
    });
    setState();
    return {get active() {return running;}, start, cancel: stop, update, pick, dispose() {abort.abort(); running = false; segments = [];}};
}
