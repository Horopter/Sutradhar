import { Hyperspell } from "hyperspell";

const TIMEOUT = Number(process.env.RETRIEVAL_TIMEOUT_MS || 2500);

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("retrieval_timeout")), ms)),
  ]);
}

/** -------- Hyperspell -------- */
export function hsClient() {
  const key = process.env.HYPERSPELL_API_KEY;
  if (!key) throw new Error("hs_missing_api_key");
  return new Hyperspell({ apiKey: key });
}

export async function hyperspellSeedText(text: string, collection = "demo") {
  const hs = hsClient();
  // Basic add to vault/collection
  return await hs.memories.add({ text, collection });
}

export async function hyperspellSearch(query: string) {
  const hs = hsClient();
  try {
    const r = await withTimeout(
      hs.memories.search({
        query,
        sources: ["vault"],
        options: { max_results: 5 },
        answer: false,
      })
    );
    const docs = (r as any)?.documents ?? [];
    return docs.map((d: any) => ({
      source: d.source || "hyperspell",
      text: d.text || d.chunk || d.summary || "",
      url: d.url,
    }));
  } catch (e: any) {
    throw new Error("hs_search_failed:" + (e?.message || String(e)));
  }
}

/** -------- Moss Bridge -------- */
const MOSS_BRIDGE = process.env.MOSS_BRIDGE_URL || "http://127.0.0.1:4050";

export async function mossBridgeEnsure() {
  const r = await fetch(`${MOSS_BRIDGE}/ensure`, { method: "POST" });
  if (!r.ok) throw new Error(`moss_bridge_ensure_${r.status}`);
  return r.json();
}

export async function mossBridgeIndex(docs: Array<{ id: string; text: string; source: string }>) {
  const r = await fetch(`${MOSS_BRIDGE}/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ docs })
  });
  if (!r.ok) throw new Error(`moss_bridge_index_${r.status}`);
  return r.json();
}

export async function mossBridgeQuery(q: string) {
  const r = await fetch(`${MOSS_BRIDGE}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q })
  });
  if (!r.ok) throw new Error(`moss_bridge_query_${r.status}`);
  const j = await r.json() as any;
  return (j.results || []).map((r: any) => ({
    source: r.source || "moss",
    text: r.text || r.chunk || ""
  }));
}

/** -------- Moss Image Search -------- */

export interface ImageIndexRequest {
  id?: string;
  image?: string; // base64 data URL or URL
  imageUrl?: string; // Alternative to image
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    url?: string;
    [key: string]: any;
  };
}

export interface ImageSearchResult {
  id: string;
  title?: string;
  description?: string;
  image?: string;
  image_url?: string;
  url?: string;
  tags?: string[];
  score?: number;
  [key: string]: any;
}

/**
 * Ensure image index exists
 */
export async function mossBridgeEnsureImageIndex() {
  const r = await fetch(`${MOSS_BRIDGE}/images/ensure`, { method: "POST" });
  if (!r.ok) throw new Error(`moss_bridge_image_ensure_${r.status}`);
  return r.json();
}

/**
 * Index images for search
 */
export async function mossBridgeIndexImages(images: ImageIndexRequest[]) {
  const r = await fetch(`${MOSS_BRIDGE}/images/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images })
  });
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`moss_bridge_image_index_${r.status}: ${errorText}`);
  }
  return r.json();
}

/**
 * Search images by text query or image similarity
 */
export async function mossBridgeSearchImages(
  query?: string,
  imageQuery?: string,
  maxResults: number = 10
): Promise<ImageSearchResult[]> {
  const body: any = { maxResults };
  if (query) body.query = query;
  if (imageQuery) body.image = imageQuery;

  const r = await fetch(`${MOSS_BRIDGE}/images/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`moss_bridge_image_query_${r.status}: ${errorText}`);
  }
  
  const data: any = await r.json();
  return (data?.results || []) as any[];
}

/**
 * Get a specific indexed image by ID
 */
export async function mossBridgeGetImage(imageId: string): Promise<ImageSearchResult | null> {
  const r = await fetch(`${MOSS_BRIDGE}/images/index/${encodeURIComponent(imageId)}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`moss_bridge_image_get_${r.status}`);
  const data: any = await r.json();
  return data.image || null;
}

export async function hyperspellDiag() {
  const requireHS = String(process.env.RETRIEVAL_REQUIRE_HS || 'false').toLowerCase() === 'true';
  
  try {
    const hs = hsClient();
    const r = await hs.memories.search({
      query: "hello",
      sources: ["vault"],
      options: { max_results: 1 },
      answer: false
    });
    return { ok: true, sample: (r as any)?.documents?.[0]?.text || null };
  } catch (e: any) {
    // If HS is optional and connection fails, mark as skipped
    if (!requireHS) {
      return { 
        ok: false, 
        skipped: true, 
        reason: 'hs_unavailable',
        error: e?.message || String(e) 
      };
    }
    return { ok: false, error: e?.message || String(e) };
  }
}

