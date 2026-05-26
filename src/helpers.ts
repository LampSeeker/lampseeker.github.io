import { Client, isFullPage } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

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
    : pageIdToApiUrl(page_id);
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
