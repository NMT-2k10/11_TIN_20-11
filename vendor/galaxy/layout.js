export function galaxyViewport(width, height) {
    return { width, height: Math.max(1, height) };
}

export function canvasPointer(x, y, rect) {
    if (rect.width <= 0 || rect.height <= 0 || x < rect.left || y < rect.top
        || x > rect.left + rect.width || y > rect.top + rect.height) return null;
    return { x: (x - rect.left) / rect.width * 2 - 1,
        y: -(y - rect.top) / rect.height * 2 + 1 };
}
