import { type GameDefinition, games } from "../utils/games";

interface GameSelectorProps {
  onSelectGame: (game: GameDefinition) => void;
  playerCount: number;
}

export function GameSelector({ onSelectGame, playerCount }: GameSelectorProps) {
  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Select a Game</h2>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3">
          {games.map((game) => {
            const canPlay = playerCount >= game.minPlayers;
            const playersNeeded = game.minPlayers - playerCount;

            return (
              <button
                key={game.id}
                onClick={() => canPlay && onSelectGame(game)}
                disabled={!canPlay}
                className={`
                  w-full p-4 rounded-lg text-left transition-all
                  flex items-center gap-4
                  ${
                    canPlay
                      ? "bg-surface hover:bg-surface-light cursor-pointer"
                      : "bg-surface/50 cursor-not-allowed opacity-60"
                  }
                `}
              >
                <div
                  className={`
                  w-14 h-14 rounded-lg flex items-center justify-center text-2xl
                  ${canPlay ? "bg-bg-light" : "bg-bg-dark"}
                `}
                >
                  {game.id === "pong" && "🏓"}
                  {game.id === "snake" && "🐍"}
                  {game.id === "tron" && "🏍️"}
                  {game.id === "asteroids" && "🌑"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {game.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {game.minPlayers === game.maxPlayers
                        ? `${game.minPlayers}P`
                        : `${game.minPlayers}-${game.maxPlayers}P`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {game.description}
                  </p>
                  {!canPlay && (
                    <p className="text-xs text-yellow-500 mt-1">
                      Need {playersNeeded} more player
                      {playersNeeded > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {canPlay && (
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
