import fs from "fs";
import path from "path";

type Document = { id: string; text: string; source: string };
type IndexStatus = { indexed: boolean; docCount: number };

let index: Map<string, number> = new Map(); // term -> docId -> tf
let documents: Document[] = [];
let docFreq: Map<string, Set<string>> = new Map(); // term -> set of docIds
let avgDocLength = 0;
let isIndexed = false;

function getDataRepositoryDir() {
  // Try multiple possible locations
  const options = [
    path.join(process.cwd(), "../data_repository"),
    path.join(process.cwd(), "../../data_repository"),
    path.join(process.cwd(), "data_repository"),
    path.join(__dirname, "../../../data_repository"),
    path.join(__dirname, "../../../../data_repository"),
  ];
  
  for (const dataRepoDir of options) {
    if (fs.existsSync(dataRepoDir)) {
      return dataRepoDir;
    }
  }
  
  // Fallback to repo root
  return path.join(process.cwd(), "../data_repository");
}

function getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllMarkdownFiles(filePath, fileList);
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function splitIntoChunks(text: string): string[] {
  const parts = text.split(/\n(?=##? )/g).filter(Boolean);
  if (parts.length >= 1) return parts;
  // fallback: split by ~500 chars
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 500) chunks.push(text.slice(i, i + 500));
  return chunks;
}

export function localIndexBuild(): { ok: boolean; docCount: number } {
  const dataRepoDir = getDataRepositoryDir();
  const filePaths = getAllMarkdownFiles(dataRepoDir);

  documents = [];
  index = new Map();
  docFreq = new Map();

  for (const filePath of filePaths) {
    const raw = fs.readFileSync(filePath, "utf8");
    const chunks = splitIntoChunks(raw);
    const relativePath = path.relative(dataRepoDir, filePath);
    chunks.forEach((c, i) => {
      const docId = `${relativePath}-${i}`;
      documents.push({ id: docId, text: c.trim(), source: relativePath });
    });
  }

  // Build inverted index with term frequencies
  const docLengths: number[] = [];
  documents.forEach((doc) => {
    const tokens = tokenize(doc.text);
    docLengths.push(tokens.length);
    const termFreq = new Map<string, number>();

    tokens.forEach((term) => {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);
    });

    termFreq.forEach((tf, term) => {
      const key = `${term}:${doc.id}`;
      index.set(key, tf);
      if (!docFreq.has(term)) docFreq.set(term, new Set());
      docFreq.get(term)!.add(doc.id);
    });
  });

  avgDocLength = docLengths.reduce((a, b) => a + b, 0) / (docLengths.length || 1);
  isIndexed = true;

  return { ok: true, docCount: documents.length };
}

export function localIndexQuery(q: string, k = 5): Array<{ source: string; text: string; score?: number }> {
  if (!isIndexed || documents.length === 0) {
    localIndexBuild();
  }

  const queryTerms = tokenize(q);
  const scores = new Map<string, number>(); // docId -> score

  const N = documents.length;
  const k1 = 1.5;
  const b = 0.75;

  queryTerms.forEach((term) => {
    const df = docFreq.get(term)?.size || 0;
    if (df === 0) return;

    const idf = Math.log((N - df + 0.5) / (df + 0.5));

    docFreq.get(term)!.forEach((docId) => {
      const key = `${term}:${docId}`;
      const tf = index.get(key) || 0;
      const doc = documents.find((d) => d.id === docId);
      if (!doc) return;

      const docLength = tokenize(doc.text).length;
      const norm = (k1 * (1 - b + b * (docLength / avgDocLength)));
      const score = idf * (tf / (tf + norm));

      scores.set(docId, (scores.get(docId) || 0) + score);
    });
  });

  const ranked = Array.from(scores.entries())
    .map(([docId, score]) => {
      const doc = documents.find((d) => d.id === docId);
      return doc ? { ...doc, score } : null;
    })
    .filter((d): d is Document & { score: number } => d !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((d) => ({
      source: d.source,
      text: d.text.substring(0, 200), // truncate long chunks
      score: d.score
    }));

  return ranked;
}

export function localIndexStatus(): IndexStatus {
  return {
    indexed: isIndexed,
    docCount: documents.length
  };
}

