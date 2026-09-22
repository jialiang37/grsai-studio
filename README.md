# Grsai 图像工作站

基于 [Grsai API](https://grsai.ai) 的纯静态图像生成网页：**文生图 · 图生图 · 批量生成 · 打包下载**。

无需服务器、无需构建，可直接部署在 GitHub Pages 或任何静态托管上。

## ✨ 功能

- **文生图 / 图生图**：输入提示词直接生成；上传参考图（多张）后转为图生图编辑模式
- **15 个模型可选**：GPT Image 系列（gpt-image-2.5 / 2 / vip / flare / sunburst）+ Nano Banana 系列（pro / 2 / fast / lite 及稳定渠道），按模型自动联动可选的比例、分辨率、质量档
- **导入 KEY，不落盘**：API Key 仅保存在当前页面的内存中，刷新或关闭页面即清除，不写入 localStorage、不上传任何服务器
- **批量生成**：一次提交 1–10 张，任务卡片实时显示进度（0–100%）
- **下载保存**：单张下载；勾选多个任务后可打包成 ZIP 一次下载
- **失败处理**：错误信息中文化提示（Key 无效 / 余额不足 / 内容审核等），失败任务可一键重新提交
- **任务历史**：保存在浏览器 localStorage，刷新页面不丢失；结果 URL 过期（2 小时）后可一键重新获取
- **节点切换**：海外直连 / 国内直连 / 自定义节点，附零成本连接测试

## 🚀 使用方法

1. 打开网页，点击右上角 **「导入 KEY」**，粘贴你在 [grsai.ai 控制台](https://grsai.ai/dashboard/api-keys) 创建的 API Key
2. （可选）点击 **「测试连接」** 验证 Key 与节点是否可用
3. 选择模型 → 填写提示词（可点提示词库快捷填充）→ 需要图生图时上传参考图
4. 点击 **「开始生成」**，右侧任务卡片实时显示进度
5. 完成后点击 **「⬇ 下载」** 保存单张，或勾选多个任务点击 **「打包下载」** 保存 ZIP

> ⚠️ 生成结果图片的 URL 有效期仅 **2 小时**，请及时下载。刷新后若图片已过期，点任务卡片上的 **「↻ 重新获取」** 即可拿到新 URL。

> ⚠️ API Key 关闭页面后即失效，下次使用需重新导入——这是有意设计，避免 Key 泄漏。

## 💻 本地运行

直接用任意静态服务器打开本目录即可，例如：

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

然后访问 http://localhost:8080

## 📦 部署到 GitHub Pages

### 方式一：网页操作

1. 在 GitHub 新建一个公开仓库（例如 `grsai-image-studio`）
2. 把本目录所有文件上传到仓库（`index.html`、`style.css`、`app.js`、`vendor/`、`README.md`）
3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)`，保存
4. 等约 1 分钟，访问 `https://<你的用户名>.github.io/grsai-image-studio/`

### 方式二：命令行

```bash
git init
git add .
git commit -m "Grsai 图像工作站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/grsai-image-studio.git
git push -u origin main

# 启用 Pages（需安装 GitHub CLI）
gh api repos/<你的用户名>/grsai-image-studio/pages -X POST -f source[branch]=main -f source[path]=/
```

## 📁 文件结构

```
index.html          # 页面结构
style.css           # 深色主题样式
app.js              # 全部逻辑（模型元数据 / API 调用 / 轮询 / 任务管理 / 下载）
vendor/jszip.min.js # JSZip（本地打包，批量 ZIP 下载用）
README.md           # 说明文档
```

## 🔒 隐私说明

- API Key 仅保存在页面内存，关闭即失效，**不会**被存储或发送到 Grsai 以外的任何地方
- 任务历史（提示词、模型参数、任务 id）保存在你自己浏览器的 localStorage 中，可随时通过「删除选中 / 清空已完成」清除
- 生成请求直接从你的浏览器发往所选的 Grsai API 节点（海外 `grsaiapi.com` 或国内 `grsai.dakka.com.cn`）
