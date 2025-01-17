function checkLoginStatus() {
    fetch('/check_login')
        .then(response => response.json())
        .then(data => {
            const authButtons = document.querySelector('.auth-buttons');
            const authButtonsSidebar = document.querySelector('.auth-buttons-sidebar');
            if (data.loggedIn) {
                authButtons.innerHTML = `<span>欢迎，${data.username}</span> <button id="logoutBtn">登出</button>`;
                authButtonsSidebar.innerHTML = `<span>欢迎，${data.username}</span><button id="logoutBtnSidebar">登出</button>`;
                document.getElementById('logoutBtn').addEventListener('click', logout);
                document.getElementById('logoutBtnSidebar').addEventListener('click', logout);
            } else {
                authButtons.innerHTML = `<button id="loginBtn">登录</button><button id="registerBtn">注册</button>`;
                authButtonsSidebar.innerHTML = `<button id="loginBtnSidebar">登录</button><button id="registerBtnSidebar">注册</button>`;
                document.getElementById('loginBtn').addEventListener('click', () => location.href = '/login.html');
                document.getElementById('registerBtn').addEventListener('click', () => location.href = '/register.html');
                document.getElementById('loginBtnSidebar').addEventListener('click', () => location.href = '/login.html');
                document.getElementById('registerBtnSidebar').addEventListener('click', () => location.href = '/register.html');
            }
        });
}

function logout() {
    fetch('/logout')
        .then(response => response.text())
        .then(data => {
            alert(data);
            location.reload();
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.carousel-item');
    let currentIndex = 0;
    const intervalTime = 5000; 

    function showNextImage() {
        items[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex].classList.add('active');
    }

    setInterval(showNextImage, intervalTime);
    const links = [
        '/',
        './game1.html',
        './game2.html',
        './game3.html',
        './game4.html',
        './game5.html',
        './game6.html'
    ];
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        carousel.addEventListener('click', () => {
            window.location.href = links[currentIndex];
        });
    }
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    function openSidebar() {
        sidebar.classList.add('active');
    }
    function closeSidebar() {
        sidebar.classList.remove('active');
    }
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            openSidebar();
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            closeSidebar();
        });
    }
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                closeSidebar();
            }
        });
    }

    checkLoginStatus();
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    if (leaderboardContainer) {
        fetch('/leaderboard')
            .then(response => response.json())
            .then(data => {
                renderLeaderboard(data);
            });
    }
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', () => {
            const gameFrame = document.getElementById('gameFrame');
            if (gameFrame.requestFullscreen) {
                gameFrame.requestFullscreen();
            } else if (gameFrame.webkitRequestFullscreen) {
                gameFrame.webkitRequestFullscreen();
            } else if (gameFrame.msRequestFullscreen) {
                gameFrame.msRequestFullscreen();
            }
        });
    }
    const developerForm = document.getElementById('developerForm');
    if (developerForm) {
        developerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(developerForm);
            fetch('/apply_developer', {
                method: 'POST',
                body: new URLSearchParams(formData)
            })
            .then(response => response.text())
            .then(data => {
                alert(data);
                location.reload();
            });
        });
    }
    const adminSection = document.getElementById('adminSection');
    if (adminSection) {
        loadAdminData();
    }
});

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(registerForm);
        fetch('/register', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
            .then(response => response.text())
            .then(data => alert(data));
    });
}
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        fetch('/login', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
            .then(response => response.text())
            .then(data => {
                alert(data);
                if (data === '登录成功') {
                    location.href = '/';
                }
            });
    });
}
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetch('/check_login')
            .then(response => response.json())
            .then(data => {
                if (!data.loggedIn) {
                    alert('请先登录');
                    location.href = '/login.html';
                } else {
                    const formData = new FormData(uploadForm);
                    fetch('/upload', {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.text())
                        .then(data => alert(data))
                        .catch(err => console.error(err));
                }
            });
    });
}
const gameList = document.getElementById('gameList');
if (gameList) {
    const categorySelect = document.getElementById('categorySelect');
    function loadGames(category) {
        let url = '/games';
        if (category && category !== '全部') {
            url += `?category=${encodeURIComponent(category)}`;
        }
        fetch(url)
            .then(response => response.json())
            .then(games => {
                gameList.innerHTML = '';
                if (games.length === 0) {
                    gameList.innerHTML = '<p>暂无游戏。</p>';
                    return;
                }
                games.forEach(game => {
                    const div = document.createElement('div');
                    div.classList.add('game-item');
                    const averageRating = game.ratings.length > 0 ? (game.ratings.reduce((a, b) => a + b, 0) / game.ratings.length).toFixed(1) : null;
                    const ratingText = averageRating ? getRatingText(averageRating) : '暂无评分';
                    div.innerHTML = `
                        <img src="${game.imageLink}" alt="游戏图片">
                        <div class="game-info">
                            <h3>${game.name}</h3>
                            <p>创建者：${game.creator}</p>
                            <p>分类：${game.category}</p>
                            <p>平均评分：${averageRating || '暂无评分'} ${averageRating ? '(' + ratingText + ')' : ''}</p>
                            <a href="game.html?id=${game.id}" class="play-button">开始游戏</a>
                        </div>
                    `;
                    gameList.appendChild(div);
                });
            })
            .catch(err => {
                console.error(err);
                gameList.innerHTML = '<p>加载游戏列表时出错。</p>';
            });
    }
    loadGames();
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            const selectedCategory = categorySelect.value;
            if (selectedCategory === '全部') {
                loadGames();
            } else {
                loadGames(selectedCategory);
            }
        });
    }
}
function getRatingText(averageRating) {
    if (averageRating >= 4.5) {
        return '好评如潮';
    } else if (averageRating >= 4) {
        return '特别好评';
    } else if (averageRating >= 3.5) {
        return '多半好评';
    } else if (averageRating >= 2.5) {
        return '褒贬不一';
    } else if (averageRating >= 2) {
        return '多半差评';
    } else if (averageRating >= 1.5) {
        return '特别差评';
    } else {
        return '差评如潮';
    }
}const gameFrame = document.getElementById('gameFrame');
const gameTitle = document.getElementById('gameTitle');
const rateForm = document.getElementById('rateForm');
if (gameFrame && rateForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    fetch('/games')
        .then(response => response.json())
        .then(games => {
            const game = games.find(g => g.id === gameId);
            if (game) {
                gameTitle.innerText = game.name;
                gameFrame.src = `/uploads/${gameId}/index.html`;
                const gameMeta = document.querySelector('.game-meta');
                if (gameMeta) {
                    gameMeta.innerHTML = `
                        <p>作者：${game.creator}</p>
                        ${game.instructionLink ? `<a href="${game.instructionLink}" target="_blank" class="instruction-button">使用说明</a>` : ''}
                        ${game.donationLink ? '<button class="donate-button">捐赠作者</button>' : ''}
                    `;
                    if (game.donationLink) {
                        const donateButton = gameMeta.querySelector('.donate-button');
                        if (donateButton) {
                            donateButton.addEventListener('click', () => {
                                const modal = document.querySelector('.donation-modal');
                                const modalImg = document.querySelector('.donation-modal-content img');
                                modalImg.src = game.donationLink;
                                modal.style.display = 'block';
                            });
                        }
                    }
                }
            } else {
                alert('游戏未找到');
            }
        });
    const modal = document.querySelector('.donation-modal');
    if (modal) {
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    rateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        fetch('/check_login')
            .then(response => response.json())
            .then(data => {
                if (!data.loggedIn) {
                    alert('请先登录');
                    location.href = '/login.html';
                } else {
                    const formData = new FormData(rateForm);
                    formData.append('gameId', gameId);
                    fetch('/rate', {
                        method: 'POST',
                        body: new URLSearchParams(formData)
                    })
                        .then(response => response.text())
                        .then(data => alert(data));
                }
            });
    });
}

function renderLeaderboard(data) {
    const leaderboardContainer = document.getElementById('leaderboardContainer');
    const bestGamesSection = document.createElement('div');
    bestGamesSection.classList.add('leaderboard-section');
    bestGamesSection.innerHTML = `<h3>最佳游戏榜</h3>`;
    data.bestGames.forEach(game => {
        const avgRating = (game.ratings.reduce((a, b) => a + b, 0) / game.ratings.length).toFixed(1);
        const ratingText = getRatingText(avgRating);
        const item = document.createElement('div');
        item.classList.add('leaderboard-item');
        item.innerHTML = `
            <img src="${game.imageLink}" alt="${game.name}">
            <div class="info">
                <h4>${game.name}</h4>
                <p>作者：${game.creator}</p>
                <p>评分：${avgRating} (${ratingText})</p>
            </div>
            <a href="game.html?id=${game.id}" class="play-button">进入游戏</a>
        `;
        bestGamesSection.appendChild(item);
    });
    const worstGamesSection = document.createElement('div');
    worstGamesSection.classList.add('leaderboard-section');
    worstGamesSection.innerHTML = `<h3>最烂游戏榜</h3>`;
    data.worstGames.forEach(game => {
        const avgRating = (game.ratings.reduce((a, b) => a + b, 0) / game.ratings.length).toFixed(1);
        const ratingText = getRatingText(avgRating);
        const item = document.createElement('div');
        item.classList.add('leaderboard-item');
        item.innerHTML = `
            <img src="${game.imageLink}" alt="${game.name}">
            <div class="info">
                <h4>${game.name}</h4>
                <p>作者：${game.creator}</p>
                <p>评分：${avgRating} (${ratingText})</p>
            </div>
            <a href="game.html?id=${game.id}" class="play-button">进入游戏</a>
        `;
        worstGamesSection.appendChild(item);
    });

    const developersSection = document.createElement('div');
    developersSection.classList.add('leaderboard-section');
    developersSection.innerHTML = `<h3>开发者榜</h3>`;
    data.developers.forEach(dev => {
        const item = document.createElement('div');
        item.classList.add('leaderboard-item', 'developer-item');
        const gamesLinks = dev.games.map(game => `<a href="game.html?id=${game.id}" class="play-button">${game.name}</a>`).join(' ');
        item.innerHTML = `
            <div class="info">
                <h4>${dev.username}</h4>
                <p>QQ号：${dev.qqNumber || '未提供'}</p>
                <p>学号：${dev.studentId || '未提供'}</p>
                <p>代表作：${gamesLinks}</p>
            </div>
        `;
        developersSection.appendChild(item);
    });

    leaderboardContainer.appendChild(bestGamesSection);
    leaderboardContainer.appendChild(worstGamesSection);
    leaderboardContainer.appendChild(developersSection);
}


function getRatingText(averageRating) {
    if (averageRating >= 4.5) {
        return '好评如潮';
    } else if (averageRating >= 4) {
        return '特别好评';
    } else if (averageRating >= 3.5) {
        return '多半好评';
    } else if (averageRating >= 2.5) {
        return '褒贬不一';
    } else if (averageRating >= 2) {
        return '多半差评';
    } else if (averageRating >= 1.5) {
        return '特别差评';
    } else {
        return '差评如潮';
    }
}


const pendingGamesDiv = document.getElementById('pendingGames');
if (pendingGamesDiv) {
    fetch('/games')
        .then(response => response.json())
        .then(games => {
            games.forEach(game => {
                if (!game.approved) {
                    const div = document.createElement('div');
                    div.classList.add('pending-game');
                    div.innerHTML = `
                        <h3>${game.name}</h3>
                        <p>创建者：${game.creator}</p>
                        <p>分类：${game.category}</p>
                        <button data-gameid="${game.id}" class="approveBtn">通过审核</button>
                    `;
                    pendingGamesDiv.appendChild(div);
                }
            });
            document.querySelectorAll('.approveBtn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const gameId = e.target.getAttribute('data-gameid');
                    fetch('/approve', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gameId })
                    })
                        .then(response => response.text())
                        .then(data => {
                            alert(data);
                            location.reload();
                        });
                });
            });
        });
}
