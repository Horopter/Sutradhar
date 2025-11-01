// CommonJS server - Using async wrapper to handle Moss SDK ESM
const express = require("express");
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = Number(process.env.PORT || 4050);
const PROJECT_ID = process.env.MOSS_PROJECT_ID;
const PROJECT_KEY = process.env.MOSS_PROJECT_KEY;
const INDEX = process.env.MOSS_INDEX_NAME || "seed";
const IMAGE_INDEX = process.env.MOSS_IMAGE_INDEX_NAME || "images";

if (!PROJECT_ID || !PROJECT_KEY) {
  console.error("MOSS_PROJECT_ID / MOSS_PROJECT_KEY missing");
  process.exit(1);
}

let client;
let MossClient;

// Initialize Moss client asynchronously - use ESM build directly
(async () => {
  try {
    // Import the ESM build directly to avoid CommonJS/ESM conflicts
    const mossPath = require.resolve("@inferedge/moss/dist/index.esm.js");
    const MossModule = await import(mossPath);
    MossClient = MossModule.MossClient || MossModule.default?.MossClient || MossModule.default || MossModule;
    client = new MossClient(PROJECT_ID, PROJECT_KEY);
    console.log("[moss-bridge] Moss client initialized successfully");
  } catch (e) {
    console.error("[moss-bridge] Failed to initialize Moss SDK:", e.message);
    console.error("[moss-bridge] Stack:", e.stack);
    process.exit(1);
  }
})();

app.get("/health", (_req, res) => {
  res.json({ 
    ok: true, 
    index: INDEX, 
    imageIndex: IMAGE_INDEX,
    clientReady: !!client 
  });
});

// ========== Text Indexing Endpoints ==========

app.post("/ensure", async (_req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    await client.createIndex(INDEX, [], "moss-minilm").catch(() => {});
    await client.loadIndex(INDEX);
    res.json({ ok: true, index: INDEX });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post("/index", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    const docs = req.body?.docs || [];
    await client.createIndex(INDEX, docs, "moss-minilm").catch(() => {});
    await client.loadIndex(INDEX);
    res.json({ ok: true, index: INDEX, count: docs.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post("/query", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    const q = String(req.body?.q || "");
    await client.loadIndex(INDEX);
    const out = await client.query(INDEX, q);
    res.json({ ok: true, results: out.docs || [] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// ========== Image Indexing Endpoints ==========

app.post("/images/ensure", async (_req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    // Try to create index, ignore if already exists
    await client.createIndex(IMAGE_INDEX, [], "moss-minilm").catch(() => {});
    // Try to load index, ignore if not found (will be created on first index)
    try {
      await client.loadIndex(IMAGE_INDEX);
    } catch (e) {
      // Index doesn't exist yet, that's OK - it will be created on first index operation
      if (!e.message.includes("not found")) {
        throw e;
      }
    }
    res.json({ ok: true, index: IMAGE_INDEX });
  } catch (e) {
    // If error is about index already existing, that's fine
    if (e.message && e.message.includes("already exists")) {
      res.json({ ok: true, index: IMAGE_INDEX, message: "Index already exists" });
    } else {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  }
});

app.post("/images/index", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    const images = req.body?.images || [];
    
    if (images.length === 0) {
      return res.status(400).json({ ok: false, error: "No images provided" });
    }

    const docs = images.map((img) => {
      const doc = {
        id: img.id || `img-${Date.now()}-${Math.random()}`,
      };

      if (img.image && img.image.startsWith('data:image')) {
        doc.image = img.image;
      } else if (img.image && (img.image.startsWith('http') || img.image.startsWith('https'))) {
        doc.image_url = img.image;
      } else if (img.imageUrl) {
        doc.image_url = img.imageUrl;
      }

      if (img.metadata) {
        if (img.metadata.title) doc.title = img.metadata.title;
        if (img.metadata.description) doc.text = img.metadata.description;
        if (img.metadata.tags && Array.isArray(img.metadata.tags)) {
          doc.tags = img.metadata.tags;
        }
        if (img.metadata.url) doc.url = img.metadata.url;

        Object.keys(img.metadata).forEach(key => {
          if (!['title', 'description', 'tags', 'url'].includes(key)) {
            doc[key] = img.metadata[key];
          }
        });
      }

      return doc;
    });

    // Create index with docs, or add docs to existing index
    try {
      await client.createIndex(IMAGE_INDEX, docs, "moss-minilm");
    } catch (e) {
      // Index might already exist, try to add docs instead
      if (e.message && e.message.includes("already exists")) {
        await client.addDocs(IMAGE_INDEX, docs).catch(() => {});
      }
    }
    // Try to load index if it exists and isn't already loaded
    try {
      await client.loadIndex(IMAGE_INDEX);
    } catch (e) {
      // If index already exists in memory or doesn't exist yet, that's OK
      if (e.message && (e.message.includes("not found") || e.message.includes("already exists"))) {
        // Index either doesn't exist (will be created) or is already in memory
      } else {
        throw e;
      }
    }

    res.json({ 
      ok: true, 
      index: IMAGE_INDEX, 
      count: docs.length,
      indexed: docs.map(d => ({ id: d.id, title: d.title || d.id }))
    });
  } catch (e) {
    console.error("Image indexing error:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.post("/images/query", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    const query = req.body?.query || "";
    const imageQuery = req.body?.image;
    const maxResults = req.body?.maxResults || 10;

    if (!query && !imageQuery) {
      return res.status(400).json({ ok: false, error: "Query or image required" });
    }

    // Try to load index if not already in memory
    try {
      await client.loadIndex(IMAGE_INDEX);
    } catch (e) {
      // If index already exists in memory, that's OK
      if (e.message && !e.message.includes("already exists") && !e.message.includes("not found")) {
        throw e;
      }
    }

    let results;
    if (imageQuery) {
      const searchQuery = query || "image";
      results = await client.query(IMAGE_INDEX, searchQuery);
    } else {
      results = await client.query(IMAGE_INDEX, query);
    }

    const limitedResults = (results.docs || []).slice(0, maxResults);

    res.json({ 
      ok: true, 
      results: limitedResults,
      count: limitedResults.length,
      query: query || "image similarity"
    });
  } catch (e) {
    console.error("Image query error:", e);
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.get("/images/index/:imageId", async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ ok: false, error: "Moss client not initialized yet" });
    }
    const imageId = req.params.imageId;
    // Try to load index if not already in memory
    try {
      await client.loadIndex(IMAGE_INDEX);
    } catch (e) {
      // If index already exists in memory, that's OK
      if (e.message && !e.message.includes("already exists") && !e.message.includes("not found")) {
        throw e;
      }
    }
    
    const results = await client.query(IMAGE_INDEX, imageId);
    const image = (results.docs || []).find((doc) => doc.id === imageId);
    
    if (!image) {
      return res.status(404).json({ ok: false, error: "Image not found" });
    }

    res.json({ ok: true, image });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Start server after a short delay to allow Moss client to initialize
setTimeout(() => {
  app.listen(PORT, () => {
    console.log(`[moss-bridge] listening on ${PORT}`);
    console.log(`[moss-bridge] Text index: ${INDEX}`);
    console.log(`[moss-bridge] Image index: ${IMAGE_INDEX}`);
    console.log(`[moss-bridge] Client ready: ${!!client}`);
  });
}, 1000);
