import { Context, Schema } from 'koishi';
export declare const name = "novel-lizard";
export declare const usage = "\n## \u7F51\u6587\u641C\u7D22\u4E0B\u8F7D\n### \u4F7F\u7528\u6B64\u63D2\u4EF6\u53EF\u4EE5\u901A\u8FC7\u5173\u952E\u8BCD\u641C\u7D22\u7F51\u6587\uFF0C\u5E76\u4E0B\u8F7D\u76F8\u5173\u5185\u5BB9\u3002\n---\n<details>\n<summary>\u5982\u679C\u8981\u53CD\u9988\u5EFA\u8BAE\u6216\u62A5\u544A\u95EE\u9898</summary>\n\n\u53EF\u4EE5[\u70B9\u8FD9\u91CC](https://github.com/lizard0126/novel-lizard/issues)\u521B\u5EFA\u8BAE\u9898~\n</details>\n<details>\n<summary>\u5982\u679C\u559C\u6B22\u6211\u7684\u63D2\u4EF6</summary>\n\n\u53EF\u4EE5[\u8BF7\u6211\u559D\u53EF\u4E50](https://ifdian.net/a/lizard0126)\uFF0C\u6CA1\u51C6\u5C31\u6709\u52A8\u529B\u66F4\u65B0\u65B0\u529F\u80FD\u4E86~\n</details>\n\n";
export interface Config {
    apiUrl: string;
}
export declare const Config: Schema<Config>;
export declare function apply(ctx: Context, config: Config): void;
