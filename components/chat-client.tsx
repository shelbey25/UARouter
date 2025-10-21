"use client"

import { useState } from "react"

export default function ChatClient() {
  const [input, setInput] = useState("")
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError(null)
    setReply(null)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Request failed: ${res.status}`)
      }

      const data = await res.json()
      setReply(data.reply ?? "(no reply)")
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-card rounded-md shadow-sm">
      <form onSubmit={sendMessage} className="space-y-3">
        <label className="block text-sm font-medium">Chat with assistant</label>
        <div className="flex gap-2">
          <input
            className="flex-1 input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            aria-label="message"
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {error && <div className="mt-3 text-sm text-destructive">Error: {error}</div>}

      {reply && (
        <div className="mt-3">
          <div className="text-sm font-medium">Assistant</div>
          <div className="mt-1 whitespace-pre-wrap">{reply}</div>
        </div>
      )}
    </div>
  )
}
