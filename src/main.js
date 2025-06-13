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

  // 差分だけ更新するloadUrls関数
  async function loadUrls() {
    const urls = await fetchUrls();

    // 現在表示中のli要素のidを取得
    const existingIds = Array.from(urlList.children).map(li => li.dataset.id);

    // 新規URLのid一覧
    const newIds = urls.map(u => u.id);

    // 削除対象のliを削除
    existingIds.forEach(id => {
      if (!newIds.includes(id)) {
        const li = urlList.querySelector(`li[data-id="${id}"]`);
        if (li) li.remove();
      }
    });

    // 追加・更新
    urls.forEach(({ id, url, title, thumbnail_url }) => {
      let li = urlList.querySelector(`li[data-id="${id}"]`);

      if (!li) {
        li = document.createElement("li");
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

        const link = document.createElement("a");
        link.target = "_blank";
        link.style.flex = "1";
        link.style.fontSize = "16px";
        link.style.fontWeight = "bold";
        link.style.color = "#E76F51";
        link.style.textDecoration = "none";

        const btn = document.createElement("button");
        btn.innerText = "削除";
        btn.classList.add("btn-delete");
        btn.onclick = async () => {
          if (!confirm(`「${title}」を削除しますか？`)) return;
          const { success, error } = await deleteUrl(id);
          if (success) {
            loadUrls();
          } else {
            alert("削除に失敗しました");
            console.error(error);
          }
        };

        li.append(img, link, btn);
        urlList.appendChild(li);
      }

      // 更新部分（差分チェックは省略）
      const img = li.querySelector("img");
      img.src = thumbnail_url ? getProxyUrl(thumbnail_url) : "https://placehold.co/80x80";

      const link = li.querySelector("a");
      link.href = url;
      link.innerText = title;
    });
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
    // 登録後に即反映
    loadUrls();
  });

  // 初回ロード
  loadUrls();

  // 5秒ごとに差分更新で再ロード（チカチカ防止）
  setInterval(loadUrls, 5000);
});
