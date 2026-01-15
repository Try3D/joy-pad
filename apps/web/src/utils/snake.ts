interface Position {
  x: number;
  y: number;
}

interface SnakeEntity {
  id: string;
  body: Position[];
  alive: boolean;
  score: number;
}

function isOccupied(pos: Position, snakes: SnakeEntity[]): boolean {
  return snakes.some((snake) =>
    snake.body.some((seg) => seg.x === pos.x && seg.y === pos.y),
  );
}

export function spawnFood(
  gridWidth: number,
  gridHeight: number,
  snakes: SnakeEntity[],
): Position {
  let food: Position;
  let attempts = 0;
  do {
    food = {
      x: Math.floor(Math.random() * gridWidth),
      y: Math.floor(Math.random() * gridHeight),
    };
    attempts++;
    if (attempts > 100) break;
  } while (isOccupied(food, snakes));
  return food;
}
