import type { Player } from "@joypad/shared";

interface PlayerListProps {
  players: Player[];
}

export function PlayerList({ players }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-text-secondary text-center py-4 font-mono">
        {"// NO PLAYERS CONNECTED"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {players.map((player) => (
        <div
          key={player.id}
          className="flex items-center gap-3 bg-surface px-4 py-2 border-2 border-border"
        >
          <div className="w-4 h-4" style={{ backgroundColor: player.color }} />
          <span className="text-text font-mono">
            {player.name.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}
