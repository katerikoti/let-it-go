"use client";

import React, { useState } from "react";

type Letter = {
  id: number;
  recipient: string;
  body: string;
  createdAt: number;
};

function loadLetters(username: string): Letter[] {
  try {
    return JSON.parse(localStorage.getItem(`letitgo_letters_${username}`) || "[]");
  } catch (e) {
    return [];
  }
}

function saveLetters(username: string, letters: Letter[]) {
  localStorage.setItem(`letitgo_letters_${username}`, JSON.stringify(letters));
}

export default function LetterEditor({ username }: { username: string }) {
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [forget, setForget] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  function handleSend() {
    if (!body.trim()) return;
    if (!forget) {
      const letters = loadLetters(username);
      letters.unshift({ id: Date.now(), recipient: recipient || "(unspecified)", body, createdAt: Date.now() });
      saveLetters(username, letters);
    }
    setBody("");
    setRecipient("");
    setSentMsg("Sent. Release received.");
    setTimeout(() => setSentMsg(null), 2500);
  }

  return (
    <div>
      <label className="block text-sm text-muted mb-1">To</label>
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Recipient name (person, yourself, the universe)"
        className="w-full p-3 rounded border mb-3"
      />

      <div className="mb-3">
        <label className="block text-sm text-muted mb-1">Your letter</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full p-4 rounded border font-sans leading-6"
          placeholder="Pour out what you want to release — no one will read this unless you save it here."
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={forget} onChange={(e) => setForget(e.target.checked)} />
          Send & forget (do not save)
        </label>

        <div className="flex items-center gap-2">
          {sentMsg && <span className="text-sm text-green-600">{sentMsg}</span>}
          <button onClick={handleSend} className="px-4 py-2 bg-foreground text-background rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
