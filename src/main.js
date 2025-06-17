import { addUrl, fetchUrls, deleteUrl } from "./utils/dbOperations.js";
import { getPreview } from "./utils/fetchPreview.js";
import { handleLogin, handleSignUp, logout } from "./utils/auth.js";
import { supabase } from "./utils/supabaseClient.js";

const PROXY_BASE_URL = "https://proxy-server-89ba.onrender.com/proxy";
function getProxyUrl(imageUrl) {
  return `${PROXY_BASE_URL}?url=${encodeURIComponent(imageUrl)}`;
}

console.log("✅ main.js loaded");

let currentGroupId = null;
let currentGroupName = "";

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

  const groupebtn = document.getElementById("groupebtn");
  const groupMenu = document.getElementById("groupMenu");

  const createbtn = document.getElementById("createbtn");
  const groupename = document.getElementById("groupename");
  const createform = document.getElementById("createform");

  const groupenameForm = document.getElementById("groupename");
  const createInput = document.getElementById("create");

  // グループ一覧表示用の要素取得
  const groupListArea = document.getElementById("groupListArea");
  const groupList = document.getElementById("groupList");
  const showGroupsBtn = document.getElementById("showGroupsBtn");
  const closeGroupListBtn = document.getElementById("closeGroupListBtn");
  const currentGroupLabel = document.getElementById("currentGroupLabel");

  let currentUser = null;
  const existingItems = new Map();
  let refreshInterval = null;

  // 全てのフォームを閉じる関数
  function closeAllForms() {
    createform.style.display = "none";
    const joinform = document.getElementById("joinform");
    if (joinform) joinform.style.display = "none";
    const inviteform = document.getElementById("inviteform");
    if (inviteform) inviteform.style.display = "none";
    groupListArea.style.display = "none";
  }

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
      resetGroupSelection();
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
      resetGroupSelection();
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
    if (!currentGroupId) {
      alert("グループを選択してください");
      return;
    }
    const showing = urlForm.style.display === "flex";
    urlForm.style.display = showing ? "none" : "flex";
    toggleBtn.innerText = showing ? "＋ URLを登録" : "× 閉じる";
  });

  // グループメニューボタン
  groupebtn.addEventListener("click", () => {
    const check = groupMenu.style.display === "none";
    groupMenu.style.display = check ? "block" : "none";
    if (check) closeAllForms(); // メニューを開いたときフォームを閉じる
  });

  // グループ作成ボタン
  createbtn.addEventListener("click", () => {
    const check = createform.style.display === "none";
    closeAllForms(); // 他フォームを閉じる
    createform.style.display = check ? "block" : "none";
  });

  groupenameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const groupName = createInput.value.trim();
    if (!groupName) {
      alert("グループ名を入力してください");
      return;
    }
    const { data, error } = await supabase
      .from("groups")
      .insert([{ name: groupName, created_by: currentUser.id }])
      .select()
      .single();
    if (error) {
      alert("グループ作成に失敗しました");
      return;
    }
    // 作成者をメンバーにも追加
    await supabase.from("group_members").insert([
      { group_id: data.id, user_id: currentUser.id }
    ]);
    alert("グループを作成しました");
    createInput.value = "";
    createform.style.display = "none";
  });

  urlForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser || !currentGroupId) {
      alert("グループを選択してください");
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
      const result = await addUrl(rawUrl, title, category, currentUser.id, imageUrl, currentGroupId);

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

  // グループ一覧ボタンのイベント
  showGroupsBtn.addEventListener("click", async () => {
    closeAllForms();
    groupList.innerHTML = "";
    groupListArea.style.display = "block";
    // Supabaseからグループ一覧を取得
    const { data, error } = await supabase.from("groups").select("*");
    if (error) {
      alert("グループ一覧の取得に失敗しました");
      return;
    }
    if (!data || data.length === 0) {
      groupList.innerHTML = "<li>グループがありません</li>";
      return;
    }
    data.forEach(group => {
      const li = document.createElement("li");
      li.textContent = group.name + " ";
      // 選択ボタン
      const selectBtn = document.createElement("button");
      selectBtn.textContent = "選択";
      selectBtn.onclick = () => {
        setCurrentGroup(group.id, group.name);
        groupListArea.style.display = "none";
      };
      li.appendChild(selectBtn);
      groupList.appendChild(li);
    });
  });

  // グループ一覧閉じるボタン
  if (closeGroupListBtn) {
    closeGroupListBtn.addEventListener("click", () => {
      groupListArea.style.display = "none";
    });
  }

  // グループ選択時
  function setCurrentGroup(groupId, groupName) {
    currentGroupId = groupId;
    currentGroupName = groupName;
    currentGroupLabel.textContent = `グループ: ${groupName}`;
    urlForm.style.display = "none";
    toggleBtn.innerText = "＋ URLを登録";
    loadUrls();
  }

  // グループ未選択時
  function resetGroupSelection() {
    currentGroupId = null;
    currentGroupName = "";
    currentGroupLabel.textContent = "グループ未選択";
    urlForm.style.display = "none";
    urlList.innerHTML = "";
  }

  async function loadUrls() {
    if (!currentUser || !currentGroupId) {
      urlList.innerHTML = "";
      return;
    }
    // group_idで絞り込む
    const { data: urls } = await supabase
      .from("urls")
      .select("*")
      .eq("group_id", currentGroupId);
    urlList.innerHTML = "";
    if (!urls || urls.length === 0) {
      urlList.innerHTML = "<li>このグループにはURLがありません</li>";
      return;
    }
    urls.forEach(({ id, url, title, thumbnail_url }) => {
      const proxyThumbnail = thumbnail_url ? getProxyUrl(thumbnail_url) : "https://placehold.co/80x80";
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
    });
  }

  async function joinGroup(groupId) {
    const { data: exists } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("user_id", currentUser.id);
    if (exists && exists.length > 0) {
      alert("すでに参加しています");
      return;
    }
    const { error } = await supabase.from("group_members").insert([
      { group_id: groupId, user_id: currentUser.id }
    ]);
    if (error) {
      alert("グループ参加に失敗しました");
      console.error(error);
    } else {
      alert("グループに参加しました");
      // ここでグループに関連するデータを再読み込みする処理を追加
    }
  }

  checkAuthState();
});
