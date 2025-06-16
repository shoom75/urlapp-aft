import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { supabase } from "./utils/supabaseClient.js";

const PROXY_BASE_URL = "https://proxy-server-89ba.onrender.com/proxy";
function getProxyUrl(imageUrl) {
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(imageUrl)}`;
}

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  // DOM要素
  const loginSection = document.getElementById("loginSection");
  const authForm = document.getElementById("authForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const authMessage = document.getElementById("authMessage");

  const appSection = document.getElementById("appSection");
  const urlForm = document.getElementById("urlForm");
  const urlInput = document.getElementById("urlInput");
  const titleInput = document.getElementById("titleInput");
  const categoryInput = document.getElementById("categoryInput");
  const urlList = document.getElementById("urlList");
  const toggleBtn = document.getElementById("toggleFormBtn");

  let currentUser = null;
  const existingItems = new Map();

  // ユーザー状態確認
  async function checkAuthState() {
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
      currentUser = data.session.user;
      showAppSection();
      loadUrls();
      setInterval(loadUrls, 5000);
    } else {
      showLoginSection();
    }
  }

  function showLoginSection() {
    loginSection.style.display = "block";
    appSection.style.display = "none";
  }

  function showAppSection() {
    loginSection.style.display = "none";
    appSection.style.display = "block";
    toggleBtn.disabled = false;
    urlForm.style.display = "none";
    toggleBtn.innerText = "＋ URLを登録";

    // ログアウトボタンなければ追加
    if (!document.getElementById("logoutBtn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.innerText = "ログアウト";
      logoutBtn.style.marginLeft = "12px";
      toggleBtn.insertAdjacentElement("afterend", logoutBtn);
      logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        currentUser = null;
        showLoginSection();
      });
    }
  }

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    authMessage.textContent = "";

    if (!email || !password) {
      authMessage.textContent = "メールアドレスとパスワードを入力してください";
      return;
    }

    // ログイン or サインアップ
    let { error, data: loginData } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // ログイン失敗 → 新規登録を試す
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        authMessage.textContent = "ログイン・登録に失敗しました";
        console.error(signUpError);
        return;
      } else {
        currentUser = signUpData.user;
        showAppSection();
        loadUrls();
        setInterval(loadUrls, 5000);
      }
    } else {
      currentUser = loginData.user;
      showAppSection();
      loadUrls();
      setInterval(loadUrls, 5000);
    }
  });

  // URLフォーム切り替え
  toggleBtn.addEventListener("click", () => {
    if (urlForm.style.display === "flex") {
      urlForm.style.display = "none";
      toggleBtn.innerText = "＋ URLを登録";
    } else {
      urlForm.style.display = "flex";
      toggleBtn.innerText = "× 閉じる";
    }
  });

  // URL登録処理
  urlForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("ログインしてください");
      return;
    }

    const rawUrl = urlInput.value.trim();
    const title = titleInput.value.trim();
    const category = categoryInput.value.trim();

    if (!rawUrl || !title || !category) {
      alert("すべての項目を入力してください");
      return;
    }

    try {
      const imageUrl = await getPreview(rawUrl);
      const result = await addUrl(rawUrl, title, category, currentUser.id, imageUrl);

      if (result.success) {
        urlForm.reset();
        urlForm.style.display = "none";
        toggleBtn.innerText = "＋ URLを登録";
        await loadUrls();
      } else {
        alert("登録に失敗しました");
      }
    } catch (err) {
      alert("エラーが発生しました");
      console.error(err);
    }
  });

  // URL一覧読み込み
  async function loadUrls() {
    if (!currentUser) return;
    const urls = await fetchUrls();
    const newIds = urls.map((u) => u.id);

    for (const id of existingItems.keys()) {
      if (!newIds.includes(id)) {
        const { li } = existingItems.get(id);
        li.remove();
        existingItems.delete(id);
      }
    }

    for (const { id, url, title, thumbnail_url } of urls) {
      const proxyThumbnail = thumbnail_url
        ? getProxyUrl(thumbnail_url)
        : "https://placehold.co/80x80";

      if (!existingItems.has(id)) {
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
      }
    }
  }

  checkAuthState(); // 初期化
});
