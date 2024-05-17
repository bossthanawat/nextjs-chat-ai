'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Chat, { UnitType, ValueChat, ValueForm } from '@/app/Chat';

const ChatSection = () => {
  const mutateGPT = useMutation({
    mutationFn: ({ messages }: { messages: any }) =>
      axios.post('/api/chat-pdf', {
        messages: messages,
      }, {
        timeout: 30 * 1000,
      }),
  });

  const [chats, setChats] = useState<ValueChat[]>([]);

  const onSubmit = async (data: ValueForm) => {
    if (data.message === '') return;
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
        isLoading: true,
      }]
    );

    mutateGPT.mutate(
      { messages: [...chats, humanMessage] },
      {
        onSuccess: async ({ data }) => {
          setChats((prev) => {
            const items = prev.slice(0, prev.length - 1);
            return [...items, {
              content: data.content,
              role: "ai" as UnitType,
              isLoading: false,
            }]
          });
        },
        onError: (error) => {
          setChats((prev) => {
            const items = prev.slice(0, prev.length - 1);
            return [...items, {
              content: 'Something went wrong :(',
              role: "ai" as UnitType,
              isLoading: false,
            }]
          });
        },
      }
    );
  };

  return (
    <>
      <Chat chats={chats} onSubmit={onSubmit} disabledType={mutateGPT.isPending}/>
    </>)

};

export default ChatSection;
