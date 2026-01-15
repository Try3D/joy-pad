import type { InputLogEntry, Player } from "@joypad/shared";
import { useCallback, useEffect, useRef } from "react";

interface PongProps {
  players: Player[];
  inputLog: InputLogEntry[];
}

const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 12;
const PADDLE_SPEED = 8;
const BALL_SIZE = 12;
const BALL_SPEED = 5;
const WINNING_SCORE = 5;

const AI_REACTION_SPEED = 4;
const AI_PREDICTION_ERROR = 30;
const AI_DEAD_ZONE = 20;
const AI_MISTAKE_CHANCE = 0.15;

interface GameState {
  paddle1Y: number;
  paddle2Y: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  score1: number;
  score2: number;
  status: "waiting" | "playing" | "paused" | "gameover";
  winner: 1 | 2 | null;
  paddle1Up: boolean;
  paddle1Down: boolean;
  paddle2Up: boolean;
  paddle2Down: boolean;
  aiTargetY: number;
  isVsAI: boolean;
}

export function Pong({ players, inputLog }: PongProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastInputIndexRef = useRef<number>(0);

  const initGameState = useCallback(
    (canvas: HTMLCanvasElement, vsAI: boolean): GameState => {
      const centerY = canvas.height / 2;
      return {
        paddle1Y: centerY,
        paddle2Y: centerY,
        ballX: canvas.width / 2,
        ballY: canvas.height / 2,
        ballVX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        ballVY: BALL_SPEED * (Math.random() * 0.6 - 0.3),
        score1: 0,
        score2: 0,
        status: "waiting",
        winner: null,
        paddle1Up: false,
        paddle1Down: false,
        paddle2Up: false,
        paddle2Down: false,
        aiTargetY: centerY,
        isVsAI: vsAI,
      };
    },
    [],
  );

  const resetBall = useCallback(
    (state: GameState, canvas: HTMLCanvasElement, direction: 1 | -1) => {
      state.ballX = canvas.width / 2;
      state.ballY = canvas.height / 2;
      state.ballVX = BALL_SPEED * direction;
      state.ballVY = BALL_SPEED * (Math.random() * 0.6 - 0.3);
    },
    [],
  );

  const processInputs = useCallback(
    (state: GameState) => {
      const newInputs = inputLog.slice(lastInputIndexRef.current);
      if (newInputs.length === 0) return;

      lastInputIndexRef.current = inputLog.length;

      for (const input of newInputs) {
        if (input.button === "a" && input.action === "press") {
          if (state.status === "waiting" && players.length >= 1) {
            state.status = "playing";
          }
        }

        const playerIndex = players.findIndex((p) => p.id === input.playerId);
        if (playerIndex === -1) continue;

        const isPress = input.action === "press";

        if (playerIndex === 0) {
          if (input.button === "up") state.paddle1Up = isPress;
          if (input.button === "down") state.paddle1Down = isPress;
        } else if (playerIndex === 1) {
          if (input.button === "up") state.paddle2Up = isPress;
          if (input.button === "down") state.paddle2Down = isPress;
        }
      }
    },
    [inputLog, players],
  );

  const updateGame = useCallback(
    (state: GameState, canvas: HTMLCanvasElement) => {
      if (state.status !== "playing") return;

      const halfPaddle = PADDLE_HEIGHT / 2;
      const padding = 30;

      if (state.paddle1Up) {
        state.paddle1Y = Math.max(halfPaddle, state.paddle1Y - PADDLE_SPEED);
      }
      if (state.paddle1Down) {
        state.paddle1Y = Math.min(
          canvas.height - halfPaddle,
          state.paddle1Y + PADDLE_SPEED,
        );
      }

      if (state.isVsAI) {
        if (state.ballVX > 0) {
          const timeToReach =
            (canvas.width - padding - PADDLE_WIDTH - state.ballX) /
            state.ballVX;
          let predictedY = state.ballY + state.ballVY * timeToReach;

          while (predictedY < 0 || predictedY > canvas.height) {
            if (predictedY < 0) {
              predictedY = -predictedY;
            } else if (predictedY > canvas.height) {
              predictedY = 2 * canvas.height - predictedY;
            }
          }

          state.aiTargetY =
            predictedY + (Math.random() - 0.5) * AI_PREDICTION_ERROR;
        } else {
          state.aiTargetY = canvas.height / 2;
        }

        const targetY = state.aiTargetY;
        const diff = targetY - state.paddle2Y;

        if (Math.abs(diff) > AI_DEAD_ZONE) {
          if (diff > 0) {
            state.paddle2Y = Math.min(
              canvas.height - halfPaddle,
              state.paddle2Y + AI_REACTION_SPEED,
            );
          } else {
            state.paddle2Y = Math.max(
              halfPaddle,
              state.paddle2Y - AI_REACTION_SPEED,
            );
          }
        }

        if (Math.random() < 0.02) {
          const shouldMakeMistake = Math.random() < AI_MISTAKE_CHANCE;
          if (shouldMakeMistake) {
            state.aiTargetY =
              state.ballY + (Math.random() - 0.5) * PADDLE_HEIGHT * 2;
          } else {
            state.aiTargetY =
              state.ballY + (Math.random() - 0.5) * AI_PREDICTION_ERROR;
          }

          state.aiTargetY = Math.max(
            halfPaddle,
            Math.min(canvas.height - halfPaddle, state.aiTargetY),
          );
        }
      } else {
        if (state.paddle2Up) {
          state.paddle2Y = Math.max(halfPaddle, state.paddle2Y - PADDLE_SPEED);
        }
        if (state.paddle2Down) {
          state.paddle2Y = Math.min(
            canvas.height - halfPaddle,
            state.paddle2Y + PADDLE_SPEED,
          );
        }
      }

      state.ballX += state.ballVX;
      state.ballY += state.ballVY;

      if (
        state.ballY <= BALL_SIZE / 2 ||
        state.ballY >= canvas.height - BALL_SIZE / 2
      ) {
        state.ballVY = -state.ballVY;
        state.ballY = Math.max(
          BALL_SIZE / 2,
          Math.min(canvas.height - BALL_SIZE / 2, state.ballY),
        );
      }

      if (
        state.ballX - BALL_SIZE / 2 <= padding + PADDLE_WIDTH &&
        state.ballX - BALL_SIZE / 2 >= padding &&
        state.ballY >= state.paddle1Y - halfPaddle &&
        state.ballY <= state.paddle1Y + halfPaddle
      ) {
        state.ballVX = Math.abs(state.ballVX) * 1.05;

        const hitPos = (state.ballY - state.paddle1Y) / halfPaddle;
        state.ballVY = hitPos * BALL_SPEED;
        state.ballX = padding + PADDLE_WIDTH + BALL_SIZE / 2;
      }

      if (
        state.ballX + BALL_SIZE / 2 >= canvas.width - padding - PADDLE_WIDTH &&
        state.ballX + BALL_SIZE / 2 <= canvas.width - padding &&
        state.ballY >= state.paddle2Y - halfPaddle &&
        state.ballY <= state.paddle2Y + halfPaddle
      ) {
        state.ballVX = -Math.abs(state.ballVX) * 1.05;
        const hitPos = (state.ballY - state.paddle2Y) / halfPaddle;
        state.ballVY = hitPos * BALL_SPEED;
        state.ballX = canvas.width - padding - PADDLE_WIDTH - BALL_SIZE / 2;
      }

      if (state.ballX < 0) {
        state.score2++;
        if (state.score2 >= WINNING_SCORE) {
          state.status = "gameover";
          state.winner = 2;
        } else {
          resetBall(state, canvas, 1);
        }
      }
      if (state.ballX > canvas.width) {
        state.score1++;
        if (state.score1 >= WINNING_SCORE) {
          state.status = "gameover";
          state.winner = 1;
        } else {
          resetBall(state, canvas, -1);
        }
      }
    },
    [resetBall],
  );

  const render = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      state: GameState,
      canvas: HTMLCanvasElement,
    ) => {
      const padding = 30;

      ctx.fillStyle = "#282c34";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "#5c6370";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      const p1Color = players[0]?.color || "#61afef";
      const p2Color = state.isVsAI ? "#d19a66" : players[1]?.color || "#98c379";

      ctx.fillStyle = p1Color;
      ctx.fillRect(
        padding,
        Math.floor(state.paddle1Y - PADDLE_HEIGHT / 2),
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      ctx.fillStyle = p2Color;
      ctx.fillRect(
        canvas.width - padding - PADDLE_WIDTH,
        Math.floor(state.paddle2Y - PADDLE_HEIGHT / 2),
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      ctx.fillStyle = "#abb2bf";
      ctx.fillRect(
        Math.floor(state.ballX - BALL_SIZE / 2),
        Math.floor(state.ballY - BALL_SIZE / 2),
        BALL_SIZE,
        BALL_SIZE,
      );

      ctx.font = 'bold 48px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.fillStyle = p1Color;
      ctx.fillText(
        state.score1.toString().padStart(2, "0"),
        canvas.width / 4,
        60,
      );
      ctx.fillStyle = p2Color;
      ctx.fillText(
        state.score2.toString().padStart(2, "0"),
        (canvas.width * 3) / 4,
        60,
      );

      ctx.font = '16px "Courier New", monospace';
      ctx.fillStyle = p1Color;
      ctx.fillText(
        (players[0]?.name || "P1").toUpperCase(),
        canvas.width / 4,
        85,
      );
      ctx.fillStyle = p2Color;
      ctx.fillText(
        state.isVsAI ? "[AI]" : (players[1]?.name || "P2").toUpperCase(),
        (canvas.width * 3) / 4,
        85,
      );

      if (state.status === "waiting") {
        ctx.fillStyle = "rgba(40, 44, 52, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#abb2bf";
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = "center";
        ctx.fillText("PONG", canvas.width / 2, canvas.height / 2 - 40);

        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = "#5c6370";
        if (players.length === 1) {
          ctx.fillText(
            "// PRESS [A] TO PLAY VS AI",
            canvas.width / 2,
            canvas.height / 2 + 20,
          );
        } else {
          ctx.fillText(
            `// ${players.length} PLAYERS - PRESS [A] TO START`,
            canvas.width / 2,
            canvas.height / 2 + 20,
          );
        }
      }

      if (state.status === "gameover") {
        ctx.fillStyle = "rgba(40, 44, 52, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const winnerColor = state.winner === 1 ? p1Color : p2Color;
        ctx.fillStyle = winnerColor;
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = "center";
        const winnerName =
          state.winner === 1
            ? (players[0]?.name || "P1").toUpperCase()
            : state.isVsAI
              ? "[AI]"
              : (players[1]?.name || "P2").toUpperCase();
        ctx.fillText(
          `${winnerName} WINS!`,
          canvas.width / 2,
          canvas.height / 2 - 20,
        );

        ctx.font = '18px "Courier New", monospace';
        ctx.fillStyle = "#5c6370";
        ctx.fillText(
          "// PRESS [A] TO PLAY AGAIN",
          canvas.width / 2,
          canvas.height / 2 + 20,
        );
      }
    },
    [players],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isVsAI = players.length === 1;

    if (!gameStateRef.current) {
      gameStateRef.current = initGameState(canvas, isVsAI);
    }

    const state = gameStateRef.current;

    state.isVsAI = isVsAI;

    const gameLoop = () => {
      const currentState = gameStateRef.current;
      if (!currentState) return;

      processInputs(currentState);

      if (currentState.status === "gameover") {
        const recentInputs = inputLog.slice(-10);
        const hasAPress = recentInputs.some(
          (input) => input.button === "a" && input.action === "press",
        );
        if (hasAPress) {
          const newState = initGameState(canvas, isVsAI);
          newState.status = "playing";
          gameStateRef.current = newState;
          lastInputIndexRef.current = inputLog.length;
        }
      }

      const finalState = gameStateRef.current;
      if (!finalState) return;
      updateGame(finalState, canvas);
      render(ctx, finalState, canvas);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [initGameState, processInputs, updateGame, render, players, inputLog]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      if (gameStateRef.current) {
        gameStateRef.current.paddle1Y = Math.min(
          Math.max(PADDLE_HEIGHT / 2, gameStateRef.current.paddle1Y),
          canvas.height - PADDLE_HEIGHT / 2,
        );
        gameStateRef.current.paddle2Y = Math.min(
          Math.max(PADDLE_HEIGHT / 2, gameStateRef.current.paddle2Y),
          canvas.height - PADDLE_HEIGHT / 2,
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full h-full bg-bg-dark overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
