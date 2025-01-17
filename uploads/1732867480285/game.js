// game.js

// 游戏状态
let nodes = [];
let links = [];

let playerBase = null;
let aiBase = null;
let playerTroops = 20;
let aiTroops = 20;
let playerTroopsPerTurn = 5; // 玩家每回合生成的兵力
let aiTroopsPerTurn = 3;     // AI 每回合生成的兵力，默认简单难度
let selectedNode = null;
let isPlayerTurn = true;
let gameInProgress = false;

let troopRatio = 50; // 默认50%

let plannedMoves = []; // 记录玩家的计划行动

let svg, linkGroup, nodeGroup, labelGroup, moveLabelGroup;

// 初始化游戏
function initializeGame() {
    // 获取难度和地图大小设置
    const difficulty = document.getElementById('difficulty').value;
    const mapSize = document.getElementById('mapSize').value;

    // 根据难度设置 AI 每回合生成的兵力（降低难度）
    switch (difficulty) {
        case 'easy':
            aiTroopsPerTurn = 3; // 降低难度
            break;
        case 'medium':
            aiTroopsPerTurn = 5; // 降低难度
            break;
        case 'hard':
            aiTroopsPerTurn = 7; // 降低难度
            break;
        default:
            aiTroopsPerTurn = 5;
    }

    // 根据地图大小生成节点和边
    generateMap(mapSize);

    playerBase = null;
    aiBase = null;
    selectedNode = null;
    isPlayerTurn = true;
    gameInProgress = true;
    plannedMoves = [];

    nodes.forEach(node => {
        node.troops = 0;
        node.controlledBy = 'neutral';
        node.plannedTroops = undefined; // 重置计划兵力
        node.previousControlledBy = 'neutral'; // 记录之前的控制者
        node.previousTroops = 0; // 记录之前的兵力
    });

    // 确保玩家和 AI 的初始节点位于对称位置
    const gridSize = Math.sqrt(nodes.length);
    const totalNodes = nodes.length;

    // 选择玩家的基地
    const playerBaseIndex = Math.floor(Math.random() * totalNodes);
    playerBase = nodes[playerBaseIndex];

    // 计算玩家基地的行列位置
    const playerRow = Math.floor(playerBaseIndex / gridSize);
    const playerCol = playerBaseIndex % gridSize;

    // 计算 AI 基地的对称位置
    const aiRow = gridSize - 1 - playerRow;
    const aiCol = gridSize - 1 - playerCol;
    const aiBaseIndex = aiRow * gridSize + aiCol;
    aiBase = nodes[aiBaseIndex];

    // 初始化基地
    playerBase.troops = playerTroops;
    playerBase.controlledBy = 'player';

    aiBase.troops = aiTroops;
    aiBase.controlledBy = 'ai';

    document.getElementById('playerTroops').innerText = getTotalTroops('player');
    document.getElementById('aiTroops').innerText = getTotalTroops('ai');

    // 启用“结束回合”按钮
    document.getElementById('endTurnButton').disabled = false;

    initializeGraph();
}

function generateMap(size) {
    nodes = [];
    links = [];

    let gridSize;
    switch (size) {
        case 'small':
            gridSize = 3; // 小地图：3x3
            break;
        case 'medium':
            gridSize = 4; // 中地图：4x4
            break;
        case 'large':
            gridSize = 5; // 大地图：5x5
            break;
        default:
            gridSize = 4;
    }

    const nodeSpacingX = 800 / (gridSize - 1);
    const nodeSpacingY = 500 / (gridSize - 1);

    let idCounter = 1;
    const nodeMap = {};

    // 创建节点
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const node = {
                id: idCounter,
                x: 80 + j * nodeSpacingX,
                y: 50 + i * nodeSpacingY,
                troops: 0,
                controlledBy: 'neutral',
                plannedTroops: undefined,
                previousControlledBy: 'neutral',
                previousTroops: 0
            };
            nodes.push(node);
            nodeMap[`${i},${j}`] = node;
            idCounter++;
        }
    }

    // 创建边（连接相邻节点）
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const currentNode = nodeMap[`${i},${j}`];
            // 右侧节点
            if (j < gridSize - 1) {
                const rightNode = nodeMap[`${i},${j + 1}`];
                links.push({ source: currentNode.id, target: rightNode.id });
            }
            // 下方节点
            if (i < gridSize - 1) {
                const bottomNode = nodeMap[`${i + 1},${j}`];
                links.push({ source: currentNode.id, target: bottomNode.id });
            }
        }
    }
}

// 更新分兵比例（保持不变）
function updateSliderValue() {
    const slider = document.getElementById('troopRatio');
    troopRatio = parseInt(slider.value);
    document.getElementById('troopRatioValue').innerText = `${troopRatio}%`;
}

// 玩家点击节点事件（保持不变）
function nodeClicked(event, d) {
    if (!isPlayerTurn || !gameInProgress) return;

    if (d.controlledBy !== 'player' && (!selectedNode || selectedNode.controlledBy !== 'player')) {
        return;
    }

    if (!selectedNode) {
        selectedNode = d;
        updateGraph();
    } else if (selectedNode.id === d.id) {
        selectedNode = null;
        updateGraph();
    } else if (areNeighbors(selectedNode, d)) {
        planAttack(selectedNode, d);
        selectedNode = null;
        updateGraph();
    }
}

// 计划攻击（调整了分兵比例的计算方式，基于剩余兵力）
function planAttack(fromNode, toNode) {
    // 获取当前剩余兵力
    const currentTroops = fromNode.plannedTroops !== undefined ? fromNode.plannedTroops : fromNode.troops;

    const troopsToMove = Math.floor(currentTroops * (troopRatio / 100));
    if (troopsToMove <= 0) {
        alert('没有足够的兵力进行行动！');
        return;
    }

    // 检查是否已经有针对该节点的行动
    const existingMove = plannedMoves.find(move => move.fromNode === fromNode && move.toNode === toNode);
    if (existingMove) {
        alert('您已经计划了从该节点到目标节点的行动！');
        return;
    }

    // 更新计划行动
    plannedMoves.push({
        fromNode: fromNode,
        toNode: toNode,
        troops: troopsToMove
    });

    // 更新起始节点的计划兵力
    fromNode.plannedTroops = currentTroops - troopsToMove;

    updateGraph();
}

// 结束玩家回合（保持不变）
function endPlayerTurn() {
    if (!isPlayerTurn || !gameInProgress) return;

    // 禁用“结束回合”按钮，防止重复点击
    document.getElementById('endTurnButton').disabled = true;

    // 执行玩家的所有计划行动
    executePlannedMoves();

    // 检查游戏是否结束
    let gameOverMessage = checkGameOver();
    if (gameOverMessage) {
        updateGraph();
        alert(gameOverMessage);
        gameInProgress = false;
        return;
    }

    // AI 行动
    aiTurn();

    // 检查游戏是否结束
    gameOverMessage = checkGameOver();
    if (gameOverMessage) {
        updateGraph();
        alert(gameOverMessage);
        gameInProgress = false;
        return;
    }

    // 进入下一回合
    isPlayerTurn = true;

    // 每个控制的节点生成兵力
    nodes.forEach(node => {
        if (node.controlledBy === 'player') {
            node.troops += playerTroopsPerTurn;
        } else if (node.controlledBy === 'ai') {
            node.troops += aiTroopsPerTurn;
        }
        // 重置计划兵力
        node.plannedTroops = undefined;
    });

    plannedMoves = []; // 清空计划行动

    updateGraph();

    // 启用“结束回合”按钮
    document.getElementById('endTurnButton').disabled = false;
}

// 执行玩家的计划行动（保持不变）
function executePlannedMoves() {
    plannedMoves.forEach(move => {
        const fromNode = move.fromNode;
        const toNode = move.toNode;
        const troopsToMove = move.troops;

        if (toNode.controlledBy === 'neutral' || toNode.controlledBy === 'ai') {
            if (troopsToMove >= toNode.troops) {
                fromNode.troops -= troopsToMove;
                toNode.troops = troopsToMove - toNode.troops;
                toNode.controlledBy = 'player';
            } else {
                fromNode.troops -= troopsToMove;
                toNode.troops -= troopsToMove;
            }
        } else if (toNode.controlledBy === 'player') {
            fromNode.troops -= troopsToMove;
            toNode.troops += troopsToMove;
        }
    });
}

// 判断节点是否相邻（保持不变）
function areNeighbors(a, b) {
    return links.some(link => (link.source === a.id && link.target === b.id) || (link.source === b.id && link.target === a.id));
}

// AI 行动
function aiTurn() {
    const aiNodes = nodes.filter(node => node.controlledBy === 'ai' && node.troops > 1);
    if (aiNodes.length === 0) return;

    aiNodes.forEach(fromNode => {
        const neighbors = getNeighbors(fromNode);
        neighbors.forEach(targetNode => {
            if (targetNode.controlledBy !== 'ai') {
                const troopsToMove = Math.floor(fromNode.troops * 0.6);
                if (troopsToMove > 0) {
                    if (troopsToMove >= targetNode.troops) {
                        fromNode.troops -= troopsToMove;
                        targetNode.troops = troopsToMove - targetNode.troops;
                        targetNode.controlledBy = 'ai';
                    } else {
                        fromNode.troops -= troopsToMove;
                        targetNode.troops -= troopsToMove;
                    }
                }
            }
        });
    });
}

// 获取邻居节点（保持不变）
function getNeighbors(node) {
    const neighborIds = links.filter(link => link.source === node.id || link.target === node.id)
        .map(link => (link.source === node.id ? link.target : link.source));
    return nodes.filter(n => neighborIds.includes(n.id));
}

// 检查游戏是否结束（保持不变）
function checkGameOver() {
    const playerNodes = nodes.filter(node => node.controlledBy === 'player');
    const aiNodes = nodes.filter(node => node.controlledBy === 'ai');

    if (playerNodes.length === 0) {
        return '游戏结束，您输了！';
    } else if (aiNodes.length === 0) {
        return '恭喜，您赢了！';
    }
    return null;
}

// 更新图形（保持不变）
function updateGraph() {
    const colorScale = {
        'player': '#ff7f0e',
        'ai': '#1f77b4',
        'neutral': '#69b3a2'
    };

    // 更新节点
    nodeGroup.selectAll('circle')
        .data(nodes, d => d.id)
        .attr('fill', d => colorScale[d.controlledBy])
        .attr('class', d => `node ${d.controlledBy} ${selectedNode && d.id === selectedNode.id ? 'selected' : ''}`)
        .select('title')
        .text(d => `节点 ${d.id}\n兵力: ${d.troops}`);

    // 更新节点上的兵力数字
    labelGroup.selectAll('text')
        .data(nodes, d => d.id)
        .text(d => {
            const displayTroops = d.plannedTroops !== undefined ? d.plannedTroops : d.troops;
            return displayTroops;
        });

    // 更新兵力显示
    document.getElementById('playerTroops').innerText = getTotalTroops('player');
    document.getElementById('aiTroops').innerText = getTotalTroops('ai');

    // 更新计划行动的显示
    updatePlannedMovesDisplay();
}

// 更新计划行动的显示（保持不变）
function updatePlannedMovesDisplay() {
    // 清除之前的显示
    moveLabelGroup.selectAll('*').remove();

    // 绘制计划行动的兵力数字
    plannedMoves.forEach(move => {
        const fromNode = move.fromNode;
        const toNode = move.toNode;

        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;

        moveLabelGroup.append('text')
            .attr('x', midX)
            .attr('y', midY - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ff7f0e') // 玩家颜色
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .text(move.troops);
    });
}

// 获取节点总兵力（保持不变）
function getTotalTroops(player) {
    return nodes.filter(node => node.controlledBy === player).reduce((sum, node) => sum + node.troops, 0);
}

// 初始化图形（保持不变）
function initializeGraph() {
    svg = d3.select('svg');
    svg.selectAll('*').remove();

    const colorScale = {
        'player': '#ff7f0e',
        'ai': '#1f77b4',
        'neutral': '#69b3a2'
    };

    // 绘制边
    linkGroup = svg.append('g')
        .attr('class', 'links');

    linkGroup.selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('x1', d => getNodeById(d.source).x)
        .attr('y1', d => getNodeById(d.source).y)
        .attr('x2', d => getNodeById(d.target).x)
        .attr('y2', d => getNodeById(d.target).y);

    // 绘制节点
    nodeGroup = svg.append('g')
        .attr('class', 'nodes');

    nodeGroup.selectAll('circle')
        .data(nodes, d => d.id)
        .enter().append('circle')
        .attr('class', d => `node ${d.controlledBy}`)
        .attr('r', 20)
        .attr('fill', d => colorScale[d.controlledBy])
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .on('click', nodeClicked)
        .on('mouseover', function() {
            d3.select(this).style('stroke', 'black').style('stroke-width', 3);
        })
        .on('mouseout', function() {
            d3.select(this).style('stroke', null).style('stroke-width', null);
        })
        .append('title')
        .text(d => `节点 ${d.id}\n兵力: ${d.troops}`);

    // 显示节点上的兵力数字
    labelGroup = svg.append('g')
        .attr('class', 'labels');

    labelGroup.selectAll('text')
        .data(nodes, d => d.id)
        .enter().append('text')
        .attr('dx', d => d.x)
        .attr('dy', d => d.y + 5)
        .attr('text-anchor', 'middle')
        .text(d => d.troops)
        .attr('pointer-events', 'none');

    // 绘制计划行动的兵力数字
    moveLabelGroup = svg.append('g')
        .attr('class', 'move-labels');

    // 初始更新图形
    updateGraph();
}

// 获取节点
function getNodeById(id) {
    return nodes.find(node => node.id === id);
}

// 开始游戏
function startGame() {
    initializeGame();
}
