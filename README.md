# 一辈子存档 WorldEternal · 官网

一个参照 **Cloudflare Connect** 视觉风格的 Minecraft 服务器宣传 + 实用型静态网站。
导航采用**侧边抽屉灵动弹出**形式，「路网规划」以**反色高亮卡片**单独区分。
纯静态，可部署到 GitHub Pages / Cloudflare Pages。

## 文件结构

```
├── index.html          # 主页
├── facilities.html     # 路网规划（交通设施）独立页
├── css/style.css       # 全站样式
├── js/main.js          # 主页逻辑
├── js/facilities.js    # 路网页逻辑
└── README.md
```

## 部署（Cloudflare Pages）

1. 上传全部文件到仓库（根目录含 index.html）。
2. Cloudflare 仪表盘 → Workers & Pages → 创建应用程序 → Pages →
   - **上传资产**：直接拖拽 zip（zip 根目录须直接含 index.html）
   - 或 **连接 Git**：构建命令留空、构建输出目录留空
3. 得到 `https://项目名.pages.dev` 地址，可绑定自定义域名。

## 自定义

所有需要改的配置集中在各 JS 顶部 `CONFIG` / `DEFAULT_NETWORK`：

| 文件 | 配置 | 说明 |
|---|---|---|
| `js/main.js` | `CONFIG.serverIp` | 服务器地址 |
| | `CONFIG.qqGroup` | 玩家 QQ 群链接 |
| | `CONFIG.feedbackUrl` | 反馈工单 |
| | `CONFIG.mapUrl` | Dynmap/BlueMap 地址（留空显示占位） |
| | `CONFIG.statusApi` | ServerTap 接口（TPS/玩家/在线） |
| | `CONFIG.statusPingApi` | mcstatus.io 接口（在线/玩家/延迟） |
| `js/facilities.js` | `DEFAULT_NETWORK` | 路网数据（站点/线路/设施字段） |

### 路网数据字段（与云中城设施页一致）

| 字段 | 说明 |
|---|---|
| `name` | 设施名称 |
| `world` | 主世界 / 地狱 / 末地 |
| `owner` | 负责人（列表可点击复制 QQ） |
| `output` | 产出（数组） |
| `category` | 机器 / 公共设施 / 地标 |
| `coords` | 游戏内坐标 |
| `depend` | 依赖站点 |
| `transport` | 接驳方式 |
| `tips` | 提示 / 使用说明 |
| `x`,`y` | SVG 画布坐标（0~800 / 0~470） |
| `edges` | 线路：`[["站Aid","站Bid"], ...]` |

## 侧边导航说明

- 左上角菜单按钮弹出/收起侧边抽屉（平滑 cubic-bezier 动画）。
- 普通页面导航与「路网规划」之间以渐变分隔线隔开。
- 「路网规划」卡片使用**与全站相反的亮色主题**高亮突出。
- 支持 Esc / 点击遮罩 / 点击链接关闭。
