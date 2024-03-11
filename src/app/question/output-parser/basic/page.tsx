'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

type Response = {
  tone: string;
  chat_response: string;
  word_count: string;
}

export default function Page() {

  const [question, setQuestion] = useState("")

  const mutate = useMutation({
    mutationFn: () =>
      axios.post<Response>('/api/chat-output-parsers', {
        question: question,
      }, {
        timeout: 30 * 1000,
      }),
    onSuccess: async ({ data }) => {
      console.log(data)
    }
  });

  const onSubmit = async () => {
    mutate.mutate()
  }

  const result = mutate?.data?.data

  return (
    <div>
      <span className="text-lg text-gray-600">
        Output parser basic
      </span>
      <div className="mt-4 flex flex-col gap-4 items-start">
        <Input
          placeholder="What a beautiful day!"
          className=" pr-8"
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button onClick={() => onSubmit()} disabled={mutate.isPending}>Submit</Button>
      </div>
      <div className="mt-4 flex flex-col gap-4 items-start">
        <span className="text-lg text-gray-600">
          Response
        </span>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-gray-600">Tone: {result?.tone}</span>
          <span className="text-sm text-gray-600">Word count: {result?.word_count}</span>
          <span className="text-sm text-gray-600">Chat response: {result?.chat_response} </span>
        </div>
      </div>
    </div>
  );
}
