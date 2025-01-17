const mapSize = 10;
let map = [];
let player = {
    x: 0,
    y: 0,
    health: 100,
    stamina: 80,
    keys: 0,
    keysNeeded: 3,
    staminaConsumptionMultiplier: 1, // 体力消耗倍率
    ddlTimerStarted: false,
    ddlTimeRemaining: 0,
    ddlInterval: null,
    prevX: 0, // 上一步的X坐标
    prevY: 0  // 上一步的Y坐标
};
let treasurePosition = { x: 0, y: 0 };
let gameStarted = false;

const gridTypes = [
    { type: 'tsinghua-boyfriend', name: '清华男友', color: 'purple', effect: 'deductHealth' },
    { type: 'electric-bike', name: '飞来的电动车', color: 'red', effect: 'deductStamina' },
    { type: 'wumei-supermarket', name: '物美超市', color: 'yellow', effect: 'exchange', used: false },
    { type: 'coffee-shop', name: '咖啡店', color: 'brown', effect: 'replenishStamina' },
    { type: 'school-hospital', name: '校医院', color: 'pink', effect: 'replenishHealth' },
    { type: 'treasure-map', name: '藏宝图', color: 'lightgreen', effect: 'lotteryTreasure' },
    { type: 'airplane-key', name: '飞机钥匙', color: 'blue', effect: 'collectKey' },
    { type: 'treasure', name: '宝藏点', color: 'gold', effect: 'win' },
    // 新增格子类型
    { type: 'chemical-lab', name: '化学实验室', color: 'cyan', effect: 'chemicalLab' },
    { type: 'td-line', name: 'TD线', color: 'orange', effect: 'tdLine' },
    { type: 'family-area', name: '家属区', color: 'magenta', effect: 'familyArea', visited: false },
    { type: 'programming-lab', name: '程设上机', color: 'darkred', effect: 'programmingLab' },
    { type: 'meet-ddl', name: '遇见DDL', color: 'black', effect: 'meetDDL' },
];

function startGame() {
    const difficulty = document.getElementById("difficulty").value;
    if (difficulty === "easy") {
        player.health = 120;
        player.stamina = 100;
        player.keysNeeded = 3;
    } else if (difficulty === "normal") {
        player.health = 100;
        player.stamina = 80;
        player.keysNeeded = 4;
    } else if (difficulty === "hard") {
        player.health = 80;
        player.stamina = 60;
        player.keysNeeded = 5;
    }

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";

    gameStarted = true;
    initGame();
}

function initGame() {
    map = [];
    player.x = Math.floor(Math.random() * mapSize);
    player.y = Math.floor(Math.random() * mapSize);
    do {
        treasurePosition.x = Math.floor(Math.random() * mapSize);
        treasurePosition.y = Math.floor(Math.random() * mapSize);
    } while (treasurePosition.x === player.x && treasurePosition.y === player.y);

    initMap();
    renderMap();
    updateStatus();
}

function initMap() {
    const totalGrids = mapSize * mapSize - 2;
    const gridCounts = {
        'tsinghua-boyfriend': 10,
        'electric-bike': 10,
        'wumei-supermarket': 3,
        'coffee-shop': 5,
        'school-hospital': 5,
        'treasure-map': 3,
        'airplane-key': player.keysNeeded + 2,
        'chemical-lab': getRandomInt(4,5),
        'td-line': getRandomInt(4,5),
        'family-area': 4,
        'programming-lab': 3,
        'meet-ddl':2,
    };

    let specialGrids = [];
    for (const gridType of gridTypes) {
        if (gridType.type !== 'treasure') {
            const count = gridCounts[gridType.type] || 0;
            for (let i = 0; i < count; i++) {
                specialGrids.push({ ...gridType, visited: false });
            }
        }
    }

    const emptyGridsCount = totalGrids - specialGrids.length;
    for (let i = 0; i < emptyGridsCount; i++) {
        specialGrids.push({ type: 'empty', name: '空地', color: 'darkgray', effect: null });
    }

    shuffleArray(specialGrids);

    let index = 0;
    for (let y = 0; y < mapSize; y++) {
        const row = [];
        for (let x = 0; x < mapSize; x++) {
            if (x === player.x && y === player.y) {
                row.push({ type: 'start', name: '出生点', color: 'green', discovered: true, effect: null });
            } else if (x === treasurePosition.x && y === treasurePosition.y) {
                row.push({ type: 'treasure', name: '宝藏点', color: 'gold', discovered: false, effect: 'win' });
            } else {
                const cell = specialGrids[index];
                cell.discovered = false;
                row.push(cell);
                index++;
            }
        }
        map.push(row);
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function shuffleArray(array) {
    array.sort(() => Math.random() - 0.5);
}

function renderMap() {
    const mapDiv = document.getElementById("map");
    mapDiv.innerHTML = "";
    mapDiv.style.gridTemplateColumns = `repeat(${mapSize}, 30px)`;
    mapDiv.style.gridTemplateRows = `repeat(${mapSize}, 30px)`;

    for (let y = 0; y < mapSize; y++) {
        for (let x = 0; x < mapSize; x++) {
            const cellData = map[y][x];
            const cell = document.createElement("div");
            cell.className = "cell";

            if (cellData.discovered) {
                cell.style.backgroundColor = cellData.color;

                if (cellData.type === 'treasure') {
                    cell.textContent = '✈️';
                }
            } else {
                cell.style.backgroundColor = 'white';
            }

            if (player.x === x && player.y === y) {
                cell.classList.add("player");
            }
            mapDiv.appendChild(cell);
        }
    }
}

function updateStatus() {
    document.getElementById("position").textContent = `(${player.x + 1}, ${player.y + 1})`;
    document.getElementById("health").textContent = player.health;
    document.getElementById("stamina").textContent = player.stamina;
    document.getElementById("keys").textContent = `${player.keys} / ${player.keysNeeded}`;
}

function move(direction) {
    if (!gameStarted) return;
    if (player.stamina <= 0) {
        alert("体力耗尽，游戏结束！");
        resetGame();
        return;
    }

    let { x, y } = player;
    if (direction === "north" && y > 0) y--;
    if (direction === "south" && y < mapSize - 1) y++;
    if (direction === "west" && x > 0) x--;
    if (direction === "east" && x < mapSize - 1) x++;
    if (x === player.x && y === player.y) return;

    // 保存上一步的位置
    player.prevX = player.x;
    player.prevY = player.y;

    player.x = x;
    player.y = y;
    let staminaCost = player.staminaConsumptionMultiplier;
    player.stamina -= staminaCost;

    const cell = map[y][x];

    if (cell.type === 'family-area' && cell.visited) {
        player.health -= 5;
        player.x = player.prevX;
        player.y = player.prevY;
        alert("你已被大爷大妈赶出来，扣除5点血量。");
        renderMap();
        updateStatus();
        checkGameOver();
        return;
    }

    if (!cell.discovered) {
        cell.discovered = true;
        if (cell.type !== 'empty') {
            triggerEvent(cell);
        }
    } else if (cell.type === 'treasure') {
        triggerEvent(cell);
    } else if (cell.type === 'family-area' && !cell.visited) {
        triggerEvent(cell);
    }

    renderMap();
    updateStatus();
    checkGameOver();
}

function triggerEvent(cell) {
    switch (cell.effect) {
        case 'deductHealth':
            player.health -= 20;
            alert("你到达了清华男友，被暴打，血量减少20。");
            break;
        case 'deductStamina':
            player.stamina -= 10;
            alert("你到达了飞来的电动车，被撞了一下，体力减少10。");
            break;
        case 'exchange':
            exchangeAtSupermarket();
            break;
        case 'replenishStamina':
            player.stamina += 20;
            alert("你到达了咖啡店，休息了一下，体力恢复20。");
            break;
        case 'replenishHealth':
            player.health += 20;
            alert("你到达了校医院，治疗了一下，血量恢复20。");
            break;
        case 'lotteryTreasure':
            lotteryForTreasure();
            break;
        case 'collectKey':
            player.keys++;
            alert("你到达了飞机钥匙，获得了一把飞机钥匙。");
            break;
        case 'win':
            if (player.keys >= player.keysNeeded) {
                alert("恭喜你找到了北京一号！游戏胜利！");
                resetGame();
            } else {
                alert("您未找到所有的飞机钥匙，无法启动！");
            }
            break;
        case 'chemicalLab':
            chemicalLabEvent();
            break;
        case 'tdLine':
            tdLineEvent();
            break;
        case 'familyArea':
            if (!cell.visited) {
                alert("你进入了家属区。");
                cell.visited = true;
            }
            break;
        case 'programmingLab':
            player.staminaConsumptionMultiplier *= 2;
            alert("你经过了程设上机，破防了，每走一步消耗更多体力！");
            break;
        case 'meetDDL':
            if (!player.ddlTimerStarted) {
                player.ddlTimerStarted = true;
                player.ddlTimeRemaining = 120;
                alert("你遇见了DDL！走软作业还有120秒就要提交，请在这之前找到宝藏！");
                startDDLTimer();
            }
            break;
    }
}

function exchangeAtSupermarket() {
    const choice = prompt("你可以进行一次交换：\n1. 用10体力换1把钥匙\n2. 用1把钥匙换20血量\n3. 离开", "1");
    if (choice === "1" && player.stamina >= 10) {
        player.stamina -= 10;
        player.keys++;
        alert("你用10体力换得了1把钥匙。");
    } else if (choice === "2" && player.keys >= 1) {
        player.keys--;
        player.health += 20;
        alert("你用1把钥匙换得了20血量。");
    } else {
        alert("交易失败！");
    }
}

function lotteryForTreasure() {
    while (true) {
        if (player.stamina < 3) {
            alert("体力不足，无法继续抽奖！");
            break;
        }
        const choice = confirm("是否花费3体力抽奖获取宝藏位置？（50%概率）");
        if (!choice) break;
        player.stamina -= 3;
        const win = Math.random() < 0.5;
        if (win) {
            map[treasurePosition.y][treasurePosition.x].discovered = true;
            alert("你成功获得了宝藏的位置！");
            renderMap();
            break;
        } else {
            alert("很遗憾，未能获得宝藏位置。");
        }
    }
}

function chemicalLabEvent() {
    const doExperiment = confirm("你到达了化学实验室，是否选择做一次实验？");
    if (doExperiment) {
        const outcome = Math.floor(Math.random() * 4);
        switch (outcome) {
            case 0:
                player.stamina += 10;
                alert("你的药品使你提升了10点体力。");
                break;
            case 1:
                player.health += 10;
                alert("你的药品使你回复了10点血量。");
                break;
            case 2:
                player.stamina -= 10;
                alert("你的药品使你损失了10点体力。");
                break;
            case 3:
                player.health -= 10;
                alert("你的药品使你损失了10点血量。");
                break;
        }
    } else {
        alert("你选择不做实验，什么都没有发生。");
    }
}

function tdLineEvent() {
    const doTD = confirm("你到达了TD线，是否选择进行TD一次？");
    if (doTD) {
        const outcome = Math.floor(Math.random() * 2);
        if (outcome === 0) {
            player.stamina += 8;
            alert("锻炼体质提升8点体力。");
        } else {
            player.stamina -= 5;
            player.health -= 10;
            alert("不小心摔下来，消耗5点体力并损失10点血量。");
        }
    } else {
        alert("你选择不进行TD，什么都没有发生。");
    }
}

function startDDLTimer() {
    player.ddlInterval = setInterval(function() {
        player.ddlTimeRemaining--;
        document.getElementById('ddl-timer').textContent = '倒计时：' + player.ddlTimeRemaining + '秒';
        if (player.ddlTimeRemaining <= 0) {
            clearInterval(player.ddlInterval);
            alert("你未能在规定时间内找到宝藏，游戏失败！");
            resetGame();
        }
    }, 1000);
}

function checkGameOver() {
    if (player.health <= 0) {
        alert("你已经阵亡，游戏结束！");
        resetGame();
    }
}

function resetGame() {
    gameStarted = false;
    if (player.ddlInterval) {
        clearInterval(player.ddlInterval);
        player.ddlInterval = null;
        player.ddlTimerStarted = false;
        document.getElementById('ddl-timer').textContent = '';
    }
    player = {
        x: 0,
        y: 0,
        health: 100,
        stamina: 80,
        keys: 0,
        keysNeeded: 3,
        staminaConsumptionMultiplier: 1,
        ddlTimerStarted: false,
        ddlTimeRemaining: 0,
        ddlInterval: null,
        prevX: 0,
        prevY: 0
    };
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("game-screen").style.display = "none";
}
