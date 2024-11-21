import { Context, Schema, h } from 'koishi';
// npm publish --workspace koishi-plugin-novel-lizard --access public --registry https://registry.npmjs.org
export const name = 'novel-lizard';

export const usage = `
## 网文搜索下载
### 使用此插件可以通过关键词搜索网文，并下载相关内容。
---
## 如果喜欢我的插件
<details>

可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了

</details>

`;

export interface Config {
  apiUrl: string;
}

export const Config: Schema<Config> = Schema.object({
  apiUrl: Schema.string()
    .default('https://www.hhlqilongzhu.cn/api/novel_1.php')
    .description('默认API，请勿更改'),
});

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger('novel-lizard'); // 创建日志实例
  const userContext: Record<
    string,
    { keyword: string; list: any[]; timeout?: NodeJS.Timeout }
  > = {};

  // 搜索命令
  ctx.command('小说 <keyword>', '搜索网络小说')
    .alias('网文')
    .action(async ({ session }, keyword) => {
      if (!keyword) {
        return '请提供关键词，例如：小说 总裁';
      }

      const url = `${config.apiUrl}?name=${encodeURIComponent(keyword)}&type=json`;

      try {
        const response = await ctx.http.get<{ n: number; name: string }[]>(url);

        if (!response.length) {
          logger.warn(`关键词 ${keyword} 未找到相关小说`);
          return '未找到相关小说，请尝试更换关键词。';
        }

        // 保存上下文并设置超时
        const timeout = setTimeout(() => {
          delete userContext[session.userId];
          session.send('操作超时，本次搜索已取消。').catch(() => { });
        }, 10 * 1000); // 超时10秒

        userContext[session.userId] = { keyword, list: response, timeout };

        logger.info(`搜索成功，返回 ${response.length} 条结果`);

        return (
          response
            .map((item) => `${item.n}. ${item.name}`)
            .join('\n') + '\n\n请输入序号以查看详情（输入“0”取消操作）。'
        );
      } catch (error) {
        logger.error(`搜索请求失败：${error.message || error}`);
        return `请求失败：${error.message || error}`;
      }
    });

  // 监听用户的选择
  ctx.middleware(async (session, next) => {
    const context = userContext[session.userId];
    if (!context) return next(); // 无上下文，跳过处理

    const content = session.content?.trim();
    if (!content) return next(); // 空输入，跳过处理

    // 主动取消逻辑
    if (content === '0') {
      clearTimeout(context.timeout); // 清理计时器
      delete userContext[session.userId];
      return '已取消本次搜索。';
    }

    // 输入验证
    const choice = parseInt(content);
    if (isNaN(choice) || choice < 1 || choice > context.list.length) {
      return '请输入有效的序号或输入“0”取消搜索！';
    }

    clearTimeout(context.timeout); // 用户输入有效，清理计时器

    const novel = context.list.find((item) => item.n === choice);
    if (!novel) {
      return '无法找到对应的小说，请重新输入。';
    }

    const url = `${config.apiUrl}?name=${encodeURIComponent(
      context.keyword
    )}&n=${choice}&type=json`;

    try {
      const detail = await ctx.http.get<{
        title: string;
        author?: string;
        type?: string;
        img?: string;
        download?: string;
        js?: string;
      }>(url);

      delete userContext[session.userId]; // 清除上下文

      const messages: string[] = [];
      messages.push(`标题：${detail.title}`);
      messages.push(`作者：${detail.author || '未知'}`);
      messages.push(`分类：${detail.type || '未分类'}`);
      messages.push(`简介：${detail.js || '无'}`);

      // 发送文字部分
      await session.send(messages.join('\n'));

      // 发送封面图片
      if (detail.img) {
        const coverResponse = await ctx.http.get(detail.img);
        await session.send(h.image(coverResponse));
      }

      // 发送TXT文件
      if (detail.download) {
        try {
          const fileResponse = await ctx.http.get(detail.download, {
            responseType: 'arraybuffer',
          });
          await session.send(
            h.file(Buffer.from(fileResponse), 'text/plain', {
              title: `${detail.title}.txt`,
            })
          );
        } catch (error) {
          await session.send('文件下载失败，请稍后重试。');
        }
      } else {
        await session.send('无下载内容');
      }
    } catch (error) {
      return `请求失败：${error.message || error}`;
    }
  });
}
