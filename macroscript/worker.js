import initSync, { init as setupHooks, apply } from '/macroscript/pkg/macroscript_wasm.js';


async function run() {
    await initSync();
    setupHooks();
}
run();

onmessage = (e) =>  {
    try {
        postMessage(apply(e.data))
    } catch (e) {
        postMessage(e.toString())
    }
}