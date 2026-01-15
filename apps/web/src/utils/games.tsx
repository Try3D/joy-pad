import type { InputLogEntry, Player } from "@joypad/shared";
import { Pong } from "../components/games/Pong";
import { Snake } from "../components/games/Snake";
import { Typing } from "../components/games/Typing";

export interface GameProps {
  players: Player[];
  inputLog: InputLogEntry[];
  config?: any;
}

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  component: React.ComponentType<GameProps>;
  thumbnail?: string;
}

export const games: GameDefinition[] = [
  {
    id: "pong",
    name: "Pong",
    description: "Classic paddle game. Play vs AI or 2-player!",
    minPlayers: 1,
    maxPlayers: 2,
    component: Pong,
    thumbnail: "/assets/pong.png",
  },
  {
    id: "snake",
    name: "Snake",
    description: "Guide your snake to eat food and grow longer.",
    minPlayers: 1,
    maxPlayers: 4,
    component: Snake,
    thumbnail: "/assets/snake.png",
  },
  {
    id: "typing",
    name: "Type Racer",
    description: "Race to type the quote faster than your opponents!",
    minPlayers: 1,
    maxPlayers: 8,
    component: Typing,
    thumbnail: "/assets/typing.png",
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return games.find((g) => g.id === id);
}
