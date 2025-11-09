# 🔥 Firebase 快速设置指南（5分钟）

## 步骤 1: 创建 Firebase 项目（2分钟）

1. **访问 Firebase Console**
   - 打开浏览器，访问：https://console.firebase.google.com/
   - 使用你的 Google 账号登录

2. **创建新项目**
   - 点击 "Add project" 或 "创建项目"
   - 项目名称：`daily-planner`（或任何你喜欢的名字）
   - 点击 "Continue"（继续）
   - **取消勾选** "Enable Google Analytics"（可选，可以先不启用）
   - 点击 "Create project"（创建项目）
   - 等待创建完成（约30秒）
   - 点击 "Continue"（继续）

## 步骤 2: 启用 Firestore 数据库（1分钟）

1. **打开 Firestore Database**
   - 在左侧菜单中，点击 "Firestore Database"
   - 点击 "Create database"（创建数据库）

2. **选择模式**
   - 选择 **"Start in test mode"**（测试模式）
   - 点击 "Next"（下一步）

3. **选择位置**
   - 选择一个离你最近的位置（例如：`us-central` 或 `asia-east1`）
   - 点击 "Enable"（启用）
   - 等待创建完成（约30秒）

## 步骤 3: 获取配置信息（1分钟）

1. **打开项目设置**
   - 点击左上角的齿轮图标 ⚙️
   - 点击 "Project settings"（项目设置）

2. **添加 Web 应用**
   - 滚动到 "Your apps"（你的应用）部分
   - 点击 Web 图标 `</>`（或 "Add app" → Web）

3. **注册应用**
   - App nickname（应用昵称）：`Daily Planner`（或任何名字）
   - **不要勾选** "Also set up Firebase Hosting"
   - 点击 "Register app"（注册应用）

4. **复制配置**
   - 你会看到一个 `firebaseConfig` 对象
   - **复制整个配置对象**，它看起来像这样：
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```

## 步骤 4: 更新代码（1分钟）

1. **打开 `src/firebase.js`**
2. **替换配置**
   - 将你复制的 `firebaseConfig` 粘贴到文件中
   - 替换掉所有的 `YOUR_API_KEY`、`YOUR_PROJECT_ID` 等占位符

3. **保存文件**

## 步骤 5: 设置安全规则（1分钟）

1. **打开 Firestore Rules**
   - 在 Firebase Console 中，点击 "Firestore Database"
   - 点击 "Rules"（规则）标签

2. **更新规则**
   - 将规则替换为：
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{collection}/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   - 点击 "Publish"（发布）

   ⚠️ **注意**：这个规则允许任何人读写数据。对于个人使用是可以的，但如果要分享给他人，建议添加身份验证。

## 步骤 6: 测试（30秒）

1. **重启开发服务器**
   ```bash
   # 停止当前服务器（Ctrl+C）
   npm run dev
   ```

2. **打开浏览器控制台（F12）**
   - 应该看到：`✅ Firebase initialized successfully`
   - 应该看到：`✅ Firebase detected, using cloud storage`

3. **添加一个任务**
   - 应该看到：`✅ Draft tasks saved to Firebase: 1 tasks`

4. **刷新页面**
   - 任务应该还在！🎉

## 完成！

现在你的数据会保存到 Firebase 云端：
- ✅ 刷新后数据不会丢失
- ✅ 可以在不同设备上访问
- ✅ 数据自动同步

## 如果遇到问题

### 错误：Permission denied
- 检查 Firestore Rules 是否已发布
- 确保规则允许 read 和 write

### 错误：Firebase not configured
- 检查 `src/firebase.js` 中的配置是否正确
- 确保没有留下 `YOUR_API_KEY` 等占位符

### 数据没有保存
- 检查浏览器控制台是否有错误
- 确认 Firestore Database 已启用
- 确认安全规则已发布

