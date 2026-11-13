import { defineConfig } from 'vite';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { glob } from 'glob';

import liveReload from 'vite-plugin-live-reload';

// ===== 作品集影片資料 =====
// 為什麼寫在這裡？
// 頁面裡的 <% %> 語法是 EJS，會由下方 plugins 裡的 ViteEjsPlugin 在「Vite 產生網頁時」轉成純 HTML。
// HTML 檔本身沒辦法讀 JSON，所以要在這裡先把資料讀進來，再透過 ViteEjsPlugin({ videos }) 交給 EJS，
// 這樣 portfolio.html 裡才能使用 videos 這個變數。
// ※ npm run dev 開著時改 videos.json，Vite 會自動重啟並重新整理頁面，不用手動重跑。

// 1. 讀取影片資料（每筆有 url、title、category）
import videoData from './data/videos.json' with { type: 'json' };

// 2. 從 YouTube 網址取出 11 碼的影片 ID，縮圖網址要用到
//    支援三種網址：
//    https://www.youtube.com/watch?v=SsYJLPpTiig
//    https://youtu.be/SsYJLPpTiig
//    https://youtube.com/shorts/YeLMZBTXVxI
function getYoutubeId(url) {
  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/);
  // 網址格式不對時直接報錯，避免頁面出現壞掉的縮圖
  if (!match) throw new Error(`無法解析 YouTube 網址：${url}`);
  return match[1];
}

// 3. 幫每筆資料加上 id 欄位
//    { url, title, category, date } → { url, title, category, date, id }
// 4. 依 date（格式 YYYY-MM-DD）排序，日期新的放最前面；同一天的維持 JSON 裡的先後順序
//    所以新增影片時 JSON 裡放哪個位置都可以，作品集頁面會自動排好
const videos = videoData
  .map((v) => ({ ...v, id: getYoutubeId(v.url) }))
  .sort((a, b) => b.date.localeCompare(a.date));

function moveOutputPlugin() {
  return {
    name: 'move-output',
    enforce: 'post',
    apply: 'build',
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        if (fileName.startsWith('pages/')) {
          const newFileName = fileName.slice('pages/'.length);
          bundle[fileName].fileName = newFileName;
        }
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  // base 的寫法：
  // base: '/Repository 的名稱/'
  base: command === 'build' ? '/morte/' : '/',
  plugins: [
    // 這些檔案有變動時，瀏覽器自動重新整理（多加了 data 資料夾）
    liveReload(['./layout/**/*.ejs', './pages/**/*.html', './data/**/*.json']),
    // 把 videos 傳給 EJS，所有頁面的 <% %> 裡都能用 videos 這個變數
    ViteEjsPlugin({ videos }),
    moveOutputPlugin(),
  ],
  server: {
    // 啟動 server 時預設開啟的頁面
    open: 'pages/index.html',
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        glob
          .sync('pages/**/*.html')
          .map((file) => [
            path.relative('pages', file.slice(0, file.length - path.extname(file).length)),
            fileURLToPath(new URL(file, import.meta.url)),
          ])
      ),
    },
  },
}));
