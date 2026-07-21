# 集换大亨

一个纯前端的集换式卡牌商店经营游戏。开卡包、观察环境行情、参与公开和私下交易、完成主题委托，并经营跨周目的成就生涯。

## 在线游玩

部署 GitHub Pages 后，可直接在浏览器打开仓库 Pages 地址游玩。游戏进度保存在浏览器本地。

## 本地运行

直接打开 `index.html`，或在项目根目录启动任意静态文件服务器。

## Android

Android 工程位于 `android/`，构建时会自动把网页和卡牌素材同步进 APK：

```powershell
cd android
.\gradlew.bat assembleDebug
```

