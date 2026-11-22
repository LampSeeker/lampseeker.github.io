import assert from "node:assert/strict";
import test from "node:test";
import { videoFromUrl } from "./md";

for (const url of [
  "https://youtu.be/mkfw283lT_M",
  "https://youtu.be/mkfw283lT_M?si=share",
  "https://www.youtube.com/watch?v=mkfw283lT_M&t=13s",
  "https://youtube.com/watch?v=mkfw283lT_M",
  "https://m.youtube.com/watch?v=mkfw283lT_M",
  "https://www.youtube.com/embed/mkfw283lT_M?start=13",
  "https://www.youtube.com/shorts/mkfw283lT_M",
]) {
  test(`YouTube video uses an iframe: ${url}`, () => {
    const html = videoFromUrl(url);
    assert.match(html, /<iframe /);
    assert.ok(html.includes('src="https://www.youtube.com/embed/mkfw283lT_M"'));
    assert.ok(!html.includes("<video"));
  });
}

for (const url of [
  "/notion-assets/example.mp4",
  "https://example.com/video.mp4",
  "https://www.youtube.com.evil.example/watch?v=mkfw283lT_M",
  "https://www.youtube.com/watch?v=invalid",
]) {
  test(`Other video sources retain the HTML video player: ${url}`, () => {
    const html = videoFromUrl(url);
    assert.match(html, /<video controls/);
    assert.ok(html.includes(`<source src="${url}">`));
  });
}
