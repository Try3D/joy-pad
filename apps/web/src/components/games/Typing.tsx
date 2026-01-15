import type { InputLogEntry, Player } from "@joypad/shared";
import { useMemo, useRef } from "react";
import { calculateWPM } from "../../utils/typing";

interface TypingProps {
  players: Player[];
  inputLog: InputLogEntry[];
  config?: { text: string };
}

interface PlayerProgress {
  id: string;
  cursorIndex: number;
  wpm: number;
  finished: boolean;
  color: string;
  name: string;
}

export function Typing({ players, inputLog, config }: TypingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const targetText =
    config?.text || "The quick brown fox jumps over the lazy dog.";

  const playersProgress = useMemo(() => {
    const progressMap = new Map<string, PlayerProgress>();

    players.forEach((p) => {
      progressMap.set(p.id, {
        id: p.id,
        cursorIndex: 0,
        wpm: 0,
        finished: false,
        color: p.color,
        name: p.name,
      });
    });

    let matchStartTime: number | null = null;

    inputLog.forEach((input) => {
      if (!progressMap.has(input.playerId)) return;
      const state = progressMap.get(input.playerId)!;

      if (!matchStartTime) matchStartTime = input.timestamp;

      const elapsedMin = (input.timestamp - matchStartTime) / 1000 / 60;

      if (input.action === "press") {
        const char = input.button;

        if (char.length === 1) {
          if (targetText[state.cursorIndex] === char) {
            state.cursorIndex++;
          }
        }

        if (state.cursorIndex >= targetText.length) {
          state.finished = true;
          state.cursorIndex = targetText.length;
        }

        if (elapsedMin > 0) {
          state.wpm = calculateWPM(
            state.cursorIndex,
            matchStartTime,
            input.timestamp,
          );
        }
      }
    });

    return Array.from(progressMap.values());
  }, [players, inputLog, targetText]);

  const allPlayersFinished = useMemo(() => {
    if (players.length === 0) return false;
    return playersProgress.every((p) => p.finished);
  }, [playersProgress, players.length]);

  return (
    <div
      className="flex flex-col h-full items-center justify-center p-8 max-w-4xl mx-auto"
      ref={containerRef}
    >
      <h2 className="text-4xl font-mono font-bold text-accent mb-4 tracking-widest">
        TYPE RACER
      </h2>
      <p className="text-text-secondary font-mono mb-12 text-sm">
        LEADER: PRESS RESTART ON CONTROLLER TO PLAY AGAIN
      </p>

      {allPlayersFinished && (
        <div className="mb-8 p-6 border-4 border-accent bg-accent/10 animate-pulse">
          <p className="text-accent font-mono text-xl font-bold text-center">
            ALL PLAYERS FINISHED!
          </p>
          <p className="text-text font-mono text-center mt-2">
            LEADER: PRESS [SPACE] TO RESTART
          </p>
        </div>
      )}

      <div className="relative text-3xl font-mono leading-relaxed mb-16 break-words w-full bg-surface p-8 border-2 border-border">
        {targetText.split("").map((char, index) => {
          const cursorsAtPos = playersProgress.filter(
            (p) => p.cursorIndex === index,
          );

          return (
            <span key={index} className="relative inline-block whitespace-pre">
              <span
                className={`
                ${charsCompletedByLeader(index, playersProgress) ? "text-text" : "text-text/30"}
              `}
              >
                {char === " " ? " " : char}
              </span>

              {cursorsAtPos.map((p) => (
                <span
                  key={p.id}
                  className="absolute left-0 top-0 bottom-0 w-1 animate-pulse"
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                />
              ))}
            </span>
          );
        })}
      </div>

      <div className="w-full grid grid-cols-2 gap-4">
        {playersProgress
          .sort((a, b) => b.cursorIndex - a.cursorIndex)
          .map((p) => (
            <div
              key={p.id}
              className={`
              flex items-center justify-between p-4 border-2
              ${p.finished ? "border-accent bg-accent/10" : "border-border bg-bg-light"}
            `}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4" style={{ backgroundColor: p.color }} />
                <span className="font-mono font-bold text-lg">{p.name}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-text-secondary font-mono">
                    WPM
                  </div>
                  <div className="text-xl font-mono font-bold">{p.wpm}</div>
                </div>
                <div className="text-right w-16">
                  <div className="text-xs text-text-secondary font-mono">
                    PROG
                  </div>
                  <div className="text-xl font-mono font-bold">
                    {Math.floor((p.cursorIndex / targetText.length) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function charsCompletedByLeader(
  index: number,
  progress: PlayerProgress[],
) {
  const maxIndex = Math.max(...progress.map((p) => p.cursorIndex));
  return index < maxIndex;
}
