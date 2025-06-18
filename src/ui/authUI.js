import { handleLogin, handleSignUp, logout } from "../utils/auth.js";
import { supabase } from "../utils/supabaseClient.js";
import { showAppSection, showLoginSection, resetGroupSelection, showLoginForm, showSignUpForm } from "./sharedUI.js";

export function setupAuthHandlers() {
    const loginForm = document.getElementById("loginFormElement");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const signUpForm = document.getElementById("signUpFormElement");
    const signUpEmail = document.getElementById("signUpEmail");
    const signUpPassword = document.getElementById("signUpPassword");
    const showSignUpLink = document.getElementById("showSignUpLink");
    const showLoginLink = document.getElementById("showLoginLink");
    const authMessage = document.getElementById("authMessage");
    const logoutBtn = document.getElementById("logoutBtn");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        const success = await handleLogin(email, password, authMessage);
        if (success) {
            const { data } = await supabase.auth.getUser();
            window.currentUser = data.user;
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
        showSignUpForm(); // ← sharedUI.js からimportすることで解決
    });
    showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginForm(); // ← sharedUI.js からimportすることで解決
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await logout();
            window.currentUser = null;
            resetGroupSelection();
            showLoginSection();
        });
    }
}

export async function checkAuthState() {
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
        window.currentUser = data.session.user;
        showAppSection();
        resetGroupSelection();
    } else {
        window.currentUser = null;
        showLoginSection();
    }
}

// ...showLoginForm, showSignUpForm などは sharedUI.js へ...