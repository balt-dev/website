"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { checkRowOrColumn } from "./slop.js";
const invalid = { pattern: 'a', value: 'b' };
const textarea = Object.assign(document.createElement('textarea'), invalid);
if (textarea.checkValidity()) {
    const input = Object.assign(document.createElement('input'), invalid);
    document.body.addEventListener('input', (e) => {
        if (e.target.matches('textarea[pattern]')) {
            const pattern = new RegExp(`^(?:${e.target.getAttribute('pattern')})$`);
            e.target.setCustomValidity(pattern.test(e.target.value)
                ? ''
                : "Please input a line-separated list of comma-separated hints.\nFor an empty row/column, input a single 0.");
        }
    });
}
(() => {
    const formNode = document.getElementById("input-form");
    const gridNode = document.getElementById("grid");
    let rowHintSize = 0;
    let columnHintSize = 0;
    let rowHints = [];
    let columnHints = [];
    let board = [];
    function constructTable() {
        var _a, _b;
        let width = columnHints.length;
        let height = rowHints.length;
        for (let y = 0; y < height; y++) {
            board[y] = new Array(width).fill(undefined);
        }
        let newChildren = [];
        for (let y = -columnHintSize; y < height; y++) {
            let rowNode = document.createElement("tr");
            for (let x = -rowHintSize; x < width; x++) {
                let cellNode = document.createElement("td");
                let xLabel = `X${("" + x)}`;
                let yLabel = `Y${("" + y)}`;
                let hint = undefined;
                if (x < 0 && y < 0) { }
                else if (x < 0)
                    hint = (_a = rowHints[y]) === null || _a === void 0 ? void 0 : _a[rowHints[y].length + x];
                else if (y < 0)
                    hint = (_b = columnHints[x]) === null || _b === void 0 ? void 0 : _b[columnHints[x].length + y];
                if (hint !== undefined)
                    cellNode.textContent = "" + hint;
                cellNode.classList.add(xLabel);
                cellNode.classList.add(yLabel);
                if (x % 5 === 0)
                    cellNode.classList.add("cell-leftBorder");
                if (y % 5 === 0)
                    cellNode.classList.add("cell-topBorder");
                cellNode.id = `cell-${xLabel}-${yLabel}`;
                rowNode.appendChild(cellNode);
            }
            newChildren.push(rowNode);
        }
        gridNode.replaceChildren(...newChildren);
    }
    let lock = false;
    let activeIndex = 0;
    let activeKind = "X";
    function updateBoardVisual() {
        for (let y = 0; y < board.length; y++) {
            for (let x = 0; x < board[0].length; x++) {
                let el = document.getElementById(`cell-X${x}-Y${y}`);
                let state = board[y][x];
                if (state === true) {
                    el === null || el === void 0 ? void 0 : el.classList.add("filledCell");
                }
                else if (state === false) {
                    el === null || el === void 0 ? void 0 : el.classList.add("crossedCell");
                }
            }
        }
        document.querySelectorAll(".highlightedCell").forEach((el) => el.classList.remove("highlightedCell"));
        document.querySelectorAll(`.${activeKind}${activeIndex}`).forEach((el) => el.classList.add("highlightedCell"));
    }
    const waitFrame = () => new Promise((resolve, _) => {
        requestAnimationFrame(resolve);
    });
    function gridStep() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let changed = false;
                activeKind = "Y";
                for (let y = 0; y < board.length; y++) {
                    activeIndex = y;
                    let hints = rowHints[y];
                    if (checkRowOrColumn(hints, board[0].length, (index) => board[y][index], (index, value) => board[y][index] = value)) {
                        changed = true;
                        updateBoardVisual();
                        yield waitFrame();
                    }
                }
                activeKind = "X";
                for (let x = 0; x < board[0].length; x++) {
                    activeIndex = x;
                    let hints = columnHints[x];
                    if (checkRowOrColumn(hints, board.length, (index) => board[index][x], (index, value) => board[index][x] = value)) {
                        changed = true;
                        updateBoardVisual();
                        yield waitFrame();
                    }
                }
                if (!changed) {
                    requestAnimationFrame(() => alert("Board got stuck while solving. The puzzle is ambiguous."));
                    lock = false;
                    return;
                }
                if (board.every((row) => row.every((cell) => cell !== undefined))) {
                    updateBoardVisual();
                    requestAnimationFrame(() => alert("Board solved!"));
                    lock = false;
                    return;
                }
            }
            catch (e) {
                lock = false;
                requestAnimationFrame(() => alert(`Ran into issue while solving.\n${e}`));
                return;
            }
            requestAnimationFrame(gridStep);
        });
    }
    function solveGrid() {
        if (lock)
            return;
        lock = true;
        requestAnimationFrame(gridStep);
    }
    formNode.addEventListener("submit", (e) => {
        var _a, _b;
        e.preventDefault();
        const formData = new FormData(formNode);
        const rawRows = (_a = formData.get("rows")) === null || _a === void 0 ? void 0 : _a.toString();
        const rawColumns = (_b = formData.get("columns")) === null || _b === void 0 ? void 0 : _b.toString();
        // Parse the rows and columns into lists of lists of numbers
        let parsedRows = rawRows === null || rawRows === void 0 ? void 0 : rawRows.split("\n").map((s) => s.split(",")
            .filter((s) => s.length !== 0)
            .map((n) => +(n.trim())));
        let parsedColumns = rawColumns === null || rawColumns === void 0 ? void 0 : rawColumns.split("\n").map((s) => s.split(",")
            .filter((s) => s.length !== 0)
            .map((n) => +(n.trim())));
        let width = parsedColumns.length;
        let height = parsedRows.length;
        let hintWidth = Math.max(...parsedRows.map((l) => l.length - 1 + l.reduce((a, b) => a + b, 0)));
        let hintHeight = Math.max(...parsedColumns.map((l) => l.length - 1 + l.reduce((a, b) => a + b, 0)));
        if (hintWidth > width) {
            alert("The specified column hints imply a width larger than the length of the row hints. Please double check your hint input.");
            return;
        }
        if (hintHeight > width) {
            alert("The specified column hints imply a width larger than the length of the row hints. Please double check your hint input.");
            return;
        }
        rowHintSize = Math.max(...parsedRows.map((l) => l.length));
        columnHintSize = Math.max(...parsedColumns.map((l) => l.length));
        rowHints = parsedRows;
        columnHints = parsedColumns;
        constructTable();
        requestAnimationFrame(solveGrid);
    });
})();
