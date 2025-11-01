import fs from "fs";
import path from "path";
import { hyperspellSearch } from "./clients";
import { localIndexBuild, localIndexQuery } from "./localIndex";

type Snippet = { source: string; text: string; url?: string };

const MOCK = String(process.env.MOCK_RETRIEVAL || "true").toLowerCase() === "true";

// Data repository directory is at repo root
// Server runs from apps/worker, so data_repository is at ../data_repository from cwd
// Fallback to checking if data_repository exists in cwd or going up one level
function getDataRepositoryDir() {
  let dataRepoDir = path.join(process.cwd(), "../data_repository");
  if (!fs.existsSync(dataRepoDir)) {
    dataRepoDir = path.join(process.cwd(), "data_repository");
  }
  return dataRepoDir;
}

function getAllMarkdownFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  
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

function fromLocal(question: string, k = 2): Snippet[] {
  const dataRepoDir = getDataRepositoryDir();
  const filePaths = getAllMarkdownFiles(dataRepoDir);
  const q = question.toLowerCase();
  const hits: Snippet[] = [];

  for (const filePath of filePaths) {
    const text = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(dataRepoDir, filePath);
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      if (t.toLowerCase().includes(q)) hits.push({ source: relativePath, text: t });
    }
  }

  if (hits.length === 0) {
    return [
      { source: "FAQ.md", text: "Business plan includes unlimited videos with 1080p exports and SSO." },
      { source: "Runbooks.md", text: "Upload 500 on >2GB via web: suggest Desktop app or split file; escalate if Business." },
    ];
  }

  return hits.slice(0, k);
}

export async function getContext(question: string, k = 2): Promise<Snippet[]> {
  if (MOCK) return fromLocal(question, k);

  const merged: Snippet[] = [];

  // 1. Try Hyperspell
  try {
    const hs = await hyperspellSearch(question);
    for (const r of hs) merged.push({ source: r.source || "hyperspell", text: r.text, url: r.url });
  } catch (e) {
    // fine to fail silently; Hyperspell returns an errors array when sources fail.
  }

  // 2. Try BM25 local index
  try {
    await localIndexBuild(); // idempotent
    const bm25 = localIndexQuery(question, k);
    for (const r of bm25) merged.push({ source: r.source || "local", text: r.text });
  } catch (e) {
    // fine to fail silently
  }

  // 3. Fallback to file-scan if we have results
  if (merged.length) return merged.slice(0, k);
  
  // 4. File-scan fallback
  return fromLocal(question, k);
}

