import fs from "fs-extra";
import { Client, isFullUser, iteratePaginatedAPI } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "./markdown/notion-to-md";
import * as md from "./markdown/md";
import YAML from "yaml";
import { sh } from "./sh";
import { DatabaseMount, PageMount } from "./config";
import { getPageTitle, getCoverLinkFromPage, getFileName } from "./helpers";
import path from "path";
import { getContentFile } from "./file";

const NOTION_HUGO_RENDER_VERSION = "2026-05-31-escape-inline-html-v1";

export async function renderPage(
  page: PageObjectResponse,
  notion: Client,
  mount?: DatabaseMount | PageMount,
) {
  // load formatter config
  const n2m = new NotionToMarkdown({ notionClient: notion });
  n2m.setUnsupportedTransformer((type) => {
    return `{{< notion-unsupported-block type=${type} >}}`;
  });
  let frontInjectString = "";
  const mdblocks = await n2m.pageToMarkdown(page.id);
  const childDatabases = n2m.getChildDatabases();
  const mdString = n2m.toMarkdownString(mdblocks);
  // Keep Hugo shortcodes at column 0. Indented shortcode lines inside list
  // contexts can produce broken HTML tree after Goldmark parsing.
  const normalizedMdString = mdString.replace(
    /^[ \t]+(\{\{[%<][\s\S]*?[>%]\}\})$/gm,
    "$1",
  );
  page.properties.Name;
  const title = getPageTitle(page);
  const frontMatter: Record<string, any> = {
    title,
    date: page.created_time,
    lastmod: page.last_edited_time,
    draft: false,
  };

  if (mount && "page_id" in mount && typeof mount.url === "string" && mount.url.length > 0) {
    frontMatter.url = mount.url;
  }

  // set featuredImage
  const featuredImageLink = await getCoverLinkFromPage(page);  if (featuredImageLink) {
    frontMatter.featuredImage = featuredImageLink;
    // Blowfish reads .Params.featureimage (lowercase) for hero/card images.
    frontMatter.featureimage = featuredImageLink;
  }

  // Keep parent hierarchy as flat params to make Hugo filtering predictable.
  if (page.parent?.type === "page_id") {
    frontMatter.notion_parent_page_id = page.parent.page_id;
  }
  if (page.parent?.type === "database_id") {
    frontMatter.notion_parent_database_id = page.parent.database_id;
  }
  if (page.parent?.type === "data_source_id") {
    frontMatter.notion_parent_data_source_id = page.parent.data_source_id;
    if ("database_id" in page.parent && typeof page.parent.database_id === "string") {
      frontMatter.notion_parent_database_id = page.parent.database_id;
    }
  }

  if (childDatabases.length > 0) {
    frontMatter.notion_child_databases = childDatabases;
  }

  // map page properties to front matter
  for (const [property, propertyValue] of Object.entries(page.properties)) {
    switch (propertyValue.type) {
      case "checkbox":
        frontMatter[property] = propertyValue.checkbox;
        break;

      case "select":
        if (propertyValue.select) {
          frontMatter[property] = propertyValue.select.name;
        }
        break;

      case "multi_select":
        frontMatter[property] = propertyValue.multi_select.map(
          (select) => select.name,
        );
        break;

      case "email":
        if (propertyValue.email) {
          frontMatter[property] = propertyValue.email;
        }
        break;

      case "url":
        if (propertyValue.url) {
          frontMatter[property] = propertyValue.url;
        }
        break;

      case "date":
        if (propertyValue.date) {
          frontMatter[property] = propertyValue.date.start;
        }
        break;

      case "number":
        if (propertyValue.number !== null) {
          frontMatter[property] = propertyValue.number;
        }
        break;

      case "phone_number":
        if (propertyValue.phone_number) {
          frontMatter[property] = propertyValue.phone_number;
        }
        break;

      case "status":
        if (propertyValue.status) {
          frontMatter[property] = propertyValue.status.name;
        }
        break;

      case "people":
        frontMatter[property] = propertyValue.people
          .map((person) => {
          if ("name" in person && typeof person.name === "string") {
            return person.name;
          }

          if ("id" in person && typeof person.id === "string") {
            return person.id;
          }
        return null;
        })
        .filter((name): name is string => Boolean(name));
      break;

      case "rich_text":
        frontMatter[property] = propertyValue.rich_text
          .map((text) => text.plain_text)
          .join("");
        break;

      default:
        break;
    }
  }

  // set default author
  if (
    frontMatter.authors == null &&
    isFullUser(page.last_edited_by) &&
    page.last_edited_by.name
  ) {
    frontMatter.authors = [page.last_edited_by.name];
  }

  // save metadata
  frontMatter.NOTION_METADATA = page;
  frontMatter.MANAGED_BY_NOTION_HUGO = true;
  frontMatter.NOTION_HUGO_RENDER_VERSION = NOTION_HUGO_RENDER_VERSION;

  return {
    title,
    childDatabases,
    pageString:
      "---\n" +
      YAML.stringify(frontMatter, {
        defaultStringType: "QUOTE_DOUBLE",
        defaultKeyType: "PLAIN",
      }) +
      "\n---\n" +
      frontInjectString +
      "\n" +
      // For parent pages that contain nested databases, render only DB card blocks.
      // This mirrors the Notion "hub page + inline DB" workflow requested by the user.
      (page.parent?.type === "data_source_id" && childDatabases.length > 0
        ? childDatabases
            .map((db) => md.childDatabaseBlock(db.database_id, db.title))
            .join("\n\n")
        : normalizedMdString),
  };
}

export async function savePage(
  page: PageObjectResponse,
  notion: Client,
  mount: DatabaseMount | PageMount,
): Promise<{ childDatabases: { database_id: string; title: string }[] }> {
  const postpath = path.join(
    "content",
    mount.target_folder,
    getFileName(getPageTitle(page), page.id),
  );
  const post = getContentFile(postpath);
  if (
    post &&
    post.metadata.last_edited_time === page.last_edited_time &&
    post.renderVersion === NOTION_HUGO_RENDER_VERSION
  ) {
    console.info(`[Info] The post ${postpath} is up-to-date, skipped.`);
    return { childDatabases: post.childDatabases ?? [] };
  }
  // otherwise update the page
  console.info(`[Info] Updating ${postpath}`);

  const { title, pageString, childDatabases } = await renderPage(page, notion, mount);
  const fileName = getFileName(title, page.id);
  await sh(`hugo new "${mount.target_folder}/${fileName}"`, false);
  fs.writeFileSync(`content/${mount.target_folder}/${fileName}`, pageString);
  return { childDatabases };
}
