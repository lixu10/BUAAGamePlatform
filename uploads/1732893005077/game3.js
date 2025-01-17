// 获取当前所有标签
var container = document.querySelector('.container');
var brickBox = container.querySelector('.brickBox');
var ball = container.querySelector('.ball');
var slider = container.querySelector('.slider');
var scoreDisplay = document.createElement('div'); // 创建一个显示分数的元素

// 动态创建砖块
// 定义砖块大小
var brickWidth = 50;
var brickHeight = 15;
// 计算砖块数量
var brickNum = brickBox.clientWidth * brickBox.clientHeight / (brickWidth * brickHeight);
var brickColNum = brickBox.clientWidth / brickWidth;

// 计分变量
var score = 0;

// 在页面上初始化分数显示
scoreDisplay.style.position = 'absolute';
scoreDisplay.style.top = '10px';
scoreDisplay.style.left = '10px';
scoreDisplay.style.fontSize = '20px';
scoreDisplay.innerText = "Score: " + score; // 显示初始分数
container.appendChild(scoreDisplay); // 将分数显示添加到容器中

// 根据数量去创建
for (var i = 0; i < brickNum; i++) {
    var div = document.createElement('div');
    setStyle(div, {
        width: brickWidth + "px",
        height: brickHeight + "px",
        backgroundColor: getColor(true),
        position: 'absolute',
        top: parseInt(i / brickColNum) * brickHeight + 'px',
        left: (i % brickColNum) * brickWidth + 'px'
    });
    brickBox.appendChild(div);
}

// 点击滑块让小球开始运动
// 定义横向移动的值和纵向移动的值
var speedX = getRandom(1, 8);
var speedY = getRandom(1, 8);
var timer;

// 点击移动
slider.onclick = move;
move();

// 回车键开始弹
function move() {
    var count = 0;
    clearInterval(timer);
    timer = setInterval(function () {
        // 开始移动
        // 获取小球的left和top
        var left = ball.offsetLeft;
        var top = ball.offsetTop;

        // 让left和top增加速度
        // 小球和滑块相撞
        if (boom(slider, ball)) {
            speedY = -speedY;
        }
        // 小球和大盒子相撞
        if (left <= 0 || left >= container.clientWidth - ball.offsetWidth) {
            speedX = -speedX;
        }
        if (top <= 0) {
            speedY = -speedY;
        }

        // 检测所有砖块和小球是否相撞
        for (var i = 0; i < brickBox.children.length; i++) {
            if (boom(brickBox.children[i], ball)) {
                speedY = -speedY;
                brickBox.removeChild(brickBox.children[i]);
                count++;
                score += 10; // 每拆除一个砖块，增加10分
                scoreDisplay.innerText = "Score: " + score; // 更新分数显示
            }
        }
        console.log(count)

        // GAME OVER
        if (top >= container.clientHeight - ball.offsetHeight) {
            clearInterval(timer);
            alert("Game Over! Your score is: " + score); // 游戏结束时显示分数
            location.reload();
        }
        left += speedX;
        top += speedY;
        // 设置给小球的left和top
        ball.style.left = left + "px";
        ball.style.top = top + "px";
    }, 20);
}

// 让滑块跟着鼠标移动
document.onmousemove = function (e) {
    var e = e || window.event;
    var x = e.pageX;
    var l = x - container.offsetLeft - 1 - slider.offsetWidth / 2;
    if (l < 0) {
        l = 0;
    }
    if (l > container.clientWidth - slider.offsetWidth) {
        l = container.clientWidth - slider.offsetWidth;
    }
    slider.style.left = l + "px";
}

// 让滑块跟着左右键盘移动
window.onload = function () {
    document.onkeydown = function () {
        var e = e || window.event;
        var keycode = e.keyCode || e.which;
        var keyword = String.fromCharCode(keycode).toLowerCase();
        if (keycode == 13) {
            move();
        }
        if (keyword == 'a') {
            console.log("1111");
            slider.style.left = slider.offsetLeft - 15 + "px";
        } else if (keyword == 'd') {
            console.log("222");
            slider.style.left = slider.offsetLeft + 15 + "px";
        }
        console.log(slider.offsetLeft);
    }
}

// 封装检测相撞的函数
function boom(node1, node2) {
    // 不撞在一起的只有4种可能
    if (node1.offsetLeft + node1.offsetWidth < node2.offsetLeft
        || node1.offsetTop + node1.offsetHeight < node2.offsetTop
        || node2.offsetLeft + node2.offsetWidth < node1.offsetLeft
        || node2.offsetTop + node2.offsetHeight < node1.offsetTop) {
        return false;
    } else {
        return true;
    }
}

// 封装获取随机颜色的函数
function getColor() {
    var hex = true;
    if (hex) {
        var color = '#';
        for (var i = 0; i < 3; i++) {
            var rgb = getRandom(256).toString(16);
            rgb = rgb.length === 1 ? '0' + rgb : rgb;
            color += rgb;
        }
        return color;
    }
    return "rgb(" + getRandom(256) + "," + getRandom(256) + "," + getRandom(256) + ")";
}

// 封装设置样式的函数
function setStyle(ele, styleObj) {
    for (var attr in styleObj) {
        ele.style[attr] = styleObj[attr];
    }
}

// 封装获取随机数的函数
function getRandom(a, b = 0) {
    var max = Math.max(a, b);
    var min = Math.min(a, b);
    return Math.floor(Math.random() * (max - min)) + min;
}
