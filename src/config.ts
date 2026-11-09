import { Client, isFullBlock, isFullDatabase, iteratePaginatedAPI } from "@notionhq/client";
import type { QueryDataSourceParameters } from "@notionhq/client/build/src/api-endpoints";
import { slugifyPathSegment } from "./helpers";
import { createNotionClient } from "./notion-client";

import userDefinedConfig from "../notion-hugo.config";

export type PageMount = {
  page_id: string;
  target_folder: string;
  url?: string;
};

export type DatabaseMount = {
  database_id: string;
  target_folder: string;
  query_filter?: QueryDataSourceParameters["filter"];
  auto_discovered?: boolean;
};

export type Mount = {
  databases: DatabaseMount[];
  pages: PageMount[];
};

export type Config = {
  mount: Mount;
  root_page_id?: string;
};

export async function loadConfig(): Promise<Config> {
  const userConfig = userDefinedConfig as UserConfig;
  const config: Config = {
    mount: {
      databases: [],
      pages: [],
    },
    root_page_id: userConfig.root_page_id,
  };

  // configure mount settings
  if (userConfig.mount.manual) {
    if (userConfig.mount.databases)
      config.mount.databases = userConfig.mount.databases;
    if (userConfig.mount.pages) config.mount.pages = userConfig.mount.pages;
    if (userConfig.mount.auto_public_property && userConfig.root_page_id) {
      const discovered = await discoverPublicDatabases(
        userConfig.root_page_id,
        userConfig.mount.auto_public_property,
        config.mount.databases,
      );
      config.mount.databases.push(...discovered);
    }
  } else {
    if (userConfig.mount.page_url === undefined)
      throw Error(
        `[Error] When mount.manual is false, a page_url must be set.`,
      );
    const url = new URL(userConfig.mount.page_url);
    const len = url.pathname.length;
    if (len < 32) throw Error(`[Error] The page_url ${url.href} is invalid`);
    const pageId = url.pathname.slice(len - 32, len);
    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    for await (const block of iteratePaginatedAPI(notion.blocks.children.list, {
      block_id: pageId,
    })) {
      if (!isFullBlock(block)) continue;
      if (block.type === "child_database") {
        config.mount.databases.push({
          database_id: block.id,
          target_folder: block.child_database.title,
        });
      }
      if (block.type === "child_page") {
        config.mount.pages.push({
          page_id: block.id,
          target_folder: ".",
        });
      }
    }
  }

  return config;
}

// Find databases placed on the root page that have a checkbox property named
// `property`, and mount them with a filter that keeps only checked pages.
// Databases already listed in `existing` are skipped so manual entries win.
async function discoverPublicDatabases(
  rootPageId: string,
  property: string,
  existing: DatabaseMount[],
): Promise<DatabaseMount[]> {
  const notion = createNotionClient();
  const normalize = (id: string) => id.replaceAll("-", "");
  const knownIds = new Set(existing.map((mount) => normalize(mount.database_id)));
  const usedFolders = new Set(existing.map((mount) => mount.target_folder));
  const discovered: DatabaseMount[] = [];

  // Walk the root page, descending into layout blocks (columns, toggles, ...)
  // but not into child pages or databases.
  const queue = [rootPageId];
  while (queue.length > 0) {
    const blockId = queue.shift()!;
    for await (const block of iteratePaginatedAPI(notion.blocks.children.list, {
      block_id: blockId,
    })) {
      if (!isFullBlock(block)) continue;
      if (block.type === "child_page") continue;
      if (block.type !== "child_database") {
        if (block.has_children) queue.push(block.id);
        continue;
      }
      if (knownIds.has(normalize(block.id))) continue;

      let database;
      try {
        database = await notion.databases.retrieve({ database_id: block.id });
      } catch (err: any) {
        console.warn(`[Warn] Could not read database ${block.id}: ${err?.message ?? err}`);
        continue;
      }
      if (!isFullDatabase(database)) continue;

      let hasProperty = false;
      for (const dataSource of database.data_sources) {
        const source = await notion.dataSources.retrieve({ data_source_id: dataSource.id });
        if (source.properties[property]?.type === "checkbox") {
          hasProperty = true;
          break;
        }
      }
      const title = block.child_database.title.trim() || "untitled";
      if (!hasProperty) {
        console.info(`[Info] Skipping database "${title}": no "${property}" checkbox property`);
        continue;
      }

      let folder = slugifyPathSegment(title);
      while (usedFolders.has(folder)) folder = `${folder}-${normalize(block.id).slice(0, 6)}`;
      usedFolders.add(folder);
      knownIds.add(normalize(block.id));

      console.info(`[Info] Auto-discovered database "${title}" (${block.id}) -> ${folder}`);
      discovered.push({
        database_id: block.id,
        target_folder: folder,
        query_filter: { property, checkbox: { equals: true } },
      });
    }
  }

  return discovered;
}

export type UserMount = {
  manual: boolean;
  // When set (with manual: true and root_page_id), every database on the root
  // page that has a checkbox property with this name is mounted automatically,
  // syncing only the pages where it is checked.
  auto_public_property?: string;
  page_url?: string;
  databases?: DatabaseMount[];
  pages?: PageMount[];
};

export type UserConfig = {
  mount: UserMount;
  root_page_id?: string;
};

export function defineConfig(config: UserConfig) {
  return config;
}
