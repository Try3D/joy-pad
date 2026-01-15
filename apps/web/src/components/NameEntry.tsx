interface NameEntryProps {
  onSubmit: (name: string) => void;
  roomCode: string;
}

import type React from "react";
import { useEffect, useRef } from "react";

export function NameEntry({ roomCode, onSubmit }: NameEntryProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-mono font-bold text-text text-center mb-2 tracking-wider">
          JOYPAD
        </h1>
        <p className="text-text-secondary font-mono text-center mb-8">
          {"// JOINING"} <span className="text-accent">{roomCode}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-mono text-text-secondary mb-2"
            >
              ENTER YOUR NAME
            </label>
            <input
              type="text"
              id="name"
              name="name"
              ref={inputRef}
              autoComplete="off"
              maxLength={20}
              placeholder="PLAYER_NAME"
              className="w-full px-4 py-3 bg-surface border-2 border-border text-text font-mono placeholder-text-secondary focus:outline-none focus:border-accent text-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border-2 border-accent bg-bg hover:bg-accent hover:text-bg text-accent font-mono font-bold transition-colors text-lg"
          >
            [ENTER] JOIN
          </button>
        </form>
      </div>
    </div>
  );
}
