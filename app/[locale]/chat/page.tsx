"use client";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ShareIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Divider } from "@heroui/divider";
import { Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Navbar, NavbarMenu, NavbarMenuToggle } from "@heroui/navbar";
import { useDisclosure } from "@heroui/modal";
import clsx from "clsx";
import { button as buttonStyles } from "@heroui/theme";
import { Alert } from "@heroui/alert";

import ConversationSection from "@/components/conversation-section";
import ConversationItem from "@/components/conversation-item";
import SentMessage from "@/components/sent-message";
import ReceivedMessage from "@/components/recieved-message";
import { axiosInstance } from "@/utils/axiosInstance";
import { MessageType, UserConversationType } from "@/types/dataTypes";
import Loader from "@/components/loader";
import ShareModal from "@/components/share-with-friend-modal";
import { Link } from "@/i18n/routing";

export interface CategorizedConversations {
  today: UserConversationType[];
  last7Days: UserConversationType[];
  older: UserConversationType[];
}

export default function ChatPage() {
  const t = useTranslations("ChatsPage");
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [newConversationError, setNewConversationError] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    isOpen: isShareOpen,
    onOpen: onShareOpen,
    onOpenChange: onShareOpenChange,
    onClose: onShareClose,
  } = useDisclosure();

  const [conversations, setConversations] = useState<CategorizedConversations>({
    today: [],
    last7Days: [],
    older: [],
  });
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([
    {
      _id: "initial_message",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      text: t("initialMessage"),
      conversationId: "",
      sender: "bot",
    },
  ]);
  const [messageText, setMessageText] = useState<string>("");
  const [isMessageSentLoading, setIsMessageSentLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);

  // --- streaming bits ---
  const streamAbortRef = useRef<AbortController | null>(null);
  const [streaming, setStreaming] = useState(false);
  // track the bot placeholder currently receiving deltas
  const currentBotIdRef = useRef<string | null>(null);

  /** Minimal SSE reader for fetch() POST streams */
  async function readSSE(
    response: Response,
    handlers: {
      onDelta?: (delta: string) => void;
      onDone?: (payload: any) => void;
      onError?: (payload: any) => void;
      onFinally?: () => void;
    }
  ) {
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          let eventName = "message";
          let dataLine = "";
          for (const line of raw.split("\n")) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (eventName === "delta" && handlers.onDelta) {
            try {
              handlers.onDelta(JSON.parse(dataLine));
            } catch {
              handlers.onDelta(dataLine);
            }
          } else if (eventName === "done" && handlers.onDone) {
            try {
              handlers.onDone(JSON.parse(dataLine));
            } catch {
              handlers.onDone(dataLine);
            }
          } else if ((eventName === "error" || eventName === "response.failed") && handlers.onError) {
            try {
              handlers.onError(JSON.parse(dataLine));
            } catch {
              handlers.onError(dataLine);
            }
          }
        }
      }
    } finally {
      handlers.onFinally?.();
    }
  }

  function appendChunk(targetId: string, chunk: string) {
    setMessages((prev) =>
      prev.map((m) => (m._id === targetId ? { ...m, text: (m.text || "") + chunk } : m))
    );
  }

  const sendMessage = async () => {
    if (messageText.trim().length === 0 || streaming) return;
    
    try {
      setStreaming(true);
      setIsMessageSentLoading(true);

      // Ensure we have a conversation
      let convoId = selectedConversationId;
      let isNewConversation = false;
      
      // If no conversation selected, create one first
      if (!convoId) {
        console.log("Creating new conversation...");
        isNewConversation = true;
        
        const newConversation = await axiosInstance.post("/chat/conversation", {
          title: messageText.trim(),
        });
        
        convoId = newConversation?.data?.conversationId || null;
        
        if (!convoId) {
          throw new Error("Failed to create conversation");
        }
        console.log("New conversation ID:", convoId);
        
        // Add to conversations list
        const newConversations = { ...conversations };
        newConversations.today.unshift({
          ...newConversation?.data,
          _id: convoId
        });
        setConversations(newConversations);
        setSelectedConversationId(convoId);
        
        // Reset messages for the new conversation with initial bot message
        setMessages([
          {
            _id: "initial_message",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            text: t("initialMessage"),
            conversationId: convoId,
            sender: "bot",
          },
        ]);
        
        console.log("Created new conversation", convoId);
      }
      // if (!convoId) {
      //   console.log("Creating new conversation...");

      // const userTempId = `user_${Date.now()}`;
      // const userDummy: MessageType = {
      //   _id: userTempId,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      //   text: messageText,
      //   conversationId: convoId || "",
      //   sender: "user",
      // };
      // setMessages((prev) => [...prev, userDummy]);

      //   const newConversation = await axiosInstance.post("/chat/conversation", {
      //     title: messageText,
      //   });

      //   convoId = newConversation?.data?.conversationId || null;

      //   const newConversations = { ...conversations };
      //   newConversations.today.push(newConversation?.data);
      //   setConversations(newConversations);
      //   setSelectedConversationId(convoId);
      //   console.log("Created new conversation", convoId);

      //   // 1) Add user's message (temp)
      


      // // 2) Add empty bot placeholder
      // const botTempId = `bot_${Date.now()}`;
      // const botDummy: MessageType = {
      //   _id: botTempId,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      //   text: "",
      //   conversationId: convoId || "",
      //   sender: "bot",
      // };

      // currentBotIdRef.current = botTempId; // mark the streaming bubble

      // setMessageText("");
      // setMessages((prev) => [...prev, botDummy]);
      // setTimeout(() => scrollToBottom(chatContainerRef), 50);

      // // 3) Start streaming from backend
      // const controller = new AbortController();
      // streamAbortRef.current = controller;

      // const apiUrl = axiosInstance.defaults.baseURL
      //   ? `${axiosInstance.defaults.baseURL.replace(/\/$/, "")}/chat/message`
      //   : "/chat/message"; // same-origin fallback

      // const resp = await fetch(apiUrl, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Accept: "text/event-stream",
      //   },
      //   body: JSON.stringify({ conversationId: convoId, text: userDummy.text }),
      //   signal: controller.signal,
      //   credentials: "include", // important for req.session
      // });

      // // If server sent a JSON error instead of SSE
      // const contentType = resp.headers.get("content-type") || "";
      // if (!resp.ok && !contentType.includes("text/event-stream")) {
      //   const errJson = await resp.json().catch(() => ({}));
      //   if (errJson?.message === "Daily message limit reached") {
      //     setLimitReached(true);
      //   } else {
      //     setLimitReached(false);
      //   }
      //   throw new Error(errJson?.message || "Failed to start stream");
      // }

      // await readSSE(resp, {
      //   onDelta: (delta) => {
      //     appendChunk(botTempId, String(delta));
      //     // auto-scroll when near bottom
      //     if (chatContainerRef.current) {
      //       const el = chatContainerRef.current;
      //       const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      //       if (nearBottom) setTimeout(() => scrollToBottom(chatContainerRef), 30);
      //     }
      //   },
      //   onDone: (info) => {
      //     const { userMessageId, botMessageId, attemptsLeft } = info || {};
      //     // swap temp IDs with DB IDs
      //     setMessages((prev) =>
      //       prev.map((m) => {
      //         if (m._id === userTempId && userMessageId) return { ...m, _id: userMessageId };
      //         if (m._id === botTempId && botMessageId) return { ...m, _id: botMessageId };
      //         return m;
      //       })
      //     );
      //     if (typeof attemptsLeft === "number") {
      //       setLimitReached(attemptsLeft <= 0);
      //     }
      //   },
      //   onError: (payload) => {
      //     console.error("SSE error:", payload);
      //     setMessages((prev) =>
      //       prev.map((m) =>
      //         m._id === botTempId
      //           ? { ...m, text: (m.text || "") + "\n\n[Error while streaming]" }
      //           : m
      //       )
      //     );
      //   },
      //   onFinally: () => {
      //     setIsMessageSentLoading(false);
      //     setStreaming(false);
      //     streamAbortRef.current = null;
      //     currentBotIdRef.current = null; // clear the streaming marker
      //     setTimeout(() => scrollToBottom(chatContainerRef), 50);
      //   },
      // });
      // }

      // 1) Add user's message (temp)
      const userTempId = `user_${Date.now()}`;
      const userDummy: MessageType = {
        _id: userTempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: messageText,
        conversationId: convoId || "",
        sender: "user",
      };

      // 2) Add empty bot placeholder
      const botTempId = `bot_${Date.now()}`;
      const botDummy: MessageType = {
        _id: botTempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: "",
        conversationId: convoId || "",
        sender: "bot",
      };

      currentBotIdRef.current = botTempId; // mark the streaming bubble

      setMessageText("");
      
      // Add user message and bot placeholder
      setMessages((prev) => [...prev, userDummy, botDummy]);
      
      setTimeout(() => scrollToBottom(chatContainerRef), 50);

      // 3) Start streaming from backend
      const controller = new AbortController();
      streamAbortRef.current = controller;

      const apiUrl = axiosInstance.defaults.baseURL
        ? `${axiosInstance.defaults.baseURL.replace(/\/$/, "")}/chat/message`
        : "/chat/message"; // same-origin fallback

      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ conversationId: convoId, text: userDummy.text }),
        signal: controller.signal,
        credentials: "include", // important for req.session
      });

      // If server sent a JSON error instead of SSE
      const contentType = resp.headers.get("content-type") || "";
      if (!resp.ok && !contentType.includes("text/event-stream")) {
        const errJson = await resp.json().catch(() => ({}));
        if (errJson?.message === "Daily message limit reached") {
          setLimitReached(true);
        } else {
          setLimitReached(false);
        }
        throw new Error(errJson?.message || "Failed to start stream");
      }

      await readSSE(resp, {
        onDelta: (delta) => {
          appendChunk(botTempId, String(delta));
          // auto-scroll when near bottom
          if (chatContainerRef.current) {
            const el = chatContainerRef.current;
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
            if (nearBottom) setTimeout(() => scrollToBottom(chatContainerRef), 30);
          }
        },
        onDone: (info) => {
          const { userMessageId, botMessageId, attemptsLeft } = info || {};
          // swap temp IDs with DB IDs
          setMessages((prev) =>
            prev.map((m) => {
              if (m._id === userTempId && userMessageId) return { ...m, _id: userMessageId };
              if (m._id === botTempId && botMessageId) return { ...m, _id: botMessageId };
              return m;
            })
          );
          if (typeof attemptsLeft === "number") {
            setLimitReached(attemptsLeft <= 0);
          }
        },
        onError: (payload) => {
          console.error("SSE error:", payload);
          setMessages((prev) =>
            prev.map((m) =>
              m._id === botTempId
                ? { ...m, text: (m.text || "") + "\n\n[Error while streaming]" }
                : m
            )
          );
        },
        onFinally: () => {
          setIsMessageSentLoading(false);
          setStreaming(false);
          streamAbortRef.current = null;
          currentBotIdRef.current = null; // clear the streaming marker
          setTimeout(() => scrollToBottom(chatContainerRef), 50);
        },
      });
    } catch (e: any) {
      console.error(e);
      setIsMessageSentLoading(false);
      setStreaming(false);
      streamAbortRef.current = null;
      currentBotIdRef.current = null;
    }
  };

  /////////////////
  const fetchMessages = async () => {
    try {
      if (selectedConversationId) {
        setIsMessagesLoading(true);
        const res = await axiosInstance.get(`/chat/messages/${selectedConversationId}`);

        if (res?.data) {
          setMessages([
            {
              _id: "initial_message",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              text: t("initialMessage"),
              conversationId: "",
              sender: "bot",
            },
            ...res.data,
          ]);
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

// Example Usage:
// Output: "693b232314ace67f876911ba"
  const fetchConversations = async () => {
    try {
      setIsConversationsLoading(true);
      const res = await axiosInstance.get<UserConversationType[]>("/chat/conversations");

      if (res?.data) {
        const categorized = arrangeConversationsReturn(res?.data);
        console.log("res data:", res?.data);
        setConversations(categorized);
        const conversationsData = res?.data; 
      
        const lastConvoId = conversationsData.length > 0 ? conversationsData[conversationsData.length - 1]._id : null;
        // --- FIX ENDS HERE ---

        if (lastConvoId) {
          console.log("Fetching more starting from:", lastConvoId);
          setSelectedConversationId(lastConvoId);
        } else {
          console.log("No ID found");
        }

        // console.log("Fetched conversations:", res.data);
        // Don't auto-select any conversation - let user choose
      }
    } catch (e) {
      console.error("Error fetching conversations:", e);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  // Returns categorized conversations instead of setting state
  const arrangeConversationsReturn = (conversations: UserConversationType[]) => {
    const now = new Date();
    const categorizedConversations: CategorizedConversations = {
      today: [],
      last7Days: [],
      older: [],
    };
    conversations.forEach((conversation) => {
      const createdAt = new Date(conversation.createdAt);
      const timeDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (createdAt.toDateString() === now.toDateString()) {
        categorizedConversations.today.push(conversation);
      } else if (timeDiff < 7) {
        categorizedConversations.last7Days.push(conversation);
      } else {
        categorizedConversations.older.push(conversation);
      }
    });
    // Sort each bucket by createdAt descending (latest first)
    (['today', 'last7Days', 'older'] as const).forEach((bucket) => {
      categorizedConversations[bucket] = categorizedConversations[bucket].sort(
        (a: UserConversationType, b: UserConversationType) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    return categorizedConversations;
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (deletingConversationId) return;
    try {
      setDeletingConversationId(conversationId);
      await axiosInstance.delete(`/chat/conversation/${conversationId}`);

      setConversations((prev) => ({
        today: prev.today.filter((c) => c._id !== conversationId),
        last7Days: prev.last7Days.filter((c) => c._id !== conversationId),
        older: prev.older.filter((c) => c._id !== conversationId),
      }));

      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
        setMessages([
          {
            _id: "initial_message",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            text: t("initialMessage"),
            conversationId: "",
            sender: "bot",
          },
        ]);
      }
    } catch (e) {
      console.error("Error deleting conversation", e);
    } finally {
      setDeletingConversationId(null);
    }
  };

  // For modal: create conversation with title only
  const handleSaveNewConversation = async () => {
    if (!newConversationTitle.trim()) {
      setNewConversationError(t("projectTitleRequired") || "Project title is required.");
      return;
    }
    setNewConversationError("");
    try {
      const res = await axiosInstance.post("/chat/conversation", {
        title: newConversationTitle.trim(),
      });
      if (res?.data) {
        // Use conversationId from backend response
        setConversations((prev) => ({
          ...prev,
          today: [{
            ...res.data,
            _id: res.data.conversationId // ensure _id is set for frontend usage
          }, ...prev.today],
        }));
        setSelectedConversationId(res.data.conversationId);
        setMessages([
          {
            _id: "initial_message",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            text: t("initialMessage"),
            conversationId: res.data.conversationId,
            sender: "bot",
          },
        ]);
        console.log("convvid :", res.data.conversationId);
      }
      setShowNewConversationModal(false);
      setNewConversationTitle("");
    } catch (e) {
      setNewConversationError(t("errorCreatingConversation") || "Error creating conversation.");
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Show modal if no conversations on initial load
  useEffect(() => {
    if (
      !isConversationsLoading &&
      conversations.today.length === 0 &&
      conversations.last7Days.length === 0 &&
      conversations.older.length === 0
    ) {
      setShowNewConversationModal(true);
    } else {
      setShowNewConversationModal(false);
    }
  }, [isConversationsLoading, conversations.today.length, conversations.last7Days.length, conversations.older.length]);

  useEffect(() => {
    fetchMessages();
  }, [selectedConversationId]);

  // abort pending stream on unmount
  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-[calc(100vh-64px-48px)] scroll-smooth md:gap-5">
      <Card
        isBlurred
        className="w-full col-span-1 border-none bg-default/10 dark:bg-white/5 hidden md:flex"
      >
        <CardHeader>
          <div className="flex gap-2 justify-center items-center">
            <CalendarIcon height={20} width={20} />
            <span className={"text-lg font-medium"}>{t("chatHistory")}</span>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="flex gap-5">
          <div className="w-full flex">
            <Card
              fullWidth
              isHoverable
              isPressable
              className="border dark:border-default/50"
              radius="sm"
              shadow="sm"
              onPress={() => setShowNewConversationModal(true)}
            >
              <CardBody>
                <div className="text-sm font-medium flex gap-2">
                  <PlusIcon height={20} width={20} />
                  {t("startNewConversation")}
                </div>
              </CardBody>
            </Card>
          </div>
          {conversations.today.length > 0 && (
            <ConversationSection title="Today">
              {conversations?.today?.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  selected={selectedConversationId === conversation._id}
                  title={conversation.title}
                  onDelete={() => handleDeleteConversation(conversation._id)}
                  isDeleting={deletingConversationId === conversation._id}
                  onClick={() => setSelectedConversationId(conversation._id)}
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
                  onDelete={() => handleDeleteConversation(conversation._id)}
                  isDeleting={deletingConversationId === conversation._id}
                  onClick={() => setSelectedConversationId(conversation._id)}
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
                  onDelete={() => handleDeleteConversation(conversation._id)}
                  isDeleting={deletingConversationId === conversation._id}
                  onClick={() => setSelectedConversationId(conversation._id)}
                />
              ))}
            </ConversationSection>
          )}
        </CardBody>
      </Card>

      <div className="flex col-span-2 w-full md:hidden">
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
                    <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className={"sm:text-lg font-medium"}>{t("chatHistory")}</span>
                  </span>
                </CardHeader>
              </Card>
            }
          />
          <NavbarMenu className="bg-black/25">
            <div className="flex justify-between items-stretch">
              <Card
                isHoverable
                isPressable
                className="border dark:border-default/50 overflow-visible"
                radius="sm"
                shadow="sm"
                onPress={() => setShowNewConversationModal(true)}
              >
                <CardBody>
                  <span className="text-sm font-medium flex gap-2">
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {t("startNewConversation")}
                  </span>
                </CardBody>
              </Card>
              <Button isIconOnly className="bg-background" onPress={() => setIsMenuOpen(false)}>
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
                    onDelete={() => handleDeleteConversation(conversation._id)}
                    isDeleting={deletingConversationId === conversation._id}
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
                    onDelete={() => handleDeleteConversation(conversation._id)}
                    isDeleting={deletingConversationId === conversation._id}
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
                    onDelete={() => handleDeleteConversation(conversation._id)}
                    isDeleting={deletingConversationId === conversation._id}
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

  <Card className="flex w/full col-span-2 border-none bg-default/10 dark:bg-white/5 relative">
        {/* New Conversation Modal (now in Conversation area) */}
        {showNewConversationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Enter the Conversation title</h2>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-2"
                placeholder="Title example: my first project"
                value={newConversationTitle}
                onChange={e => { setNewConversationTitle(e.target.value); setNewConversationError(""); }}
                autoFocus
              />
              {newConversationError && (
                <div className="text-red-500 text-sm mb-2">{newConversationError}</div>
              )}
              <div className="flex gap-2 justify-end">
                {/* Only show Cancel button if there is any chat history */}
                {(conversations.today.length > 0 || conversations.last7Days.length > 0 || conversations.older.length > 0) && (
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => { setShowNewConversationModal(false); setNewConversationTitle(""); setNewConversationError(""); }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-lime-500 text-white rounded hover:bg-lime-600 transition duration-200 ease-in-out"
                  onClick={handleSaveNewConversation}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        <CardHeader>
          <div className="flex gap-2 justify-center items-center">
            <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className={"sm:text-lg font-medium"}>{t("conversation")}</span>
          </div>
        </CardHeader>
        <Divider />
        <div
          ref={chatContainerRef}
          className="p-4 flex flex-col gap-5 h-[calc(100vh-64px-48px-120px)] overflow-y-auto"
        >
          <Loader isLoading={isMessagesLoading} />
          {messages.length > 0
            ? messages.map((message) =>
                message.sender === "user" ? (
                  <SentMessage key={message._id} text={message.text} />
                ) : (
                  <ReceivedMessage
                    key={message._id}
                    text={message.text}
                    // skeleton while streaming & this is the active bot bubble & it's still empty
                    isLoading={
                      streaming &&
                      currentBotIdRef.current === message._id &&
                      (message.text ?? "") === ""
                    }
                  />
                )
              )
            : null}
        </div>
        <Divider />
        <CardFooter>
          <div className="flex gap-4 w-full">
            {limitReached ? (
              <Alert className="text-left" color="warning" title="Daily limit reached" variant="faded" />
            ) : (
              <>
                <Textarea
                  isClearable
                  maxRows={3}
                  minRows={1}
                  placeholder="Type your message here"
                  value={messageText}
                  variant="bordered"
                  onChange={(e) => setMessageText(e.target.value)}
                  onClear={() => setMessageText("")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  isIconOnly
                  className="text-black dark:text-black bg-lime-500 hover:bg-lime-600 transition duration-200 ease-in-out"
                  radius="full"
                  onPress={sendMessage}
                >
                  <PaperAirplaneIcon height={20} width={20} />
                </Button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>

      <div className="hidden flex-col gap-4 w-full lg:flex">
        <Card className="flex w-full h-[35%] border dark:border-gray-700 bg-default/10 dark:bg-white/5">
          <CardHeader className="py-2">
            <div className="flex items-center justify-center gap-2">
              <ShareIcon height={16} width={16} />
              <span className="text-base font-semibold">{t("refer.title")}</span>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="py-2">
            <div className="flex flex-col gap-2 justify-between h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {t("refer.description")}
              </p>
              <Button
                className="text-black dark:text-black bg-lime-500 hover:bg-lime-600 transition duration-200 ease-in-out"
                radius="full"
                size="sm"
                onPress={onShareOpen}
              >
                {t("refer.button")}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="flex w-full h-[32.5%] border-none bg-default/10 dark:bg-white/5">
          <CardHeader className="py-2">
            <div className="flex gap-2 justify-center items-center">
              <EnvelopeIcon height={16} width={16} />
              <span className={"text-base font-medium"}>{t("feedback.title")}</span>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="py-2">
            <div className="flex flex-col gap-2 justify-between h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                {t("feedback.description")}
              </p>
              <Link
                className={clsx(
                  buttonStyles({ size: "sm", radius: "full" }),
                  "text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
                )}
                href="mailto:info@vaccifi.co?subject=Response%20Feedback"
              >
                {t("feedback.button")}
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card className="flex w-full h-[32.5%]  border-none bg-default/10 dark:bg-white/5">
          <CardHeader className="py-2">
            <div className="flex gap-2 justify-center items-center">
              <SparklesIcon height={16} width={16} />
              <span className={"text-base font-medium"}>{t("enhancements.title")}</span>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="py-2">
            <div className="flex flex-col gap-2 justify-between h-full">
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {t("enhancements.description")}
              </p>
              <Link
                className={clsx(
                  buttonStyles({ size: "sm", radius: "full" }),
                  "text-black dark:text-black bg-lime-500 shadow-lime-500/50 hover:bg-lime-600 transition duration-200 ease-in-out"
                )}
                href="mailto:info@vaccifi.co?subject=Site%20Enhancments"
              >
                {t("enhancements.button")}
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>

      <Loader isLoading={isConversationsLoading} />
      <ShareModal isOpen={isShareOpen} onClose={onShareClose} onOpenChange={onShareOpenChange} />
    </div>
  );
}
