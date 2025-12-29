"use client";

import React, { useEffect, useState } from "react";

type Letter = { id: number; recipient: string; body: string; createdAt: number };

export default function Profile({ username, onSignOut }: { username: string; onSignOut: () => void }) {
  const [letters, setLetters] = useState<Letter[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`letitgo_letters_${username}`) || "[]";
      setLetters(JSON.parse(raw));
    } catch (e) {
      setLetters([]);
    }
  }, [username]);

  function remove(id: number) {
    const next = letters.filter((l) => l.id !== id);
    setLetters(next);
    localStorage.setItem(`letitgo_letters_${username}`, JSON.stringify(next));
  }

  return (
    <div className="p-3 border rounded">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-muted">Signed in as</div>
          <div className="font-medium">{username}</div>
        </div>
        <div>
          <button onClick={onSignOut} className="px-3 py-1 border rounded text-sm">
            Sign out
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Saved letters</h3>
        {letters.length === 0 && <div className="text-sm text-muted">No saved letters.</div>}
        <ul className="space-y-2 mt-2">
          {letters.map((l) => (
            <li key={l.id} className="p-2 border rounded">
              <div className="text-xs text-muted">To {l.recipient}</div>
              <div className="text-sm mt-1 line-clamp-3">{l.body}</div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-muted">{new Date(l.createdAt).toLocaleString()}</div>
                <button className="text-xs text-red-600" onClick={() => remove(l.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
