'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Chat, { UnitType, ValueChat, ValueForm } from '@/app/Chat';


const ChatSection = () => {

  const [chats, setChats] = useState<ValueChat[]>([]);
  const [disabled, setDisabled] = useState(false)

  const onSubmit = async (data: ValueForm) => {
    if (data.message === '') return;
    setDisabled(true)
    try {
      const humanMessage = {
        content: data.message,
        role: "human" as UnitType,
      };
      setChats((prev) =>
        [...prev,
          humanMessage,
        {
          content: '',
          role: "ai" as UnitType,
          isLoading: true
        }]
      );
      const response = await fetch("/api/chat-stream", {
        method: "post",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...chats, humanMessage] }),
      });
      if (!response.ok || !response.body) {
        throw response.statusText;
      }

      // Here we start prepping for the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const loopRunner = true;
      let text = ''

      while (loopRunner) {
        // Here we start reading the stream, until its done.
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const decodedChunk = decoder.decode(value, { stream: true });
        text = text + decodedChunk;
        setChats((prev) => {
          const items = prev.slice(0, prev.length - 1);
          return [...items, {
            content: text,
            role: "ai" as UnitType,
            isLoading: false
          }]
        });
      }
    } catch (e) {
      console.error(e);
      setChats((prev) => {
        const items = prev.slice(0, prev.length - 1);
        return [...items, {
          content: 'Something went wrong :(',
          role: "ai" as UnitType,
          isLoading: false
        }]
      });
    }
    setDisabled(false);
  }

  return (
    <>
      <Chat chats={chats} onSubmit={onSubmit} disabledType={disabled} />
    </>)

};

export default ChatSection;
