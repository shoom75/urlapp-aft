// import { supabase } from './supabaseClient.js';

// export async function handleLogin(email, password, messageEl) {
//   messageEl.textContent = "";
//   if (!email || !password) {
//     messageEl.textContent = "メールアドレスとパスワードを入力してください";
//     messageEl.style.color = "red";
//     return false;
//   }
// /
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });

//   if (error) {
//     messageEl.textContent = "ログインに失敗しました: " + error.message;
//     messageEl.style.color = "red";
//     return false;
//   }

//   messageEl.textContent = "";
//   return true;
// }

// export async function handleSignUp(email, password, messageEl, onSuccess) {
//   messageEl.textContent = "";
//   if (!email || !password) {
//     messageEl.textContent = "メールアドレスとパスワードを入力してください";
//     messageEl.style.color = "red";
//     return false;
//   }

//   const { data, error } = await supabase.auth.signUp({ email, password });

//   if (error) {
//     if (error.message.includes("already registered") || error.message.includes("User already registered")) {
//       messageEl.textContent = "このメールアドレスはすでに登録されています";
//     } else {
//       messageEl.textContent = "登録に失敗しました: " + error.message;
//     }
//     messageEl.style.color = "red";
//     return false;
//   }

//   messageEl.style.color = "green";
//   messageEl.textContent = "登録成功！確認メールをご確認ください。";
//   if (onSuccess) onSuccess();
//   return true;
// }

// export async function logout() {
//   await supabase.auth.signOut();
// }
// export async function checkAuthState() {
//   const { data } = await supabase.auth.getSession();
//   if (data.session && data.session.user) {
//     window.currentUser = data.session.user;
//     return true;
//   } else {
//     window.currentUser = null;
//     return false;
//   }
// }
