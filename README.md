# 西班牙车辆库存看板

领导查看：<https://maoshio.github.io/spain-inventory-dashboard/>

每日上传：<https://maoshio.github.io/spain-inventory-dashboard/admin.html>

在上传页点击“上传 Excel”，输入上传密码并选择最新 Excel。浏览器按 VIN 统计后发布汇总，查看页读取统一的最新数据，无须登录。

## 数据与部署

网页托管在 GitHub Pages，从 main 分支的根目录发布。上传及共享汇总数据仍由现有 Sites Worker 和 R2 存储提供，网页通过跨域请求访问后台。因此浏览器网址使用 github.io，但后台仍依赖 Sites。

仓库包含前端、Worker 源码和初始汇总快照，不包含上传密码或原始 VIN 明细。上传密码保存在后台 ADMIN_TOKEN 环境变量中。ES-sales 归入 Barcelona PDI；按逐车入库时间计算库龄。

## 构建与验证

```sh
node scripts/generate-worker.mjs
node scripts/generate-pages.mjs
node scripts/test-worker.mjs
node scripts/test-pages-cors.mjs
bash scripts/build.sh
node scripts/validate-artifact.mjs
```

page.html 是页面源文件；index.html 和 admin.html 是生成的 GitHub Pages 页面。后台绑定 BUCKET，允许 https://maoshio.github.io 跨域访问；写入仍需上传密码。
