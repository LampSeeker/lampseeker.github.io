import { Client, isFullPage } from "@notionhq/client";
import {
  GetBlockResponse,
  ListBlockChildrenResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getFileName, getPageTitle } from "../helpers";

export const getBlockChildren = async (
  notionClient: Client,
  block_id: string,
  totalPage: number | null
) => {
  try {
    let results: GetBlockResponse[] = [];
    let pageCount = 0;
    let start_cursor = undefined;

    do {
      const response: ListBlockChildrenResponse =
        await notionClient.blocks.children.list({
          start_cursor,
          block_id,
        });
      results.push(...response.results);

      start_cursor = response.next_cursor;
      pageCount += 1;
    } while (
      start_cursor != null &&
      (totalPage == null || pageCount < totalPage)
    );

    return results;
  } catch (e) {
    console.log(e);
    return [];
  }
};

export const getPageRelrefFromId = async (
  pageId: string,
  notion: Client
): Promise<{
  title: string;
  relref: string;
}> => {
  const page = await notion.pages.retrieve({ page_id: pageId });
  if (!isFullPage(page)) {
    throw Error(
      `The pages.retrieve endpoint failed to return a full page for ${pageId}.`
    );
  }
  const title = getPageTitle(page);
  const fileName = getFileName(title, page.id);
  const relref = `{{% notion-page-url path=${JSON.stringify(fileName)} url=${JSON.stringify(page.url)} %}}`;
  return { title, relref };
};
