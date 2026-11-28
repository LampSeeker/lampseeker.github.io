import assert from "node:assert/strict";
import test from "node:test";
import type { Client } from "@notionhq/client";
import { getFileName } from "../helpers";
import { getPageRelrefFromId } from "./notion";

for (const propertyName of ["이름", "Name", "title"]) {
  test(`page links resolve the ${propertyName} title property`, async () => {
    const id = "41e5b029-aea6-8009-91bb-ce63199a8aeb";
    const title = "건설 기준";
    const notion = {
      pages: {
        retrieve: async () => ({
          object: "page",
          id,
          url: `https://www.notion.so/${id.replaceAll("-", "")}`,
          properties: {
            [propertyName]: {
              type: "title",
              title: [{ plain_text: title }],
            },
          },
        }),
      },
    } as unknown as Client;

    assert.deepEqual(await getPageRelrefFromId(id, notion), {
      title,
      relref: `{{% notion-page-url path=${JSON.stringify(getFileName(title, id))} url="https://www.notion.so/${id.replaceAll("-", "")}" %}}`,
    });
  });
}
