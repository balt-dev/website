/**
 * Intersects all valid placements of `runs` within `state` in-place.
 *
 * After the call, each cell in `state` reflects the intersection of every
 * valid placement that was consistent with the initial state:
 *   true      — true  in every valid placement
 *   false     — false in every valid placement
 *   undefined — differs across valid placements (no new information)
 *
 * Throws if the state is irreconcilable with the given runs.
 *
 * Short-circuit: generation stops as soon as every initially-undefined cell
 * has been seen as both true and false across the placements found so far,
 * because at that point the intersection for all of them is already determined
 * to be undefined — further placements cannot add any new information.
 */
export function intersectRunLengths(runs, state) {
    let width = state.length;
    // --- Trim leading/trailing definite-false cells ----------------------------
    // False cells can never be part of a run, so they're irrelevant to placement.
    // Trimming them aggressively shrinks the search space.
    let leftTrim = 0;
    while (leftTrim < width && state[leftTrim] === false)
        leftTrim++;
    let rightTrim = width - 1;
    while (rightTrim >= 0 && state[rightTrim] === false)
        rightTrim--;
    // Edge case: everything trimmed away (all cells are false).
    if (leftTrim > rightTrim) {
        if (runs.length > 0)
            throw new Error("Impossible: all cells are false but runs are non-empty.");
        return; // Nothing to do; state is already all false.
    }
    // Edge case: no runs to place.
    if (runs.length === 0) {
        for (let i = leftTrim; i <= rightTrim; i++) {
            if (state[i] === true)
                throw new Error(`Impossible: no runs but cell ${i} is true.`);
            state[i] = false;
        }
        return;
    }
    const trimmedWidth = rightTrim - leftTrim + 1;
    // Snapshot of the known values within the trimmed window.
    // We reference this throughout generation; state itself is only mutated at the end.
    const trimmedState = state.slice(leftTrim, rightTrim + 1);
    // Quick feasibility check before we bother searching.
    const minSpace = runs.reduce((a, r) => a + r, 0) + (runs.length - 1);
    if (trimmedWidth < minSpace)
        throw new Error(`Impossible: runs require at least ${minSpace} cells but only ${trimmedWidth} are available.`);
    // --- Short-circuit bookkeeping --------------------------------------------
    // For each cell that starts as undefined, we track whether we've seen it
    // land as true, false, or both across the placements enumerated so far.
    //   seenAs[i] & 0b01 → seen as false in at least one placement
    //   seenAs[i] & 0b10 → seen as true  in at least one placement
    //
    // Once seenAs[i] === 0b11 for every initially-undefined cell, the
    // intersection result for all those cells is definitively undefined, and no
    // further placements can change anything. We stop immediately.
    const seenAs = new Uint8Array(trimmedWidth);
    for (let i = 0; i < trimmedWidth; i++) {
        if (trimmedState[i] !== undefined)
            seenAs[i] = 0b11; // already resolved
    }
    let ambiguousCells = seenAs.reduce((n, v) => n + (v === 0b11 ? 0 : 1), 0);
    // Running intersection across placements found so far.
    let firstPlacement = true;
    let foundAny = false;
    let done = false;
    const allTrue = new Uint8Array(trimmedWidth); // 1 if true  in every placement so far
    const allFalse = new Uint8Array(trimmedWidth); // 1 if false in every placement so far
    function registerPlacement(placement) {
        foundAny = true;
        if (firstPlacement) {
            firstPlacement = false;
            for (let i = 0; i < trimmedWidth; i++) {
                allTrue[i] = placement[i] ? 1 : 0;
                allFalse[i] = placement[i] ? 0 : 1;
            }
        }
        else {
            // Narrow the intersection: a cell is "all-true" only if it's been true
            // in every placement, and vice versa.
            for (let i = 0; i < trimmedWidth; i++) {
                if (!placement[i])
                    allTrue[i] = 0;
                if (placement[i])
                    allFalse[i] = 0;
            }
        }
        // Update short-circuit state.
        for (let i = 0; i < trimmedWidth; i++) {
            if (seenAs[i] === 0b11)
                continue;
            const was = seenAs[i];
            seenAs[i] |= placement[i] ? 0b10 : 0b01;
            if (seenAs[i] === 0b11 && was !== 0b11)
                ambiguousCells--;
        }
        if (ambiguousCells === 0)
            done = true;
    }
    // Precompute suffix minimum-space requirements to avoid recomputing in the hot path.
    // suffixSpace[i] = minimum cells needed for runs[i..end] including their inter-run gaps.
    const suffixSpace = new Array(runs.length).fill(0);
    suffixSpace[runs.length - 1] = runs[runs.length - 1];
    for (let i = runs.length - 2; i >= 0; i--)
        suffixSpace[i] = suffixSpace[i + 1] + runs[i] + 1;
    function generate(runIndex, startPos, current) {
        if (done)
            return;
        if (runIndex === runs.length) {
            // All runs placed. Verify and fill the remaining tail with false.
            const placement = [...current];
            for (let i = startPos; i < trimmedWidth; i++) {
                if (trimmedState[i] === true)
                    return; // Contradiction: leftover true cell.
                placement[i] = false;
            }
            registerPlacement(placement);
            return;
        }
        const run = runs[runIndex];
        const maxStart = trimmedWidth - suffixSpace[runIndex];
        for (let pos = startPos; pos <= maxStart; pos++) {
            if (done)
                return;
            // The gap before this run (startPos..pos-1) must all be non-true.
            let valid = true;
            for (let i = startPos; i < pos; i++) {
                if (trimmedState[i] === true) {
                    // A definite-true cell in the gap can't be covered — shifting further
                    // right only widens the gap, so we're done with this loop entirely.
                    valid = false;
                    break;
                }
            }
            if (!valid)
                break; // Not `continue` — shifting right can't fix this.
            // The run body (pos..pos+run-1) must all be non-false.
            for (let i = pos; i < pos + run; i++) {
                if (trimmedState[i] === false) {
                    valid = false;
                    break;
                }
            }
            if (!valid)
                continue; // This position fails; a later one might not.
            // Commit gap + run body into a working copy of the placement.
            const next = [...current];
            for (let i = startPos; i < pos; i++)
                next[i] = false;
            for (let i = pos; i < pos + run; i++)
                next[i] = true;
            if (runIndex < runs.length - 1) {
                // The mandatory one-cell gap after this run must also be non-true.
                const gapPos = pos + run;
                if (trimmedState[gapPos] === true)
                    continue;
                next[gapPos] = false;
                generate(runIndex + 1, pos + run + 1, next);
            }
            else {
                generate(runIndex + 1, pos + run, next);
            }
        }
    }
    generate(0, 0, new Array(trimmedWidth).fill(undefined));
    if (!foundAny)
        throw new Error("Impossible: no valid placement exists for the given runs and state.");
    // --- Mutate state with the intersection results ----------------------------
    // We only update cells that started as undefined; known cells are untouched.
    for (let i = 0; i < trimmedWidth; i++) {
        if (trimmedState[i] !== undefined)
            continue;
        state[leftTrim + i] = allTrue[i] ? true : allFalse[i] ? false : undefined;
    }
}
