import { supabase } from "@/integrations/supabase/client";

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25MB
export const MAX_ATTACHMENTS_PER_MESSAGE = 6;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export type AttachmentKind = "image" | "video";

export interface PreparedAttachment {
  file: File;
  kind: AttachmentKind;
  previewUrl: string;
  width?: number;
  height?: number;
  durationMs?: number;
  thumbnailBlob?: Blob;
}

export interface UploadedAttachment {
  id: string;
  kind: AttachmentKind;
  storage_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
}

export function classifyFile(file: File): AttachmentKind | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

/** Compress image to max 1920px JPEG 0.85 (skips small files). */
async function compressImage(file: File): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  if (file.size < 1024 * 1024) {
    const dim = await getImageDimensions(file);
    return { blob: file, width: dim.width, height: dim.height, mime: file.type };
  }
  const bitmap = await createImageBitmap(file);
  const maxSide = 1920;
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)
  );
  return { blob, width: w, height: h, mime: "image/jpeg" };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/** Extract a poster frame at 0.1s from a video file. */
function extractVideoPoster(file: File): Promise<{ blob: Blob; width: number; height: number; durationMs: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.1, video.duration / 2);
    };
    video.onseeked = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(video, 0, 0, w, h);
      canvas.toBlob((b) => {
        URL.revokeObjectURL(url);
        if (b) resolve({ blob: b, width: w, height: h, durationMs: Math.round(video.duration * 1000) });
        else reject(new Error("poster blob null"));
      }, "image/jpeg", 0.8);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video metadata error"));
    };
  });
}

export async function prepareAttachment(file: File): Promise<PreparedAttachment | null> {
  const kind = classifyFile(file);
  if (!kind) return null;
  if (file.size > MAX_ATTACHMENT_BYTES) return null;

  const previewUrl = URL.createObjectURL(file);
  if (kind === "image") {
    try {
      const dim = await getImageDimensions(file);
      return { file, kind, previewUrl, width: dim.width, height: dim.height };
    } catch {
      return { file, kind, previewUrl };
    }
  } else {
    try {
      const poster = await extractVideoPoster(file);
      return {
        file,
        kind,
        previewUrl,
        width: poster.width,
        height: poster.height,
        durationMs: poster.durationMs,
        thumbnailBlob: poster.blob,
      };
    } catch {
      return { file, kind, previewUrl };
    }
  }
}

function randomId() {
  return crypto.randomUUID();
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("quicktime")) return "mov";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "mp4";
  return "jpg";
}

export async function uploadAttachment(
  conversationId: string,
  prepared: PreparedAttachment,
  onProgress?: (pct: number) => void
): Promise<UploadedAttachment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let blob: Blob;
  let width: number | undefined = prepared.width;
  let height: number | undefined = prepared.height;
  let mime = prepared.file.type;

  if (prepared.kind === "image") {
    const c = await compressImage(prepared.file);
    blob = c.blob;
    width = c.width;
    height = c.height;
    mime = c.mime;
  } else {
    blob = prepared.file;
  }

  const id = randomId();
  const ext = extFromMime(mime);
  const path = `${conversationId}/${id}.${ext}`;

  onProgress?.(10);
  const { error: upErr } = await supabase.storage
    .from("chat-media")
    .upload(path, blob, { contentType: mime, upsert: false });
  if (upErr) {
    console.error("chat-media upload failed", upErr);
    return null;
  }
  onProgress?.(70);

  let thumbPath: string | null = null;
  if (prepared.kind === "video" && prepared.thumbnailBlob) {
    thumbPath = `${conversationId}/${id}_thumb.jpg`;
    const { error: thumbErr } = await supabase.storage
      .from("chat-media")
      .upload(thumbPath, prepared.thumbnailBlob, { contentType: "image/jpeg", upsert: false });
    if (thumbErr) {
      console.warn("thumb upload failed", thumbErr);
      thumbPath = null;
    }
  }
  onProgress?.(85);

  const { data: row, error: insErr } = await supabase
    .from("message_attachments")
    .insert({
      conversation_id: conversationId,
      uploader_id: user.id,
      kind: prepared.kind,
      storage_path: path,
      thumbnail_path: thumbPath,
      mime_type: mime,
      size_bytes: blob.size,
      width: width ?? null,
      height: height ?? null,
      duration_ms: prepared.durationMs ?? null,
    })
    .select("*")
    .single();

  if (insErr || !row) {
    console.error("attachment insert failed", insErr);
    return null;
  }
  onProgress?.(100);

  return {
    id: row.id,
    kind: row.kind as AttachmentKind,
    storage_path: row.storage_path,
    thumbnail_path: row.thumbnail_path,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    width: row.width,
    height: row.height,
    duration_ms: row.duration_ms,
  };
}

/** Get a signed URL for a storage path inside chat-media. */
export async function getSignedChatMedia(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from("chat-media").createSignedUrl(path, expiresIn);
  if (error) {
    console.warn("signed url error", error);
    return null;
  }
  return data.signedUrl;
}

export interface AttachmentRow {
  id: string;
  message_id: string | null;
  conversation_id: string;
  uploader_id: string;
  kind: AttachmentKind;
  storage_path: string;
  thumbnail_path: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  hidden_by_admin: boolean;
  created_at: string;
}

export async function fetchConversationAttachments(conversationId: string): Promise<AttachmentRow[]> {
  const { data, error } = await supabase
    .from("message_attachments")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("hidden_by_admin", false)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetch attachments error", error);
    return [];
  }
  return (data || []) as AttachmentRow[];
}

export async function attachToMessage(messageId: string, attachmentIds: string[]): Promise<void> {
  if (!attachmentIds.length) return;
  await supabase
    .from("message_attachments")
    .update({ message_id: messageId })
    .in("id", attachmentIds);
}

export async function reportMessage(opts: {
  messageId?: string;
  attachmentId?: string;
  conversationId?: string;
  reportedUserId?: string;
  category?: string;
  reason?: string;
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("message_reports").insert({
    message_id: opts.messageId ?? null,
    attachment_id: opts.attachmentId ?? null,
    conversation_id: opts.conversationId ?? null,
    reported_user_id: opts.reportedUserId ?? null,
    category: opts.category ?? "other",
    reporter_id: user.id,
    reason: opts.reason ?? null,
  });
  if (error) console.error("report error", error);
  return !error;
}

export async function blockUser(blockedId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_blocks")
    .insert({ blocker_id: user.id, blocked_id: blockedId });
  if (error && error.code !== "23505") {
    console.error("block error", error);
    return false;
  }
  return true;
}

export async function unblockUser(blockedId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);
  if (error) {
    console.error("unblock error", error);
    return false;
  }
  return true;
}

export async function isUserBlocked(otherId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", user.id)
    .eq("blocked_id", otherId)
    .maybeSingle();
  return !!data;
}