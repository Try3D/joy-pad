export const PLAYER_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#F97316",
  "#EC4899",
  "#14B8A6",
] as const;

export const MAX_PLAYERS = 8;

export type ControllerLayout = "dpad" | "keyboard";

export type Button = "up" | "down" | "left" | "right" | "a" | "b" | string;
export type Action = "press" | "release";

export interface Player {
  id: string;
  name: string;
  color: string;
  isLeader: boolean;
}

export interface InputLogEntry {
  sequenceId: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  button: Button;
  action: Action;
  modifiers?: string[];
  timestamp: number;
}

export interface HostConnectMessage {
  type: "host_connect";
}

export interface JoinMessage {
  type: "join";
  name: string;
}

export interface ButtonInputMessage {
  type: "input";
  button: Button;
  action: Action;
  modifiers?: string[];
}

export interface KickMessage {
  type: "kick";
  playerId: string;
}

export interface SelectGameMessage {
  type: "select_game";
  gameId: string;
}

export type ClientMessage =
  | HostConnectMessage
  | JoinMessage
  | ButtonInputMessage
  | KickMessage
  | SelectGameMessage;

export interface HostAckMessage {
  type: "host_ack";
}

export interface JoinedMessage {
  type: "joined";
  playerId: string;
  playerName: string;
  playerColor: string;
  isLeader: boolean;
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  playerId: string;
  playerName: string;
  playerColor: string;
  isLeader: boolean;
}

export interface PlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export interface PlayerKickedMessage {
  type: "player_kicked";
  playerId: string;
  reason: string;
}

export interface LeaderChangedMessage {
  type: "leader_changed";
  playerId: string;
}

export interface PlayerInputMessage {
  type: "player_input";
  sequenceId: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  button: Button;
  action: Action;
  modifiers?: string[];
  timestamp: number;
}

export interface GameSelectedMessage {
  type: "game_selected";
  gameId: string;
  layout: ControllerLayout;
  config?: any;
}

export interface RoomStateMessage {
  type: "room_state";
  players: Player[];
  leaderId: string | null;
  currentGameId: string | null;
  layout: ControllerLayout;
  config?: any;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export type ServerMessage =
  | HostAckMessage
  | JoinedMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerKickedMessage
  | LeaderChangedMessage
  | PlayerInputMessage
  | GameSelectedMessage
  | RoomStateMessage
  | ErrorMessage;

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const ms = date.getMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}.${ms}`;
}
