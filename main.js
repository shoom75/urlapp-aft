import { setupAuthHandlers, checkAuthState } from "./ui/authUI.js";
import { setupGroupHandlers } from "./ui/groupUI.js";
import { setupUrlHandlers } from "./ui/urlUI.js";
import { showLoginSection } from "./ui/sharedUI.js";

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    setupAuthHandlers();
    setupGroupHandlers();
    setupUrlHandlers();
    showLoginSection(); // 追加: 最初にログイン画面を表示
    checkAuthState();
});