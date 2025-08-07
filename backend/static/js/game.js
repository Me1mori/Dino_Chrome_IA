// game.js

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GRAVITY = 0.5;
const JUMP_FORCE = -9;
let useAI = false;
let generation = 1;

let dino, dinos = [];
let obstacles = [];

let frame = 0;
let gameSpeed = 10;
let gameOver = false;
let aiJumpLocks = [];
let currentAlive = 0;

let score = 0, highScore = parseInt(localStorage.getItem("highScore")) || 0;
let playerHighScore = localStorage.getItem("playerHighScore") || 0;
let aiHighScore = localStorage.getItem("aiHighScore") || 0;

let animationId = null;
let paused = true;

const sprite = new Image();
sprite.src = "/static/img/descarga.png";

// ===================== Crear botón de reload =====================
const reloadBtn = document.createElement("canvas");
reloadBtn.width = 37;
reloadBtn.height = 33;
reloadBtn.style.position = "fixed";
reloadBtn.style.top = "80%";
reloadBtn.style.left = "50%";
reloadBtn.style.transform = "translateX(-50%)";
reloadBtn.style.zIndex = "20";
reloadBtn.style.display = "none";
reloadBtn.style.cursor = "pointer";
document.body.appendChild(reloadBtn);

const reloadCtx = reloadBtn.getContext("2d");

// Dibuja el ícono del sprite en el canvas del botón
function drawReloadIcon() {
    reloadCtx.clearRect(0, 0, reloadBtn.width, reloadBtn.height);
    reloadCtx.drawImage(sprite, 2, 2, 37, 33, 0, 0, 37, 33);
}

// Acción al hacer clic
reloadBtn.onclick = () => {
    resetGame();
};

// ===================== Suelo (GROUND) =====================
const ground = {
    y: canvas.height - 45, // la altura real del sprite
    scrollX: 0,
    draw(speed = gameSpeed) {
        this.scrollX += speed;

        const sx = 2;
        const sy = 53;
        const sw = 1199;
        const sh = 14;
        const dw = sw;
        const dh = sh;

        const offset = this.scrollX % dw;

        ctx.drawImage(sprite, sx, sy, sw, sh, -offset, this.y, dw, dh);
        ctx.drawImage(sprite, sx, sy, sw, sh, -offset + dw, this.y, dw, dh);
    }
};

// ===================== Score con sprite =====================
function drawScoreSprite(score, x, y) {
    const digits = score.toString().padStart(5, '0');
    const spriteBaseX = 654;
    const digitWidth = 10;
    const digitHeight = 12;

    for (let i = 0; i < digits.length; i++) {
        const digit = parseInt(digits[i]);
        const sx = spriteBaseX + digit * digitWidth;
        const sy = 1;
        const sw = digitWidth;
        const sh = digitHeight;
        const dw = sw;
        const dh = sh;

        ctx.drawImage(sprite, sx, sy, sw, sh, x + i * (dw + 1), y, dw, dh);
    }
}

// ===================== Game Over =====================
function drawGameOver() {
    const sx = 654;
    const sy = 14;
    const sw = 192;
    const sh = 12;
    const scale = 2;
    const dw = sw * scale;
    const dh = sh * scale;

    ctx.drawImage(sprite, sx, sy, sw, sh, canvas.width / 2 - dw / 2, 50, dw, dh);
}

// ===================== Dinosaurio =====================
class Dinosaur {
    constructor() {
        this.x = 100;
        this.y = 0;
        this.w = 43;
        this.h = 46;
        this.vy = 0;
        this.jumpForce = JUMP_FORCE;
        this.grounded = false;
        this.frame = 0;
        this.dead = false;
        this.score = 0;
        this.brain = null;

        // Pre-cargar sonidos
        this.jumpSound = new Audio("/static/sounds/jump.wav");
        this.pointSound = new Audio("/static/sounds/point.wav");
        this.dieSound = new Audio("/static/sounds/die.wav");
        this.hasPlayedDieSound = false;
    }

    update(isLeader = false) {
        this.vy += GRAVITY;
        this.y += this.vy;

        if (this.y + this.h >= ground.y) {
            this.y = ground.y - this.h + 6;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        this.frame++;

        if (frame % 60 === 0 && !this.dead && (isLeader || !useAI)) {
            this.score++;

            if (this.score % 100 === 0) {
                this.pointSound.currentTime = 0;
                this.pointSound.play();
                gameSpeed += 1;
            } else if (this.score % 5 === 0) {
                gameSpeed += 0.7;
            }

            // Límite para que no se dispare
            gameSpeed = Math.min(gameSpeed, 100);
        }

        if (!useAI && gameOver && !this.hasPlayedDieSound) {
            this.dieSound.play();
            this.hasPlayedDieSound = true;
        }
    }

    jump() {
        if (this.grounded) {
            this.vy = this.jumpForce;
            this.jumpSound.play();
        }
    }

    draw() {
        const runFrame = Math.floor(this.frame / 5) % 2;
        const frames = [
            { x: 936, y: 2, w: 43, h: 46 },
            { x: 980, y: 2, w: 43, h: 46 }
        ];
        const f = frames[runFrame];
        this.w = f.w;
        this.h = f.h;

        ctx.drawImage(sprite, f.x, f.y, f.w, f.h, this.x, this.y, f.w, f.h);
    }

    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}

// ===================== Obstáculos (cactus) =====================
class Obstacle {
    constructor() {
        this.big = Math.random() > 0.5;
        this.sprite = sprite;  // ✅ corregido

        if (this.big) {
            this.sx = 332;
            this.sy = 2;
            this.sw = 25;
            this.sh = 51;
            this.w = 25;
            this.h = 51;
            this.yOffset = 15;  // bajar 10px
        } else {
            this.sx = 228;
            this.sy = 2;
            this.sw = 17;
            this.sh = 36;
            this.w = 17;
            this.h = 36;
            this.yOffset = 7;  // bajar 5px
        }

        this.x = canvas.width;
        this.y = ground.y - this.h + this.yOffset;
    }

    update(speed) {
        this.x -= speed;
    }

    draw() {
        ctx.drawImage(
            this.sprite,
            this.sx, this.sy, this.sw, this.sh,
            this.x, this.y, this.w, this.h
        );
    }

    isOffScreen() {
        return this.x + this.w < 0;
    }

    getBounds() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
}

// ===================== Mostrar texto en pantalla =====================
function drawLabels() {
    ctx.fillStyle = "#444";
    ctx.font = "14px 'Press Start 2P'";

    if (useAI) {
        // SCORE y HI a la izquierda
        ctx.fillText("SCORE", 20, 20);
        ctx.fillText("HI", 20, 60);

        let best = getBestAliveDino();
        if (best) ctx.fillText(best.score.toString().padStart(5, "0"), 20, 40);
        ctx.fillText(aiHighScore.toString().padStart(5, "0"), 20, 80);

        // GEN y ALIVE a la derecha
        ctx.fillText("GEN", canvas.width - 120, 20);
        ctx.fillText("ALIVE", canvas.width - 120, 60);
        ctx.fillText(generation.toString().padStart(5, "0"), canvas.width - 120, 40);
        ctx.fillText(currentAlive.toString().padStart(5, "0"), canvas.width - 120, 80);
    } else {
        ctx.fillText("SCORE", 20, 20);
        ctx.fillText("HI", 20, 60);
        ctx.fillText(dino.score.toString().padStart(5, "0"), 20, 40);
        ctx.fillText(playerHighScore.toString().padStart(5, "0"), 20, 80);
    }
}

// ===================== Colisiones =====================
function collide(a, b) {
    return a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y;
}

// ===================== IA =====================
function getAIInputs(dino) {
    const next = obstacles[0];
    if (!next) return [0, 0, 0, 0, 0, 0];

    const distToObstacle = next.x - dino.x;
    const currentSpeed = gameSpeed;
    const verticalSpeed = dino.vy;
    const obstacleHeight = next.h;
    const obstacleWidth = next.w;
    const isGrounded = dino.grounded ? 1 : 0;

    return [distToObstacle, currentSpeed, verticalSpeed, obstacleHeight, obstacleWidth, isGrounded];
}

function handleAI(dino) {
    const output = dino.brain.predict(getAIInputs(dino));
    const id = dinos.indexOf(dino);
    if (!aiJumpLocks[id]) aiJumpLocks[id] = false;

    if (output === 1 && dino.grounded && !aiJumpLocks[id]) {
        dino.jump();
        aiJumpLocks[id] = true;
    }

    if (dino.grounded) aiJumpLocks[id] = false;
}

// ===================== Mejor IA =====================
function getBestAliveDino() {
    return dinos.find(d => !d.dead);
}

//  ===================== Visualización de red neuronal =====================
const nnCanvas = document.getElementById("nn-canvas");
const nnCtx = nnCanvas.getContext("2d");

function drawNeuralNetwork(brain) {
    if (!brain) return;
    nnCtx.clearRect(0, 0, nnCanvas.width, nnCanvas.height);

    const layers = brain.weights.length + 1;
    const nodeRadius = 6;

    const layerX = i => 50 + (nnCanvas.width - 100) * (i / (layers - 1));
    const layerY = (nodes, j) => 60 + j * 40;

    const activations = brain.lastActivations || [];

    for (let i = 0; i < brain.weights.length; i++) {
        const layer = brain.weights[i];
        for (let j = 0; j < layer.length; j++) {
            for (let k = 0; k < layer[j].length; k++) {
                nnCtx.beginPath();
                nnCtx.moveTo(layerX(i), layerY(layer.length, j));
                nnCtx.lineTo(layerX(i + 1), layerY(layer[j].length, k));
                nnCtx.strokeStyle = "rgba(0,0,0,0.2)";
                nnCtx.stroke();
            }
        }
    }

    for (let i = 0; i < layers; i++) {
        const nodes = i === 0 ? brain.weights[0].length : brain.weights[i - 1][0].length;
        for (let j = 0; j < nodes; j++) {
            nnCtx.beginPath();
            nnCtx.arc(layerX(i), layerY(nodes, j), nodeRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "black";
            ctx.fill();

            ctx.fillStyle = "black";
            ctx.font = "10px monospace";
            let label = "";

            if (i === 0) {
                label = ["x", "y", "dist", "obsW", "obsH"][j] || "";
            } else if (i === layers - 1) {
                label = "Out";
            } else {
                label = "H" + (j + 1);
            }

            nnCtx.fillText(label, layerX(i) - 10, layerY(nodes, j) - 10);
        }
    }
}

// ===================== Juego principal =====================
function resetGame() {
    if (animationId) cancelAnimationFrame(animationId);

    obstacles = [];
    frame = 0;
    gameSpeed = 7;
    score = 0;
    aiJumpLocks = [];

    if (useAI) {
        initBrains();
    } else {
        dino = new Dinosaur();
    }

    gameOver = false;
    document.getElementById("legend").style.display = useAI ? "block" : "none";
    update(); // ← inicia de cero
}

function updateUI() {
    // Mostrar/ocultar botón de reload solo cuando pierdes
    reloadBtn.style.display = gameOver ? "block" : "none";
}

// Arregla error de red neuronal vacía
function drawNeuralNetworkSafe(brain) {
    if (!brain || !brain.weights || brain.weights.length === 0) return;
    drawNeuralNetwork(brain);
}

// Actualizar juego
function update() {
    if (paused) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    ground.draw();

    if (frame % 90 === 0) {
        obstacles.push(new Obstacle());
    }

    obstacles.forEach(o => o.update(gameSpeed));
    obstacles = obstacles.filter(o => !o.isOffScreen());

    if (useAI) {
        const best = getBestAliveDino();

        dinos.forEach(dino => {
            if (!dino.dead) {
                dino.update(dino === best);
                dino.draw();
            }
        });

        for (let obs of obstacles) {
            for (let dino of dinos) {
                if (!dino.dead && collide(dino.getBounds(), obs.getBounds())) {
                    dino.dead = true;
                    dino.brain.score = dino.score;
                    currentAlive--;
                    if (dino.score > aiHighScore) {
                        aiHighScore = dino.score;
                        localStorage.setItem("aiHighScore", aiHighScore);
                    }
                    if (currentAlive <= 0) evolve();
                    break;
                }
            }
        }

        if (currentAlive <= 0) return; // detiene la lógica de IA si todos murieron

        dinos.forEach(dino => {
            if (!dino.dead) handleAI(dino);
        });

        drawLabels();
        drawBrainSafe(getBestAliveDino()?.brain);

    } else {
        dino.update();
        dino.draw();

        for (let obs of obstacles) {
            if (collide(dino.getBounds(), obs.getBounds())) {
                gameOver = true;
                if (dino.score > playerHighScore) {
                    playerHighScore = dino.score;
                    localStorage.setItem("playerHighScore", playerHighScore);
                }
            }
        }

        drawLabels();
    }

    obstacles.forEach(o => o.draw());

    if (!gameOver || useAI) {
        animationId = requestAnimationFrame(update);
    } else {
        drawGameOver();
    }

    if (gameOver) {
        reloadBtn.style.display = "block";
        drawReloadIcon();

        // Posicionar el botón debajo de "Game Over"
        const goX = canvas.offsetLeft + canvas.width / 2 - reloadBtn.width / 2;
        const goY = canvas.offsetTop + 120;

        reloadBtn.style.position = "absolute";
        reloadBtn.style.left = `${goX}px`;
        reloadBtn.style.top = `${goY}px`
    } else {
        reloadBtn.style.display = "none";
    }

    if (nnCanvas) {
        nnCanvas.style.display = useAI ? "block" : "none";
    }

}

// ===================== Controles =====================
document.addEventListener("keydown", e => {
    if (gameOver) {
        resetGame();
        return;
    }
    if (!useAI && (e.code === "ArrowUp" || e.code === "Space")) {
        dino.jump();
    }
});

document.body.addEventListener("click", () => {
    if (gameOver) return;
    paused = false;
    if (!animationId) {
        animationId = requestAnimationFrame(update); // ← importante
    }

    updateUI();
});

document.body.addEventListener("touchstart", (e) => {
    e.preventDefault(); // Evita el zoom o scroll
    if (gameOver) {
        resetGame();
        return;
    }

    paused = false;
    if (!animationId) {
        animationId = requestAnimationFrame(update);
    }

    if (!useAI) {
        dino.jump();
    }

    updateUI();
}, { passive: false });

// ===================== UI =====================
document.getElementById("aiBtn").onclick = () => {
    useAI = !useAI;
    document.getElementById("aiBtn").innerText = useAI ? "Desactivar IA" : "Activar IA";
    if (!useAI) {
        generation = 1;
    }
    resetGame();
};

function resizeGameCanvas() {
    const canvas = document.getElementById("game");
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
}


// ===================== INICIO =====================
function resizeGameCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

window.addEventListener("resize", () => {
    resizeGameCanvas();
    if (!paused && !gameOver) {
        update();
    }
});

window.onload = () => {
    resizeGameCanvas(); // ✅ ahora sí se llama correctamente
    resetGame();
    paused = true;
    update();
    nnCanvas.style.display = "none";
    drawReloadIcon();
};