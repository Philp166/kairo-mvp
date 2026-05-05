/**
 * Quick canned-message dialog. Per spec §2.7 watch screen 4 = «Сообщение от
 * родителя» and HAP-06 = «Получено сообщение от родителя».
 *
 * Watch display is 128×64, so we keep messages ≤ 20 chars + emoji glyph.
 */

import { useEffect } from 'react'

const cannedMessages = [
  { id: 'love', emoji: '❤️', text: 'Love you' },
  { id: 'miss', emoji: '🤗', text: 'Miss you' },
  { id: 'proud', emoji: '⭐', text: 'Great job' },
  { id: 'home', emoji: '🏠', text: 'Home soon' },
  { id: 'eat', emoji: '🍎', text: 'Don’t forget to eat' },
  { id: 'water', emoji: '💧', text: 'Drink water' },
  { id: 'sleep', emoji: '🌙', text: 'Bedtime' },
  { id: 'play', emoji: '🎈', text: 'Have fun' },
  { id: 'good', emoji: '👍', text: 'All good' },
  { id: 'call', emoji: '📞', text: 'Call me' },
  { id: 'wait', emoji: '⏳', text: 'Wait for me' },
  { id: 'hug', emoji: '🫂', text: 'Hugs' },
]

interface MessageDialogProps {
  open: boolean
  childName: string
  onClose: () => void
  onSend: (msg: { emoji: string; text: string }) => void
}

export function MessageDialog({ open, childName, onClose, onSend }: MessageDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-app-surface rounded-3xl shadow-xl border border-app-line p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-app-muted">
          Message
        </div>
        <h3 className="text-xl font-semibold tracking-tight">{childName}</h3>
        <p className="text-xs text-app-muted mt-1">
          Band will show icon + short text and buzz once
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {cannedMessages.map((m) => (
            <button
              key={m.id}
              onClick={() => onSend(m)}
              className="cursor-pointer flex items-center gap-2.5 rounded-xl border border-app-line p-3 text-left hover:bg-app-line/60 transition-colors duration-200"
            >
              <span className="text-xl shrink-0" aria-hidden>
                {m.emoji}
              </span>
              <span className="text-sm text-app-ink truncate">{m.text}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer text-sm text-app-muted hover:text-app-ink px-3 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageDialog
