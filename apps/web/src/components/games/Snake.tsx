import type { InputLogEntry, Player } from "@joypad/shared";
import { useCallback, useEffect, useRef } from "react";
import { spawnFood } from "../../utils/snake";

interface SnakeProps {
  players: Player[];
  inputLog: InputLogEntry[];
}

interface Position {
  x: number;
  y: number;
}

interface SnakeEntity {
  id: string;
  body: Position[];
  direction: "up" | "down" | "left" | "right";
  nextDirection: "up" | "down" | "left" | "right";
  color: string;
  alive: boolean;
  score: number;
}

interface SnakeState {
  snakes: SnakeEntity[];
  food: Position;
  status: "waiting" | "playing" | "gameover" | "winner";
  winner?: string;
  gridWidth: number;
  gridHeight: number;
  restartRequested?: boolean;
}

const CELL_SIZE = 40;
const GAME_SPEED = 120;

export function Snake({ players, inputLog }: SnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<SnakeState | null>(null);
  const gameLoopRef = useRef<number>(0);
  const lastInputIndexRef = useRef<number>(0);

  const initGameState = useCallback(
    (canvas: HTMLCanvasElement): SnakeState => {
      const gridWidth = Math.floor(canvas.width / CELL_SIZE);
      const gridHeight = Math.floor(canvas.height / CELL_SIZE);

      const snakes: SnakeEntity[] = players.map((player, index) => {
        const startX = 5;
        const spacing = Math.floor(gridHeight / (players.length + 1));
        const startY = spacing * (index + 1);

        const direction: "up" | "down" | "left" | "right" = "right";

        return {
          id: player.id,
          body: [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
          ],
          direction,
          nextDirection: direction,
          color: player.color,
          alive: true,
          score: 0,
        };
      });

      return {
        snakes,
        food: spawnFood(gridWidth, gridHeight, snakes),
        status: "waiting",
        gridWidth,
        gridHeight,
      };
    },
    [players],
  );

  const processInputs = useCallback(
    (state: SnakeState) => {
      const newInputs = inputLog.slice(lastInputIndexRef.current);
      if (newInputs.length === 0) return;

      lastInputIndexRef.current = inputLog.length;

      for (const input of newInputs) {
        if (input.action !== "press") continue;

        if (input.button === "a") {
          if (state.status === "waiting" && players.length >= 1) {
            state.status = "playing";
          } else if (state.status === "gameover" || state.status === "winner") {
            state.restartRequested = true;
          }
          continue;
        }

        const snake = state.snakes.find((s) => s.id === input.playerId);
        if (!snake || !snake.alive) continue;

        switch (input.button) {
          case "up":
            if (snake.direction !== "down") snake.nextDirection = "up";
            break;
          case "down":
            if (snake.direction !== "up") snake.nextDirection = "down";
            break;
          case "left":
            if (snake.direction !== "right") snake.nextDirection = "left";
            break;
          case "right":
            if (snake.direction !== "left") snake.nextDirection = "right";
            break;
        }
      }
    },
    [inputLog, players],
  );

  const updateGame = useCallback((state: SnakeState) => {
    if (
      state.status === "waiting" &&
      (state.snakes.some((s) => !s.alive) || state.winner)
    ) {
      return;
    }

    if (state.status !== "playing") return;

    state.snakes.forEach((snake) => {
      if (!snake.alive) return;

      snake.direction = snake.nextDirection;
      const head = snake.body[0];
      const newHead = { ...head };

      switch (snake.direction) {
        case "up":
          newHead.y -= 1;
          break;
        case "down":
          newHead.y += 1;
          break;
        case "left":
          newHead.x -= 1;
          break;
        case "right":
          newHead.x += 1;
          break;
      }

      // Wrapping Logic
      newHead.x = (newHead.x + state.gridWidth) % state.gridWidth;
      newHead.y = (newHead.y + state.gridHeight) % state.gridHeight;

      snake.body.unshift(newHead); // Add new head
    });

    // Check Collisions (Snake vs Snake, Head vs Body)
    // We check collisions AFTER moving all heads to detect head-to-head properly
    const crashedSnakes = new Set<string>();

    state.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const head = snake.body[0];

      // Self Collision (start from index 1)
      if (
        snake.body.slice(1).some((seg) => seg.x === head.x && seg.y === head.y)
      ) {
        crashedSnakes.add(snake.id);
      }

      // Collision with other snakes
      state.snakes.forEach((otherSnake) => {
        if (otherSnake.id === snake.id || !otherSnake.alive) return;

        // Check head vs other body
        if (
          otherSnake.body.some((seg) => seg.x === head.x && seg.y === head.y)
        ) {
          crashedSnakes.add(snake.id);
        }
      });
    });

    // Check Head-to-Head (special case where two heads land on same spot)
    for (let i = 0; i < state.snakes.length; i++) {
      for (let j = i + 1; j < state.snakes.length; j++) {
        const s1 = state.snakes[i];
        const s2 = state.snakes[j];
        if (
          s1.alive &&
          s2.alive &&
          s1.body[0].x === s2.body[0].x &&
          s1.body[0].y === s2.body[0].y
        ) {
          crashedSnakes.add(s1.id);
          crashedSnakes.add(s2.id);
        }
      }
    }

    // Apply deaths
    crashedSnakes.forEach((id) => {
      const snake = state.snakes.find((s) => s.id === id);
      if (snake) snake.alive = false;
    });

    // Handle Food (only for survivors)
    let foodEaten = false;
    state.snakes.forEach((snake) => {
      if (!snake.alive) return;
      const head = snake.body[0];

      if (head.x === state.food.x && head.y === state.food.y) {
        snake.score += 10;
        foodEaten = true;
        // Provide visual feedback or sound here if possible
      } else {
        // Tail shrinking (if not ate food)
        snake.body.pop();
      }
    });

    if (foodEaten) {
      state.food = spawnFood(state.gridWidth, state.gridHeight, state.snakes);
    }

    // Game Over / Win Condition
    const survivors = state.snakes.filter((s) => s.alive);
    if (state.snakes.length > 1) {
      // Multiplayer: Game ends when 0 or 1 player left
      if (survivors.length === 1) {
        state.status = "winner";
        state.winner = survivors[0].id;
      } else if (survivors.length === 0) {
        state.status = "gameover"; // Draw
      }
    } else {
      // Single player: Game ends when dead
      if (survivors.length === 0) {
        state.status = "gameover";
      }
    }
  }, []);

  // Render game
  const render = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      state: SnakeState,
      canvas: HTMLCanvasElement,
    ) => {
      // Clear canvas with One Dark bg
      ctx.fillStyle = "#282c34";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid (optional, pixel art style)
      ctx.strokeStyle = "#3e4451";
      ctx.lineWidth = 1;
      for (let x = 0; x <= state.gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= state.gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
      }

      // Draw food (square pixel, no glow)
      ctx.fillStyle = "#e06c75"; // One Dark red
      ctx.fillRect(
        state.food.x * CELL_SIZE,
        state.food.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
      );

      // Draw Snakes (square pixels)
      state.snakes.forEach((snake) => {
        ctx.fillStyle = snake.alive ? snake.color : "#5c6370"; // Gray if dead

        snake.body.forEach((segment, index) => {
          const isHead = index === 0;

          // Draw square pixel
          ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE,
          );

          // Draw eyes on head (simple pixels)
          if (isHead && snake.alive) {
            ctx.fillStyle = "#282c34"; // Dark eyes
            const eyeSize = 3;
            const offset = CELL_SIZE / 4;
            // Two small square eyes
            ctx.fillRect(
              segment.x * CELL_SIZE + offset,
              segment.y * CELL_SIZE + offset,
              eyeSize,
              eyeSize,
            );
            ctx.fillRect(
              segment.x * CELL_SIZE + CELL_SIZE - offset - eyeSize,
              segment.y * CELL_SIZE + offset,
              eyeSize,
              eyeSize,
            );
            ctx.fillStyle = snake.color; // Restore
          }
        });
      });

      // Draw HUD (Scores) - monospace, terminal style
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = "left";

      // Draw scores in top corners
      players.forEach((p, i) => {
        const snake = state.snakes.find((s) => s.id === p.id);
        const score = snake?.score || 0;
        const color = p.color;

        ctx.fillStyle = color;
        // P1 TopLeft, P2 TopRight, etc.
        let x = 20;
        const y = 30;
        if (i === 1) {
          x = canvas.width - 20;
          ctx.textAlign = "right";
        }

        ctx.fillText(
          `${p.name.toUpperCase()}: ${score.toString().padStart(3, "0")}`,
          x,
          y,
        );
        ctx.textAlign = "left"; // Reset
      });

      // Status Messages (terminal style)
      ctx.textAlign = "center";
      const midX = canvas.width / 2;
      const midY = canvas.height / 2;

      if (state.status === "waiting") {
        ctx.fillStyle = "rgba(40, 44, 52, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#abb2bf";
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillText("SNAKE", midX, midY - 60);

        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = "#5c6370";
        ctx.fillText(
          `// ${players.length}/${state.snakes.length} PLAYERS`,
          midX,
          midY - 10,
        );

        ctx.fillStyle = "#98c379"; // Green
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillText("[A] START", midX, midY + 40);
      } else if (state.status === "gameover") {
        ctx.fillStyle = "rgba(40, 44, 52, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#e06c75"; // Red
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillText("GAME OVER", midX, midY - 20);

        ctx.fillStyle = "#5c6370";
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText("// PRESS [A] TO RESTART", midX, midY + 40);
      } else if (state.status === "winner") {
        ctx.fillStyle = "rgba(40, 44, 52, 0.95)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const winnerName = (
          players.find((p) => p.id === state.winner)?.name || "UNKNOWN"
        ).toUpperCase();

        ctx.fillStyle = "#e5c07b"; // Yellow/Gold
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.fillText("WINNER!", midX, midY - 40);

        ctx.fillStyle = "#abb2bf";
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillText(winnerName, midX, midY + 20);

        ctx.font = '24px "Courier New", monospace';
        ctx.fillStyle = "#5c6370";
        ctx.fillText("// PRESS [A] TO RESTART", midX, midY + 70);
      }
    },
    [players],
  );

  // Main Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reset loop
    const startGame = () => {
      gameStateRef.current = initGameState(canvas);
      lastInputIndexRef.current = inputLog.length;
    };

    if (!gameStateRef.current) {
      startGame();
    }

    let lastTime = 0;
    const loop = (timestamp: number) => {
      const state = gameStateRef.current;
      if (!state) return;

      // Handle restart request from inside inputs
      if (state.restartRequested) {
        gameStateRef.current = initGameState(canvas);
        // Reset input log index so we don't replay old inputs?
        // Actually nice to keep them, but index needs to be current.
        lastInputIndexRef.current = inputLog.length;
        return; // Skip this frame
      }

      processInputs(state);

      // Re-check restart after processing inputs (in case an input triggered it just now)
      if (state.restartRequested) {
        gameStateRef.current = initGameState(canvas);
        lastInputIndexRef.current = inputLog.length;
        return;
      }

      if (timestamp - lastTime >= GAME_SPEED) {
        updateGame(state);
        lastTime = timestamp;
      }

      render(ctx, state, canvas);
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [initGameState, processInputs, updateGame, render, inputLog]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !canvasRef.current.parentElement) return;
      canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
      canvasRef.current.height = canvasRef.current.parentElement.clientHeight;
      // Re-init on resize to fit grid
      if (gameStateRef.current) {
        const newState = initGameState(canvasRef.current);
        // Preserve status if playing? No, grid changes breaks positions. Reset is safer.
        gameStateRef.current = newState;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [initGameState]);

  return (
    <div className="w-full h-full bg-bg relative">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
