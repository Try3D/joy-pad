import {
  type ClientMessage,
  type ControllerLayout,
  MAX_PLAYERS,
  PLAYER_COLORS,
  type Player,
  type ServerMessage,
} from "@joypad/shared";
import type * as Party from "partykit/server";
import { COMMON_WORDS } from "./wordList";

export default class RoomServer implements Party.Server {
  party: Party.Party;

  private hostConn: Party.Connection | null = null;

  private players: Map<string, Player> = new Map();
  private leaderId: string | null = null;
  private currentGameId: string | null = null;
  private currentLayout: ControllerLayout = "dpad";
  private currentConfig: any = null;
  private colorIndex = 0;
  private globalSequenceId = 0;

  private readonly GAME_LAYOUTS: Record<string, ControllerLayout> = {
    typing: "keyboard",
    default: "dpad",
  };

  constructor(party: Party.Party) {
    this.party = party;
  }

  onConnect(conn: Party.Connection) {
    console.log(`[${this.party.id}] Connection opened: ${conn.id}`);
  }

  onMessage(message: string, sender: Party.Connection) {
    let data: ClientMessage;

    try {
      data = JSON.parse(message);
    } catch {
      this.sendError(sender, "Invalid message format");
      return;
    }

    switch (data.type) {
      case "host_connect":
        this.handleHostConnect(sender);
        break;

      case "join":
        this.handleJoin(sender, data.name);
        break;

      case "input":
        this.handleInput(sender, data.button, data.action, data.modifiers);
        break;

      case "kick":
        this.handleKick(sender, data.playerId);
        break;

      case "select_game":
        this.handleSelectGame(sender, data.gameId);
        break;

      default:
        this.sendError(sender, "Unknown message type");
    }
  }

  onClose(conn: Party.Connection) {
    if (this.hostConn?.id === conn.id) {
      console.log(`[${this.party.id}] Host screen disconnected`);
      this.hostConn = null;
      return;
    }

    const player = this.players.get(conn.id);
    if (!player) return;

    console.log(`[${this.party.id}] Player left: ${player.name}`);
    this.players.delete(conn.id);

    if (this.hostConn) {
      this.send(this.hostConn, {
        type: "player_left",
        playerId: player.id,
      });
    }

    this.broadcastToPlayers({
      type: "player_left",
      playerId: player.id,
    });

    if (this.leaderId === conn.id) {
      this.assignNewLeader();
    }
  }

  private handleHostConnect(conn: Party.Connection) {
    if (this.hostConn) {
      console.log(`[${this.party.id}] Replacing host screen connection`);
    }

    this.hostConn = conn;
    console.log(`[${this.party.id}] Host screen connected`);

    this.send(conn, { type: "host_ack" });

    this.send(conn, {
      type: "room_state",
      players: Array.from(this.players.values()),
      leaderId: this.leaderId,
      currentGameId: this.currentGameId,
      layout: this.currentLayout,
      config: this.currentConfig,
    });
  }

  private handleJoin(conn: Party.Connection, name: string) {
    if (this.players.has(conn.id)) {
      console.log(`[${this.party.id}] Player ${conn.id} already joined`);
      return;
    }

    if (this.players.size >= MAX_PLAYERS) {
      this.sendError(conn, "Room is full");
      return;
    }

    const cleanName = name.trim().slice(0, 20) || "Anonymous";

    const isLeader = this.players.size === 0;

    const player: Player = {
      id: conn.id,
      name: cleanName,
      color: PLAYER_COLORS[this.colorIndex % PLAYER_COLORS.length],
      isLeader,
    };
    this.colorIndex++;

    this.players.set(conn.id, player);

    if (isLeader) {
      this.leaderId = conn.id;
    }

    console.log(
      `[${this.party.id}] Player joined: ${player.name} (leader: ${isLeader})`,
    );

    this.send(conn, {
      type: "joined",
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isLeader: player.isLeader,
    });

    this.send(conn, {
      type: "room_state",
      players: Array.from(this.players.values()),
      leaderId: this.leaderId,
      currentGameId: this.currentGameId,
      layout: this.currentLayout,
      config: this.currentConfig,
    });

    if (this.hostConn) {
      this.send(this.hostConn, {
        type: "player_joined",
        playerId: player.id,
        playerName: player.name,
        playerColor: player.color,
        isLeader: player.isLeader,
      });
    }

    this.broadcastToPlayersExcept(conn.id, {
      type: "player_joined",
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      isLeader: player.isLeader,
    });
  }

  private handleInput(
    conn: Party.Connection,
    button: string,
    action: string,
    modifiers?: string[],
  ) {
    const player = this.players.get(conn.id);
    if (!player) return;

    const inputMsg: ServerMessage = {
      type: "player_input",
      sequenceId: ++this.globalSequenceId,
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      button: button,
      action: action as "press" | "release",
      modifiers,
      timestamp: Date.now(),
    };

    if (this.hostConn) {
      this.send(this.hostConn, inputMsg);
    }

    this.broadcastToPlayers(inputMsg);
  }

  private handleKick(sender: Party.Connection, targetPlayerId: string) {
    if (this.leaderId !== sender.id) {
      this.sendError(sender, "Only the leader can kick players");
      return;
    }

    if (targetPlayerId === sender.id) {
      this.sendError(sender, "You can't kick yourself");
      return;
    }

    const targetPlayer = this.players.get(targetPlayerId);
    if (!targetPlayer) {
      this.sendError(sender, "Player not found");
      return;
    }

    console.log(`[${this.party.id}] Leader kicked: ${targetPlayer.name}`);

    const kickMsg: ServerMessage = {
      type: "player_kicked",
      playerId: targetPlayerId,
      reason: "Kicked by leader",
    };

    for (const conn of this.party.getConnections()) {
      if (conn.id === targetPlayerId) {
        this.send(conn, kickMsg);
        break;
      }
    }

    this.players.delete(targetPlayerId);

    if (this.hostConn) {
      this.send(this.hostConn, kickMsg);
    }

    this.broadcastToPlayers(kickMsg);

    for (const conn of this.party.getConnections()) {
      if (conn.id === targetPlayerId) {
        conn.close();
        break;
      }
    }
  }

  private handleSelectGame(sender: Party.Connection, gameId: string) {
    const isHost = this.hostConn?.id === sender.id;
    const isLeader = this.leaderId === sender.id;

    if (!isHost && !isLeader) {
      this.sendError(sender, "Only the leader can select games");
      return;
    }

    this.currentGameId = gameId || null;

    this.currentLayout = this.GAME_LAYOUTS[gameId] || "dpad";

    this.currentConfig = null;
    if (gameId === "typing") {
      const allWords = COMMON_WORDS;
      const wordCount = 30;
      const selectedWords: string[] = [];

      for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * allWords.length);
        selectedWords.push(allWords[randomIndex]);
      }

      this.currentConfig = {
        text: selectedWords.join(" "),
      };
    }

    console.log(
      `[${this.party.id}] Game selected: ${gameId || "none"} (layout: ${this.currentLayout})`,
    );

    const gameMsg: ServerMessage = {
      type: "game_selected",
      gameId,
      layout: this.currentLayout,
      config: this.currentConfig,
    };

    if (this.hostConn) {
      this.send(this.hostConn, gameMsg);
    }

    this.broadcastToPlayers(gameMsg);
  }

  private assignNewLeader() {
    const firstPlayer = this.players.values().next().value;

    if (firstPlayer) {
      this.leaderId = firstPlayer.id;
      firstPlayer.isLeader = true;

      console.log(`[${this.party.id}] New leader: ${firstPlayer.name}`);

      const leaderMsg: ServerMessage = {
        type: "leader_changed",
        playerId: firstPlayer.id,
      };

      if (this.hostConn) {
        this.send(this.hostConn, leaderMsg);
      }

      this.broadcastToPlayers(leaderMsg);
    } else {
      this.leaderId = null;
      this.currentGameId = null;
      this.colorIndex = 0;
      this.currentLayout = "dpad";
      this.currentConfig = null;
      console.log(`[${this.party.id}] No players left`);
    }
  }

  private send(conn: Party.Connection, message: ServerMessage) {
    conn.send(JSON.stringify(message));
  }

  private broadcastToPlayers(message: ServerMessage) {
    const msg = JSON.stringify(message);
    for (const conn of this.party.getConnections()) {
      if (this.players.has(conn.id)) {
        conn.send(msg);
      }
    }
  }

  private broadcastToPlayersExcept(excludeId: string, message: ServerMessage) {
    const msg = JSON.stringify(message);
    for (const conn of this.party.getConnections()) {
      if (this.players.has(conn.id) && conn.id !== excludeId) {
        conn.send(msg);
      }
    }
  }

  private sendError(conn: Party.Connection, message: string) {
    this.send(conn, { type: "error", message });
  }
}
