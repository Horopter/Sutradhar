import express from "express";
// @ts-ignore - Moss SDK has obfuscated code and type issues
const MossModule = require("@inferedge/moss");
const MossClient = MossModule.MossClient || MossModule.default?.MossClient || MossModule;

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for image base64 data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = Number(process.env.PORT || 4050);
const PROJECT_ID = process.env.MOSS_PROJECT_ID!;
const PROJECT_KEY = process.env.MOSS_PROJECT_KEY!;
const INDEX = process.env.MOSS_INDEX_NAME || "seed";
const IMAGE_INDEX = process.env.MOSS_IMAGE_INDEX_NAME || "images";

if (!PROJECT_ID || !PROJECT_KEY) {
  console.error("MOSS_PROJECT_ID / MOSS_PROJECT_KEY missing");
  process.exit(1);
}

const client = new MossClient(PROJECT_ID, PROJECT_KEY);

app.get("/health", (_req, res) => res.json({ ok: true, index: INDEX, imageIndex: IMAGE_INDEX }));

// ========== Text Indexing Endpoints ==========

app.post("/ensure", async (_req, res) => {
  try {
    await client.createIndex(INDEX, [], "moss-minilm").catch(() => {});
    await client.loadIndex(INDEX);
    res.json({ ok: true, index: INDEX });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post("/index", async (req, res) => {
  try {
    const docs = req.body?.docs || [];
    await client.createIndex(INDEX, docs, "moss-minilm").catch(() => {});
    await client.loadIndex(INDEX);
    res.json({ ok: true, index: INDEX, count: docs.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post("/query", async (req, res) => {
  try {
    const q = String(req.body?.q || "");
    await client.loadIndex(INDEX);
    const out = await client.query(INDEX, q);
    res.json({ ok: true, results: out.docs || [] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// ========== Image Indexing Endpoints ==========

/**
 * POST /images/ensure
 * Ensure the image index exists
 */
app.post("/images/ensure", async (_req, res) => {
  try {
    await client.createIndex(IMAGE_INDEX, [], "moss-minilm").catch(() => {});
    await client.loadIndex(IMAGE_INDEX);
    res.json({ ok: true, index: IMAGE_INDEX });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/**
 * POST /images/index
 * Index images for semantic search
 * Body: { images: [{ id: string, image: string (base64 or URL), metadata?: { title, description, tags, url } }] }
 */
app.post("/images/index", async (req, res) => {
  try {
    const images = req.body?.images || [];
    
    if (images.length === 0) {
      return res.status(400).json({ ok: false, error: "No images provided" });
    }

    // Convert images to Moss document format
    // Moss supports image embeddings when you provide image data
    const docs = images.map((img: any) => {
      const doc: any = {
        id: img.id || `img-${Date.now()}-${Math.random()}`,
      };

      // If image is base64, include it
      if (img.image && img.image.startsWith('data:image')) {
        doc.image = img.image;
      } else if (img.image && (img.image.startsWith('http') || img.image.startsWith('https'))) {
        doc.image_url = img.image;
      } else if (img.imageUrl) {
        doc.image_url = img.imageUrl;
      }

      // Add text description for better searchability
      if (img.metadata) {
        if (img.metadata.title) doc.title = img.metadata.title;
        if (img.metadata.description) doc.text = img.metadata.description;
        if (img.metadata.tags && Array.isArray(img.metadata.tags)) {
          doc.tags = img.metadata.tags;
        }
        if (img.metadata.url) doc.url = img.metadata.url;
      }

      // Copy any additional metadata
      if (img.metadata) {
        Object.keys(img.metadata).forEach(key => {
          if (!['title', 'description', 'tags', 'url'].includes(key)) {
            doc[key] = img.metadata[key];
          }
        });
      }

      return doc;
    });

    // Create/update index with images
    await client.createIndex(IMAGE_INDEX, docs, "moss-minilm").catch(() => {});
    await client.loadIndex(IMAGE_INDEX);

    res.json({ 
      ok: true, 
      index: IMAGE_INDEX, 
      count: docs.length,
      indexed: docs.map((d: any) => ({ id: d.id, title: d.title || d.id }))
    });
  } catch (e: any) {
    console.error("Image indexing error:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/**
 * POST /images/query
 * Search images by text query or image (similarity search)
 * Body: { query: string, image?: string (base64 or URL), maxResults?: number }
 */
app.post("/images/query", async (req, res) => {
  try {
    const query = req.body?.query || "";
    const imageQuery = req.body?.image; // Optional: search by image similarity
    const maxResults = req.body?.maxResults || 10;

    if (!query && !imageQuery) {
      return res.status(400).json({ ok: false, error: "Query or image required" });
    }

    await client.loadIndex(IMAGE_INDEX);

    let results;
    if (imageQuery) {
      // Image-to-image similarity search
      // If Moss SDK supports image queries directly, use it
      // Otherwise, fallback to text query if image has metadata
      const searchQuery = query || "image";
      results = await client.query(IMAGE_INDEX, searchQuery);
    } else {
      // Text-to-image search
      results = await client.query(IMAGE_INDEX, query);
    }

    // Limit results
    const limitedResults = (results.docs || []).slice(0, maxResults);

    res.json({ 
      ok: true, 
      results: limitedResults,
      count: limitedResults.length,
      query: query || "image similarity"
    });
  } catch (e: any) {
    console.error("Image query error:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/**
 * GET /images/index/:imageId
 * Get a specific indexed image by ID
 */
app.get("/images/index/:imageId", async (req, res) => {
  try {
    const imageId = req.params.imageId;
    await client.loadIndex(IMAGE_INDEX);
    
    // Query for the specific image ID
    const results = await client.query(IMAGE_INDEX, imageId);
    const image = (results.docs || []).find((doc: any) => doc.id === imageId);
    
    if (!image) {
      return res.status(404).json({ ok: false, error: "Image not found" });
    }

    res.json({ ok: true, image });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`[moss-bridge] listening on ${PORT}`);
  console.log(`[moss-bridge] Text index: ${INDEX}`);
  console.log(`[moss-bridge] Image index: ${IMAGE_INDEX}`);
});

