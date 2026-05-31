import { isFullDatabase, isFullPage, iteratePaginatedAPI } from "@notionhq/client";
import type { Client } from "@notionhq/client";
import { createNotionClient } from "./notion-client";import dotenv from "dotenv";
import fs from "fs-extra";
import { savePage } from "./render";
import { loadConfig } from "./config";
import { getAllContentFiles } from "./file";
import { downloadAsset, getCoverLink, getFileName, getPageTitle } from "./helpers";
import path from "path";

dotenv.config();

type MountedDatabaseMeta = {
  database_id: string;
  data_source_ids: string[];
  title: string;
  target_folder: string;
  parent_page_id: string | null;
};

function slugifyPathSegment(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "untitled";
}

function bumpCount(counter: Map<string, number>, id: string | null) {
  if (!id) return;
  counter.set(id, (counter.get(id) || 0) + 1);
}

function pickPlainTextFromBlock(block: any): string {
  const blockValue = block?.[block?.type];
  const richText = blockValue?.rich_text;
  if (!Array.isArray(richText)) return "";
  const text = richText
    .map((item: any) => (typeof item?.plain_text === "string" ? item.plain_text : ""))
    .join("")
    .trim();
  return text;
}

function fileExtensionFromUrl(url: string, fallback = ".png"): string {
  try {
    const pathname = new URL(url).pathname;
    return path.extname(pathname) || fallback;
  } catch {
    return fallback;
  }
}

async function resolveBlockImage(block: any): Promise<string | null> {
  if (block?.type !== "image" || !block.image) return null;
  if (block.image.type === "external") {
    return block.image.external?.url ?? null;
  }
  if (block.image.type === "file") {
    const fileUrl: string | undefined = block.image.file?.url;
    if (!fileUrl) return null;
    return downloadAsset(
      fileUrl,
      block.id,
      fileExtensionFromUrl(fileUrl, ".png"),
    );
  }
  return null;
}

async function collectRootPageSignals(notion: Client, rootPageId: string): Promise<{
  heroImage: string | null;
  intro: string | null;
}> {
  let heroImage: string | null = null;
  let intro: string | null = null;
  const queue: string[] = [rootPageId];
  const visited = new Set<string>();

  while (queue.length > 0 && (!heroImage || !intro)) {
    const blockId = queue.shift();
    if (!blockId || visited.has(blockId)) continue;
    visited.add(blockId);

    let startCursor: string | undefined = undefined;
    do {
      const response = await notion.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
        page_size: 100,
      });

      for (const block of response.results as any[]) {
        if (!intro) {
          const text = pickPlainTextFromBlock(block).replace(/\s+/g, " ").trim();
          if (text.length > 0) {
            intro = text;
          }
        }

        if (!heroImage && block.type === "image") {
          heroImage = await resolveBlockImage(block);
        }

        if (block.has_children) {
          queue.push(block.id);
        }

        if (heroImage && intro) break;
      }

      if (heroImage && intro) break;
      startCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    } while (startCursor);
  }

  return { heroImage, intro };
}

async function main() {
  if (process.env.NOTION_TOKEN === "")
    throw Error("The NOTION_TOKEN environment vairable is not set.");
  const config = await loadConfig();
  console.info("[Info] Config loaded ");

  const notion = createNotionClient();

  const pages: string[] = [];
  const mountedDatabases: MountedDatabaseMeta[] = [];
  const pageIdsByDatabase = new Map<string, Set<string>>();
  const rootPageParentCounts = new Map<string, number>();
  const queuedDatabaseIds = new Set(config.mount.databases.map((mount) => mount.database_id));
  const processedDatabaseIds = new Set<string>();

  console.info("[Info] Start processing mounted databases");
  // process mounted databases
  for (let mountIndex = 0; mountIndex < config.mount.databases.length; mountIndex += 1) {
    const mount = config.mount.databases[mountIndex];
    if (processedDatabaseIds.has(mount.database_id)) {
      continue;
    }
    processedDatabaseIds.add(mount.database_id);
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
      try {
        for await (const page of iteratePaginatedAPI(notion.dataSources.query, {
          data_source_id: data_source.id,
          filter: mount.query_filter,
        })) {
          if (!isFullPage(page) || page.object !== "page") {
            continue;
          }
          pageIds.add(page.id);
          console.info(`[Info] Start processing page ${page.id}`);
          pages.push(getFileName(getPageTitle(page), page.id));
          const { childDatabases } = await savePage(page, notion, mount);
          for (const childDatabase of childDatabases) {
            if (queuedDatabaseIds.has(childDatabase.database_id)) {
              continue;
            }
            queuedDatabaseIds.add(childDatabase.database_id);
            const targetFolder = path.posix.join(
              mount.target_folder,
              slugifyPathSegment(childDatabase.title),
            );
            console.info(
              `[Info] Auto-mounted child database: ${childDatabase.title} (${childDatabase.database_id}) -> ${targetFolder}`,
            );
            config.mount.databases.push({
              database_id: childDatabase.database_id,
              target_folder: targetFolder,
              query_filter: mount.query_filter,
              auto_discovered: true,
            });
          }
        }
      } catch (err: any) {
        const isMissingFilterProperty =
          err?.code === "validation_error" &&
          typeof err?.message === "string" &&
          err.message.includes("Could not find property");

        if (mount.auto_discovered && isMissingFilterProperty) {
          console.warn(
            `[Warn] Skipping auto-discovered child database ${mount.database_id}: inherited filter property was not found.`,
          );
          continue;
        }
        throw err;
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
  let rootPageId: string | null = config.root_page_id ?? null;
  if (!rootPageId && rootPageParentCounts.size > 0) {
    rootPageId = [...rootPageParentCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  let rootPageTitle: string | null = null;
  let rootPageUrl: string | null = null;
  let rootPageHeroImage: string | null = null;
  let rootPageIntro: string | null = null;
  if (rootPageId) {
    const rootPage = await notion.pages.retrieve({ page_id: rootPageId });
    if (isFullPage(rootPage)) {
      rootPageTitle = getPageTitle(rootPage);
      rootPageUrl = rootPage.url ?? null;
      const signals = await collectRootPageSignals(notion, rootPageId);
      rootPageIntro = signals.intro;
      rootPageHeroImage =
        signals.heroImage || (await getCoverLink(rootPageId, notion));
    }
  }

  fs.writeJsonSync(
    "data/notion_root_page.json",
    {
      generated_at: new Date().toISOString(),
      page_id: rootPageId,
      title: rootPageTitle,
      url: rootPageUrl,
      hero_image: rootPageHeroImage,
      intro: rootPageIntro,
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
