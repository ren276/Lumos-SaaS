import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Document } from "@langchain/core/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export const aiSummariseCommit = async (diff: string) => {
  const response = await model.generateContent([
    `You are an expert programmer, and you are trying to summarize a git diff.

Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
 diff --git a/lib/index.js b/lib/index.js
 index aadf691..bfef603 100644
 ---a/lib/index.js
 +++b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starting with \`-\` means that line was deleted.
A line that starts with neither \`+\' nor \`-\` is code given for context and better understanding.
It is not port of the diff.

[...]

EXAMPLE SUMMARY COMMENTS:
\`\`\`

* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this examples list
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.`,
    `Please summarise the following diff file: \n\n${diff}`,
  ]);

  return response.response.text();
};

export async function batchSummariseCode(docs: Document[]) {
  console.log("Getting summaries for", docs.length, "documents");
  const summaries: (string | null)[] = new Array(docs.length).fill(null);
  
  // Process in smaller batches to avoid API limits
  const batchSize = 5;
  
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(docs.length/batchSize)}`);
    
    await Promise.all(batch.map(async (doc, batchIndex) => {
      const index = i + batchIndex;
      
      try {
        const code = doc.pageContent.slice(0, 10000);
        const prompt = `You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.

You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file

Here is the code:
---
${code}
---

Give a summary no more than 100 words of the code above.`;

        const response = await model.generateContent(prompt);
        const summary = response.response.text().trim();
        
        if (summary && summary.length > 10) {
          summaries[index] = summary;
          console.log(`✅ Summary generated for ${doc.metadata.source}`);
        } else {
          console.warn(`⚠️ Empty or invalid summary for: ${doc.metadata.source}`);
          // Add a fallback summary
          summaries[index] = `This is the ${doc.metadata.source} file.`;
        }
      } catch (err) {
        console.error(`Error summarizing document ${doc.metadata.source}:`, err);
        // Add a fallback summary
        summaries[index] = `This is the ${doc.metadata.source} file.`;
      }
    }));
    
    // Add a small delay between batches to avoid rate limits
    if (i + batchSize < docs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("Summary generation complete. Generated:", summaries.filter(Boolean).length, "of", docs.length);
  return summaries;
}


export async function batchGenerateEmbedding(summaries: string[]) {
  try {
    // Create the embedding model
    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });
    
    const results = await Promise.all(
      summaries.map(async (summary) => {
        if (!summary) return null;
        try {
          const result = await embeddingModel.embedContent(summary);
          return result.embedding.values;
        } catch (err) {
          console.warn(`Error embedding summary: ${err}`);
          return null;
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error("Error generating embeddings for multiple summaries:", error);
    return summaries.map(() => null);
  }
}
