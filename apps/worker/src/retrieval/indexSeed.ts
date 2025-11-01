import { localIndexBuild } from "./localIndex";

export async function indexSeedLocal() {
  // BM25 is in-memory; building from data_repository/**/*.md is enough
  return await localIndexBuild();
}

// Legacy alias for compatibility
export async function indexSeed() {
  return await indexSeedLocal();
}

