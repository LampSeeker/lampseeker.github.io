import { Client, isFullDatabase, isFullPage, iteratePaginatedAPI } from "@notionhq/client";
import dotenv from "dotenv";
import fs from "fs-extra";
import { savePage } from "./render";
import { loadConfig } from "./config";
import { getAllContentFiles } from "./file";
import { getFileName, getPageTitle } from "./helpers";

dotenv.config();

type MountedDatabaseMeta = {
  database_id: string;
  data_source_ids: string[];
  title: string;
  target_folder: string;
  parent_page_id: string | null;
};

function bumpCount(counter: Map<string, number>, id: string | null) {
  if (!id) return;
  counter.set(id, (counter.get(id) || 0) + 1);
}

async function main() {
  if (process.env.NOTION_TOKEN === "")
    throw Error("The NOTION_TOKEN environment vairable is not set.");
  const config = await loadConfig();
  console.info("[Info] Config loaded ");

  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  const pages: string[] = [];
  const mountedDatabases: MountedDatabaseMeta[] = [];
  const pageIdsByDatabase = new Map<string, Set<string>>();
  const rootPageParentCounts = new Map<string, number>();

  console.info("[Info] Start processing mounted databases");
  // process mounted databases
  for (const mount of config.mount.databases) {
    fs.ensureDirSync(`content/${mount.target_folder}`);
    const database = await notion.databases.retrieve({ database_id: mount.database_id });
    if (!isFullDatabase(database)) {
      console.warn(`[Warn] Skipping mount for database ${mount.database_id} as it could not be fully retrieved.`);
      continue;
    }

    const pageIds = new Set<string>();
    const databaseTitle = (database.title || []).map((t) => t.plain_text).join("").trim();
    const parentPageId =
      database.parent?.type === "page_id" ? database.parent.page_id : null;

    mountedDatabases.push({
      database_id: mount.database_id,
      data_source_ids: database.data_sources.map((ds) => ds.id),
      title: databaseTitle || mount.target_folder,
      target_folder: mount.target_folder,
      parent_page_id: parentPageId,
    });
    bumpCount(rootPageParentCounts, parentPageId);

    for (const data_source of database.data_sources) {
      console.info(`[Info] Processing data source: ${data_source.name} (${data_source.id})`);
      for await (const page of iteratePaginatedAPI(notion.dataSources.query, {
        data_source_id: data_source.id
      })) {
        if (!isFullPage(page) || page.object !== "page") {
          continue;
        }
        pageIds.add(page.id);
        console.info(`[Info] Start processing page ${page.id}`);
        pages.push(getFileName(getPageTitle(page), page.id));
        await savePage(page, notion, mount);
      }
    }
    pageIdsByDatabase.set(mount.database_id, pageIds);
  }

  // Build root database list (exclude nested DB mounted under pages inside other mounted DBs).
  const allMountedPageIds = new Set<string>();
  for (const ids of pageIdsByDatabase.values()) {
    for (const id of ids) allMountedPageIds.add(id);
  }

  const rootDatabases = mountedDatabases
    .filter((db) => !db.parent_page_id || !allMountedPageIds.has(db.parent_page_id))
    .map((db) => ({
      title: db.title,
      target_folder: db.target_folder,
      section: db.target_folder.split("/")[0],
      database_id: db.database_id,
      data_source_id: db.data_source_ids[0] || "",
    }));

  fs.ensureDirSync("data");
  fs.writeJsonSync("data/notion_root_databases.json", {
    generated_at: new Date().toISOString(),
    roots: rootDatabases,
  }, { spaces: 2 });

  // process mounted pages
  for (const mount of config.mount.pages) {
    const page = await notion.pages.retrieve({ page_id: mount.page_id });
    if (!isFullPage(page)) {
      continue;
    }
    const pageParentId = page.parent?.type === "page_id" ? page.parent.page_id : null;
    bumpCount(rootPageParentCounts, pageParentId);
    pages.push(getFileName(getPageTitle(page), page.id));
    await savePage(page, notion, mount);
  }

  // Infer and persist the Notion root page title (e.g. "Be your own lamp")
  // so templates can show it without hardcoding.
  let rootPageId: string | null = null;
  if (rootPageParentCounts.size > 0) {
    rootPageId = [...rootPageParentCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  let rootPageTitle: string | null = null;
  let rootPageUrl: string | null = null;
  if (rootPageId) {
    const rootPage = await notion.pages.retrieve({ page_id: rootPageId });
    if (isFullPage(rootPage)) {
      rootPageTitle = getPageTitle(rootPage);
      rootPageUrl = rootPage.url ?? null;
    }
  }

  fs.writeJsonSync(
    "data/notion_root_page.json",
    {
      generated_at: new Date().toISOString(),
      page_id: rootPageId,
      title: rootPageTitle,
      url: rootPageUrl,
    },
    { spaces: 2 },
  );

  // remove posts that exist locally but not in Notion Database
  const contentFiles = getAllContentFiles("content");
  for (const file of contentFiles) {
    if (!pages.includes(file.filename) && file.managed) {
      console.info(`[Info] Removing unsynced file ${file.filepath}`);
      fs.removeSync(file.filepath);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
