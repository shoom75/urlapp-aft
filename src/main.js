import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { supabase } from "./utils/supabaseClient.js";

// ✅ プロキシベースURLを本番用に設定
const IS_LOCAL = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const PROXY_BASE_URL = IS_LOCAL
  ? "http://localhost:3001/proxy"
  : "https://proxy-server-89ba.onrender.com/proxy";

// ✅ プロキシURLを生成する関数
function getProxyUrl(imageUrl) {
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(imageUrl)}`;
}

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const session = supabase.auth.session;
  const userId  = session?.user?.id || "user_123";

  const urlForm      = document.getElementById("urlForm");
  const urlList      = document.getElementById("urlList");
  const thumbnailImg = document.getElementById("thumbnail");
  const thumbnailBg  = document.getElementById("thumbnail-bg");

  // ── サムネイル読み込み関数
  function loadThumbnail(proxyUrl) {
    thumbnailBg.style.display  = "none";
    thumbnailImg.style.display = "block";

    thumbnailImg.onerror = () => {
      console.warn("🐞 プレビュー読み込み失敗 → background-image でフォールバック:", proxyUrl);
      thumbnailImg.style.display = "none";
      thumbnailBg.style.backgroundImage = `url(${proxyUrl})`;
      thumbnailBg.style.display      = "block";
    };

    thumbnailImg.onload = () => {
      thumbnailBg.style.display  = "none";
      thumbnailImg.style.display = "block";
    };

    thumbnailImg.src = "";
    setTimeout(() => {
      thumbnailImg.src = proxyUrl;
    }, 50);
  }

  // ── 既存の URL 一覧ロード
  async function loadUrls() {
    urlList.innerHTML = "";
    const urls = await fetchUrls();

    const frag = document.createDocumentFragment();
    urls.forEach(({ id, url, title, thumbnail_url }) => {
      const li = document.createElement("li");
      li.style.display    = "flex";
      li.style.alignItems = "center";
      li.style.gap        = "12px";
      li.style.margin     = "10px 0";

      const img = document.createElement("img");
      const proxyThumbUrl = thumbnail_url
        ? getProxyUrl(thumbnail_url)
        : "https://placehold.co/80x80";

      img.src    = proxyThumbUrl;
      img.width  = 80;
      img.height = 80;
      img.alt    = "サムネイル";
      img.style.objectFit = "cover";
      img.onerror = () => {
        img.src = "https://placehold.co/80x80";
      };

      const link = document.createElement("a");
      link.href           = url;
      link.target         = "_blank";
      link.innerText      = title;
      link.style.flex     = "1";
      link.style.fontSize = "16px";
      link.style.fontWeight = "bold";
      link.style.color    = "#E76F51";
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
      frag.appendChild(li);
    });

    urlList.appendChild(frag);
  }

  // ── フォーム登録処理
  urlForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawUrl    = urlForm.urlInput.value.trim();
    const title     = urlForm.titleInput.value.trim();
    const category  = urlForm.categoryInput.value.trim();
    if (!rawUrl || !title || !category) return;

    const imageUrl = await getPreview(rawUrl);
    await addUrl(rawUrl, title, category, userId, imageUrl);

    const proxyUrl = getProxyUrl(imageUrl);
    loadThumbnail(proxyUrl);

    urlForm.reset();
    loadUrls();
  });

  // 初回一覧ロード
  loadUrls();
});
