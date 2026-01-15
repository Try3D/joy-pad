import { useState } from "react";

interface JoinFormProps {
  onJoin: (roomCode: string) => void;
  onBack: () => void;
}

export function JoinForm({ onJoin, onBack }: JoinFormProps) {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const code = roomCode.toUpperCase().trim();

    if (!/^[A-Z]{6}$/.test(code)) {
      setError("Room code must be 6 letters");
      return;
    }

    setError("");
    onJoin(code);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 6);
    setRoomCode(value);
    setError("");
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-text-secondary hover:text-text mb-8 flex items-center gap-2 font-mono"
        >
          &lt;- BACK
        </button>

        <h1 className="text-3xl font-mono font-bold text-text mb-8 text-center">
          JOIN GAME
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="roomCode"
              className="block text-text-secondary font-mono mb-2"
            >
              // ENTER ROOM CODE
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={handleChange}
              placeholder="ABCXYZ"
              className="
                w-full px-4 py-3 text-2xl text-center
                font-mono tracking-widest uppercase
                bg-surface text-text border-2 border-border
                focus:border-accent
                outline-none transition-colors
              "
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
            />
            {error && (
              <p className="mt-2 text-error text-sm font-mono">[!] {error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={roomCode.length !== 6}
            className="
              w-full px-6 py-3 text-xl font-mono font-bold
              border-2 border-accent bg-bg hover:bg-accent hover:text-bg
              disabled:border-border disabled:text-text-secondary disabled:hover:bg-bg disabled:cursor-not-allowed
              text-accent
              transition-colors duration-200
            "
          >
            [ENTER] JOIN ROOM
          </button>
        </form>
      </div>
    </div>
  );
}
