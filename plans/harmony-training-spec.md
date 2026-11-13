# 和弦级数与流行走向训练

本扩展使用现有暖色界面、练习目录和指板，不提供独立学习模式。

## 训练规则

- C、G、D、A、E 五个大调，1–7 级顺阶三和弦：大、小、小、大、大、小、减。
- 单级题默认 C 调、全部级数；多选调和级数后每题随机抽取。
- 走向题默认 C 调及全部六条内置走向；每题保持一个调，显示完整级数，逐格填写。
- 十二个根音与大三／小三／减三始终可选。根音统一显示升号，和弦后缀使用 `m`、`dim`。
- 完整答案自动发声并在共用指板显示红点，使用一个真实指法，包括空弦，闷弦标 `×`。优先开放和弦，其他采用低把位可移动指法。
- 手动提交，不计时、不提前显示对错；走向全部正确才计为正确。反馈后锁定答案与计分，逐格显示正确答案，可复听双方答案。
- 手动下一题；正确走向可连续播放、同步高亮当前答案卡和指法。停止、改选、切题、切换题型、退出与改变调弦取消旧播放。
- 仅标准调弦支持。学习摘要分题型累计、保留最近错题，掌握度按题型与调分组，最近 20 题达到 80% 为已掌握。
- 自定义走向接受 1–32 位数字 1–7，支持删除、去重与本地保存；存储键沿用 `digital-guitar-custom-progressions-v1`。

## 内置题库与来源

以下是常见教学走向的三和弦版本，不代表近期歌曲榜单的热度排名；实际歌曲可能使用七和弦、转位或替代和弦。

| 级数 | C 大调示例 | 来源 |
|---|---|---|
| 1645 | C–Am–F–G | [Fender：常见吉他和弦走向](https://www.fender.com/articles/chords/3-common-guitar-chord-progressions) |
| 1564 | C–G–Am–F | [Fender](https://www.fender.com/articles/chords/3-common-guitar-chord-progressions) |
| 6415 | Am–F–C–G | [Fender](https://www.fender.com/articles/chords/3-common-guitar-chord-progressions) |
| 4536251 | F–G–Em–Am–Dm–G–C | [Jimbo Piano：4536251](https://www.jimbopiano.com/blog/4536251-fill-in) |
| 15634145 | C–G–Am–Em–F–C–F–G | [听音吧：和弦进行](https://www.tingyinba.com/chord-progressions) |
| 6251 | Am–Dm–G–C | [听音吧](https://www.tingyinba.com/chord-progressions) |

## 验收

音乐测试验证全部五个调的答案及 36 种可选三和弦指法；控制器和界面测试覆盖配置、作答、计分、复习、记录兼容与音频取消。浏览器验收覆盖桌面和手机宽度、木质和金属主题、键盘焦点、单指板红点和连续播放。通过检查后推送并确认 Pages 部署。
