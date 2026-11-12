# 黑客tube · HackerTube 中文版

[在线体验](https://ziho7.github.io/HackerTube/) · [提交问题](https://github.com/ziho7/HackerTube/issues) · [参与贡献](CONTRIBUTING.md)

一个零运行时依赖的静态视频浏览站，把 Hacker News 社区反复推荐的视频整理为中文卡片、分类与主题播单。现有数据包含 6,454 条视频、39,834 条 HN 提及和 150 个主题。

## 本地运行

安装 Node.js 22 或更新版本后，在项目目录运行：

```sh
npm start
```

打开终端显示的地址，默认是 `http://127.0.0.1:4173/`。不需要 `npm install`。自定义端口：`PORT=4180 npm start`。默认只监听本机；需要局域网访问时可显式设置 `HOST=0.0.0.0`。服务器是本地开发预览用途。

也可以直接打开 `site/index.html`。视频详情通过按需加载的脚本分片读取，兼容 `file://`；缩略图和视频播放仍需联网。个人记录按浏览器和来源隔离，`localhost`、`127.0.0.1` 与 `file://` 的记录不互通，可通过设置中的备份功能迁移。

## 已有功能

- 中文标题、摘要与分类；详情同时保留英文原标题和 HN 原始讨论。
- 中英文标题、频道、主题、标签和中文摘要的关键词搜索，支持组合筛选与排序。
- 每日发现、最近推荐、常青内容、小众推荐及主题播单；不喜欢的视频从首页推荐中排除。
- 按当前顺序创建最多 50 条的观看队列，在详情页切换上一条和下一条；每条视频由用户点击播放。
- 点赞、不喜欢、稍后再看、最近 500 条浏览历史；各列表可以单条移除。同一来源的多个标签页会同步个人记录。
- JSON 备份导入导出；导入合并记录，按时间解决点赞冲突，保留当前显示设置。
- 深浅色主题、移动端导航、键盘操作。按 `?` 查看快捷键。

## 更新数据

```sh
npm run build:data
```

生成器读取 `data/hackertube-data/`：

| 文件 | 用途 |
| --- | --- |
| `videos.jsonl` | 原始视频及 HN 统计，必要输入 |
| `videos.zh.jsonl` | 按 `vid` 匹配 `title_zh` 和 `summary_zh`，缺失时回退原文 |
| `taxonomy.json` | 领域与主题 |
| `mentions.jsonl` | HN 讨论原文 |
| `related.jsonl` | 共同推荐人关联 |
| `youtube_meta.jsonl` | 可选的 YouTube 元数据；格式参见原始数据说明 |

输出为 `site/data/` 的索引、播单和 64 个详情分片。数据生成器也支持 `--src <目录>`、`--out <目录>`。**不要直接修改生成的文件**，下次构建会覆盖。

当前数据没有 YouTube 时长、上传时间或播放量，这些筛选明确禁用；不会用 HN 提及时间冒充上传时间。内嵌权限未知时尝试播放，确认禁止内嵌时显示 YouTube 跳转。第三方视频可用性和实际播放取决于 YouTube 与网络环境。

## 检查

```sh
npm run check
npm test
```

测试覆盖搜索与日期区间、个人记录恢复和备份合并、详情分片失败重试、中文数据构建和静态服务器错误响应。修改界面后还应检查桌面/手机、空搜索、收藏、观看队列与主题切换。

## 目录

- `site/`：可部署到静态托管的完整网站，入口 `index.html`。
- `site/js/`：数据适配、查询、个人状态、渲染、页面与路由。
- `tools/`：数据生成器、本地服务器、语法检查。
- `tests/`：使用 Node 内置测试运行器，无额外依赖。
- `data/`：原始数据与中文翻译。
- `work/`：原有翻译中间文件与处理脚本。

## 部署

项目使用 GitHub Pages 托管 `site/`，工作流位于 `.github/workflows/pages.yml`。

- 推送到 `main`：检查 JavaScript、运行测试、重建中文数据，然后部署。
- Pull Request：执行检查、测试和数据构建，不发布网站。
- 在 GitHub Actions 页面可以手动运行 **Check and deploy**。

Fork 后，在 **Settings → Pages → Source** 选择 **GitHub Actions**，并手动运行工作流。资源都使用相对地址，支持仓库子路径部署。

## 许可证与数据署名

项目代码采用 [MIT](LICENSE)。原始数据、中文翻译及 `site/data/` 的衍生数据保留 **ODC-By 1.0** 数据库许可，详见 [第三方内容说明](THIRD_PARTY_NOTICES.md)。为减少仓库体积，原始 ZIP 与未使用的向量文件未纳入提交；构建网站需要的 JSONL、分类和翻译数据均已包含。


数据来自 [HackerTube](https://hackertube.org) 与 [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news)，采用 ODC-By v1.0。HN 数据由 Y Combinator 提供，评论及视频内容属于各自作者。本站与 YouTube、Google、Hacker News、Y Combinator 无隶属关系。完整数据说明见 `data/hackertube-data/DATA.md`。
