import { supabase } from "../utils/supabaseClient.js";
import { closeAllForms, setCurrentGroup, resetGroupSelection } from "./sharedUI.js";

export function setupGroupHandlers() {
    const groupebtn = document.getElementById("groupebtn");
    const groupMenu = document.getElementById("groupMenu");
    const createbtn = document.getElementById("createbtn");
    const createform = document.getElementById("createform");
    const groupenameForm = document.getElementById("groupename");
    const createInput = document.getElementById("create");
    const groupListArea = document.getElementById("groupListArea");
    const groupList = document.getElementById("groupList");
    const showGroupsBtn = document.getElementById("showGroupsBtn");
    const showInviteBtn = document.getElementById("showInviteBtn");
    const closeGroupListBtn = document.getElementById("closeGroupListBtn");
    const closeGroupMenuBtn = document.getElementById("closeGroupMenuBtn");

    // 追加: グループ参加用
    const joinbtn = document.getElementById("joinbtn");
    const joinform = document.getElementById("joinform");
    const joinGroupForm = document.getElementById("joinGroupForm");
    const joinGroupInput = document.getElementById("joinGroupInput");

    // 招待コード関連
    const inviteCodeArea = document.getElementById("inviteCodeArea");
    const inviteCodeLabel = document.getElementById("inviteCodeLabel");
    const copyInviteCodeBtn = document.getElementById("copyInviteCodeBtn");

    // メニュー内のボタンをまとめて取得
    const menuButtons = [
        showGroupsBtn,
        createbtn,
        joinbtn,
        showInviteBtn
    ];

    // フォーム表示時に他ボタンを非表示
    function setMenuButtonsVisible(visible) {
        menuButtons.forEach(btn => {
            if (btn) btn.style.display = visible ? "" : "none";
        });
    }

    // closeAllFormsを拡張
    const origCloseAllForms = closeAllForms;
    function closeAllFormsWithRestore() {
        origCloseAllForms();
        restoreMenuButtons();
    }

    // フォーム送信後やcloseAllForms時にもボタンを再表示
    function restoreMenuButtons() {
        setMenuButtonsVisible(true);
    }

    groupebtn.addEventListener("click", () => {
        const check = groupMenu.style.display === "none";
        groupMenu.style.display = check ? "flex" : "none";
        if (check) closeAllFormsWithRestore();
    });

    createbtn.addEventListener("click", () => {
        const check = createform.style.display === "none";
        closeAllForms();
        if (check) {
            createform.style.display = "block";
            setMenuButtonsVisible(false);
            createbtn.style.display = ""; // 自分だけは残す
        } else {
            createform.style.display = "none";
            setMenuButtonsVisible(true);
        }
    });

    // 追加: グループに参加ボタン
    joinbtn.addEventListener("click", () => {
        const check = joinform.style.display === "none";
        closeAllForms();
        if (check) {
            joinform.style.display = "block";
            setMenuButtonsVisible(false);
            joinbtn.style.display = ""; // 自分だけは残す
        } else {
            joinform.style.display = "none";
            setMenuButtonsVisible(true);
        }
    });

    // 追加: グループに参加フォーム送信（招待コードのみで参加）
    joinGroupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const code = joinGroupInput.value.trim();
        if (!code) {
            alert("招待コードを入力してください");
            return;
        }
        // 招待コードでグループを検索
        const { data: group, error } = await supabase
            .from("groups")
            .select("*")
            .eq("invite_code", code)
            .single();
        if (error || !group) {
            alert("グループが見つかりません");
            return;
        }
        // すでにメンバーか確認
        const { data: member } = await supabase
            .from("group_members")
            .select("*")
            .eq("group_id", group.id)
            .eq("user_id", window.currentUser.id)
            .single();
        if (member) {
            alert("すでにこのグループに参加しています");
            joinform.style.display = "none";
            joinGroupInput.value = "";
            return;
        }
        // 参加処理
        const { error: joinError } = await supabase
            .from("group_members")
            .insert([{ group_id: group.id, user_id: window.currentUser.id }]);
        if (joinError) {
            alert("グループ参加に失敗しました");
            return;
        }
        alert("グループに参加しました");
        joinform.style.display = "none";
        joinGroupInput.value = "";
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
            .insert([{ name: groupName, created_by: window.currentUser.id }])
            .select()
            .single();
        if (error) {
            alert("グループ作成に失敗しました");
            return;
        }
        await supabase.from("group_members").insert([
            { group_id: data.id, user_id: window.currentUser.id }
        ]);
        alert("グループを作成しました");
        createInput.value = "";
        createform.style.display = "none";
        restoreMenuButtons();
    });

    showGroupsBtn.addEventListener("click", async () => {
        closeAllForms();
        groupList.innerHTML = "";
        groupListArea.style.display = "block";
        const { data, error } = await supabase
            .from("groups")
            .select("*, group_members!inner(user_id)")
            .eq("group_members.user_id", window.currentUser.id);
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

    if (closeGroupListBtn) {
        closeGroupListBtn.addEventListener("click", () => {
            groupListArea.style.display = "none";
        });
    }

    // メニュー閉じるボタン（右上のみ）
    if (closeGroupMenuBtn) {
        closeGroupMenuBtn.addEventListener("click", () => {
            groupMenu.style.display = "none";
            restoreMenuButtons();
        });
    }

    // 招待コード表示ボタン
    if (showInviteBtn) {
        showInviteBtn.addEventListener("click", async () => {
            closeAllForms();
            if (!window.currentGroupId) {
                alert("グループを選択してください");
                return;
            }
            // グループ情報取得
            const { data: group, error } = await supabase
                .from("groups")
                .select("id, invite_code")
                .eq("id", window.currentGroupId)
                .single();
            if (error || !group) {
                alert("グループ情報の取得に失敗しました");
                return;
            }
            // 招待コードがなければ生成
            let inviteCode = group.invite_code;
            if (!inviteCode) {
                inviteCode = generateInviteCode();
                await supabase
                    .from("groups")
                    .update({ invite_code: inviteCode })
                    .eq("id", window.currentGroupId);
            }
            inviteCodeLabel.textContent = inviteCode;
            inviteCodeArea.style.display = "block";
        });
    }

    // 招待コードコピー
    if (copyInviteCodeBtn) {
        copyInviteCodeBtn.addEventListener("click", () => {
            const code = inviteCodeLabel.textContent;
            if (code) {
                navigator.clipboard.writeText(code);
                alert("コピーしました");
            }
        });
    }

    // 招待コード生成関数
    function generateInviteCode() {
        return Math.random().toString(36).slice(-8);
    }
}