# GitHub 设置指南

## 后台管理系统 (spa-admin-firebase)

### 1. 初始化 Git 仓库

```bash
cd C:\Users\polung\Desktop\spa-admin-firebase

# 初始化 Git
git init

# 添加 .gitignore 文件（如果没有）
# 确保包含以下内容：
# node_modules/
# dist/
# .env
# .env.local
# .firebase/
```

### 2. 创建 .gitignore 文件

```bash
# 创建 .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local

# Firebase
.firebase/
.firebaserc

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
EOF
```

### 3. 提交到本地仓库

```bash
git add .
git commit -m "Initial commit: SPA admin dashboard with Firebase integration"
```

### 4. 创建 GitHub 仓库并推送

#### 4.1 在 GitHub 创建新仓库
1. 登入 GitHub 账号: **chenlan550-commits**
2. 点击 "New repository"
3. 仓库名称: `spa-admin-firebase`
4. 设为 Private（推荐，因为是后台系统）
5. **不要**初始化 README、.gitignore 或 license
6. 点击 "Create repository"

#### 4.2 连接并推送到 GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/chenlan550-commits/spa-admin-firebase.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 5. 设置 GitHub Secrets（用于自动部署）

如果要使用 GitHub Actions 自动部署：

1. 进入仓库页面
2. 点击 Settings > Secrets and variables > Actions
3. 添加以下 Secrets：

```
VITE_FIREBASE_API_KEY=AIzaSyCEWsKYjXTBD-k-zcKEmYeaQ6INxhhb08w
VITE_FIREBASE_AUTH_DOMAIN=spa-admin-firebase.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=spa-admin-firebase
VITE_FIREBASE_STORAGE_BUCKET=spa-admin-firebase.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=12778948033
VITE_FIREBASE_APP_ID=1:12778948033:web:94c0dfed597ddfc37c9b40
FIREBASE_SERVICE_ACCOUNT=(需要从 Firebase Console 获取)
```

### 6. 获取 Firebase Service Account

1. 进入 Firebase Console
2. 选择项目: spa-admin-firebase
3. 点击设置 (齿轮图标) > Project settings
4. 选择 Service accounts
5. 点击 "Generate new private key"
6. 下载 JSON 文件
7. 将整个 JSON 内容复制到 GitHub Secret `FIREBASE_SERVICE_ACCOUNT`

### 7. 后续更新

每次修改代码后：

```bash
git add .
git commit -m "描述您的更改"
git push origin main
```

### 8. 仓库地址

- GitHub 仓库: `https://github.com/chenlan550-commits/spa-admin-firebase`
- Clone URL: `https://github.com/chenlan550-commits/spa-admin-firebase.git`

### 9. 团队协作（可选）

如需添加其他开发者：
1. 进入仓库 Settings > Collaborators
2. 添加协作者的 GitHub 用户名

### 10. 分支策略建议

```
main - 生产环境
  └─ develop - 开发环境
      └─ feature/* - 功能分支
```

### 11. 保护主分支（建议）

1. Settings > Branches
2. Add branch protection rule
3. Branch name pattern: `main`
4. 启用:
   - Require pull request reviews before merging
   - Require status checks to pass before merging

## 注意事项

⚠️ **重要**:
- 永远不要提交 `.env` 文件到 Git
- 确保 `.gitignore` 包含所有敏感文件
- Firebase API Key 可以公开，但要设置好 Security Rules
- Service Account Key 必须保密

✅ **已包含在 .gitignore**:
- node_modules/
- dist/
- .env 和 .env.local
- .firebase/
