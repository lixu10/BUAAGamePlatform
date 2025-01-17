# BUAAGamePlatform
A game platform that not only allows users to play games online, but also allows developers to easily upload and publish their own games.

# Inctroduction
It is the final work of "Go in Software"(a waterful course).
Powered by LX and **ChatGPT o1**.   

# Installation
### 1. Install node.js and npm
### 2. Execute in the root directory
```
npm init -y
npm install express body-parser multer unzipper express-session uuid fs-extra
```
### 3. Upload and unzip website files to the root directory
### 4. Modify code content (such as initial knowledge data, game information, etc.)
### 5. Launch the website(You can also use PM2)
```
node app.js
```
### 6. Visit your website on `localhost:3000`



# Construction
www/  
├── app.js  
├── package.json   
├── public/  
│   ├── index.html  
│   ├── login.html  
│   ├── register.html  
│   ├── upload.html  
│   ├── games.html  
│   ├── game.html  
│   ├── admin.html  
│   ├── admin_login.html  
│   ├── css/  
│   │   ├── styles.css   
│   │   ├── form.css  
│   │   ├── games.css  
│   │   └── admin.css   
│   └── js/  
│       └── scripts.js  
├── data/  
│   ├── users.json  
│   └── games.json  
└── uploads/  
