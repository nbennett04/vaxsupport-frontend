"use client"

import {Button} from "@heroui/button"
import React, {useRef, useState, useEffect, useContext, Fragment} from "react"
import {Card, CardBody, CardFooter, CardHeader} from "@heroui/card"
import {Dialog, Transition} from "@headlessui/react"
import {XMarkIcon} from "@heroicons/react/24/outline"
import {Divider} from "@heroui/divider"
import {Textarea} from "@heroui/input"
import {PaperAirplaneIcon} from "@heroicons/react/24/solid"
import {PhotoIcon} from "@heroicons/react/24/solid"
import ReceivedMessage from "@/components/recieved-message"
import Loader from "@/components/loader"
import SentMessage from "@/components/sent-message"
import {axiosInstance} from "@/utils/axiosInstance"
import {MessageType} from "@/types/dataTypes"
import VoiceInput from "@/components/voice-input"
import {v4 as uuidv4} from "uuid"
import {useRouter} from "next/navigation" // ✅ for navigation
import VoiceMessageBubble from "@/components/voicebbubbleMessage"
import {UserContext} from "../context/user-context"
import {Link} from "@heroui/link"
import {SparklesIcon} from "@heroicons/react/24/solid"
import {button as buttonStyles} from "@heroui/theme"
import {ModalContext} from "@/context/ModalContext"
import clsx from "clsx"

type KeywordPrompt = {
  keyword: string
  prompt: string
}
type labelLink = {
  label: string
  link: string
}
interface WelcomeMessage {
  _id: string
  message: string
}

interface systemPrompt {
  _id: string
  prompt: string
  feature: boolean
}

export default function ChatPage() {
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const {isAdmin, isUser, loading} = useContext(UserContext)
  const [streamedText, setStreamedText] = useState("")
  // const [streamingText, setStreamingText] = useState<boolean>(false)

  const [isMessageSentLoading, setIsMessageSentLoading] = useState(false)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [messageText, setMessageText] = useState<string>("")
  const [keywords, setKeywords] = useState<KeywordPrompt[]>([])
  const [lables, setLabels] = useState<labelLink[]>([])
  const [welcomeText, setWelcomeText] = useState<string>("")
  const [systemPrompt, setSystemPrompt] = useState<string>("")
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false)

  const [typing, setTyping] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState(false)
  const [websearch, setWebseacrh] = useState<boolean>(false)
  const {isTopicModalOpen, closeTopicModal, islinkModalOpen, closeLinkModal} =
    useContext(ModalContext)

  // const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  // const openTopicModal = () => setIsTopicModalOpen(true);
  // const closeTopicModal = () => setIsTopicModalOpen(false);

  // const router = useRouter() // ✅
  const [messages, setMessages] = useState<MessageType[]>([
    {
      _id: "welcome_message",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      text: welcomeText,
      sender: "bot",
    },
  ])

  useEffect(() => {
    console.log("welcome")
    fetchUserMessages()
    const fetchKeywords = async () => {
      const res = await axiosInstance.get<KeywordPrompt[]>(
        "/api/keywords/get-all"
      )
      setKeywords(res.data)
    }
    fetchKeywords()
    fetchSystemPrompt()
  }, [])

  const fetchSystemPrompt = async () => {
    try {
      const res = await axiosInstance.get<systemPrompt>(
        "/api/system-prompt/get-all"
      )
      if (res.data) {
        setSystemPrompt(res.data.prompt)
        setIsFeatureEnabled(res.data.feature)
      }
    } catch (err) {
      console.error("❌ Failed to fetch welcome message:", err)
    }
  }
  const VoiceBar = () => (
    <div className="flex space-x-1 h-6 items-end">
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-[#1d86f0] animate-wave"
          style={{animationDelay: `${i * 0.1}s`}}
        />
      ))}
    </div>
  )
  const fetchUserMessages = async () => {
    const userId = localStorage.getItem("userId")
    if (!userId) return

    try {
      console.log("user123", userId)
      setIsMessagesLoading(true)
      const res = await axiosInstance.get(`/api/chat-data/messages/${userId}`)
      console.log("CHat history")
      if (Array.isArray(res.data)) {
        if (res.data.length === 0) {
          fetchWelcomeText()
        }
        setMessages(res.data) // Replace welcome message if real ones exist
      }
    } catch (err) {
      console.error("❌ Failed to fetch user messages:", err)
    } finally {
      setIsMessagesLoading(false)
      scrollToBottom(chatContainerRef)
    }
  }

  const fetchWelcomeText = async () => {
    try {
      const res = await axiosInstance.get<WelcomeMessage>(
        "/api/welcome-text/get-all"
      )
      if (res.data) {
        setWelcomeText(res.data.message) // or just res.data.message if not nested
      }
    } catch (err) {
      console.error("❌ Failed to fetch welcome message:", err)
    }
  }

  useEffect(() => {
    const fetchLables = async () => {
      const res = await axiosInstance.get<labelLink[]>("/api/links/get-all")
      setLabels(res.data)
    }
    fetchLables()
  }, [])

  useEffect(() => {
    if (welcomeText.trim().length > 0) {
      setMessages([
        {
          _id: "welcome_message",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          text: welcomeText,
          sender: "bot",
        },
      ])
    }
  }, [welcomeText])

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: ref.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  const sendMessage = async (keyword = false, customPrompt = "") => {
    try {
      const finalText = keyword ? customPrompt : messageText

      if (finalText.trim().length === 0) return

      setIsMessageSentLoading(true)

      const userMessage: MessageType = {
        _id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: finalText,
        sender: "user",
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setMessageText("")
      setTyping(false)
      setStreamedText("") // 🔄 Reset streamed text if needed

      const activeSystemPrompt = isFeatureEnabled ? systemPrompt : ""

      setTimeout(() => {
        scrollToBottom(chatContainerRef)
      }, 100)
      const userId = localStorage.getItem("userId")

      // ✅ Make streaming POST request using fetch (not axios)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            userId: userId,
            systemPrompt: activeSystemPrompt,
            websearchFeature: websearch,
            messages: [
              {
                role: "system",
                content: isFeatureEnabled ? systemPrompt : "",
              },
              ...updatedMessages.slice(-10).map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.text,
              })),
            ],
          }),
        }
      )

      if (!response.body) {
        throw new Error("Response body is null — cannot stream.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")

      let streamed = ""
      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, {stream: true})
        const lines = chunk.split("\n").filter(line => line.trim() !== "")

        for (const line of lines) {
          if (line === "data: [DONE]") {
            const botMessage: MessageType = {
              _id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              text: streamed,
              sender: "bot",
            }
            setMessages(prev => [...prev, botMessage])
            setStreamedText("")
            scrollToBottom(chatContainerRef)
            return
          }

          if (line.startsWith("data: ")) {
            const token = line.replace("data: ", "")
            streamed += token
            setIsMessageSentLoading(false)
            setStreamedText(streamed)
          }
        }
      }
    } catch (e) {
      console.error("❌ sendMessage failed:", e)
      setIsMessageSentLoading(false)
    }
  }

  const getImage = async () => {
    try {
      const finalText = messageText

      if (finalText.trim().length === 0) return

      // setStreamingText(true)
      setIsMessageSentLoading(true)

      const userMessage: MessageType = {
        _id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: finalText,
        sender: "user",
      }
      // let updatedMessages = [...messages]
      // if(!keyword){
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      // }
      setMessageText("")
      setTyping(false)

      setTimeout(() => {
        scrollToBottom(chatContainerRef)
      }, 100)

      // ✅ Send full context to OpenAI
      const res = await axiosInstance.post("/api/dalle", {
        prompt: finalText,
        size: "512x512",
      })

      if (res?.data?.image_url) {
        const botMessage: MessageType = {
          _id: uuidv4(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          text: `<img src="${res.data.image_url}" alt="DALL·E Image" class="rounded-md max-w-full" />`,
          sender: "bot",
        }

        setMessages(prev => [...prev, botMessage])
      }

      setIsMessageSentLoading(false)
      setTimeout(() => {
        scrollToBottom(chatContainerRef)
      }, 100)
    } catch (e) {
      console.error("❌ sendMessage failed:", e)
      setIsMessageSentLoading(false)
    }
  }

  const sendAudio = async (audioFile: File) => {
    try {
      if (!audioFile) return

      const audioUrl = URL.createObjectURL(audioFile)
      const userMessage: MessageType = {
        _id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        text: "", // no text needed
        audioUrl,
        sender: "user",
      }

      setMessages(prev => [...prev, userMessage])
      scrollToBottom(chatContainerRef)
      setIsMessageSentLoading(true)
      setStreamedText("")
      const activeSystemPrompt = isFeatureEnabled ? systemPrompt : ""
      const userId = localStorage.getItem("userId") || ""

      const formData = new FormData()
      formData.append("audio", audioFile) // audioFile must be a Blob/File object
      formData.append("userId", userId)
      formData.append("systemPrompt", activeSystemPrompt)
      formData.append("websearchFeature", websearch.toString())

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/whisper`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.body) {
        throw new Error("Streaming not supported by response body.")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")

      let streamed = ""

      while (true) {
        const {done, value} = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, {stream: true})
        const lines = chunk.split("\n").filter(line => line.trim() !== "")

        for (const line of lines) {
          if (line === "data: [DONE]") {
            const botMessage: MessageType = {
              _id: uuidv4(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              text: streamed,
              sender: "bot",
            }
            setMessages(prev => [...prev, botMessage])
            setStreamedText("")
            setIsMessageSentLoading(false)
            scrollToBottom(chatContainerRef)
            return
          }

          if (line.startsWith("data: ")) {
            const token = line.replace("data: ", "")
            streamed += token
            setStreamedText(streamed)
            setIsMessageSentLoading(false)
          }
        }
      }
    } catch (e) {
      console.error("❌ sendAudio failed:", e)
      setIsMessageSentLoading(false)
    }
  }
  if (loading) {
    return <Loader isLoading />
  }

  if (!isAdmin && !isUser) {
    return (
      <>
        <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="inline-block max-w-xl text-center justify-center">
            <br />
            {/* <div className={subtitle({class: "mt-4"})}>
                You are not singed in yet, sign in first to get access to chat with Your Personalized AI Health Coach
              </div> */}
            <div className="font-bold text-5xl text-[#1929B3]">Marvelz AI</div>
            &nbsp; &nbsp;
            <div className="text-[#6909DD]">
              When MARVELZ speaks, enterpreneurs listen
            </div>
            <div className="text-[#6909DD]">
              {" "}
              Your 24/7 AI partner for business
            </div>
            <br />
            {/* <div className={title({size: "lg"})}>Tailored to You</div> */}
            &nbsp; &nbsp;
            <div className="">
              Please log in to chat with your{" "}
              <b className="text-[#6909DD]">AI Finance Assistant</b>.
            </div>
          </div>
          <div className="flex gap-4 sm:gap-3 flex-wrap justify-center">
            <Link
              className={clsx(
                buttonStyles({
                  radius: "full",
                  variant: "shadow",
                  size: "lg",
                }),
                "text-white dark:text-black bg-[#610DD9] shadow-[#610DD9]/50 hover:bg-[#610DD9]/90 transition duration-200 ease-in-out"
              )}
              href="/sign-in"
            >
              <SparklesIcon height={16} width={16} />
              {"SignIn Now"}
            </Link>
          </div>
        </section>
      </>
    )
  }

  return (
    // <div className="flex flex-col items-center justify-center gap-4">

    <section className="flex flex-col items-center justify-center gap-4 px-6">
      <div className="inline-block w-full h-full text-center justify-center py-6">
        <div className="flex gap-2 h-[calc(100vh-64px-48px)] scroll-smooth flex-col md:flex-row md:gap-5">
          <Transition appear show={isTopicModalOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50 md:hidden"
              onClose={closeTopicModal}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-bold text-gray-900 dark:text-white"
                        >
                          Topics
                        </Dialog.Title>
                        <button onClick={closeTopicModal}>
                          <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-white" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-4">
                        {keywords.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              sendMessage(true, item.prompt)
                              closeTopicModal()
                            }}
                            className="w-full text-left px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <span className="text-sm font-medium text-gray-800 dark:text-white">
                              {item.keyword}
                            </span>
                          </button>
                        ))}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
          <Transition appear show={islinkModalOpen} as={Fragment}>
            <Dialog
              as="div"
              className="relative z-50 md:hidden"
              onClose={closeLinkModal}
            >
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-bold text-gray-900 dark:text-white"
                        >
                          Links
                        </Dialog.Title>
                        <button onClick={closeLinkModal}>
                          <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-white" />
                        </button>
                      </div>

                      <div className="flex flex-col gap-4">
                        {lables.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              const url = item.link.startsWith("http")
                                ? item.link
                                : `https://${item.link}`
                              window.open(url, "_blank")
                              closeLinkModal()
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <p className="text-sm font-semibold text-[#2C2C70]">
                              {item.label}
                            </p>
                            <p className="text-xs text-gray-500">{item.link}</p>
                          </button>
                        ))}
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
          <Card
            isBlurred
            radius="sm"
            className="w-1/4 border-none bg-blue-50/10 backdrop-saturate-150 dark:bg-white/5 hidden md:flex"
          >
            <CardHeader>
              <div className="flex gap-2 justify-center items-center">
                <span className={"text-[20px] font-bold"}>Topics</span>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="flex gap-5">
              <div className="w-full flex flex-col gap-4">
                {keywords.map((item, index) => (
                  <Card
                    key={index}
                    fullWidth
                    isHoverable
                    isPressable
                    className="border dark:border-default/50"
                    radius="sm"
                    shadow="sm"
                    onPress={() => sendMessage(true, item.prompt)}
                  >
                    <CardBody>
                      <div className="text-sm font-medium flex gap-2">
                        {item.keyword}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card
            radius="sm"
            className="flex w-full md:w-2/4 border-none bg-blue-50/10 backdrop-saturate-150 dark:bg-white/5"
          >
            <CardHeader>
              <div className="flex gap-2 justify-center items-center text-[20px] font-bold">
                Chat
              </div>
            </CardHeader>
            <Divider />
            <div
              ref={chatContainerRef}
              className="p-4 flex flex-col gap-5 h-[calc(100vh-64px-48px-120px)] overflow-y-auto"
            >
              <Loader isLoading={isMessagesLoading} />

              {messages.map(message => {
                if (message.sender === "user") {
                  return message.audioUrl ? (
                    <VoiceMessageBubble
                      key={message._id}
                      audioUrl={message.audioUrl}
                    />
                  ) : (
                    <SentMessage key={message._id} text={message.text} />
                  )
                } else {
                  return (
                    <ReceivedMessage key={message._id} text={message.text} />
                  )
                }
              })}

              {/* ✅ Live streaming message appears here */}
              {streamedText && <ReceivedMessage text={streamedText} />}

              {/* Optional loading indicator during AI thinking */}
              {isMessageSentLoading && <ReceivedMessage isLoading text="" />}

              {isRecording && <VoiceBar />}
            </div>

            <Divider />
            <CardFooter>
              <div className="flex items-center w-full gap-2 sm:gap-4 overflow-x-auto">
                <Textarea
                  isClearable
                  maxRows={3}
                  minRows={1}
                  placeholder="Type your message here"
                  value={messageText}
                  variant="flat"
                  className="flex-grow min-w-0"
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) => {
                    setMessageText(e.target.value)
                    setTyping(e.target.value.trim().length > 0)
                  }}
                  onClear={() => {
                    setMessageText("")
                    setTyping(false)
                  }}
                  onKeyDown={(
                    e: React.KeyboardEvent<
                      HTMLTextAreaElement | HTMLInputElement
                    >
                  ) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />

                {!typing ? (
                  <VoiceInput
                    onAudioSend={sendAudio}
                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                  />
                ) : (
                  <Button
                    isIconOnly
                    radius="sm"
                    onPress={() => sendMessage()}
                    className="w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 bg-[#6909DD] text-white hover:bg-white hover:text-[#6909DD] border border-transparent hover:border-[#6909DD] transition"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                )}

                <Button
                  isIconOnly
                  radius="sm"
                  onPress={() => getImage()}
                  className="w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 bg-[#6909DD] text-white hover:bg-white hover:text-[#6909DD] border border-transparent hover:border-[#6909DD] transition"
                >
                  <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Button
                  isIconOnly
                  radius="sm"
                  onPress={() => setWebseacrh(!websearch)}
                  className={`w-10 h-10 sm:w-10 sm:h-10 flex-shrink-0 transition
                    ${websearch ? "bg-[#6909DD] text-white border-[#6909DD]" : "bg-white text-[#6909DD] border border-[#6909DD]"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                    />
                  </svg>{" "}
                </Button>
              </div>
            </CardFooter>
          </Card>
          <Card
            isBlurred
            radius="sm"
            className="w-1/4 border-none bg-blue-50/10 backdrop-saturate-150 dark:bg-white/5 hidden md:flex"
          >
            <CardHeader>
              <div className="flex gap-2 justify-center items-center">
                <span className="text-[20px] font-bold">Links</span>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="flex gap-5">
              <div className="w-full flex flex-col gap-4">
                {lables.map((item, index) => (
                  <Card
                    key={index}
                    fullWidth
                    isHoverable
                    isPressable
                    className="border dark:border-default/50"
                    radius="sm"
                    shadow="sm"
                    onPress={() => {
                      const url = item.link.startsWith("http")
                        ? item.link
                        : `https://${item.link}`
                      window.open(url, "_blank")
                    }}
                  >
                    <CardBody>
                      <div className="text-sm font-medium flex flex-col gap-1">
                        <p className="text-[#2C2C70]">{item.label}</p>
                        <p className="text-tiny text-gray-400">{item.link}</p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  )
}