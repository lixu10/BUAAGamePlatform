const redDot = document.getElementById('red-dot');
const scoreDisplay = document.getElementById('score');
let score = 0;
let interval;
let gameTimer;
const gameDuration = 60; 
const gameContainer = document.getElementById('game-container');
const containerWidth = gameContainer.offsetWidth; 
const containerHeight = gameContainer.offsetHeight; 
const areaReductionFactor = 0.2; 
function getRandomPosition() {
    const maxX = containerWidth * areaReductionFactor;
    const maxY = containerHeight * areaReductionFactor;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    redDot.style.left = `${containerWidth / 2 - maxX / 2 + x}px`;
    redDot.style.top = `${containerHeight / 2 - maxY / 2 + y}px`;
}
function startGame(newInterval = 500) {
    score = 0;
    scoreDisplay.textContent = 'Score: ' + score;
    clearInterval(interval);
    clearInterval(gameTimer);
    interval = setInterval(() => {
        redDot.style.display = 'block'; 
        getRandomPosition();
    }, newInterval);
    gameTimer = setTimeout(endGame, gameDuration * 1000);
}
function endGame() {
    clearInterval(interval);
    alert(`总计得分 ${score}.`);
}
redDot.addEventListener('click', () => {
    score++;
    scoreDisplay.textContent = 'Score: ' + score;
    redDot.style.display = 'none'; 
});
const intervalRange = document.getElementById('interval-range');
const intervalValue = document.getElementById('interval-value');
intervalRange.addEventListener('input', function() {
    const value = this.value;
    intervalValue.textContent = `${value} ms`;
    if (interval) {
        clearInterval(interval); 
        startGame(value);
    }
});
intervalRange.value = 500;
intervalValue.textContent = '500 ms';
document.getElementById('start-btn').addEventListener('click', () => startGame(intervalRange.value));