# Markdown Editor For Leanote Web & Desktop App

Leanote's Markdown Editor originally forked from [Stackedit](https://github.com/benweet/stackedit)-[v3.1.14](https://github.com/benweet/stackedit/releases/tag/v3.1.14). The Stackedit source is under Apache License (http://www.apache.org/licenses/LICENSE-2.0) and the code updated by Leanote is under GPL v2.

## Difference with [Leanote-Markdown-Editor](https://github.com/leanote/markdown-editor)

* Use Ace Editor as main editor
* Support Vim & Emacs mode

## Branches

* [master](https://github.com/leanote/desktop-app-v2) Markdown Editor v2 For [Leanote](https://github.com/leanote/leanote)
* [desktop-app](https://github.com/leanote/markdown-editor-v2/tree/desktop-app) Markdown Editor v2 For [Leanote Desktop App](https://github.com/leanote/desktop-app)

## Build

Please install `node` and `gulp` firstly.

```
> gulp # build & minify res-min/main-v2.js, res-min/main-v2.min.js
```

## Local Debug

```
> node server.js
```

See: http://localhost:3001/editor.html

![](screenshot.png)

## Integrated With Leanote Desktop App
copy res-min/main-v2.js & res-min/main-v2.min.js to leanote-dekstop-app's path `/public/md/`

----------------------------------------

## 与 [Leanote-Markdown-Editor](https://github.com/leanote/markdown-editor) 的不同

* 使用Ace编辑器作为主要的编辑器
* 支持Vim和Emacs编辑模式

## 构建

确保在此之前安装了node, gulp
```
> gulp # 生成 res-min/main-v2.js 和 res-min/main-v2.min.js
```

## 本地调试

```
> node server.js
```

访问: http://localhost:3001/editor.html

![](screenshot.png)

## Leanote 桌面端使用本 Markdown v2 编辑器

将 `res-min/main-v2.min.js` 复制到desktop-app `/public/md/` 下

## 与Web的不同

* 将res/libs目录移到res/public下
* main.js libs的路径前加public
* index.html ace路径前加res/public/
* core.js 插入图片
* core.js 打开Markdown帮助
* raphael eve问题