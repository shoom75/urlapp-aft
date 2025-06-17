import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { handleLogin, handleSignUp, logout } from "./utils/auth.js";
import { supabase } from "./utils/supabaseClient.js";

const PROXY_BASE_URL = "https://proxy-server-89ba.onrender.com/proxy";
function getProxyUrl(imageUrl) {
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(imageUrl)}`;
}

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("loginSection");
  const loginFormWrapper = document.getElementById("loginForm");
  const loginForm = document.getElementById("loginFormElement");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const signUpFormWrapper = document.getElementById("signUpForm");
  const signUpForm = document.getElementById("signUpFormElement");
  const signUpEmail = document.getElementById("signUpEmail");
  const signUpPassword = document.getElementById("signUpPassword");

  const showSignUpLink = document.getElementById("showSignUpLink");
  const showLoginLink = document.getElementById("showLoginLink");
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
  let refreshInterval = null;

  function showLoginForm() {
    loginFormWrapper.style.display = "block";
    signUpFormWrapper.style.display = "none";
    authMessage.textContent = "";
    authMessage.style.color = "red";
  }
  function showSignUpForm() {
    loginFormWrapper.style.display = "none";
    signUpFormWrapper.style.display = "block";
    authMessage.textContent = "";
    authMessage.style.color = "red";
  }
  function showLoginSection() {
    loginSection.style.display = "block";
    appSection.style.display = "none";
    showLoginForm();
    clearInterval(refreshInterval);
  }
  function showAppSection() {
    loginSection.style.display = "none";
    appSection.style.display = "block";
    toggleBtn.disabled = false;
    urlForm.style.display = "none";
    toggleBtn.innerText = "＋ URLを登録";

    if (!document.getElementById("logoutBtn")) {
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.innerText = "ログアウト";
      logoutBtn.style.marginLeft = "12px";
      toggleBtn.insertAdjacentElement("afterend", logoutBtn);
      logoutBtn.addEventListener("click", async () => {
        await logout();
        currentUser = null;
        showLoginSection();
      });
    }

    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(loadUrls, 5000);
  }

  async function checkAuthState() {
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
      currentUser = data.session.user;
      showAppSection();
      await loadUrls();
    } else {
      currentUser = null;
      showLoginSection();
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    const success = await handleLogin(email, password, authMessage);
    if (success) {
      const { data } = await supabase.auth.getUser();
      currentUser = data.user;
      showAppSection();
      await loadUrls();
    }
  });

  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = signUpEmail.value.trim();
    const password = signUpPassword.value.trim();

    await handleSignUp(email, password, authMessage, () => {
      showLoginForm();
    });
  });

  showSignUpLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSignUpForm();
  });
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
  });

  toggleBtn.addEventListener("click", () => {
    const showing = urlForm.style.display === "flex";
    urlForm.style.display = showing ? "none" : "flex";
    toggleBtn.innerText = showing ? "＋ URLを登録" : "× 閉じる";
  });

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
      const proxyThumbnail = thumbnail_url ? getProxyUrl(thumbnail_url) : "https://placehold.co/80x80";

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
        img.onerror = () => (img.src = "https://placehold.co/80x80");
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
        if (item.url !== url) item.link.href = url;
        if (item.title !== title) item.link.innerText = title;
        if (item.thumbnailUrl !== proxyThumbnail) item.img.src = proxyThumbnail;
        existingItems.set(id, {
          ...item,
          url,
          title,
          thumbnailUrl: proxyThumbnail,
        });
      }
    }
  }

  checkAuthState();
});
