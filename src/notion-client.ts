import { Client } from "@notionhq/client";

const DEFAULT_REQUEST_INTERVAL_MS = 500;
const DEFAULT_RETRY_AFTER_SECONDS = 60;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let lastRequestAt = 0;

function getRequestIntervalMs() {
  const value = Number(process.env.NOTION_REQUEST_INTERVAL_MS);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_REQUEST_INTERVAL_MS;
  }

  return value;
}

function getRetryAfterMs(response: Response) {
  const retryAfter = Number(response.headers.get("retry-after"));

  if (!Number.isFinite(retryAfter) || retryAfter <= 0) {
    return DEFAULT_RETRY_AFTER_SECONDS * 1000;
  }

  return (retryAfter + 1) * 1000;
}

async function waitForRequestSlot() {
  const intervalMs = getRequestIntervalMs();
  const now = Date.now();
  const waitMs = Math.max(0, lastRequestAt + intervalMs - now);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  lastRequestAt = Date.now();
}

async function throttledFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  await waitForRequestSlot();

  const response = await fetch(input, init);

  if (response.status !== 429) {
    return response;
  }

  const retryAfterMs = getRetryAfterMs(response);

  console.warn(
    `[Warn] Notion API rate limited. Retry after ${Math.ceil(
      retryAfterMs / 1000,
    )} seconds.`,
  );

  await sleep(retryAfterMs);
  await waitForRequestSlot();

  return fetch(input, init);
}

export function createNotionClient() {
  return new Client({
    auth: process.env.NOTION_TOKEN,
    fetch: throttledFetch,
  });
}