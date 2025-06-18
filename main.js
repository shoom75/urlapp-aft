import { setupAuthHandlers, checkAuthState } from "./src/ui/authUI.js";
import { setupGroupHandlers } from "./src/ui/groupUI.js";
import { setupUrlHandlers } from "./src/ui/urlUI.js";
import { showLoginSection } from "./src/ui/sharedUI.js";

console.log("✅ main.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    setupAuthHandlers();
    setupGroupHandlers();
    setupUrlHandlers();
    showLoginSection(); // 追加: 最初にログイン画面を表示
    checkAuthState();
});