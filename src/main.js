import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { supabase } from "./utils/supabaseClient.js";

const PROXY_BASE_URL = "https://proxy-server-89ba.onrender.com/proxy";

function getProxyUrl(imageUrl) {
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(imageUrl)}`;
}

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const session = supabase.auth.session;
  const userId = session?.user?.id || "user_123";

  const urlForm = document.getElementById("urlForm");
  const urlList = document.getElementById("urlList");

  // 既存リストアイテムをMapで保持（id -> {url, title, thumbnailUrl, li}）
  const existingItems = new Map();

  async function loadUrls() {
    const urls = await fetchUrls();

    // 新規id一覧
    const newIds = urls.map(u => u.id);

    // 削除処理：既存にあって新規にないidは削除
    for (const id of existingItems.keys()) {
      if (!newIds.includes(id)) {
        const { li } = existingItems.get(id);
        li.remove();
        existingItems.delete(id);
      }
    }

    // 追加・更新処理
    for (const { id, url, title, thumbnail_url } of urls) {
      const proxyThumbnail = thumbnail_url ? getProxyUrl(thumbnail_url) : "https://placehold.co/80x80";
      if (!existingItems.has(id)) {
        // 新規追加
        const li = document.createElement("li");
        li.dataset.id = id;
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "12px";
        li.style.margin = "10px 0";

        const img = document.createElement("img");
        img.width = 80;
        img.height = 80;
        img.alt = "サムネイル";
        img.style.objectFit = "cover";
        img.onerror = () => {
          img.src = "https://placehold.co/80x80";
        };
        img.src = proxyThumbnail;

        const link = document.createElement("a");
        link.target = "_blank";
        link.style.flex = "1";
        link.style.fontSize = "16px";
        link.style.fontWeight = "bold";
        link.style.color = "#E76F51";
        link.style.textDecoration = "none";
        link.href = url;
        link.innerText = title;

        const btn = document.createElement("button");
        btn.innerText = "削除";
        btn.classList.add("btn-delete");
        btn.onclick = async () => {
          if (!confirm(`「${title}」を削除しますか？`)) return;
          const { success, error } = await deleteUrl(id);
          if (success) {
            // 削除はloadUrlsで反映
            loadUrls();
          } else {
            alert("削除に失敗しました");
            console.error(error);
          }
        };

        li.append(img, link, btn);
        urlList.appendChild(li);

        existingItems.set(id, {
          url,
          title,
          thumbnailUrl: proxyThumbnail,
          li,
          img,
          link,
        });
      } else {
        // 既存アイテムの差分チェック・更新
        const item = existingItems.get(id);
        let changed = false;

        if (item.url !== url) {
          item.link.href = url;
          item.url = url;
          changed = true;
        }
        if (item.title !== title) {
          item.link.innerText = title;
          item.title = title;
          changed = true;
        }
        if (item.thumbnailUrl !== proxyThumbnail) {
          item.img.src = proxyThumbnail;
          item.thumbnailUrl = proxyThumbnail;
          changed = true;
        }

        if (changed) {
          // 必要に応じてここにアニメーションや視覚効果を追加できる
          // console.log(`更新: ${title}`);
        }
      }
    }
  }

  urlForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawUrl = urlForm.urlInput.value.trim();
    const title = urlForm.titleInput.value.trim();
    const category = urlForm.categoryInput.value.trim();
    if (!rawUrl || !title || !category) return;

    const imageUrl = await getPreview(rawUrl);
    await addUrl(rawUrl, title, category, userId, imageUrl);

    urlForm.reset();
    await loadUrls();
  });

  // 初回ロード
  loadUrls();

  // 5秒ごとに差分だけ更新
  setInterval(loadUrls, 5000);
});
