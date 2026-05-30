import fs from "fs-extra";
import { Client, isFullUser, iteratePaginatedAPI } from "@notionhq/client";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionToMarkdown } from "./markdown/notion-to-md";
import * as md from "./markdown/md";
import YAML from "yaml";
import { sh } from "./sh";
import { DatabaseMount, PageMount } from "./config";
import { getPageTitle, getCoverLink, getFileName } from "./helpers";
import path from "path";
import { getContentFile } from "./file";

const NOTION_HUGO_RENDER_VERSION = "2026-05-29-shortcode-indent-fix-v1";

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
  const featuredImageLink = await getCoverLink(page.id, notion);
  if (featuredImageLink) {
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
  for (const property in page.properties) {
    const id = page.properties[property].id;
    const response = await notion.pages.properties.retrieve({
      page_id: page.id,
      property_id: id,
    });
    if (response.object === "property_item") {
      switch (response.type) {
        case "checkbox":
          frontMatter[property] = response.checkbox;
          break;
        case "select":
          if (response.select) frontMatter[property] = response.select.name;
          break;
        case "multi_select":
          frontMatter[property] = response.multi_select.map(
            (select) => select.name,
          );
          break;
        case "email":
          if (response.email) frontMatter[property] = response.email;
          break;
        case "url":
          if (response.url) frontMatter[property] = response.url;
          break;
        case "date":
          if (response.date) frontMatter[property] = response.date.start;
          break;
        case "number":
          if (response.number) frontMatter[property] = response.number;
          break;
        case "phone_number":
          if (response.phone_number)
            frontMatter[property] = response.phone_number;
          break;
        case "status":
          if (response.status) frontMatter[property] = response.status.name;
        // ignore these properties
        case "last_edited_by":
        case "last_edited_time":
        case "rollup":
        case "files":
        case "formula":
        case "created_by":
        case "created_time":
          break;
        default:
          break;
      }
    } else {
      for await (const result of iteratePaginatedAPI(
        // @ts-ignore
        notion.pages.properties.retrieve,
        {
          page_id: page.id,
          property_id: id,
        },
      )) {
        switch (result.type) {
          case "people":
            frontMatter[property] = frontMatter[property] || [];
            if (isFullUser(result.people)) {
              const fm = frontMatter[property];
              if (Array.isArray(fm) && result.people.name) {
                fm.push(result.people.name);
              }
            }
            break;
          case "rich_text":
            frontMatter[property] = frontMatter[property] || "";
            frontMatter[property] += result.rich_text.plain_text;
          // ignore these
          case "relation":
          case "title":
          default:
            break;
        }
      }
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
) {
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
    return;
  }
  // otherwise update the page
  console.info(`[Info] Updating ${postpath}`);

  const { title, pageString } = await renderPage(page, notion, mount);
  const fileName = getFileName(title, page.id);
  await sh(`hugo new "${mount.target_folder}/${fileName}"`, false);
  fs.writeFileSync(`content/${mount.target_folder}/${fileName}`, pageString);
}
