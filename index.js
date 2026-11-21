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


const inpSketch = document.getElementById("num-characters-sketch");
const inpSimple = document.getElementById("num-characters-simple");
const inpHalf = document.getElementById("num-characters-half");
const inpFull = document.getElementById("num-characters-full");
const inpProps = document.getElementById("num-characters-props");
const inpBGChar = document.getElementById("num-characters-bg");
const inpShading = document.getElementById("calc-shading");
const inpColoring = document.getElementById("calc-coloring");
const inpBackground = document.getElementById("calc-background");
const inpNSFW = document.getElementById("calc-nsfw");
const outPrice = document.getElementById("calc-finalprice");

function updatePrice() {
    let sketchChars = +inpSketch.value;
    let simpleChars = +inpSimple.value;
    let halfChars = +inpHalf.value;
    let fullChars = +inpFull.value;
    let bgChars = +inpBGChar.value;
    let props = +inpProps.value;
    let doShading = inpShading.checked;
    let doColoring = inpColoring.checked
    let doBackground = inpBackground.checked;
    let totalChars = sketchChars + simpleChars + halfChars + fullChars;
    let price = 0;
    if (totalChars > 0) {
        price += (sketchChars > 1) ? (6 + (sketchChars - 1) * 2.5) : (sketchChars * 6);
        price += (simpleChars > 1) ? (8.5 + (simpleChars - 1) * 2.5) : (simpleChars * 8.5);
        price += (halfChars > 1) ? (6 + (halfChars - 1) * 2.5) : (halfChars * 6);
        price += (fullChars > 1) ? (12.5 + (fullChars - 1) * 5) : (fullChars * 12.5);
        if (doShading) price += totalChars * 1.5;
        if (doColoring) price += totalChars * 2.5;
        price += props;
    } else {
        if (doColoring) price += 0.5;
        price += (props > 1) ? (2 + props * 0.5) : (props * 2.5);
    }
    if (doBackground) price += 2.5;
    price += bgChars;
    if (inpNSFW.checked) {
        price = Math.floor(price * 1.35);
    }
    if (totalChars == 0 && props == 0) {
        price = "N/A"
    }
    outPrice.value = price;
}