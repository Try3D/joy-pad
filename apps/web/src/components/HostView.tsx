import { useEffect, useMemo, useRef, useState } from "react";
import { useHost } from "../hooks/usePartyKit";
import { games, getGame } from "../utils/games";
import { Modal } from "./Modal";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Toast } from "./Toast";

interface HostViewProps {
  roomCode: string;
  onLeave: () => void;
}

export function HostView({ roomCode, onLeave }: HostViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastInputIndexRef = useRef<number>(0);

  const joinUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?room=${roomCode}`;
  }, [roomCode]);

  const {
    isConnected,
    players,
    inputLog,
    currentGameId,
    leaderId,
    activeConfig,
    selectGame,
  } = useHost({
    roomId: roomCode,
    onError: (message) => {
      console.error("PartyKit error:", message);
    },
  });

  const selectedGame = currentGameId ? getGame(currentGameId) : null;
  const GameComponent = selectedGame?.component;

  const availableGames = useMemo(() => {
    return games.map((game) => ({
      ...game,
      canPlay: game.minPlayers === 1 || players.length >= game.minPlayers,
      playersNeeded: Math.max(0, game.minPlayers - players.length),
    }));
  }, [players.length]);

  useEffect(() => {
    if (currentGameId || !leaderId || players.length === 0) return;

    const newInputs = inputLog.slice(lastInputIndexRef.current);
    if (newInputs.length === 0) return;

    lastInputIndexRef.current = inputLog.length;

    for (const input of newInputs) {
      if (input.playerId !== leaderId) continue;
      if (input.action !== "press") continue;

      switch (input.button) {
        case "left":
          setSelectedIndex((prev) => Math.max(0, prev - 1));
          break;
        case "right":
          setSelectedIndex((prev) =>
            Math.min(availableGames.length - 1, prev + 1),
          );
          break;
        case "a": {
          const game = availableGames[selectedIndex];
          if (game && game.canPlay) {
            selectGame(game.id);
          }
          break;
        }
      }
    }
  }, [
    inputLog,
    leaderId,
    currentGameId,
    availableGames,
    selectGame,
    selectedIndex,
    players.length,
  ]);

  const prevGameIdRef = useRef<string | null>(currentGameId);
  useEffect(() => {
    if (prevGameIdRef.current && !currentGameId) {
      setSelectedIndex(0);
      lastInputIndexRef.current = inputLog.length;
    }
    prevGameIdRef.current = currentGameId;
  }, [currentGameId, inputLog.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case "r":
          setShowModal(true);
          break;
        case "x":
          if (currentGameId) {
            selectGame("");
          }
          break;
        case "c":
          navigator.clipboard.writeText(joinUrl);
          setShowToast(true);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentGameId, selectGame, onLeave, joinUrl]);

  return (
    <div className="h-screen bg-bg flex flex-col">
      <header className="bg-bg-light border-b-2 border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              className={`text-lg font-mono font-bold text-text ${selectedGame ? "cursor-pointer hover:text-accent transition-colors" : ""}`}
              onClick={() => selectedGame && selectGame("")}
            >
              JOYPAD
            </h1>
            {selectedGame && (
              <>
                <span className="text-text-secondary font-mono">/</span>
                <span className="text-text font-mono text-sm">
                  {selectedGame.name.toUpperCase()}
                </span>
              </>
            )}
            <div
              className={`
              px-2 py-1 border-2 text-xs font-mono
              ${isConnected ? "border-accent text-accent" : "border-warning text-warning"}
            `}
            >
              {isConnected ? `${players.length}P` : "WAIT"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedGame && (
              <button
                onClick={() => selectGame("")}
                className="px-3 py-1.5 border-2 border-error bg-bg text-error hover:bg-error hover:text-bg transition-colors text-sm font-mono"
                title="Exit Game"
              >
                [X] EXIT
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 border-2 border-border bg-surface hover:bg-surface-light text-text transition-colors text-sm font-mono font-bold"
              title="Room Info (R)"
            >
              ROOM [R]
            </button>
            <button
              onClick={onLeave}
              className="text-text-secondary hover:text-text transition-colors text-sm font-mono font-bold"
              title="Leave Room"
            >
              LEAVE
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {selectedGame && GameComponent ? (
          <div className="h-full bg-bg overflow-hidden">
            <GameComponent
              players={players}
              inputLog={inputLog}
              config={activeConfig}
            />
          </div>
        ) : players.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="bg-accent p-2 border-2 border-accent mb-6">
              <QRCodeDisplay url={joinUrl} size={200} />
            </div>
            <div className="text-3xl font-mono font-bold text-text tracking-widest mb-2">
              {roomCode}
            </div>
            <p className="text-text-secondary font-mono mb-8">
              SCAN TO JOIN OR ENTER CODE
            </p>
            <p className="text-text-secondary font-mono">
              WAITING FOR PLAYERS...
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col p-8">
            <div className="mb-8">
              <h2 className="text-4xl font-mono font-bold text-text mb-2">
                SELECT GAME
              </h2>
            </div>

            <div className="flex-1 flex items-center overflow-hidden">
              <div
                className="flex gap-6 transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${selectedIndex * 344}px)`,
                }}
              >
                {availableGames.map((game, index) => {
                  const isSelected = index === selectedIndex;

                  return (
                    <div
                      key={game.id}
                      className={`
                        flex-shrink-0 w-80 border-2 transition-all duration-300
                        ${
                          isSelected
                            ? "border-accent"
                            : "border-border opacity-70"
                        }
                        ${!game.canPlay && "opacity-40"}
                      `}
                    >
                      <div
                        className={`
                        h-80 relative overflow-hidden
                        ${isSelected ? "bg-surface" : "bg-bg-light"}
                      `}
                      >
                        <div className="absolute inset-0">
                          {game.thumbnail ? (
                            <img
                              src={game.thumbnail}
                              alt={game.name}
                              className={`
                                w-full h-full object-cover transition-opacity duration-300
                                ${isSelected ? "opacity-100" : "opacity-60 grayscale"}
                              `}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-6xl font-mono text-text-secondary">
                              ?
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="absolute top-4 right-4">
                            <div className="bg-accent text-bg px-2 py-1 text-xs font-mono font-bold">
                              [X]
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        className={`
                        p-6 border-t-2 border-border
                        ${isSelected ? "bg-surface" : "bg-bg-light"}
                      `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-mono font-bold text-text">
                            {game.name.toUpperCase()}
                          </h3>
                          <span
                            className={`
                            text-xs font-mono px-2 py-1 border-2
                            ${isSelected ? "border-accent text-accent" : "border-border text-text-secondary"}
                          `}
                          >
                            {game.minPlayers === game.maxPlayers
                              ? `${game.minPlayers}P`
                              : `${game.minPlayers}-${game.maxPlayers}P`}
                          </span>
                        </div>
                        <p className="text-text-secondary font-mono text-sm mb-3">
                          {game.description}
                        </p>

                        {!game.canPlay && (
                          <div className="flex items-center gap-2 text-warning text-sm font-mono">
                            <span>[!]</span>
                            <span>Need {game.playersNeeded} more</span>
                          </div>
                        )}

                        {game.canPlay && isSelected && (
                          <div className="mt-4 flex items-center gap-2 text-accent text-sm font-mono">
                            <span>[▶]</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm">
                  {players.length} player{players.length !== 1 ? "s" : ""}:
                </span>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-2 py-1 bg-surface border border-border"
                    >
                      <div
                        className="w-2 h-2"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-text text-xs font-mono">
                        {p.name.toUpperCase()}
                      </span>
                      {p.isLeader && (
                        <span className="text-warning text-xs font-mono">
                          [L]
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Room Info"
      >
        <div className="flex flex-col items-center">
          <div className="bg-accent p-2 border-2 border-accent mb-4">
            <QRCodeDisplay url={joinUrl} size={180} />
          </div>
          <div className="text-2xl font-mono font-bold text-text tracking-widest mb-2">
            {roomCode}
          </div>
          <div className="text-text-secondary text-sm text-center mb-3 font-mono">
            {"// SCAN QR OR ENTER CODE"}
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(joinUrl);
              setShowToast(true);
            }}
            className="px-4 py-2 border-2 border-accent bg-bg hover:bg-accent hover:text-bg text-accent font-mono font-bold transition-colors text-sm mb-4"
          >
            [C] COPY LINK
          </button>

          <div className="w-full border-t-2 border-border pt-4">
            <h3 className="text-text-secondary text-sm font-mono mb-3">
              PLAYERS ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-2 bg-surface border-2 border-border"
                >
                  <div
                    className="w-4 h-4"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="text-text text-sm font-mono">
                    {player.name.toUpperCase()}
                  </span>
                  {player.isLeader && (
                    <span className="text-warning text-xs font-mono">
                      [LEADER]
                    </span>
                  )}
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-2">
                  No players yet
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Toast
        message="LINK COPIED"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
