// app.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const fsExtra = require('fs-extra');
const multer = require('multer');
const path = require('path');
const unzipper = require('unzipper');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}));

// 设置模板引擎（用于渲染 404 页面）
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const gameId = req.body.gameId || Date.now().toString();
        const uploadPath = path.join(__dirname, 'uploads', gameId);
        fsExtra.emptyDirSync(uploadPath); // 清空目录
        req.uploadPath = uploadPath;
        req.gameId = gameId;
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, 'game.zip');
    }
});

const upload = multer({ storage: storage });

// 工具函数：读取用户数据
function readUsers() {
    return JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
}

// 工具函数：写入用户数据
function writeUsers(users) {
    fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));
}

// 工具函数：读取游戏数据
function readGames() {
    return JSON.parse(fs.readFileSync('./data/games.json', 'utf8'));
}

// 工具函数：写入游戏数据
function writeGames(games) {
    fs.writeFileSync('./data/games.json', JSON.stringify(games, null, 2));
}

// 注册
app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    let users = readUsers();
    if (users.find(user => user.username === username)) {
        return res.send('用户名已存在');
    }
    users.push({
        username,
        password,
        email,
        developerStatus: '未申请', // 新增开发者状态
        realName: '',
        phoneNumber: '',
        qqNumber: '',
        studentId: '',
        applicationReason: ''
    });
    writeUsers(users);
    res.send('注册成功');
});

// 登录
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    let users = readUsers();
    let user = users.find(user => user.username === username && user.password === password);
    if (user) {
        req.session.user = username;
        res.send('登录成功');
    } else {
        res.send('用户名或密码错误');
    }
});

// 登出
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.send('已登出');
});

// 申请成为开发者
app.post('/apply_developer', (req, res) => {
    if (!req.session.user) {
        return res.send('请先登录');
    }
    const { realName, phoneNumber, qqNumber, studentId, applicationReason } = req.body;
    let users = readUsers();
    let user = users.find(user => user.username === req.session.user);

    if (user.developerStatus !== '未申请') {
        return res.send('您已提交过申请');
    }

    user.developerStatus = '待审核';
    user.realName = realName;
    user.phoneNumber = phoneNumber;
    user.qqNumber = qqNumber;
    user.studentId = studentId;
    user.applicationReason = applicationReason;

    writeUsers(users);
    res.send('申请已提交，等待审核');
});

// 获取开发者信息
app.get('/developer_info', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }
    let users = readUsers();
    let user = users.find(u => u.username === req.session.user);
    if (!user) {
        return res.status(404).json({ error: '用户未找到' });
    }
    res.json({
        username: user.username,
        email: user.email,
        developerStatus: user.developerStatus,
        realName: user.developerStatus === '已批准' ? user.realName : undefined,
        phoneNumber: user.developerStatus === '已批准' ? user.phoneNumber : undefined,
        qqNumber: user.developerStatus === '已批准' ? user.qqNumber : undefined,
        studentId: user.developerStatus === '已批准' ? user.studentId : undefined
    });
});

// 获取开发者的游戏列表
app.get('/developer_games', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }
    let users = readUsers();
    let user = users.find(u => u.username === req.session.user);
    if (!user || user.developerStatus !== '已批准') {
        return res.status(403).json({ error: '您还不是开发者' });
    }
    let games = readGames();
    let userGames = games.filter(game => game.creator === user.username);
    // 计算实时平均评分排名
    let rankedGames = games.filter(g => g.status === '已上架' && g.ratings.length > 0);
    rankedGames.sort((a, b) => {
        const avgA = a.ratings.reduce((sum, r) => sum + r, 0) / a.ratings.length;
        const avgB = b.ratings.reduce((sum, r) => sum + r, 0) / b.ratings.length;
        if (avgB !== avgA) return avgB - avgA;
        if (b.ratings.length !== a.ratings.length) return b.ratings.length - a.ratings.length;
        return b.timestamp - a.timestamp;
    });
    let rankings = {};
    rankedGames.forEach((game, index) => {
        rankings[game.id] = index + 1;
    });
    let gameData = userGames.map(game => {
        const avgRating = game.ratings.length > 0 ? (game.ratings.reduce((sum, r) => sum + r, 0) / game.ratings.length).toFixed(2) : '暂无评分';
        const ranking = rankings[game.id] || '未上榜';
        return {
            id: game.id,
            name: game.name,
            status: game.status,
            averageRating: avgRating,
            ratingCount: game.ratings.length,
            ranking: ranking,
            imageLink: game.imageLink,
            instructionLink: game.instructionLink,
            category: game.category,
            donationLink: game.donationLink
        };
    });
    res.json(gameData);
});

// 修改游戏信息
app.post('/modify_game', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }
    let users = readUsers();
    let user = users.find(u => u.username === req.session.user);
    if (!user || user.developerStatus !== '已批准') {
        return res.status(403).json({ error: '您还不是开发者' });
    }
    const { gameId, imageLink, instructionLink, category, donationLink } = req.body;
    let games = readGames();
    let game = games.find(g => g.id === gameId && g.creator === user.username);
    if (!game) {
        return res.status(404).json({ error: '游戏未找到' });
    }
    // 检查是否有待审核的游戏
    let pendingGame = games.find(g => g.creator === user.username && g.status === '待审核');
    if (pendingGame && pendingGame.id !== gameId) {
        return res.status(403).json({ error: '您已经有一款游戏正在审核中，无法修改其他游戏' });
    }
    // 更新游戏信息
    game.imageLink = imageLink || game.imageLink;
    game.instructionLink = instructionLink || game.instructionLink;
    game.category = category || game.category;
    game.donationLink = donationLink || game.donationLink;
    // 修改后变为待审核状态
    game.status = '待审核';
    writeGames(games);
    res.json({ message: '游戏信息已修改，等待审核' });
});

// 重新上传游戏
app.post('/reupload_game', upload.single('gameFile'), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }
    let users = readUsers();
    let user = users.find(u => u.username === req.session.user);
    if (!user || user.developerStatus !== '已批准') {
        return res.status(403).json({ error: '您还不是开发者' });
    }
    const { gameId } = req.body;
    let games = readGames();
    let game = games.find(g => g.id === gameId && g.creator === user.username);
    if (!game) {
        return res.status(404).json({ error: '游戏未找到' });
    }
    // 检查是否有待审核的游戏
    let pendingGame = games.find(g => g.creator === user.username && g.status === '待审核');
    if (pendingGame && pendingGame.id !== gameId) {
        return res.status(403).json({ error: '您已经有一款游戏正在审核中，无法重新上传其他游戏' });
    }
    const { gameId: newGameId, uploadPath } = req;
    fs.createReadStream(path.join(uploadPath, 'game.zip'))
        .pipe(unzipper.Extract({ path: uploadPath }))
        .on('close', () => {
            fs.unlinkSync(path.join(uploadPath, 'game.zip'));
            // 更新游戏的文件夹和ID
            game.id = newGameId;
            // 修改后变为待审核状态
            game.status = '待审核';
            writeGames(games);
            res.json({ message: '游戏已重新上传，等待审核' });
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).json({ error: '解压缩失败' });
        });
});

// 上传游戏
app.post('/upload', upload.single('gameFile'), (req, res) => {
    if (!req.session.user) {
        return res.send('请先登录');
    }

    let users = readUsers();
    let user = users.find(user => user.username === req.session.user);

    if (user.developerStatus !== '已批准') {
        return res.send('您还不是游戏开发者哦');
    }

    let games = readGames();

    // 检查是否有待审核的游戏
    const pendingGame = games.find(game => game.creator === req.session.user && game.status === '待审核');
    if (pendingGame) {
        return res.send('你的游戏正在审核，暂不能提交新的游戏');
    }

    const username = req.session.user;
    const { gameId, uploadPath } = req;

    const { gameName, imageLink, instructionLink, category, donationLink } = req.body;

    if (!gameName || !imageLink) {
        return res.send('游戏名称和展示图片链接为必填项');
    }

    games.push({
        id: gameId,
        name: gameName,
        creator: username,
        category: category,
        imageLink: imageLink,
        instructionLink: instructionLink || '',
        donationLink: donationLink || '',
        status: '待审核', // 状态字段：待审核、已上架、已下架
        ratings: [],
        ratedUsers: [],
        timestamp: Date.now()
    });

    writeGames(games);

    fs.createReadStream(path.join(uploadPath, 'game.zip'))
        .pipe(unzipper.Extract({ path: uploadPath }))
        .on('close', () => {
            fs.unlinkSync(path.join(uploadPath, 'game.zip'));
            res.send('上传成功，等待审核');
        })
        .on('error', (err) => {
            console.error(err);
            res.send('解压缩失败');
        });
});


// 获取游戏列表，随机排序
app.get('/games', (req, res) => {
    let games = readGames();
    const category = req.query.category;
    if (category) {
        games = games.filter(game => game.category === category);
    }
    games = games.filter(game => game.status === '已上架');
    // 随机排序
    games.sort(() => Math.random() - 0.5);
    res.json(games);
});

// 获取所有游戏（管理员使用）
app.get('/all_games', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    let games = readGames();
    res.json(games);
});

// 评分
app.post('/rate', (req, res) => {
    if (!req.session.user) {
        return res.send('请先登录');
    }
    const username = req.session.user;
    const { gameId, rating } = req.body;
    let games = readGames();
    let game = games.find(game => game.id === gameId);
    if (game) {
        if (game.ratedUsers.includes(username)) {
            return res.send('您已经对该游戏评分过');
        }
        game.ratings.push(parseInt(rating));
        game.ratedUsers.push(username);
        writeGames(games);
        res.send('评分成功');
    } else {
        res.send('游戏未找到');
    }
});

// 管理员登录页面
app.get('/admin', (req, res) => {
    if (req.session.adminAuthenticated) {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'admin_login.html'));
    }
});

// 管理员登录
app.post('/admin_login', (req, res) => {
    const { adminPassword } = req.body;
    if (adminPassword === 'buaaaaub') {
        req.session.adminAuthenticated = true;
        res.redirect('/admin');
    } else {
        res.send('密码错误');
    }
});

// 管理员登出
app.get('/admin_logout', (req, res) => {
    req.session.adminAuthenticated = false;
    res.send('管理员已登出');
});

// 批准游戏
app.post('/approve_game', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    const { gameId } = req.body;
    let games = readGames();
    let game = games.find(game => game.id === gameId);
    if (game) {
        game.status = '已上架';
        writeGames(games);
        res.send('操作成功');
    } else {
        res.send('游戏未找到');
    }
});

// 驳回或下架游戏
app.post('/reject_game', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    const { gameId } = req.body;
    let games = readGames();
    let game = games.find(game => game.id === gameId);
    if (game) {
        game.status = '已下架';
        writeGames(games);
        res.send('操作成功');
    } else {
        res.send('游戏未找到');
    }
});

// 管理员获取用户列表
app.get('/all_users', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    let users = readUsers();
    res.json(users);
});

// 批准开发者申请
app.post('/approve_developer', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    const { username } = req.body;
    let users = readUsers();
    let user = users.find(user => user.username === username);
    if (user) {
        user.developerStatus = '已批准';
        writeUsers(users);
        res.send('操作成功');
    } else {
        res.send('用户未找到');
    }
});

// 封禁用户
app.post('/ban_user', (req, res) => {
    if (!req.session.adminAuthenticated) {
        return res.send('未经授权');
    }
    const { username } = req.body;
    let users = readUsers();
    let user = users.find(user => user.username === username);
    if (user) {
        user.isBanned = true;
        writeUsers(users);
        res.send('用户已被封禁');
    } else {
        res.send('用户未找到');
    }
});

// 检查登录状态
app.get('/check_login', (req, res) => {
    if (req.session.user) {
        let users = readUsers();
        let user = users.find(user => user.username === req.session.user);
        res.json({ loggedIn: true, username: req.session.user, developerStatus: user.developerStatus });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/leaderboard', (req, res) => {
    let games = readGames();
    let users = readUsers();

    // 最佳游戏榜
    let bestGames = games.filter(game => game.ratings.length > 0 && game.status === '已上架');
    bestGames.sort((a, b) => {
        const avgA = a.ratings.reduce((sum, r) => sum + r, 0) / a.ratings.length;
        const avgB = b.ratings.reduce((sum, r) => sum + r, 0) / b.ratings.length;
        if (avgB !== avgA) return avgB - avgA; // 从高到低排序
        if (b.ratings.length !== a.ratings.length) return b.ratings.length - a.ratings.length;
        return b.timestamp - a.timestamp;
    });
    bestGames = bestGames.slice(0, 5);

    // 最烂游戏榜
    let worstGames = games.filter(game => game.ratings.length > 0 && game.status === '已上架');
    worstGames.sort((a, b) => {
        const avgA = a.ratings.reduce((sum, r) => sum + r, 0) / a.ratings.length;
        const avgB = b.ratings.reduce((sum, r) => sum + r, 0) / b.ratings.length;
        if (avgA !== avgB) return avgA - avgB; // 从低到高排序
        if (a.ratings.length !== b.ratings.length) return a.ratings.length - b.ratings.length;
        return a.timestamp - b.timestamp;
    });
    worstGames = worstGames.slice(0, 5);

    // 开发者榜（保持不变）
    let developerGames = {};
    games.forEach(game => {
        if (game.status === '已上架') {
            developerGames[game.creator] = developerGames[game.creator] ? developerGames[game.creator] + 1 : 1;
        }
    });

    let developers = users.filter(user => developerGames[user.username]);
    developers.sort((a, b) => {
        return developerGames[b.username] - developerGames[a.username];
    });
    developers = developers.slice(0, 5);

    // 获取开发者的代表作
    developers = developers.map(dev => {
        let devGames = games.filter(game => game.creator === dev.username && game.status === '已上架');
        devGames.sort((a, b) => b.timestamp - a.timestamp);
        devGames = devGames.slice(0, 3);
        return {
            username: dev.username,
            qqNumber: dev.qqNumber,
            studentId: dev.studentId,
            games: devGames
        };
    });

    res.json({ bestGames, worstGames, developers });
});


// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
    console.log(`服务器已启动，访问：http://localhost:${port}`);
});
