import { markdownTable } from "markdown-table";
import {
  EquationRichTextItemResponse,
  MentionRichTextItemResponse,
  PageIconResponse,
  RichTextItemResponse,
  RichTextItemResponseCommon,
  TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getPageRelrefFromId } from "./notion";
import { Client, isFullUser } from "@notionhq/client";
export const inlineCode = (text: string) => {
  return `\`${text}\``;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(text: string): string {
  return escapeHtml(text);
}

export const bold = (text: string) => {
  return `**${text}**`;
};

export const italic = (text: string) => {
  return `_${text}_`;
};

export const strikethrough = (text: string) => {
  return `~~${text}~~`;
};

export const underline = (text: string) => {
  return `<u>${text}</u>`;
};

export const link = (text: string, href: string) => {
  const label = text.trim() || href;
  return `[${label}](${href})`;
};

const htmlLink = (text: string, href: string) => {
  return `<a href="${escapeAttribute(href)}">${text}</a>`;
};

const notionColorNames = new Set([
  "default",
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
]);

export const notionColor = (text: string, color: string) => {
  if (!color || color === "default") return text;

  const backgroundSuffix = "_background";
  const isBackground = color.endsWith(backgroundSuffix);
  const colorName = isBackground
    ? color.slice(0, -backgroundSuffix.length)
    : color;

  if (!notionColorNames.has(colorName)) return text;

  const className = isBackground
    ? `notion-color-${colorName}-background`
    : `notion-color-${colorName}`;

  return `<span class="${className}">${text}</span>`;
};

export const codeBlock = (text: string, language?: string) => {
  if (language === "plain text") language = "text";

  return `\`\`\`${language}
${text}
\`\`\``;
};

export const heading1 = (text: string) => {
  return `# ${text}`;
};

export const heading2 = (text: string) => {
  return `## ${text}`;
};

export const heading3 = (text: string) => {
  return `### ${text}`;
};

export const quote = (text: string) => {
  // the replace is done to handle multiple lines
  return `> ${text.replace(/\n/g, "  \n> ")}`;
};

export const callout = (text: string, icon?: PageIconResponse | null) => {
  let emoji: string | undefined;
  if (icon?.type === "emoji") {
    emoji = icon.emoji;
  }

  // the replace is done to handle multiple lines
  return `> ${emoji ? emoji + " " : ""}${text.replace(/\n/g, "  \n> ")}`;
};

export const bullet = (text: string, count?: number) => {
  let renderText = text.trim();
  return count ? `${count}. ${renderText}` : `- ${renderText}`;
};

export const todo = (text: string, checked: boolean) => {
  return checked ? `- [x] ${text}` : `- [ ] ${text}`;
};

export const image = (alt: string, href: string) => {
  return `![${alt}](${href})`;
};

export const addTabSpace = (text: string, n = 0) => {
  if (n <= 0) return text;

  const indent = "  ".repeat(n);
  return text
    .split("\n")
    .map((line) => (line.length > 0 ? `${indent}${line}` : line))
    .join("\n");
};

export const divider = () => {
  return "---";
};

export const tableOfContents = () => {
  return "";
};

function shortcodeParam(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export const linkCard = (
  url: string,
  title?: string,
  kind: "bookmark" | "embed" | "link_preview" = "bookmark",
) => {
  const cardTitle = title?.trim() || url;
  return `{{< notion-link-card kind="${kind}" url="${shortcodeParam(url)}" title="${shortcodeParam(cardTitle)}" >}}`;
};

export const childDatabaseBlock = (databaseId: string, title?: string) => {
  const safeId = shortcodeParam(databaseId);
  const safeTitle = shortcodeParam((title || "Database").trim());
  return `{{< notion-child-database database_id="${safeId}" title="${safeTitle}" >}}`;
};

export const toggle = (summary?: string, children?: string) => {
  if (!summary) return children || "";
  return `{{% details title="${shortcodeParam(summary)}" %}}

${children || ""}

{{% /details %}}`;
};

export const table = (cells: string[][]) => {
  return markdownTable(cells);
};

export const plainText = (textArray: RichTextItemResponse[]) => {
  return textArray.map((text) => text.plain_text).join("");
};

/**
 * Block equation
 * Format: \[ expression \]
 * @param expression
 * @returns
 */
export const equation = (expression: string) => {
  return `\\[${expression}\\]`;
};

function textRichText(text: RichTextItemResponseCommon & TextRichTextItemResponse): string {
  const annotations = text.annotations;
  const hasHtmlAnnotation =
    annotations.bold ||
    annotations.italic ||
    annotations.strikethrough ||
    annotations.underline ||
    annotations.code ||
    annotations.color !== "default" ||
    !!text.href;

  let content = hasHtmlAnnotation ? escapeHtml(text.text.content) : text.text.content;
  if (annotations.code) {
    content = `<code>${content}</code>`;
  }
  if (annotations.bold) {
    content = `<strong>${content}</strong>`;
  }
  if (annotations.italic) {
    content = `<em>${content}</em>`;
  }
  if (annotations.strikethrough) {
    content = `<del>${content}</del>`;
  }
  if (annotations.underline) {
    content = underline(content);
  }
  if (annotations.color) {
    content = notionColor(content, annotations.color);
  }
  if (text.href) {
    content = htmlLink(content, text.href);
  }
  return content;
}

/**
 * Inline equation
 * Format: \( expression \)
 * @param text
 * @returns
 */
function equationRichText(text: EquationRichTextItemResponse): string {
  return `\\(${text.equation.expression}\\)`;
}

async function mentionRichText(
  text: MentionRichTextItemResponse,
  notion: Client,
): Promise<string> {
  const mention = text.mention;
  switch (mention.type) {
    case "page": {
      const pageId = mention.page.id;
      const { title, relref } = await getPageRelrefFromId(pageId, notion);
      return link(title, relref);
    }
    case "user": {
      if (isFullUser(mention.user) && mention.user.name) {
        return `@${mention.user.name}`;
      }
      return (text as { plain_text?: string }).plain_text ?? "";
    }
    case "date": {
      const date = mention.date;
      const dateEnd = date.end ? ` -> ${date.end}` : "";
      const timeZone = date.time_zone ? ` (${date.time_zone})` : "";
      return `@${date.start}${dateEnd}${timeZone}`;
    }
    case "link_preview": {
      const linkPreview = mention.link_preview;
      return link(linkPreview.url, linkPreview.url);
    }
    case "template_mention": {
      // https://developers.notion.com/reference/rich-text#template-mention-type-object
      // Hide the template button
      return "";
    }
    case "database": {
      console.warn("[Warn] Database mention is not supported");
      return "";
    }
  }
  return "";
}

export async function richText(
  textArray: RichTextItemResponse[],
  notion: Client,
) {
  return (
    await Promise.all(
      textArray.map(async (text) => {
        if (text.type === "text") {
          return textRichText(text);
        } else if (text.type === "equation") {
          return equationRichText(text);
        } else if (text.type === "mention") {
          return await mentionRichText(text, notion);
        }
      }),
    )
  ).join("");
}

export const videoFromUrl = (url: string) => {
  if (url.startsWith("https://www.youtube.com/")) {
    /*
      YouTube video links that include embed or watch.
      E.g. https://www.youtube.com/watch?v=[id], https://www.youtube.com/embed/[id]
    */
    // get last 11 characters of the url as the video id
    const videoId = url.slice(-11);
    return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }
  return htmlVideo(url);
};

function htmlVideo(url: string) {
  return `<video controls style="height:auto;width:100%;">
  <source src="${url}">
  <p>
    Your browser does not support HTML5 video. Here is a
    <a href="${url}" download="${url}">link to the video</a> instead.
  </p>
</video>`;
}

export const pdfFromUrl = (url: string) => {
  return `<embed src="${url}" type="application/pdf" style="width: 100%;aspect-ratio: 2/3;height: auto;" />`;
};

export const audioFromUrl = (url: string) => {
  return `<audio controls src="${url}"></audio>`;
};
