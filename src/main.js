import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { supabase } from "./utils/supabaseClient.js";

console.log("✅ main.js loaded");
console.log("const proxyUrl = `https://localhost:3001/proxy?url=${encodeURIComponent(imageUrl)}`;");
document.addEventListener("DOMContentLoaded", () => {
  // ── 認証ユーザー取得（テスト用フォールバック含む）
  const session = supabase.auth.session;
  const userId  = session?.user?.id || "user_123";

  const urlForm          = document.getElementById("urlForm");
  const urlList          = document.getElementById("urlList");
  const thumbnailImg     = document.getElementById("thumbnail");
  const thumbnailBg      = document.getElementById("thumbnail-bg"); // フォールバック用DIV

  // ── サムネイル読み込み関数
  function loadThumbnail(proxyUrl) {
    // 初期化
    thumbnailBg.style.display  = "none";
    thumbnailImg.style.display = "block";

    // img が失敗したら background-image に切り替え
    thumbnailImg.onerror = () => {
      console.warn("🐞 プレビュー読み込み失敗 → background-image でフォールバック:", proxyUrl);
      thumbnailImg.style.display = "none";
      thumbnailBg.style.backgroundImage = `url(${proxyUrl})`;
      thumbnailBg.style.display      = "block";
    };

    // 成功時は念のため bg を隠して img 表示
    thumbnailImg.onload = () => {
      thumbnailBg.style.display  = "none";
      thumbnailImg.style.display = "block";
    };

    // iOS Safari 再描画対策：一度クリアしてから再セット
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
      li.style.display      = "flex";
      li.style.alignItems   = "center";
      li.style.gap          = "12px";
      li.style.margin       = "10px 0";

      // 画像要素
      const img = document.createElement("img");
      const proxyThumbUrl = thumbnail_url
        ? `http://localhost:3001/proxy?url=${encodeURIComponent(thumbnail_url)}`
        : "https://placehold.co/80x80";

      // 高速表示 & フォールバック
      img.src    = proxyThumbUrl;
      img.width  = 80;
      img.height = 80;
      img.alt    = "サムネイル";
      img.style.objectFit = "cover";
      img.onerror = () => {
        img.src = "https://placehold.co/80x80";
      };

      // タイトルリンク
      const link = document.createElement("a");
      link.href          = url;
      link.target        = "_blank";
      link.innerText     = title;
      link.style.flex    = "1";
      link.style.fontSize = "16px";
      link.style.fontWeight = "bold";
      link.style.color   = "#E76F51";
      link.style.textDecoration = "none";

      // 削除ボタン
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

    // プレビューURL取得 & 保存
    const imageUrl = await getPreview(rawUrl);
    await addUrl(rawUrl, title, category, userId, imageUrl);

    // プレビュー表示
    const proxyUrl = `https://localhost:3001/proxy?url=${encodeURIComponent(imageUrl)}`;
    loadThumbnail(proxyUrl);

    urlForm.reset();
    loadUrls();
  });

  // 初回一覧ロード
  loadUrls();
});