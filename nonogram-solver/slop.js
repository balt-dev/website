export function checkRowOrColumn(hints, size, getter, setter) {
    const k = hints.length;
    if (k < 1) {
        for (let i = 0; i < size; i++)
            setter(i, false);
        return false;
    }
    // JS Sets use reference equality for objects, so encode (r, p) as a string
    const encode = (r, p) => `${r},${p}`;
    const decode = (s) => {
        const [r, p] = s.split(',').map(Number);
        return [r, p];
    };
    // Check for if it would be appropriate for the next cell to be filled
    const fillTransition = (r, p) => {
        if (r >= k || p >= hints[r])
            return null;
        return encode(r, p + 1);
    };
    // Check for if it would be appropriate for the next cell to be crossed
    const crossTransition = (r, p) => {
        if (p === 0)
            return encode(r, 0);
        if (p === hints[r])
            return encode(r + 1, 0);
        return null;
    };
    const forwardSets = Array.from({ length: size + 1 }, () => new Set());
    forwardSets[0].add(encode(0, 0));
    for (let j = 0; j < size; j++) {
        for (const state of forwardSets[j]) {
            const [r, p] = decode(state);
            if (getter(j) !== false) {
                const s = fillTransition(r, p);
                if (s !== null)
                    forwardSets[j + 1].add(s);
            }
            if (getter(j) !== true) {
                const s = crossTransition(r, p);
                if (s !== null)
                    forwardSets[j + 1].add(s);
            }
        }
    }
    // Add valid terminal states - either trailing gap, or end of row
    const validEnd = new Set([encode(k, 0), encode(k - 1, hints[k - 1])]);
    // Check for a contradiction
    if (![...forwardSets[size]].some(s => validEnd.has(s)))
        return false;
    const backwardSets = Array.from({ length: size + 1 }, () => new Set());
    for (const s of validEnd)
        backwardSets[size].add(s);
    for (let j = size - 1; j >= 0; j--) {
        for (const state of backwardSets[j + 1]) {
            const [r, p] = decode(state);
            if (getter(j) !== false && p >= 1 && r < k && p <= hints[r]) {
                backwardSets[j].add(encode(r, p - 1));
            }
            if (getter(j) !== true && p === 0) {
                backwardSets[j].add(encode(r, 0));
                if (r > 0) {
                    backwardSets[j].add(encode(r - 1, hints[r - 1]));
                }
            }
        }
    }
    // Deduce any forced cells
    let changed = false;
    for (let j = 0; j < size; j++) {
        if (getter(j) !== undefined)
            continue;
        const canFill = [...forwardSets[j]].some(state => {
            const [r, p] = decode(state);
            const s = fillTransition(r, p);
            return s !== null && backwardSets[j + 1].has(s);
        });
        const canCross = [...forwardSets[j]].some(state => {
            const [r, p] = decode(state);
            const s = crossTransition(r, p);
            return s !== null && backwardSets[j + 1].has(s);
        });
        if (!canFill) {
            setter(j, false);
            changed = true;
        }
        else if (!canCross) {
            setter(j, true);
            changed = true;
        }
    }
    return changed;
}
