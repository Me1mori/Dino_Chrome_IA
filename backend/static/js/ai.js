// ai.js

const INPUT_SIZE = 6;
const HIDDEN_SIZE = 6;
const OUTPUT_SIZE = 1;

const POPULATION_SIZE = 20;
let brains = [];
let bestBrain = null;

// ===== Red Neuronal =====
class Brain {
    constructor() {
        this.w1 = randomMatrix(INPUT_SIZE, HIDDEN_SIZE);
        this.b1 = randomArray(HIDDEN_SIZE);
        this.w2 = randomMatrix(HIDDEN_SIZE, OUTPUT_SIZE);
        this.b2 = randomArray(OUTPUT_SIZE);
        this.score = 0;
    }

    predict(inputs) {
        const h = this.activate(add(dot(inputs, this.w1), this.b1));
        const o = this.activate(add(dot(h, this.w2), this.b2))[0];
        this.lastInput = inputs;
        this.lastHidden = h;
        this.lastOutput = [o];
        return o > 0.5 ? 1 : o < -0.5 ? -1 : 0;
    }

    activate(v) {
        return v.map(x => Math.tanh(x));
    }

    clone() {
        const b = new Brain();
        b.w1 = copyMatrix(this.w1);
        b.b1 = [...this.b1];
        b.w2 = copyMatrix(this.w2);
        b.b2 = [...this.b2];
        return b;
    }

    mutate(rate = 0.1) {
        mutateMatrix(this.w1, rate);
        mutateMatrix(this.w2, rate);
        mutateArray(this.b1, rate);
        mutateArray(this.b2, rate);
    }

    toJSON() {
        return {
            w1: this.w1, w2: this.w2,
            b1: this.b1, b2: this.b2
        };
    }

    static fromJSON(data) {
        const b = new Brain();
        b.w1 = data.w1;
        b.w2 = data.w2;
        b.b1 = data.b1;
        b.b2 = data.b2;
        return b;
    }
}

// ===== Utils =====
function randomArray(n) {
    return Array.from({ length: n }, () => Math.random() * 2 - 1);
}

function randomMatrix(r, c) {
    return Array.from({ length: r }, () => randomArray(c));
}

function copyMatrix(m) {
    return m.map(row => [...row]);
}

function dot(a, b) {
    const result = [];
    for (let i = 0; i < b[0].length; i++) {
        let sum = 0;
        for (let j = 0; j < a.length; j++) {
            sum += a[j] * b[j][i];
        }
        result.push(sum);
    }
    return result;
}

function add(v, bias) {
    return v.map((val, i) => val + bias[i]);
}

function mutateArray(arr, rate) {
    for (let i = 0; i < arr.length; i++) {
        if (Math.random() < rate) {
            arr[i] += (Math.random() * 2 - 1) * 0.5;
        }
    }
}

function mutateMatrix(m, rate) {
    for (let i = 0; i < m.length; i++) {
        mutateArray(m[i], rate);
    }
}

// ===== Evolución =====
function initBrains() {
    brains = [];
    dinos = [];
    generation = parseInt(localStorage.getItem("generation")) || 1;

    const saved = localStorage.getItem("bestBrain");
    if (saved) bestBrain = Brain.fromJSON(JSON.parse(saved));

    for (let i = 0; i < POPULATION_SIZE; i++) {
        let brain = bestBrain ? bestBrain.clone() : new Brain();
        if (i !== 0) brain.mutate(0.1);
        brains.push(brain);

        const dino = new Dinosaur();
        dino.brain = brain;
        dinos.push(dino);
    }

    currentAlive = POPULATION_SIZE;
    gameSpeed = 7;
    gameOver = false;
}

function evolve() {
    brains.sort((a, b) => b.score - a.score);

    // Usar los top 3
    const parents = brains.slice(0, 3);
    bestBrain = parents[0].clone();

    localStorage.setItem("bestBrain", JSON.stringify(bestBrain.toJSON()));
    localStorage.setItem("generation", generation + 1);
    generationScore = 0;
    generation++;
    resetGame();

    // nueva población con mutaciones de los 3 mejores
    brains = [];
    for (let i = 0; i < POPULATION_SIZE; i++) {
        const parent = parents[i % 3].clone();
        if (i !== 0) parent.mutate(0.1);
        brains.push(parent);
    }

    dinos = brains.map(brain => {
        const dino = new Dinosaur();
        dino.brain = brain;
        return dino;
    });

    currentAlive = POPULATION_SIZE;

    // 🔧 CORRECCIÓN IMPORTANTE
    gameSpeed = 7;
    obstacles = [];
    gameOver = false;
}

// Red neuronal
function drawBrain(brain) {
    if (!brain.lastInput || !brain.lastHidden || !brain.lastOutput) {
        return; // aún no se han generado activaciones
    }

    const canvas = document.getElementById("nn-canvas");
    if (!canvas || !brain) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layerY = [100, 200, 300];
    const nodeX = (count, layerIndex) => {
        const spacing = canvas.width / (count + 1);
        return Array.from({ length: count }, (_, i) => spacing * (i + 1));
    };

    const drawNode = (x, y, value, label = "") => {
        const r = 14;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);

        // color del nodo según activación
        const c = Math.floor(255 * Math.abs(value));
        if (value > 0) ctx.fillStyle = `rgb(0,${c},0)`;      // verde
        else if (value < 0) ctx.fillStyle = `rgb(${c},0,0)`; // rojo
        else ctx.fillStyle = "black";                        // neutro

        ctx.fill();
        ctx.stroke();

        if (label) {
            ctx.fillStyle = "#000";
            ctx.font = "11px monospace";
            ctx.textAlign = "center";
            ctx.fillText(label, x, y - r - 6);
        }
    };

    const drawLine = (x1, y1, x2, y2, weight) => {
        const alpha = Math.min(Math.abs(weight), 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = weight > 0
            ? `rgba(0,0,255,${alpha})`    // azul = peso positivo
            : `rgba(255,0,0,${alpha})`;   // rojo = peso negativo
        ctx.lineWidth = 2;
        ctx.stroke();

        // valor del peso
        ctx.fillStyle = "#000";
        ctx.font = "8px monospace";
        ctx.fillText(weight.toFixed(2), (x1 + x2) / 2, (y1 + y2) / 2);
    };

    const INPUT_SIZE = brain.w1.length;
    const HIDDEN_SIZE = brain.w1[0].length;
    const OUTPUT_SIZE = brain.w2[0].length;

    const inputNodes = nodeX(INPUT_SIZE);
    const hiddenNodes = nodeX(HIDDEN_SIZE);
    const outputNodes = nodeX(OUTPUT_SIZE);

    // líneas input -> hidden
    for (let i = 0; i < INPUT_SIZE; i++) {
        for (let j = 0; j < HIDDEN_SIZE; j++) {
            drawLine(inputNodes[i], layerY[0], hiddenNodes[j], layerY[1], brain.w1[i][j]);
        }
    }

    // líneas hidden -> output
    for (let i = 0; i < HIDDEN_SIZE; i++) {
        for (let j = 0; j < OUTPUT_SIZE; j++) {
            drawLine(hiddenNodes[i], layerY[1], outputNodes[j], layerY[2], brain.w2[i][j]);
        }
    }

    // nodos con valores reales
    const inputLabels = [
        "D Obstacle",
        "gameSpeed",
        "V Speed",
        "obstacle H",
        "obstacle W",
        "isGrounded"
    ];

    for (let i = 0; i < INPUT_SIZE; i++) {
        const val = brain.lastInput?.[i] ?? 0;
        drawNode(inputNodes[i], layerY[0], val, inputLabels[i] || "");
    }

    for (let i = 0; i < HIDDEN_SIZE; i++) {
        const val = brain.lastHidden?.[i] ?? 0;
        drawNode(hiddenNodes[i], layerY[1], val, "H" + (i + 1));
    }

    for (let i = 0; i < OUTPUT_SIZE; i++) {
        const val = brain.lastOutput?.[i] ?? 0;
        drawNode(outputNodes[i], layerY[2], val, ["↥", "↧"][i] || "O" + (i + 1));
    }
}

function drawBrainSafe(brain) {
    if (!brain || !brain.w1 || !brain.w2) return;
    drawBrain(brain);
}
