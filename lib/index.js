var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var name = "novel-lizard";
var usage = `
## 网文搜索下载
### 使用此插件可以通过关键词搜索网文，并下载相关内容。
---
<details>
<summary>如果要反馈建议或报告问题</summary>

可以[点这里](https://github.com/lizard0126/novel-lizard/issues)创建议题~
</details>
<details>
<summary>如果喜欢我的插件</summary>

可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~
</details>

`;
var Config = import_koishi.Schema.object({
  apiUrl: import_koishi.Schema.string().default("https://www.hhlqilongzhu.cn/api/novel_1.php").description("默认API，请勿更改")
});
function apply(ctx, config) {
  const logger = ctx.logger("novel-lizard");
  const userContext = {};
  ctx.command("小说 <keyword>", "搜索网络小说").alias("网文").action(async ({ session }, keyword) => {
    if (!keyword) {
      return "请提供关键词，例如：小说 总裁";
    }
    const url = `${config.apiUrl}?name=${encodeURIComponent(keyword)}&type=json`;
    try {
      const response = await ctx.http.get(url);
      if (!response.length) {
        logger.warn(`关键词 ${keyword} 未找到相关小说`);
        return "未找到相关小说，请尝试更换关键词。";
      }
      const timeout = setTimeout(() => {
        delete userContext[session.userId];
        session.send("操作超时，本次搜索已取消。").catch(() => {
        });
      }, 15 * 1e3);
      userContext[session.userId] = { keyword, list: response, timeout };
      logger.info(`搜索成功，返回 ${response.length} 条结果`);
      return response.map((item) => `${item.n}. ${item.name}`).join("\n") + "\n\n请输入序号以查看详情（输入“0”取消操作）。";
    } catch (error) {
      logger.error(`搜索请求失败：${error.message || error}`);
      return `请求失败：${error.message || error}`;
    }
  });
  ctx.middleware(async (session, next) => {
    const context = userContext[session.userId];
    if (!context) return next();
    const content = session.content?.trim();
    if (!content) return next();
    if (content === "0") {
      clearTimeout(context.timeout);
      delete userContext[session.userId];
      return "已取消本次搜索。";
    }
    const choice = parseInt(content);
    if (isNaN(choice) || choice < 1 || choice > context.list.length) {
      return "请输入有效的序号或输入“0”取消搜索！";
    }
    clearTimeout(context.timeout);
    const novel = context.list.find((item) => item.n === choice);
    if (!novel) {
      return "无法找到对应的小说，请重新输入。";
    }
    const url = `${config.apiUrl}?name=${encodeURIComponent(
      context.keyword
    )}&n=${choice}&type=json`;
    try {
      const detail = await ctx.http.get(url);
      delete userContext[session.userId];
      const messages = [];
      messages.push(`标题：${detail.title}`);
      messages.push(`作者：${detail.author || "未知"}`);
      messages.push(`分类：${detail.type || "未分类"}`);
      messages.push(`简介：${detail.js || "无"}`);
      await session.send(messages.join("\n"));
      if (detail.img) {
        const coverResponse = await ctx.http.get(detail.img);
        await session.send(import_koishi.h.image(coverResponse));
      }
      if (detail.download) {
        try {
          const fileResponse = await ctx.http.get(detail.download, {
            responseType: "arraybuffer"
          });
          await session.send(
            import_koishi.h.file(Buffer.from(fileResponse), "text/plain", {
              title: `${detail.title}.txt`
            })
          );
        } catch (error) {
          await session.send("文件下载失败，请稍后重试。");
        }
      } else {
        await session.send("无下载内容");
      }
    } catch (error) {
      return `请求失败：${error.message || error}`;
    }
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name,
  usage
});
