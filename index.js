function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }
    
    gl.deleteShader(shader);
}
function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    try {
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success) {
            return program;
        }

        gl.deleteProgram(program);
    } catch (err) {}
}
function fixCanvas() { // This isn't perfect but I really don't need that
    const canvas = document.querySelector("#background");
    let dpr = Math.min(1.0, window.devicePixelRatio); // I really don't need to render at 4k on mac
    dpr /= 4;
    const {width, height} = canvas.getBoundingClientRect();
    const displayWidth  = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    const needResize = canvas.width  != displayWidth || canvas.height != displayHeight;
    if (needResize) {
        canvas.width  = displayWidth;
        canvas.height = displayHeight;
    }
    return needResize;
}

const startTime = Date.now();
            
const canvas = document.querySelector("#background");
window.addEventListener('resize', fixCanvas, false);
window.addEventListener('resize', draw, false);
fixCanvas();
const gl = canvas.getContext( 'webgl', { antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true } );
var program;
var positionAttributeLocation;
var positionBuffer;	


function draw() {
    if (!gl) return;
    let dayProgress = (((Date.now()) + 43200000) % 86400000) / 86400000; // this is specifically in MY timezone
    let viewportResolutionLocation = gl.getUniformLocation(program, "resolution");
    let elapsedTimeLocation = gl.getUniformLocation(program, "time");
    let dayProgressLocation = gl.getUniformLocation(program, "dayProgress");

    gl.viewport(0, 0, canvas.width, canvas.height);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(viewportResolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(elapsedTimeLocation, (Date.now() - startTime) / 1000.0);
    gl.uniform1f(dayProgressLocation, dayProgress);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    let size = 2;          // 2 components per iteration
    let type = gl.FLOAT;   // the data is 32bit floats
    let normalize = false; // don't normalize the data
    let stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    let offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

function init() {

    if (!gl) {
        alert("WebGL not initialized! Check your browser's compatibility.\nDisabling background shader.");
        return;
    }

    let frag = createShader(gl, gl.FRAGMENT_SHADER, document.querySelector("#frag").text);
    let vert = createShader(gl, gl.VERTEX_SHADER, document.querySelector("#vert").text);
    program = createProgram(gl, vert, frag);

    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // three 2d points
    const positions = [
        -1, -1,
        -1,  1,
        1, -1,
        1,  1,
        -1,  1,
        1, -1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    setInterval(draw, 17);
};
init();

function handleAnchor(new_anchor) {
    let anchor = (typeof(new_anchor) === "string") ? new_anchor : window.location.hash.substring(1); // Get the anchor from the URL
    if (!anchor) {anchor = "about"};
    console.log(`going to ${anchor}`)
    if (anchor) {
      // Hide elements with a specific class or ID based on the anchor
      let elementsToHide = document.querySelectorAll(`div.article:not(#_${anchor})`);
      elementsToHide.forEach(element => {
        element.setAttribute("hidden", "");
      });
      let elementsToShow = document.querySelectorAll(`div.article#_${anchor}`);
      elementsToShow.forEach(element => {
        element.removeAttribute("hidden");
      });
    }
}

window.addEventListener("load", handleAnchor);

function allowNSFW() {
    let styleSheet = document.createElement("style")
    styleSheet.textContent = `
        .nsfw { display: inherit; }
    `
    document.head.appendChild(styleSheet)
}