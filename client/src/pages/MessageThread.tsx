import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import api from '../lib/axios'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { SEO } from '../components/SEO'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  readAt: string | null
  createdAt: string
}

function MessageThread() {
  const { t } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [partnerNickname, setPartnerNickname] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchThread = async () => {
    try {
      const res = await api.get(`/messages/thread/${userId}`)
      setMessages(res.data.messages)

      // Get partner nickname from conversations list
      const convRes = await api.get('/messages/conversations')
      const conv = convRes.data.conversations.find(
        (c: any) => c.partner.id === userId
      )
      if (conv) setPartnerNickname(conv.partner.nickname)
    } catch {
      toast.error(t('messageThread.toastLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThread()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchThread, 5000)
    return () => clearInterval(interval)
  }, [userId])

  // Scroll to bottom when messages load or update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      await api.post('/messages', { receiverId: userId, content: content.trim() })
      setContent('')
      await fetchThread()
    } catch {
      toast.error(t('messageThread.toastSendFailed'))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-6">
      <SEO
        titleEn="Messages"
        titleFa="پیام‌ها"
        descriptionEn="Your private conversation."
        descriptionFa="مکالمه خصوصی شما."
        path="/messages"
        noIndex
      />

      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/profile?tab=messages"
          className="text-brand-muted hover:text-brand-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 font-bold text-brand-primary">
          {partnerNickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-brand-primary">{partnerNickname}</p>
          <p className="text-xs text-brand-muted">Afghanistan Online Cargo</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-white p-4 shadow-sm">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-brand-muted">
              {t('messageThread.noMessagesYet')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'rounded-br-sm bg-brand-primary text-white'
                        : 'rounded-bl-sm bg-brand-bg text-brand-primary'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-xs ${isMe ? 'text-white/60' : 'text-brand-muted'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('messageThread.inputPlaceholder')}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-brand-muted/30 bg-white px-4 py-3 text-sm text-brand-primary outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
        />
        <button
          onClick={handleSend}
          disabled={sending || !content.trim()}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  )
}

export default MessageThread
