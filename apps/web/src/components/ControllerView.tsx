import { useEffect, useState } from "react";
import { useController } from "../hooks/usePartyKit";
import { DPad } from "./controllers/DPadController";
import { KeyboardController } from "./controllers/KeyboardController";
import { getGame } from "../utils/games";
import { Modal } from "./Modal";

interface ControllerViewProps {
  roomCode: string;
  playerName: string;
  onLeave: () => void;
  onKicked: (reason: string) => void;
}

export function ControllerView({
  roomCode,
  playerName,
  onLeave,
}: Omit<ControllerViewProps, "onKicked">) {
  const [showModal, setShowModal] = useState(false);

  const {
    myPlayer,
    sendInput,
    kickPlayer,
    isConnected,
    activeLayout,
    activeConfig,
    isLeader,
    selectGame,
    players,
    currentGameId,
  } = useController({
    roomId: roomCode,
    playerName,
    onKicked: (reason) => {
      onLeave();
      alert(`You were kicked: ${reason}`);
    },
    onError: (msg) => alert(msg),
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      let button: "up" | "down" | "left" | "right" | "a" | null = null;
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          button = "up";
          break;
        case "s":
        case "arrowdown":
          button = "down";
          break;
        case "a":
        case "arrowleft":
          button = "left";
          break;
        case "d":
        case "arrowright":
          button = "right";
          break;
        case " ":
        case "enter":
          button = "a";
          break;
      }

      if (button) {
        sendInput(button, "press");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      let button: "up" | "down" | "left" | "right" | "a" | null = null;
      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          button = "up";
          break;
        case "s":
        case "arrowdown":
          button = "down";
          break;
        case "a":
        case "arrowleft":
          button = "left";
          break;
        case "d":
        case "arrowright":
          button = "right";
          break;
        case " ":
        case "enter":
          button = "a";
          break;
      }

      if (button) {
        sendInput(button, "release");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [sendInput]);

  const selectedGame = currentGameId ? getGame(currentGameId) : null;

  return (
    <div className="h-screen bg-bg flex flex-col">
      <header className="bg-bg-light border-b-2 border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-mono font-bold text-text">JOYPAD</h1>
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
              {isConnected ? "CONN" : "WAIT"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 border-2 border-border bg-surface hover:bg-surface-light text-text transition-colors text-sm font-mono"
            >
              <span>PLAYERS</span>
              <span className="ml-2 bg-border px-1.5 py-0.5 text-xs">
                {players.length}
              </span>
            </button>
            <button
              onClick={onLeave}
              className="text-text-secondary hover:text-text transition-colors text-sm font-mono"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center p-4">
          <div className="text-center">
            <div
              className="w-24 h-24 border-4 mx-auto mb-4 flex items-center justify-center text-4xl font-mono font-bold"
              style={{
                borderColor: myPlayer?.color || "#00ff00",
                color: myPlayer?.color || "#00ff00",
              }}
            >
              {myPlayer?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <h2 className="text-2xl font-mono font-bold text-text mb-2">
              {myPlayer?.name?.toUpperCase()}
            </h2>
            {isLeader && (
              <span className="inline-block px-3 py-1 border-2 border-warning text-warning text-sm font-mono">
                [LEADER]
              </span>
            )}
            <p className="text-text-secondary font-mono text-sm mt-4">
              WATCH THE SCREEN
            </p>
          </div>
        </div>

        <div className="flex-1 bg-bg-dark border-t border-border flex items-center justify-center">
          {activeLayout === "keyboard" ? (
            <KeyboardController
              onInput={sendInput}
              color={myPlayer?.color || "#3B82F6"}
              onRestart={() => {
                if (isLeader) {
                  selectGame("typing");
                } else {
                  alert("Only the leader can restart the game");
                }
              }}
              config={activeConfig}
            />
          ) : (
            <div className="p-6">
              <DPad
                onButtonPress={(button) => sendInput(button, "press")}
                onButtonRelease={(button) => sendInput(button, "release")}
                color={myPlayer?.color || "#3B82F6"}
              />
            </div>
          )}
        </div>
      </main>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="PLAYERS"
      >
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 bg-surface border-2 border-border"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3"
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-text text-sm font-mono">
                  {player.name.toUpperCase()}
                  {player.id === myPlayer?.id && (
                    <span className="text-accent ml-2">[YOU]</span>
                  )}
                </span>
                {player.isLeader && (
                  <span className="text-warning text-xs font-mono ml-2">
                    [LEADER]
                  </span>
                )}
              </div>
              {isLeader && player.id !== myPlayer?.id && (
                <button
                  onClick={() => kickPlayer(player.id)}
                  className="px-2 py-1 text-xs font-mono font-bold border-2 border-error text-error hover:bg-error hover:text-bg transition-colors"
                >
                  [KICK]
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
