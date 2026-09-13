import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, X, Send, User, Bot, Loader2, Zap, Paperclip } from "lucide-react"
import { useTranslation } from "react-i18next"
import styles from "./chat-bot.module.css"
import { API_BASE } from "../config"

interface Message {
  _id?: string
  id?: string 
  text: string
  sender: "user" | "bot"
  imageUrl?: string
}

interface ChatBotProps {
  token: string
  activeDisease?: string
  isFullPage?: boolean
  threadId?: string | null
  onThreadCreated?: (id: string) => void
}

export const ChatBot: React.FC<ChatBotProps> = ({ 
  token, 
  activeDisease, 
  isFullPage, 
  threadId,
  onThreadCreated 
}) => {
  const { t, i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(isFullPage || false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  useEffect(() => {
    if (threadId) {
      loadHistory(threadId)
    } else {
      setMessages([{ id: "welcome", text: t('bot_greet'), sender: "bot" }])
    }
  }, [threadId])

  const loadHistory = async (id: string) => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`${API_BASE}/api/chat/thread/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) setMessages(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append("image", file)

    try {
      // Reuse existing upload endpoint
      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData
      })
      const uploadData = await uploadRes.json()
      
      if (uploadRes.ok) {
        const cleanPath = uploadData.filePath.replace(/\\/g, "/")
        const normalizedPath = cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath
        const imageUrl = `${API_BASE}${normalizedPath}`
        
        // optimistically add image message
        const userMsg: Message = { 
          id: Date.now().toString(), 
          text: t('image_sent_notif') || "Sent an image for diagnosis.", 
          sender: "user",
          imageUrl 
        }
        setMessages(prev => [...prev, userMsg])
        
        // Trigger bot response about the image
        setIsTyping(true)
        const chatRes = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            message: "I am sharing an image of my plant for your analysis.",
            context: { disease: activeDisease },
            lang: i18n.language,
            threadId: threadId,
            imageUrl: uploadData.filePath
          })
        })
        const chatData = await chatRes.json()
        if (chatRes.ok) {
          setMessages(prev => [...prev, { id: Date.now().toString(), text: chatData.reply, sender: "bot" }])
          if (!threadId && chatData.threadId && onThreadCreated) onThreadCreated(chatData.threadId)
        } else {
          setMessages(prev => [...prev, { id: Date.now().toString(), text: chatData.error || "Failed to analyze image.", sender: "bot" }])
        }
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: uploadData.error || "Failed to upload image.", sender: "bot" }])
      }
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Error sending image for diagnosis.", sender: "bot" }])
    } finally {
      setUploadingImage(false)
      setIsTyping(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSend = async (msgOverride?: string) => {
    const textToSend = msgOverride || input
    if (!textToSend.trim() || isTyping) return

    const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: "user" }
    setMessages(prev => [...prev, userMsg])
    if (!msgOverride) setInput("")
    setIsTyping(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: textToSend,
          context: { disease: activeDisease },
          lang: i18n.language,
          threadId: threadId
        })
      })

      let data = await response.json()
      
      if (!response.ok && (response.status === 401 || (data.error && data.error.toLowerCase().includes("token")))) {
        // Retry request for auto-healing fallback
        const retryRes = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: textToSend,
            context: { disease: activeDisease },
            lang: i18n.language,
            threadId: threadId
          })
        })
        data = await retryRes.json()
      }

      if (data.reply) {
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: data.reply, sender: "bot" }])
        if (!threadId && data.threadId && onThreadCreated) {
          onThreadCreated(data.threadId)
        }
      } else {
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: data.error || "AI Assistant could not respond.", sender: "bot" }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Connection error. Please check your backend connection.", sender: "bot" }])
    } finally {
      setIsTyping(false)
    }
  }

  const quickPrompts = [
    { key: 'prompt_pesticide', icon: '🌱' },
    { key: 'prompt_organic', icon: '🍃' },
    { key: 'prompt_spread', icon: '🛡️' }
  ]

  return (
    <div className={isFullPage ? styles.fullContainer : styles.wrapper}>
      {!isFullPage && !isOpen && (
        <button className={styles.floatBtn} onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
          <span className={styles.pulse}></span>
        </button>
      )}

      {isOpen && (
        <div className={isFullPage ? styles.fullWindow : styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.botAvatar}>
                <Bot size={20} />
              </div>
              <div>
                <h4 className={styles.headerTitle}>AgroVision Specialist</h4>
                <p className={styles.headerStatus}>{t('bot_status')}</p>
              </div>
            </div>
            {!isFullPage && (
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            )}
          </div>

          <div className={styles.messageList}>
            <div className={isFullPage ? styles.centeredMessages : ""}>
              {loadingHistory ? (
                <div className={styles.loadingHistory}>
                  <Loader2 className={styles.spinning} />
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={msg._id || msg.id || idx} className={`${styles.messageWrapper} ${styles[msg.sender]}`}>
                    <div className={styles.avatar}>
                      {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={styles.bubble}>
                      {msg.imageUrl && (
                        <div className={styles.imageBubble}>
                          <img 
                            src={msg.imageUrl.startsWith("http") ? msg.imageUrl : `http://localhost:5000${msg.imageUrl}`} 
                            alt="Uploaded" 
                            className={styles.chatImage} 
                          />
                        </div>
                      )}
                      <p className={styles.msgText}>{msg.text}</p>
                    </div>
                  </div>
                ))
              )}

              {!threadId && messages.length <= 1 && !isTyping && (
                <div className={styles.promptGrid}>
                  <p className={styles.promptLabel}>
                    <Zap size={14} /> {t('quick_prompts')}
                  </p>
                  {quickPrompts.map(p => (
                    <button 
                      key={p.key} 
                      className={styles.promptCard}
                      onClick={() => handleSend(t(p.key))}
                    >
                      <span className={styles.pIcon}>{p.icon}</span>
                      <span>{t(p.key)}</span>
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className={`${styles.messageWrapper} ${styles.bot}`}>
                  <div className={styles.avatar}><Bot size={14} /></div>
                  <div className={styles.bubble}>
                    <Loader2 size={16} className={styles.spinning} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form className={styles.inputArea} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
             <div className={isFullPage ? styles.centeredInput : styles.inputFlex}>
              <button 
                type="button" 
                className={styles.attachBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage || isTyping}
              >
                {uploadingImage ? <Loader2 size={18} className={styles.spinning} /> : <Paperclip size={18} />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <input
                type="text"
                placeholder={t('ready_desc')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isTyping || uploadingImage}>
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
