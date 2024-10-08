/**c'est ici que va s'écrire la logique front pour les websocket */
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { logout } from "./session.server";
import { useSocket } from "~/hooks/ useSocket";
import { Chatbox } from "~/components/Chatbox";
import { ActionFeedback } from "~/components/FeedbackComponent";
import { getConversation, sendMessage } from "~/server/chat.server";
import { messagesSchema } from "~/server/conversation.schema";
import { requireUser } from "~/server/auth.server";

export type MessagesType = Awaited<
  ReturnType<typeof getConversation>
>["messages"];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUser({ request });

  const conversationId = params.conversationId;

  if (!conversationId) {
    throw await logout({
      request,
    });
  }

  const conversation = await getConversation({
    request,
    conversationId,
  });
  return json({ conversation });
};

const ConversationDetail = () => {
  const { conversation } = useLoaderData<typeof loader>();
  const [messages, setMessages] = useState<MessagesType>(conversation.messages);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit("join-chat-room", conversation.id); //emet un evènement avec un Id, ne répondrons que ceux qui ont cet Id en backend;
    socket.on("send-chat-update", (messagesData) => {
      const updatedMessages = messagesSchema.parse(messagesData);
      setMessages(updatedMessages);
    });
  }, [socket]);
  return (
    <Chatbox
      messages={messages}
      setMessages={setMessages}
      conversation={conversation}
    />
  );
};

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUser({ request });

  const conversationId = params.conversationId;

  if (!conversationId) {
    throw await logout({
      request,
    });
  }
  const formData = await request.formData();
  const content = formData.get("content") ?? null;
  if (!content) {
    return json<ActionFeedback>({
      error: true,
      message: "Votre message ne doit pas être vide.",
    });
  }

  const apiFeedback = await sendMessage({
    request,
    conversationId,
    content: content as string,
  });
  return json<ActionFeedback>(apiFeedback);
};

export default ConversationDetail;
