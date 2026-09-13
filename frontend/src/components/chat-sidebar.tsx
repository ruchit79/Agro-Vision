import React, { useEffect, useState } from "react"
import { PlusCircle, MessageSquare, Trash2, Clock, Edit2, Check, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import styles from "./chat-sidebar.module.css"
import { API_BASE } from "../config"

interface Thread {
  _id: string
  title: string
  lastMessage: string
  updatedAt: string
}

interface SidebarProps {
  token: string
  onSelectThread: (id: string) => void
  onNewChat: () => void
  currentThreadId?: string | null
}

export const ChatSidebar: React.FC<SidebarProps> = ({ 
  token, 
  onSelectThread, 
  onNewChat, 
  currentThreadId 
}) => {
  const { t } = useTranslation()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tempTitle, setTempTitle] = useState("")

  const fetchThreads = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/threads`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok) setThreads(data)
    } catch (err) {
      console.error("Failed to fetch threads", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThreads()
  }, [currentThreadId])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm(t('delete_chat'))) return

    try {
      const response = await fetch(`${API_BASE}/api/chat/thread/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setThreads(prev => prev.filter(t => t._id !== id))
        if (currentThreadId === id) onNewChat()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const startEditing = (e: React.MouseEvent, thread: Thread) => {
    e.stopPropagation()
    setEditingId(thread._id)
    setTempTitle(thread.title)
  }

  const submitRename = async (e: React.FormEvent | React.MouseEvent) => {
    e.stopPropagation()
    if (!tempTitle.trim() || !editingId) return

    try {
      const response = await fetch(`${API_BASE}/api/chat/thread/${editingId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title: tempTitle })
      })
      if (response.ok) {
        setThreads(prev => prev.map(t => t._id === editingId ? { ...t, title: tempTitle } : t))
        setEditingId(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className={styles.sidebar}>
      <button className={styles.newChatBtn} onClick={onNewChat} id="new-chat-btn">
        <PlusCircle size={20} />
        <span>{t('new_chat')}</span>
      </button>

      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <Clock size={16} />
          <span>{t('history')}</span>
        </div>

        <div className={styles.threadList}>
          {loading ? (
            <div className={styles.loading}>...</div>
          ) : threads.length === 0 ? (
            <p className={styles.empty}>{t('history_empty')}</p>
          ) : (
            threads.map(thread => (
              <div 
                key={thread._id} 
                className={`${styles.threadItem} ${currentThreadId === thread._id ? styles.active : ""}`}
                onClick={() => {
                  setEditingId(null)
                  onSelectThread(thread._id)
                }}
              >
                <div className={styles.threadInfo}>
                  <MessageSquare size={16} className={styles.msgIcon} />
                  <div className={styles.threadTexts}>
                    {editingId === thread._id ? (
                      <div className={styles.editWrapper} onClick={e => e.stopPropagation()}>
                        <input 
                          autoFocus
                          className={styles.editInput}
                          value={tempTitle}
                          onChange={e => setTempTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && submitRename(e)}
                        />
                        <button className={styles.confirmBtn} onClick={submitRename}><Check size={12}/></button>
                        <button className={styles.confirmBtn} onClick={() => setEditingId(null)}><X size={12}/></button>
                      </div>
                    ) : (
                      <>
                        <p className={styles.threadTitle}>{thread.title}</p>
                        <p className={styles.lastMsg}>{thread.lastMessage}</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className={styles.actionGroup}>
                  {editingId !== thread._id && (
                    <button 
                      className={styles.actionBtn} 
                      onClick={(e) => startEditing(e, thread)}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                  <button 
                    className={styles.actionBtn} 
                    onClick={(e) => handleDelete(e, thread._id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
