"use client";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Divider } from "@heroui/divider";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Navbar, NavbarMenu, NavbarMenuToggle } from "@heroui/navbar";
import { useParams } from "next/navigation";
import { Button } from "@heroui/button";

import ConversationSection from "@/components/conversation-section";
import ConversationItem from "@/components/conversation-item";
import SentMessage from "@/components/sent-message";
import ReceivedMessage from "@/components/recieved-message";
import { CategorizedConversations } from "@/app/[locale]/chat/page";
import { MessageType, UserConversationType } from "@/types/dataTypes";
import { axiosInstance } from "@/utils/axiosInstance";
import Loader from "@/components/loader";

export default function UserDetailsPage() {
  const t = useTranslations("ChatsPage");
  const params = useParams<{ userId: string }>();
  const { userId } = params;

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<CategorizedConversations>({
    today: [],
    last7Days: [],
    older: [],
  });
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [isMessageSentLoading, setIsMessageSentLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchMessages = async () => {
    try {
      if (selectedConversationId) {
        setIsMessagesLoading(true);
        const res = await axiosInstance.get(
          `/chat/admin/messages/${selectedConversationId}`,
        );

        if (res?.data) {
          setMessages(res.data);
          setIsMessagesLoading(false);
          setTimeout(() => {
            scrollToBottom(chatContainerRef);
          }, 100);
        }
      }
    } catch (e) {
      console.log(e);
      setIsMessagesLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setIsConversationsLoading(true);
      const res = await axiosInstance.get<UserConversationType[]>(
        `/chat/admin/${userId}`,
      );

      if (res?.data) {
        arrangeConversations(res?.data);
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  const arrangeConversations = (conversations: UserConversationType[]) => {
    const now = new Date();

    const categorizedConversations: CategorizedConversations = {
      today: [],
      last7Days: [],
      older: [],
    };

    if (conversations.length > 0) {
      conversations.forEach((conversation) => {
        const createdAt = new Date(conversation.createdAt);
        const timeDiff =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // Difference in days

        if (createdAt.toDateString() === now.toDateString()) {
          categorizedConversations.today.push(conversation);
        } else if (timeDiff < 7) {
          categorizedConversations.last7Days.push(conversation);
        } else {
          categorizedConversations.older.push(conversation);
        }
      });
    }

    setConversations(categorizedConversations);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [selectedConversationId]);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      console.log("scrolling to bottom...");
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex gap-2 h-[calc(100vh-64px-48px)] scroll-smooth flex-col md:flex-row md:gap-5">
      <Card
        isBlurred
        className="w-1/4 border-none bg-default/10 dark:bg-white/5 hidden md:flex"
      >
        <CardHeader>
          <div className="flex gap-2 justify-center items-center">
            <CalendarIcon height={20} width={20} />
            <span className={"text-lg font-medium"}>{t("chatHistory")}</span>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex gap-5">
          {conversations?.today?.length > 0 && (
            <ConversationSection title="Today">
              {conversations?.today?.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  selected={selectedConversationId === conversation._id}
                  title={conversation.title}
                  onClick={() => setSelectedConversationId(conversation._id)}
                />
              ))}
            </ConversationSection>
          )}
          {conversations?.last7Days?.length > 0 && (
            <ConversationSection title="Last 7 days">
              {conversations?.last7Days?.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  selected={selectedConversationId === conversation._id}
                  title={conversation.title}
                  onClick={() => setSelectedConversationId(conversation._id)}
                />
              ))}
            </ConversationSection>
          )}
          {conversations?.older?.length > 0 && (
            <ConversationSection title="Older">
              {conversations?.older?.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  selected={selectedConversationId === conversation._id}
                  title={conversation.title}
                  onClick={() => setSelectedConversationId(conversation._id)}
                />
              ))}
            </ConversationSection>
          )}
          {conversations?.today?.length === 0 &&
            conversations?.last7Days?.length === 0 &&
            conversations?.older?.length === 0 && (
              <div className="flex justify-center items-center w-full h-full">
                <span className="text-gray-500">{t("noConversation")}</span>
              </div>
            )}
        </CardBody>
      </Card>
      <div className="flex md:hidden">
        <Navbar
          className="z-0"
          classNames={{ wrapper: "p-0 z-0" }}
          isMenuOpen={isMenuOpen}
          onMenuOpenChange={setIsMenuOpen}
        >
          <NavbarMenuToggle
            className="w-full flex justify-start p-0"
            icon={
              <Card fullWidth>
                <CardHeader>
                  <span className="flex items-center gap-2">
                    <CalendarIcon height={20} width={20} />
                    <span className={"text-lg font-medium"}>
                      {t("chatHistory")}
                    </span>
                  </span>
                </CardHeader>
              </Card>
            }
          />
          <NavbarMenu className="bg-black/25">
            <div className="flex justify-end">
              <Button
                isIconOnly
                className="bg-background"
                onPress={() => setIsMenuOpen(false)}
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            {conversations.today.length > 0 && (
              <ConversationSection title="Today">
                {conversations?.today?.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    selected={selectedConversationId === conversation._id}
                    title={conversation.title}
                    onClick={() => {
                      setSelectedConversationId(conversation._id);
                      setIsMenuOpen(false);
                    }}
                  />
                ))}
              </ConversationSection>
            )}
            {conversations.last7Days.length > 0 && (
              <ConversationSection title="Last 7 days">
                {conversations?.last7Days?.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    selected={selectedConversationId === conversation._id}
                    title={conversation.title}
                    onClick={() => {
                      setSelectedConversationId(conversation._id);
                      setIsMenuOpen(false);
                    }}
                  />
                ))}
              </ConversationSection>
            )}
            {conversations.older.length > 0 && (
              <ConversationSection title="Older">
                {conversations?.older?.map((conversation) => (
                  <ConversationItem
                    key={conversation._id}
                    selected={selectedConversationId === conversation._id}
                    title={conversation.title}
                    onClick={() => {
                      setSelectedConversationId(conversation._id);
                      setIsMenuOpen(false);
                    }}
                  />
                ))}
              </ConversationSection>
            )}
          </NavbarMenu>
        </Navbar>
      </div>
      <Card className="flex w-full md:w-3/4 border-none bg-default/10 dark:bg-white/5">
        <CardHeader>
          <div className="flex gap-2 justify-center items-center">
            <ChatBubbleLeftRightIcon height={20} width={20} />
            <span className={"text-lg font-medium"}>{t("conversation")}</span>
          </div>
        </CardHeader>
        <Divider />
        <div
          ref={chatContainerRef}
          className="p-4 flex flex-col gap-5 h-[calc(100vh-64px-48px-90px)] overflow-y-auto"
        >
          <Loader isLoading={isMessagesLoading} />
          {messages.length > 0 ? (
            messages?.map((message) =>
              message?.sender === "user" ? (
                <SentMessage key={message?._id} text={message?.text} />
              ) : (
                <ReceivedMessage key={message?._id} text={message?.text} />
              ),
            )
          ) : (
            <div className="flex flex-col gap-2 text-center h-full w-full items-center justify-center">
              <ChatBubbleLeftRightIcon
                className="text-gray-400 dark:text-gray-500"
                height={40}
                width={40}
              />
              <span className="text-3xl font-medium text-gray-600 dark:text-gray-300">
                No messages found
              </span>
            </div>
          )}
          {isMessageSentLoading && <ReceivedMessage isLoading text="" />}
        </div>
      </Card>
      <Loader isLoading={isConversationsLoading} />
    </div>
  );
}
