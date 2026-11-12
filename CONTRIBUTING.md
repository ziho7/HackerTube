# 参与贡献

欢迎提交问题、中文翻译纠错和功能改进。

## 开发

1. Fork 仓库并创建分支。
2. 使用 Node.js 22 或更新版本，运行 `npm start`。项目不需要安装运行时依赖。
3. 完成修改后执行 `npm run check` 与 `npm test`。
4. 如果修改数据，执行 `npm run build:data`，一起提交对应的源数据与生成文件。
5. 提交 Pull Request，说明问题、修改后的行为和验证方法。

涉及页面交互的修改，请检查桌面与手机宽度、键盘操作和深色模式。回归测试应验证用户行为或数据契约。

## 数据纠错

请提供视频 ID、当前内容、建议修改和必要的来源。标题与摘要的中文修订放在 `data/hackertube-data/videos.zh.jsonl` 的 `title_zh`、`summary_zh` 字段，保留原始英文与视频 ID。HN 原始评论应保留原文与来源链接。

代码贡献按 MIT 许可发布；数据贡献保留 ODC-By 1.0 数据库许可及内容作者的权利。详情见 `THIRD_PARTY_NOTICES.md`。
