# 数据与第三方内容署名

## HackerTube 数据集

本项目使用 [HackerTube](https://hackertube.org) 于 2026-10-31 导出的公开数据，基于 [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news) 整理。数据库采用 [Open Data Commons Attribution License 1.0](https://opendatacommons.org/licenses/by/1-0/)。原始说明保留在 `data/hackertube-data/DATA.md`，许可全文保留在该目录的 `LICENSE`。

`videos.zh.jsonl` 是中文标题与摘要的衍生数据，`site/data/` 是用于浏览器的衍生索引和讨论分片，均保留上述数据库许可与署名，不适用项目代码的 MIT 许可。

推荐署名：

> 数据来自 HackerTube（hackertube.org）与 open-index/hacker-news，数据库许可为 ODC-By 1.0。Hacker News 数据由 Y Combinator 提供；评论仍属于原作者。

## 视频与评论

视频、标题、频道名、缩略图和评论内容的权利属于各自作者或权利人。视频由 YouTube 提供播放，缩略图通过 YouTube 图片服务加载；本仓库不托管视频或缩略图文件。数据库许可不替代这些内容自身的权利。

YouTube API 返回的私有元数据缓存不包含在本仓库中。

## 界面与独立性

本项目是独立的 HackerTube 中文浏览器，产品构思参考原站。发布版本的样式表与 SVG 线条图标为本项目重新实现，按 MIT 许可发布。

本站与 HackerTube 原站、YouTube、Google、Hacker News、Y Combinator 无隶属或背书关系。
