import { supabase } from "./supabaseClient.js";

/**
 * URLとサムネイルURLを Supabase に保存する（グループID対応）
 */
export async function addUrl(url, title, category, userId, imageUrl, groupId) {
    const { data, error } = await supabase
        .from("urls")
        .insert([
            { url, title, category, user_id: userId, thumbnail_url: imageUrl, group_id: groupId },
        ]);
    if (error) {
        console.error("Supabase insert error:", error);
        return { success: false, error };
    }
    return { success: true, data };
}

/**
 * Supabase の "urls" テーブルからデータを取得する関数（グループIDで絞り込み可能）
 */
export async function fetchUrls(groupId) {
    let query = supabase
        .from("urls")
        .select("id, url, title, category, user_id, thumbnail_url, visited, created_at, group_id")
        .order("created_at", { ascending: false });

    if (groupId) {
        query = query.eq("group_id", groupId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase fetch error:", error);
        return [];
    }
    return data;
}

/**
 * 指定されたIDのURLを Supabase から削除する
 */
export async function deleteUrl(id) {
    const { data, error } = await supabase
        .from("urls")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Supabase delete error:", error);
        return { success: false, error };
    }
    return { success: true, data };
}
