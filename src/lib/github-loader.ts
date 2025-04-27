/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import type { Document } from "@langchain/core/documents";
import { batchSummariseCode, batchGenerateEmbedding } from "./gemini";
import { db } from "~/server/db";
import { Octokit } from "octokit";
import path from "path";

const getFileCount = async (
  path: string,
  octokit: Octokit,
  githubOwner: string,
  githubRepo: string,
  acc: number = 0,
) => {
  const { data } = await octokit.rest.repos.getContent({
    owner: githubOwner,
    repo: githubRepo,
    path,
  });
  if (!Array.isArray(data) && data.type === "file") {
    return acc + 1;
  }
  if (Array.isArray(data)) {
    let fileCount = 0;
    const directories: string[] = [];

    for (const item of data) {
      if (item.type === "dir") {
        directories.push(item.path);
      } else {
        fileCount += 1;
      }
    }

    if (directories.length > 0) {
      const directoryCounts = await Promise.all(
        directories.map((dirPath) =>
          getFileCount(dirPath, octokit, githubOwner, githubRepo, 0),
        ),
      );
      fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
    }
    return acc + fileCount;
  }
  return acc;
};

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
  const octokit = new Octokit({ auth: githubToken });
  const githubOwner = githubUrl.split("/")[3];
  const githubRepo = githubUrl.split("/")[4];
  if (!githubOwner || !githubRepo) {
    return 0;
  }
  const fileCount = await getFileCount("", octokit, githubOwner, githubRepo, 0);
  return fileCount;
};

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
      console.log(
        `processing ${index} - Summary: ${embedding.summary ? "YES" : "NO"}`,
      );
      if (!embedding) return;

      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary || "No summary available",
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          project: {
            connect: { id: projectId },
          },
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
  const summaries = await batchSummariseCode(docs);

  // Only generate embeddings for valid summaries
  const validSummaries = summaries.filter(Boolean) as string[];
  const embeddings = await batchGenerateEmbedding(validSummaries);

  // Map back to original documents
  return docs.map((doc, index) => {
    const summary = summaries[index];
    const embedding = summary
      ? embeddings[validSummaries.indexOf(summary)]
      : null;

    return {
      summary: summary || `This is the ${doc.metadata.source} file.`,
      embedding: embedding,
      sourceCode: doc.pageContent,
      fileName: doc.metadata.source,
      index,
    };
  });
};
