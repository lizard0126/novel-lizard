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
# 📖 网络小说搜索与下载
## 通过关键词搜索网络小说，并获取下载链接

## API 已默认提供，如有需要可自行更换。

## 请合理使用，避免因滥用导致 API 限制或封禁。
---

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">使用方法</span></strong></summary>

### 通过关键词搜索小说
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">小说 斗破苍穹 // 搜索关键词“斗破苍穹”</pre>

### 选择小说查看详情
在搜索结果中，输入对应的序号即可查看小说详情和下载链接。
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">1 // 查看第一本小说详情</pre>

### 取消当前查询
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">0 // 取消当前搜索</pre>

</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果要反馈建议或报告问题</span></strong></summary>

<strong>可以[点这里](https://github.com/lizard0126/javbus-lizard/issues)创建议题~</strong>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果喜欢我的插件</span></strong></summary>

<strong>可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~</strong>
</details>
`;
var Config = import_koishi.Schema.object({
  apiUrl: import_koishi.Schema.string().default("https://www.hhlqilongzhu.cn/api/novel_new.php").description("默认API，请勿更改")
});
function apply(ctx, config) {
  const userContext = {};
  ctx.command("小说 <keyword>", "搜索网络小说").alias("网文").action(async ({ session }, keyword) => {
    if (!keyword) return "请提供关键词，例如：小说 总裁";
    const url = `${config.apiUrl}?name=${encodeURIComponent(keyword)}&type=json`;
    try {
      const response = await ctx.http.get(url);
      if (response === null) {
        return "未找到相关小说，请尝试更换关键词。";
      }
      const timeout = setTimeout(() => {
        delete userContext[session.userId];
        session.send("操作超时，本次搜索已取消。").catch(() => {
        });
      }, 15 * 1e3);
      userContext[session.userId] = { keyword, list: response, timeout };
      return response.map((item) => `${item.n}. ${item.name}`).join("\n") + "\n\n请输入序号以查看详情（输入“0”取消操作）。";
    } catch (error) {
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
    if (!novel) return "无法找到对应的小说，请重新输入。";
    const url = `${config.apiUrl}?name=${encodeURIComponent(context.keyword)}&n=${choice}&type=json`;
    try {
      const detail = await ctx.http.get(url);
      delete userContext[session.userId];
      const messages = [
        `标题：${detail.title}`,
        `作者：${detail.author || "未知"}`,
        `分类：${detail.type || "未分类"}`,
        `简介：${detail.js || "无"}`
      ];
      await session.send(messages.join("\n"));
      if (detail.img) {
        const coverResponse = await ctx.http.get(detail.img);
        await session.send(import_koishi.h.image(coverResponse));
      }
      if (detail.download) {
        try {
          const fileResponse = await ctx.http.get(detail.download, { responseType: "arraybuffer" });
          await session.send(import_koishi.h.file(Buffer.from(fileResponse), "text/plain", { title: `${detail.title}.txt` }));
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
