# 云屿 CloudIsle · Minecraft 服务器宣传站

一个参照 **Cloudflare Connect** 视觉风格、以 **Cloudsdale（云中城）** 功能为蓝本的
MC 服务器宣传 + 实用型静态网站，适配桌面端与移动端，可直接部署到 GitHub Pages。

## 快速部署（GitHub Pages）

1. 新建 GitHub 仓库（如 `mc-server-site`），保持 **Public**。
2. 将 `index.html`、`css/`、`js/` 三个文件上传到仓库根目录（可通过网页上传，或 git push）。
3. 打开仓库 **Settings → Pages**：
   - Source 选择 **Deploy from a branch**
   - Branch 选择 `main`，目录 `/ (root)`
   - 点击 **Save**
4. 等待 1~2 分钟，访问 `https://你的用户名.github.io/mc-server-site/` 即可。
5. （可选）在 **Settings → Pages** 中绑定自定义域名。

> 提示：纯静态站免费、无需服务器，适合宣传页 / 落地页。
> 实时状态、在线地图等需要与你的 MC 服务器联动，见下方「自定义」。

## 自定义你的服务器信息

所有需要修改的配置都集中在 `js/main.js` 顶部的 `CONFIG` 对象：

| 配置项 | 说明 |
|---|---|
| `serverIp` | 服务器地址（复制按钮会复制它） |
| `serverPort` | 基岩版端口 |
| `mcVersion` | 支持的 MC 版本 |
| `maxPlayers` | 最大玩家数 |
| `qqGroup` | 入服门户群链接 |
| `quizUrl` | 白名单答题系统地址 |
| `docsUrl` | 入服教程文档地址 |
| `feedbackUrl` | 反馈 / 工单入口 |
| `supportUrl` | 赞助入口（爱发电 / 支付宝等） |
| `mapUrl` | 实时地图地址（Dynmap / BlueMap），**留空显示占位图** |
| `statusApi` | 服务器状态 API，**留空为演示模式（模拟数据）** |

### 接入真实状态

- 使用 [mcstatus.io](https://mcstatus.io) 等第三方 API（需支持 CORS），把 JSON 地址填入 `statusApi`。
- 或在你的服务器上部署一个小接口，返回格式：
  ```json
  { "online": true, "players": { "online": 42, "max": 120 }, "tps": 20.0, "ms": 12 }
  ```

### 修改路网地图

站点与线路数据在 `js/main.js` 的 `NETWORKS` 对象中，按 `{x, y, name, icon, desc}` 增删站点、
按 `['站点A','站点B']` 增删连线即可，坐标范围建议在 0~800（横向）、0~470（纵向）内。

### 修改配色

所有颜色集中在 `css/style.css` 顶部 `:root` 变量中，改 `--accent`（橙色强调色）即可全局换肤。

## 移动端适配

- ≤768px：导航折叠为抽屉菜单、卡片单列堆叠、时间线紧凑化、价格卡片竖排。
- 桌面端：3 列网格、导航常驻、卡片 3D 倾斜悬停。
- 所有动画（涟漪、滚动渐入、数字滚动、地图高亮）均对触屏友好。
