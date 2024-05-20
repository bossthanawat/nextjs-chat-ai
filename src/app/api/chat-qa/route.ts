import { Document } from "langchain/document";
import { NextRequest, NextResponse } from "next/server";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import DefaultRetrievalText from "@/lib/DefaultRetrievalText";
import { ValueChat } from "@/app/Chat";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

import { GitbookLoader } from "langchain/document_loaders/web/gitbook";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";

import type { BaseMessage } from "@langchain/core/messages";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { writeFile } from "fs";
import { allSplits } from "./allSplits";
import { pull } from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages as ValueChat[];

    //Chat Models
    const chat = new ChatOpenAI({
      modelName: "gpt-3.5-turbo-1106",
      temperature: 0.4,
    });
    // const chat = new ChatGoogleGenerativeAI({
    //   apiKey: process.env.GOOGLE_API_KEY,
    //   modelName: "gemini-pro",
    //   maxOutputTokens: 2048,
    //   temperature: 0.1,
    //   safetySettings: [
    //     {
    //       category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    //       threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    //     },
    //   ],
    // });

    // Chat History
    const ephemeralChatMessageHistory = new ChatMessageHistory();
    for (const message of messages) {
      if (message.role === "human") {
        await ephemeralChatMessageHistory.addMessage(
          new HumanMessage(message.content)
        );
      }
      if (message.role === "ai") {
        await ephemeralChatMessageHistory.addMessage(
          new AIMessage(message.content)
        );
      }
    }

    // Retrievers
    // const docs = [new Document({ pageContent: DefaultRetrievalText })];
    // const loader = new GitbookLoader(
    //   "https://easyrice-1.gitbook.io/easy-rice-m0",
    //   {
    //     shouldLoadAllPaths: true,
    //   }
    // );
    // const rawDocs = await loader.load();
    // const textSplitter = new RecursiveCharacterTextSplitter({
    //   chunkSize: 500,
    //   chunkOverlap: 0,
    // });

    // const allSplits = await textSplitter.splitDocuments(rawDocs);
    // await writeFile(
    //   "allSplits.json",
    //   JSON.stringify(allSplits, null, 2),
    //   {},
    //   (data) => {console.log("data", data)}
    // );

    const vectorstore = await MemoryVectorStore.fromDocuments(
      allSplits,
      new OpenAIEmbeddings()
    );
    // You are a helpful assistant. Only answer that relevant to context or answer AI gave earlier. Respond using markdown.
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Context:{context}. ",
      ],
      new MessagesPlaceholder("messages"),
    ]);

    const retriever = vectorstore.asRetriever(4);

    const parseRetrieverInput = (params: { messages: BaseMessage[] }) => {
      return params.messages[params.messages.length - 1].content;
    };

    const documentChain = await createStuffDocumentsChain({
      llm: chat,
      prompt: questionAnsweringPrompt,
      outputParser: new StringOutputParser(),
    });

    const retrievalChain = RunnablePassthrough.assign({
      context: RunnableSequence.from([parseRetrieverInput, retriever]),
    }).assign({
      answer: documentChain,
    });

    const responseMessage = await retrievalChain.invoke({
      messages: await ephemeralChatMessageHistory.getMessages(),
    });

    return NextResponse.json({
      content: responseMessage?.answer,
    });

  } catch (e: any) {
    console.log("err", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
