const STORAGE_BUCKET = process.env.SUPABASE_BRANDING_BUCKET?.trim() || "branding";

type SupabaseConfig = {
  url: string;
  key: string;
};

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return {
    url: url.replace(/\/$/, ""),
    key,
  };
}

function encodeStoragePath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildPublicUrl(baseUrl: string, path: string | null): string | null {
  if (!path) {
    return null;
  }
  const encodedPath = encodeStoragePath(path);
  return `${baseUrl.replace(/\/$/, "")}/storage/v1/object/public/${encodeURIComponent(STORAGE_BUCKET)}/${encodedPath}`;
}

function guessExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (MIME_EXTENSION_MAP[normalized]) {
    return MIME_EXTENSION_MAP[normalized]!;
  }
  const subtype = normalized.split("/")[1] ?? "bin";
  if (subtype.includes("+xml")) {
    return subtype.replace("+xml", "");
  }
  if (subtype.includes("+")) {
    return subtype.split("+")[0]!;
  }
  return subtype || "bin";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createObjectPath(type: "logo" | "favicon", extension: string): string {
  const timestamp = Date.now();
  return `${type}s/${type}-${timestamp}-${randomSuffix()}.${extension}`;
}

export async function uploadBrandingAsset(
  type: "logo" | "favicon",
  data: Buffer,
  mimeType: string
): Promise<{ path: string; publicUrl: string }> {
  if (!data.length) {
    throw new Error(`Cannot upload empty ${type} payload.`);
  }

  const config = getSupabaseConfig();
  const extension = guessExtension(mimeType || "application/octet-stream");
  const objectPath = createObjectPath(type, extension);
  const targetUrl = `${config.url}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${encodeStoragePath(
    objectPath
  )}`;

  const payload = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const arrayBuffer = payload as ArrayBuffer;

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.key}`,
      "Content-Type": mimeType || "application/octet-stream",
      "x-upsert": "true",
    },
    body: arrayBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to upload ${type} asset (status ${response.status}): ${errorText || response.statusText}`
    );
  }

  const publicUrl = buildPublicUrl(config.url, objectPath);
  if (!publicUrl) {
    throw new Error("Unable to resolve public URL for branding asset.");
  }

  return { path: objectPath, publicUrl };
}

export async function deleteBrandingAsset(path: string | null | undefined): Promise<void> {
  if (!path) {
    return;
  }

  const config = getSupabaseConfig();
  const targetUrl = `${config.url}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${encodeStoragePath(path)}`;

  const response = await fetch(targetUrl, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${config.key}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to remove branding asset at ${path} (status ${response.status}): ${
        errorText || response.statusText
      }`
    );
  }
}

export function getBrandingAssetPublicUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  const { url } = getSupabaseConfig();
  return buildPublicUrl(url, path);
}

export function isBrandingStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
