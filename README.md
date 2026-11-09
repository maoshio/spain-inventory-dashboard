# 西班牙车辆库存看板

公开查看地址：<https://spain-inventory-shared-mao-1109.gsimonay.chatgpt.site/>

管理员上传地址：<https://spain-inventory-shared-mao-1109.gsimonay.chatgpt.site/admin>

管理员在 `/admin` 输入上传密码并选择每天的 Excel。浏览器逐 VIN 统计后，只把汇总结果发布到站点存储；领导打开公开地址即可查看最新数据，无须登录。刷新页面会重新读取已发布的汇总。

看板按库龄、销售单号、发运单号、库房和车型展示。ES-sales 并入 Barcelona PDI。库龄按车辆入库时间计算。页面使用固定 1600×1050 画布并自动缩放到单个窗口，不要求滚动。

## 部署

此仓库保存 Sites Worker 源码。在线上传和多人共享依赖 Worker 的 `/api/dashboard` 接口、`BUCKET` 存储绑定和 `ADMIN_TOKEN` 环境变量；单独使用 GitHub Pages 无法提供这些后台功能。

```sh
node scripts/generate-worker.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
node scripts/test-worker.mjs
```

`page.html` 包含页面、前端逻辑和初始汇总快照。`scripts/generate-worker.mjs` 将其嵌入 `worker/index.js`。上传密码保存在站点环境变量中，不写入仓库。
