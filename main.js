// 基本參數
const TRACKS = 5;
const GAME_HEIGHT = 600;
const JUDGE_LINE = 80; // px from bottom
const NOTE_SPEED = 3; // px per frame
const NOTE_INTERVAL = 40; // frames

let notes = [];
let frame = 0;
let score = 0;
let combo = 0;
let life = 10;
let judgeTextTimeout = null;

const gameArea = document.getElementById('gameArea');
const scoreDiv = document.getElementById('score');
const comboDiv = document.getElementById('combo');
const lifeDiv = document.getElementById('life');
const judgeText = document.getElementById('judgeText');

// 生成音符（支持普通和連按）
function spawnNote(track, hold = false, holdLen = 60) {
    const note = document.createElement('div');
    note.className = 'note';
    note.style.left = (track * 85 + 5) + 'px';
    note.style.bottom = GAME_HEIGHT + 'px';
    note.dataset.track = track;
    if (hold) {
        note.style.height = holdLen + 24 + 'px';
        note.style.background = 'linear-gradient(90deg,#ffd740 60%,#fffde7 100%)';
    }
    gameArea.appendChild(note);
    notes.push({el: note, track, y: GAME_HEIGHT, hit: false, hold, holdLen, holdStart: null, holding: false, released: false});
}

// 隨機生成音符（含連按）
function randomNotes() {
    if (frame % NOTE_INTERVAL === 0) {
        const t = Math.floor(Math.random() * TRACKS);
        // 20% 機率生成連按音符
        if (Math.random() < 0.2) {
            const len = 60 + Math.floor(Math.random() * 60); // 連按長度
            spawnNote(t, true, len);
        } else {
            spawnNote(t);
        }
    }
}

// 更新音符位置與判定
function updateNotes() {
    for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.y -= NOTE_SPEED;
        n.el.style.bottom = n.y + 'px';
        // 連按音符
        if (n.hold) {
            // 進入判定區
            if (!n.hit && n.y <= JUDGE_LINE && n.y + n.holdLen >= JUDGE_LINE) {
                n.holdStart = true;
                // 若正在按住
                if (n.holding) {
                    score += 2;
                    combo++;
                    showJudge('HOLD', '#ffd740');
                    updateUI();
                }
            }
            // 連按結束
            if (n.y + n.holdLen < JUDGE_LINE && !n.released) {
                if (n.holding) {
                    n.hit = true;
                    n.released = true;
                    showJudge('PERFECT', '#ffd740');
                } else {
                    combo = 0;
                    life--;
                    showJudge('MISS', '#f44336');
                }
                updateUI();
            }
        } else {
            // 普通音符
            if (n.y < JUDGE_LINE - 20 && !n.hit) {
                n.hit = true;
                combo = 0;
                life--;
                showJudge('MISS', '#f44336');
                updateUI();
            }
        }
        // 音符完全離開畫面
        if (n.y < -Math.max(30, n.holdLen || 0)) {
            if (n.el.parentNode) gameArea.removeChild(n.el);
            notes.splice(i, 1);
        }
    }
}

// 判定擊中
function hitNote(track, isDown = true) {
    for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (n.track === track && !n.hit) {
            if (n.hold) {
                // 進入判定區才可按住
                if (n.y <= JUDGE_LINE && n.y + n.holdLen >= JUDGE_LINE) {
                    n.holding = isDown;
                    if (!isDown) n.released = true;
                }
            } else if (Math.abs(n.y - JUDGE_LINE) < 24) {
                n.hit = true;
                score += 100;
                combo++;
                showJudge('PERFECT', '#ffd740');
                updateUI();
                n.el.style.background = 'linear-gradient(90deg,#fffde7 60%,#ffd740 100%)';
                setTimeout(()=>{
                    if (n.el.parentNode) gameArea.removeChild(n.el);
                }, 80);
                return;
            }
        }
    }
    // 沒有擊中
    if (!isDown) return;
    combo = 0;
    life--;
    showJudge('MISS', '#f44336');
    updateUI();
}

// 顯示判定文字
function showJudge(text, color) {
    judgeText.textContent = text;
    judgeText.style.color = color;
    judgeText.style.opacity = 1;
    clearTimeout(judgeTextTimeout);
    judgeTextTimeout = setTimeout(()=>{
        judgeText.style.opacity = 0;
    }, 400);
}

// 更新分數等UI
function updateUI() {
    scoreDiv.textContent = '分數: ' + score;
    comboDiv.textContent = 'COMBO: ' + combo;
    lifeDiv.textContent = 'LIFE: ' + life;
}

// 鍵盤控制
const keyMap = { 'd':0, 'f':1, 'j':2, 'k':3, 'l':4 };
window.addEventListener('keydown', (e) => {
    if (life <= 0) return;
    let track = keyMap[e.key];
    if (track !== undefined) hitNote(track, true);
});
window.addEventListener('keyup', (e) => {
    if (life <= 0) return;
    let track = keyMap[e.key];
    if (track !== undefined) hitNote(track, false);
});

// 遊戲主循環
function gameLoop() {
    if (life <= 0) {
        showJudge('GAME OVER', '#fff');
        return;
    }
    frame++;
    randomNotes();
    updateNotes();
    requestAnimationFrame(gameLoop);
}

updateUI();
gameLoop();
