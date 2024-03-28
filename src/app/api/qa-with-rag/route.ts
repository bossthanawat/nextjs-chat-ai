import { NextRequest, NextResponse } from "next/server";
import "cheerio";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough, RunnableSequence } from "langchain/runnables";
import { formatDocumentsAsString } from "langchain/util/document";

export async function GET(request: NextRequest) {
  try {
    const llm = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: "gemini-pro",
      maxOutputTokens: 2048,
      temperature: 0,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
    });

    const loader = new CheerioWebBaseLoader(
      "https://lilianweng.github.io/posts/2023-06-23-agent/"
    );
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);
    const vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings()
    );

    // Retrieve and generate using the relevant snippets of the blog.
    const retriever = vectorStore.asRetriever();
    const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

    // ------------------------------------------------------------

    // const ragChain = await createStuffDocumentsChain({
    //   llm: llm,
    //   prompt: prompt,
    //   outputParser: new StringOutputParser(),
    // });

    // const retrievedDocs = await retriever.getRelevantDocuments(
    //   "what is task decomposition"
    // );

    // const result = await ragChain.invoke({
    //   question: "What is task decomposition?",
    //   context: retrievedDocs,
    // });

    // ------------------------------------------------------------

    const declarativeRagChain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    const result = await declarativeRagChain.invoke(
      "What is task decomposition?"
    );

    // ------------------------------------------------------------

    return NextResponse.json(result);
  } catch (e) {
    console.log("err", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
