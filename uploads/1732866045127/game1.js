// 定义全局变量
let bhy = 100000.0000;
let loan = 50000000.0000;
let date = new Date(2124, new Date().getMonth(), new Date().getDate());
let currencies = {
    tebibyte: {
        name: '特比币',
        price: 10000.0000,
        maxFluctuation: 0.2, // 最大波动20%
        riseProbability: 0.4,
        consecutiveRiseDays: 0,
        consecutiveFallDays: 0,
        ownedAmount: 0,
        priceHistory: [10000.0000],
        leverage: 1,
        liquidationPrice: null,
        borrowedAmount: 0,    // 杠杆借款的 BHY 数量
        borrowDays: 0        // 持有借款的天数
    },
    catcoin: {
        name: '猫猫币',
        price: 20.0000,
        maxFluctuation: 18.00, // 最大波动1800%
        riseProbability: 0.4,
        consecutiveRiseDays: 0,
        consecutiveFallDays: 0,
        ownedAmount: 0,
        priceHistory: [20.0000],
        leverage: 1,
        liquidationPrice: null,
        borrowedAmount: 0,
        borrowDays: 0
    },
    ethereum: {
        name: '以大坊',
        price: 90.0000,
        maxFluctuation: 0.40, // 最大波动40%
        riseProbability: 0.4,
        consecutiveRiseDays: 0,
        consecutiveFallDays: 0,
        ownedAmount: 0,
        priceHistory: [90.0000],
        leverage: 1,
        liquidationPrice: null,
        borrowedAmount: 0,
        borrowDays: 0
    },
    aircoin: {
        name: '飞机币',
        price: 200.0000,
        maxFluctuation: 0.05, // 最大波动5%
        riseProbability: 0.4,
        consecutiveRiseDays: 0,
        consecutiveFallDays: 0,
        ownedAmount: 0,
        priceHistory: [200.0000],
        leverage: 1,
        liquidationPrice: null,
        borrowedAmount: 0,
        borrowDays: 0
    }
};
let currentCurrency = currencies['tebibyte'];
let timer;
let chart;

// 初始化游戏
function initGame() {
    document.getElementById('currentBHY').innerText = bhy.toFixed(4);
    document.getElementById('remainingLoan').innerText = loan.toFixed(4);
    document.getElementById('currentDate').innerText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    updateCurrencyDetails();
    updateAssetTable();
    startTimer();
}

// 更新持有资产表
function updateAssetTable() {
    let assetTable = document.getElementById('assetTable');
    // 清空除表头外的行
    assetTable.innerHTML = `
        <tr>
            <th>虚拟货币</th>
            <th>持有数量</th>
            <th>当前价格（BHY）</th>
            <th>持有价值（BHY）</th>
        </tr>
    `;
    for (let key in currencies) {
        let currency = currencies[key];
        if (currency.ownedAmount > 0) {
            let row = assetTable.insertRow();
            row.insertCell(0).innerText = currency.name;
            row.insertCell(1).innerText = currency.ownedAmount.toFixed(4);
            row.insertCell(2).innerText = currency.price.toFixed(4);
            let value = (currency.ownedAmount * currency.price).toFixed(4);
            row.insertCell(3).innerText = value;
        }
    }
}

// 更新货币详情
function updateCurrencyDetails() {
    document.getElementById('currencyName').innerText = currentCurrency.name;
    document.getElementById('currentPrice').innerText = currentCurrency.price.toFixed(4);
    document.getElementById('ownedAmount').innerText = currentCurrency.ownedAmount.toFixed(4);
    let ownedValue = (currentCurrency.ownedAmount * currentCurrency.price).toFixed(4);
    document.getElementById('ownedValue').innerText = ownedValue;

    // 更新涨跌幅
    let priceHistory = currentCurrency.priceHistory;
    let priceChange = 0;
    let isRise = false; // 用于判断价格是否上涨
    if (priceHistory.length > 1) {
        let yesterdayPrice = priceHistory[priceHistory.length - 2];
        let todayPrice = priceHistory[priceHistory.length - 1];
        priceChange = ((todayPrice - yesterdayPrice) / yesterdayPrice * 100).toFixed(2);
        isRise = todayPrice >= yesterdayPrice;
    }
    document.getElementById('priceChange').innerText = priceChange + '%';

    // 根据涨跌设置样式
    if (isRise) {
        document.getElementById('currentPrice').classList.remove('price-down');
        document.getElementById('currentPrice').classList.add('price-up');
        document.getElementById('priceChange').classList.remove('price-down');
        document.getElementById('priceChange').classList.add('price-up');
    } else {
        document.getElementById('currentPrice').classList.remove('price-up');
        document.getElementById('currentPrice').classList.add('price-down');
        document.getElementById('priceChange').classList.remove('price-up');
        document.getElementById('priceChange').classList.add('price-down');
    }

    // 更新杠杆借款显示
    document.getElementById('borrowedAmount').innerText = currentCurrency.borrowedAmount.toFixed(4);

    // 更新强制平仓价格显示
    let liquidationPrice = currentCurrency.liquidationPrice;
    if (liquidationPrice) {
        document.getElementById('liquidationPrice').innerText = liquidationPrice.toFixed(4) + ' BHY';
    } else {
        document.getElementById('liquidationPrice').innerText = '-';
    }

    // 绘制折线图
    drawChart();
}

// 开始游戏按钮
document.getElementById('startGameBtn').addEventListener('click', () => {
    document.getElementById('gameIntro').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'block';
    initGame();
});

// 查看详情按钮
document.getElementById('viewDetailsBtn').addEventListener('click', () => {
    let selectedCurrency = document.getElementById('currencySelect').value;
    currentCurrency = currencies[selectedCurrency];
    updateCurrencyDetails();
});

// 购买按钮
document.getElementById('buyBtn').addEventListener('click', () => {
    // 新增价格检查
    if (currentCurrency.price <= 0.01) {
        alert('该货币价格已达到最低值，启动价格保护，暂时无法购买。');
        return;
    }

    let tradeType = document.getElementById('tradeType').value;
    let amount = parseFloat(document.getElementById('tradeAmount').value);
    let leverage = parseInt(document.getElementById('leverageSelect').value);

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额或数量');
        return;
    }

    let userInvestment;
    let totalInvestment;
    if (tradeType === 'bhy') {
        // 按 BHY 金额交易
        userInvestment = amount / leverage;
        totalInvestment = amount;
    } else if (tradeType === 'amount') {
        // 按虚拟货币数量交易
        totalInvestment = amount * currentCurrency.price;
        userInvestment = totalInvestment / leverage;
    }

    // 计算借款金额
    let borrowed = totalInvestment - userInvestment;

    if (bhy >= userInvestment) {
        bhy -= userInvestment;
        if (tradeType === 'bhy') {
            currentCurrency.ownedAmount += amount / currentCurrency.price;
        } else if (tradeType === 'amount') {
            currentCurrency.ownedAmount += amount;
        }
        // 更新杠杆信息
        currentCurrency.borrowedAmount += borrowed;
        currentCurrency.borrowDays = 0;
        currentCurrency.leverage = leverage;

        // 计算强制平仓价格
        calculateLiquidationPrice(totalInvestment, leverage);

        // 更新界面
        document.getElementById('currentBHY').innerText = bhy.toFixed(4);
        updateCurrencyDetails();
        updateAssetTable();
    } else {
        alert('BHY余额不足');
    }
});

// 卖出按钮
document.getElementById('sellBtn').addEventListener('click', () => {
    let tradeType = document.getElementById('tradeType').value;
    let amount = parseFloat(document.getElementById('tradeAmount').value);

    if (isNaN(amount) || amount <= 0) {
        alert('请输入有效的金额或数量');
        return;
    }

    let sellAmount;
    if (tradeType === 'bhy') {
        sellAmount = amount / currentCurrency.price;
    } else if (tradeType === 'amount') {
        sellAmount = amount;
    }

    if (currentCurrency.ownedAmount >= sellAmount) {
        // 计算卖出总价值
        let sellValue = sellAmount * currentCurrency.price;

        // 计算借款利息
        let interest = currentCurrency.borrowedAmount * 0.01 * currentCurrency.borrowDays;

        // 应归还的总金额
        let totalRepayment = currentCurrency.borrowedAmount + interest;

        // 实际获得的 BHY
        let netBHY = sellValue - totalRepayment;

        // 更新 BHY 余额
        bhy += netBHY;

        // 更新持有数量
        currentCurrency.ownedAmount -= sellAmount;

        // 清零借款信息
        if (currentCurrency.ownedAmount <= 0) {
            currentCurrency.borrowedAmount = 0;
            currentCurrency.borrowDays = 0;
            currentCurrency.leverage = 1;
            currentCurrency.liquidationPrice = null;
        }

        document.getElementById('currentBHY').innerText = bhy.toFixed(4);
        updateCurrencyDetails();
        updateAssetTable();
    } else {
        alert('持有的虚拟货币数量不足');
    }
});

// 全仓买入按钮
document.getElementById('buyAllBtn').addEventListener('click', () => {
    // 新增价格检查
    if (currentCurrency.price === 0.0001) {
        alert('该货币价格已达到最低值，暂时无法购买。');
        return;
    }

    let leverage = parseInt(document.getElementById('leverageSelect').value);

    // 计算可用的总投资金额
    let totalInvestment = bhy * leverage;

    // 计算用户需要支付的自有资金
    let userInvestment = bhy;

    // 计算借款金额
    let borrowed = totalInvestment - userInvestment;

    // 购买的虚拟货币数量
    let amount = totalInvestment / currentCurrency.price;

    // 更新 BHY 余额
    bhy -= userInvestment;

    // 更新持有数量
    currentCurrency.ownedAmount += amount;

    // 更新杠杆信息
    currentCurrency.borrowedAmount += borrowed;
    currentCurrency.borrowDays = 0;
    currentCurrency.leverage = leverage;

    // 计算强制平仓价格
    calculateLiquidationPrice(totalInvestment, leverage);

    document.getElementById('currentBHY').innerText = bhy.toFixed(4);
    updateCurrencyDetails();
    updateAssetTable();
});

// 全仓卖出按钮
document.getElementById('sellAllBtn').addEventListener('click', () => {
    if (currentCurrency.ownedAmount > 0) {
        // 计算卖出总价值
        let sellValue = currentCurrency.ownedAmount * currentCurrency.price;

        // 计算借款利息
        let interest = currentCurrency.borrowedAmount * 0.01 * currentCurrency.borrowDays;

        // 应归还的总金额
        let totalRepayment = currentCurrency.borrowedAmount + interest;

        // 实际获得的 BHY
        let netBHY = sellValue - totalRepayment;

        // 更新 BHY 余额
        bhy += netBHY;

        // 清零持有的虚拟货币数量和借款信息
        currentCurrency.ownedAmount = 0;
        currentCurrency.borrowedAmount = 0;
        currentCurrency.borrowDays = 0;
        currentCurrency.leverage = 1;
        currentCurrency.liquidationPrice = null;

        document.getElementById('currentBHY').innerText = bhy.toFixed(4);
        updateCurrencyDetails();
        updateAssetTable();
    } else {
        alert('您没有持有任何该虚拟货币');
    }
});

// 计算强制平仓价格的函数
function calculateLiquidationPrice(totalInvestment, leverage) {
    let entryPrice = currentCurrency.price;

    // 假设维持保证金率为 3%
    let maintenanceMarginRate = 0.03;

    // 强制平仓价格计算公式
    let liquidationPrice = entryPrice * (1 - ((1 / leverage) - maintenanceMarginRate));

    currentCurrency.liquidationPrice = liquidationPrice;
}

// 检查是否触发强制平仓
function checkLiquidation(currency) {
    if (currency.liquidationPrice && currency.price <= currency.liquidationPrice) {
        // 触发强制平仓
        alert(`${currency.name} 已触发强制平仓！`);

        // 清零持有的虚拟货币数量和借款信息
        currency.ownedAmount = 0;
        currency.borrowedAmount = 0;
        currency.borrowDays = 0;
        currency.leverage = 1;
        currency.liquidationPrice = null;

        // 更新界面显示
        updateCurrencyDetails();
        updateAssetTable();
    }
}

// 计时器，每15秒进入下一天
function startTimer() {
    timer = setInterval(() => {
        nextDay();
    }, 15000);
}

// 下一天按钮
document.getElementById('nextDayBtn').addEventListener('click', () => {
    nextDay();
});

// 进入下一天
function nextDay() {
    // 更新日期
    date.setDate(date.getDate() + 1);
    document.getElementById('currentDate').innerText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    // 每月一号尝试扣除贷款
    if (date.getDate() === 1) {
        if (bhy >= 50000) {
            // 有足够的 BHY 进行还款
            bhy -= 50000;
            loan -= 50000;
            document.getElementById('currentBHY').innerText = bhy.toFixed(4);
            document.getElementById('remainingLoan').innerText = loan.toFixed(4);
        } else {
            // BHY 不足，自动卖出所有虚拟货币
            alert('您的 BHY 余额不足以偿还贷款，系统将自动卖出所有虚拟货币。');

            for (let key in currencies) {
                let currency = currencies[key];

                if (currency.ownedAmount > 0) {
                    // 计算卖出总价值
                    let sellValue = currency.ownedAmount * currency.price;

                    // 计算借款利息
                    let interest = currency.borrowedAmount * 0.01 * currency.borrowDays;

                    // 应归还的总金额
                    let totalRepayment = currency.borrowedAmount + interest;

                    // 实际获得的 BHY
                    let netBHY = sellValue - totalRepayment;

                    bhy += netBHY;

                    // 清零持有的虚拟货币数量和借款信息
                    currency.ownedAmount = 0;
                    currency.borrowedAmount = 0;
                    currency.borrowDays = 0;
                    currency.leverage = 1;
                    currency.liquidationPrice = null;
                }
            }

            // 更新资产表和 BHY 显示
            updateAssetTable();
            document.getElementById('currentBHY').innerText = bhy.toFixed(4);

            // 检查卖出后是否有足够的 BHY 进行还款
            if (bhy >= 50000) {
                bhy -= 50000;
                loan -= 50000;
                document.getElementById('currentBHY').innerText = bhy.toFixed(4);
                document.getElementById('remainingLoan').innerText = loan.toFixed(4);
                alert('系统已卖出您的所有虚拟货币，并完成了贷款的还款。');
            } else {
                gameOver(false);
                return;
            }
        }
    }

    // 更新货币价格并计算杠杆利息
    for (let key in currencies) {
        let currency = currencies[key];

        // 计算涨跌概率
        if (currency.priceHistory.length > 1) {
            let yesterdayPrice = currency.priceHistory[currency.priceHistory.length - 2];
            let todayPrice = currency.priceHistory[currency.priceHistory.length - 1];
            if (todayPrice > yesterdayPrice) {
                currency.consecutiveRiseDays++;
                currency.consecutiveFallDays = 0;
                currency.riseProbability = 0.48 * Math.pow(0.95, currency.consecutiveRiseDays);
                currency.riseProbability = Math.min(currency.riseProbability, 0.75); // 最大上涨概率75%
            } else {
                currency.consecutiveFallDays++;
                currency.consecutiveRiseDays = 0;
                let fallProbability = 0.52 * Math.pow(0.96, currency.consecutiveFallDays);
                fallProbability = Math.min(fallProbability, 0.7); // 最大下跌概率70%
                currency.riseProbability = 1 - fallProbability;
            }
        }

        // 确定涨跌
        let random = Math.random();
        let isRise = random < currency.riseProbability;

        // 随机波动幅度
        let fluctuation = Math.random() * currency.maxFluctuation;

        // 如果是下跌，限制最大跌幅不超过90%
        if (!isRise && fluctuation > 0.9) {
            fluctuation = 0.9; // 最大跌幅90%
        }

        // 更新价格
        if (isRise) {
            currency.price *= (1 + fluctuation);
        } else {
            currency.price *= (1 - fluctuation);
        }

        // 确保价格不低于 0.0001
        if (currency.price < 0.0001) {
            currency.price = 0.0001;
        }

        currency.price = parseFloat(currency.price.toFixed(4));
        currency.priceHistory.push(currency.price);

        // 检查强制平仓
        checkLiquidation(currency);

        // 如果有借款，增加借款天数
        if (currency.borrowedAmount > 0) {
            currency.borrowDays += 1;
        }
    }

    // 检查是否胜利
    if (loan <= bhy) {
        gameOver(true);
        return;
    }

    updateCurrencyDetails();
    updateAssetTable();
}

// 绘制折线图
function drawChart() {
    let ctx = document.getElementById('priceChart').getContext('2d');
    if (chart) {
        chart.destroy();
    }
    let labels = currentCurrency.priceHistory.map((_, index) => `第${index + 1}天`);
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.slice(-14),
            datasets: [{
                label: `${currentCurrency.name}价格走势`,
                data: currentCurrency.priceHistory.slice(-14),
                borderColor: '#1890ff',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true
                },
                y: {
                    display: true
                }
            }
        }
    });
}

// 游戏结束
function gameOver(success) {
    clearInterval(timer);
    document.getElementById('gameInterface').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
    if (success) {
        document.getElementById('gameResult').innerText = '恭喜你，成功还清了贷款！';
    } else {
        document.getElementById('gameResult').innerText = '游戏失败。理财有风险，投资需谨慎！';
    }
}

// 重新开始游戏
document.getElementById('restartGameBtn').addEventListener('click', () => {
    location.reload();
});
