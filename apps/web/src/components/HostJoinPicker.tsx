import { useEffect } from "react";

interface HostJoinPickerProps {
  onHostGame: () => void;
  onJoinGame: () => void;
}

export function HostJoinPicker({
  onHostGame,
  onJoinGame,
}: HostJoinPickerProps) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        onHostGame();
      } else if (e.key === "2") {
        onJoinGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onHostGame, onJoinGame]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-mono font-bold text-text mb-4 tracking-wider">
          JOYPAD
        </h1>
        <p className="text-text-secondary font-mono text-lg">
          // COUCH CO-OP GAMING
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onHostGame}
          className="
            px-8 py-4 text-xl font-mono font-bold
            border-2 border-accent bg-bg hover:bg-accent hover:text-bg
            text-accent
            transition-colors duration-200
          "
        >
          [1] HOST GAME
        </button>

        <button
          onClick={onJoinGame}
          className="
            px-8 py-4 text-xl font-mono font-bold
            border-2 border-border bg-surface hover:bg-surface-light
            text-text
            transition-colors duration-200
          "
        >
          [2] JOIN GAME
        </button>
      </div>
    </div>
  );
}
