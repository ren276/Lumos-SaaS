/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";
import { generateEmbedding, batchSummariseCode, batchGenerateEmbeddings } from "./gemini";
import { db } from "~/server/db";

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    accessToken: githubToken || "",
    branch: "main",
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  const docs = await loader.load();
  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGithubRepo(githubUrl, githubToken);
  const allEmbeddings = await generateEmbeddings(docs);
  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`processing ${index} of ${allEmbeddings.length}`);
      if (!embedding) return;

      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          project:{
            connect: {
              id: projectId,
            },
          }
        },
      });

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${embedding.embedding}::vector
        WHERE "id" = ${sourceCodeEmbedding.id} 
        `;
    }),
  );
};

const generateEmbeddings = async (docs: Document[]) => {
  const summaries = await batchSummariseCode(docs); // Use the batched function
  const embeddings = await batchGenerateEmbeddings(summaries.filter(Boolean) as string[]);

  return docs.map((doc, index) => ({
    summary: summaries[index],
    embedding: embeddings[summaries[index] ? index : -1],
    sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
    fileName: doc.metadata.source,
    index,
  }));
};
