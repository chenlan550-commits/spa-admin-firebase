# 快速开始指南

## 后台管理系统 - GitHub 和部署设置

### GitHub 账号信息
- **GitHub 用户名**: `chenlan550-commits`
- **后台仓库**: `spa-admin-firebase`
- **前端仓库**: `luxury-spa-website`

---

## 🚀 一键部署命令

### Step 1: 推送后台到 GitHub

```bash
cd C:\Users\polung\Desktop\spa-admin-firebase

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: SPA admin dashboard"

# 添加远程仓库
git remote add origin https://github.com/chenlan550-commits/spa-admin-firebase.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### Step 2: 部署到 Firebase

```bash
# 安装 Firebase CLI（如果还没有）
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 构建应用
npm run build

# 部署
firebase deploy
```

---

## 🌐 前端网站部署

### Step 1: 推送前端到 GitHub

```bash
cd C:\Users\polung\Desktop\luxury-spa-website

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Luxury SPA website"

# 添加远程仓库
git remote add origin https://github.com/chenlan550-commits/luxury-spa-website.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### Step 2: 连接 Cloudflare Pages

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages > Create application > Pages
3. Connect to Git > 选择 `chenlan550-commits/luxury-spa-website`
4. 设置构建配置：
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: **18**

5. 添加环境变量（Production 和 Preview）：
   ```
   VITE_FIREBASE_API_KEY=AIzaSyCEWsKYjXTBD-k-zcKEmYeaQ6INxhhb08w
   VITE_FIREBASE_AUTH_DOMAIN=spa-admin-firebase.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=spa-admin-firebase
   VITE_FIREBASE_STORAGE_BUCKET=spa-admin-firebase.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=12778948033
   VITE_FIREBASE_APP_ID=1:12778948033:web:94c0dfed597ddfc37c9b40
   ```

6. 添加自定义域名: `polung.dpdns.org`

---

## 📋 检查清单

### 后台系统
- [ ] 推送到 GitHub: `chenlan550-commits/spa-admin-firebase`
- [ ] 部署到 Firebase Hosting
- [ ] 部署 Firestore Rules
- [ ] 创建管理员账号（Firebase Authentication）
- [ ] 测试登入功能

### 前端网站
- [ ] 推送到 GitHub: `chenlan550-commits/luxury-spa-website`
- [ ] 连接 Cloudflare Pages
- [ ] 设置环境变量
- [ ] 添加自定义域名 `polung.dpdns.org`
- [ ] 测试网站功能

### 整合测试
- [ ] 前端可以显示疗程服务
- [ ] 前端可以提交预约
- [ ] 后台可以查看前端提交的预约
- [ ] 后台可以管理客户和会员

---

## 🔗 访问地址

### 开发环境
- **后台本地**: `http://localhost:5173`
- **前端本地**: `http://localhost:5173`

### 生产环境
- **后台管理**: `https://spa-admin-firebase.web.app`
- **前端网站**: `https://polung.dpdns.org`
- **Cloudflare 预览**: `https://luxury-spa-website.pages.dev`

---

## 📞 Firebase 项目信息

- **项目 ID**: `spa-admin-firebase`
- **项目名称**: SPA Admin Firebase
- **Firebase Console**: https://console.firebase.google.com/project/spa-admin-firebase

---

## ⚙️ 后续更新流程

### 更新后台
```bash
cd C:\Users\polung\Desktop\spa-admin-firebase
git add .
git commit -m "描述更新内容"
git push origin main
npm run build
firebase deploy
```

### 更新前端
```bash
cd C:\Users\polung\Desktop\luxury-spa-website
git add .
git commit -m "描述更新内容"
git push origin main
# Cloudflare Pages 会自动部署
```

---

## 🆘 需要帮助？

- **GitHub 设置**: 查看 `GITHUB_SETUP.md`
- **部署指南**: 查看 `DEPLOYMENT.md`
- **Firebase 文档**: https://firebase.google.com/docs
- **Cloudflare Pages 文档**: https://developers.cloudflare.com/pages
