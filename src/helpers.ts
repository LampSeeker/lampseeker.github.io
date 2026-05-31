import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import fs from "fs-extra";
import path from "path";

export function getPageTitle(pageOrProperty: any): string {
  const properties = pageOrProperty?.properties

  const titleProperty = properties
    ? Object.values(properties).find((property: any) => property?.type === "title")
    : pageOrProperty

  if (!titleProperty || titleProperty.type !== "title") {
    return "untitled"
  }

  const title = titleProperty.title
    ?.map((item: any) => item?.plain_text ?? "")
    .join("")
    .trim()

  return title || "untitled"
}

export async function getCoverLink(
  page_id: string,
  notion: Client,
): Promise<string | null> {
  const page = await notion.pages.retrieve({ page_id });
  if (!isFullPage(page) || page.cover === null) {
    return null;
  }
  return page.cover.type === "external"
    ? page.cover.external.url
    : await downloadAsset(page.cover.file.url, page_id, ".png");
}

export async function getCoverLinkFromPage(
  page: PageObjectResponse,
): Promise<string | null> {
  if (page.cover === null) {
    return null;
  }
  return page.cover.type === "external"
    ? page.cover.external.url
    : await downloadAsset(page.cover.file.url, page.id, ".png");
}

export async function downloadAsset(
  url: string,
  id: string,
  fallbackExtension = "",
): Promise<string> {
  const pathname = new URL(url).pathname;
  const extension = path.extname(pathname) || fallbackExtension;
  const filename = `${id.replaceAll("-", "")}${extension}`;
  const targetPath = path.join("static", "notion-assets", filename);
  const publicPath = `/notion-assets/${filename}`;

  if (fs.existsSync(targetPath)) {
    return publicPath;
  }

  fs.ensureDirSync(path.dirname(targetPath));
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download Notion asset: ${response.status} ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);
  return publicPath;
}

export function getFileName(title: string, page_id: string): string {
  const safeTitle = title
    .trim()
    // replace path separators and Windows-forbidden filename chars
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    (safeTitle || "untitled") +
    "-" +
    page_id.replaceAll("-", "") +
    ".md"
  );
}
