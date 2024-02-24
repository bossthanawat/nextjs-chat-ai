import { Document } from "langchain/document";
import { NextRequest, NextResponse } from "next/server";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import DefaultRetrievalText from "@/lib/DefaultRetrievalText";
import { ValueChat } from "@/components/Chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages as ValueChat[];

    //Chat Models
    const chat = new ChatOpenAI({
      modelName: "gpt-3.5-turbo-1106",
      temperature: 0.6,
    });
    // const chat = new ChatGoogleGenerativeAI({
    //   apiKey: process.env.GOOGLE_API_KEY,
    //   modelName: "gemini-pro",
    //   maxOutputTokens: 2048,
    // });

    //Prompt Templates
    const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a helpful assistant. Answer all questions to the best of your ability based on the below context:{context}",
      ],
      new MessagesPlaceholder("messages"),
    ]);


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
    const docs = [new Document({ pageContent: DefaultRetrievalText })];

    const documentChain = await createStuffDocumentsChain({
      llm: chat,
      prompt: questionAnsweringPrompt,
    });

    const responseMessage = await documentChain.invoke({
      messages: await ephemeralChatMessageHistory.getMessages(),
      context: docs,
    });

    return NextResponse.json({
      content: responseMessage,
    });
  } catch (e) {
    console.log("err", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
