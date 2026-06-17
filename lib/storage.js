"use client";

// Uploads a video file to the "showcase" Supabase Storage bucket and returns
// { url, path }. The bucket must exist and be public (see SETUP).

export async function uploadVideo(supabase, userId, file) {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("showcase")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("showcase").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export const MAX_VIDEO_MB = 50;

export async function uploadPhoto(supabase, userId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `photos/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("showcase").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("showcase").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export const MAX_PHOTO_MB = 8;

export async function uploadAvatar(supabase, userId, file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `avatars/${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("showcase").upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("showcase").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
