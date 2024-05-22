import { NextRequest, NextResponse } from "next/server";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import {
  StructuredOutputParser,
} from "langchain/output_parsers";
import { RunnableSequence } from "langchain/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const question = body.question as string;

    const chat = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY_MANUAL,
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

    const parser = StructuredOutputParser.fromNamesAndDescriptions({
      tone: "The overall tone of the input better be positive or negative",
      word_count: "The number of words in the input",
      chat_response: "A response to the human's input",
    });

    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(
        "Answer the users question as best as possible.\n{format_instructions}\n{question}"
      ),
      chat,
      parser,
    ]);

    const result = await chain.invoke({
      question: question,
      format_instructions: parser.getFormatInstructions(),
    });

    return NextResponse.json(result);
  } catch (e) {
    console.log("err", e);
    return NextResponse.json({ error: e }, { status: 500 });
  }
}
