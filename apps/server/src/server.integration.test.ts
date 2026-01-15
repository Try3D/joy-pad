import type { ClientMessage, ServerMessage } from "@joypad/shared";
import { afterEach, describe, expect, it } from "vitest";
import WebSocket from "ws";

const SERVER_URL = "ws://localhost:1999/party";

function createConnection(roomId: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${SERVER_URL}/${roomId}`);
    ws.on("open", () => resolve(ws));
    ws.on("error", reject);
  });
}

function send(ws: WebSocket, message: ClientMessage): void {
  ws.send(JSON.stringify(message));
}

function waitForMessage(
  ws: WebSocket,
  type: string,
  timeout = 5000,
): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for message type: ${type}`));
    }, timeout);

    const handler = (data: WebSocket.Data) => {
      const message: ServerMessage = JSON.parse(data.toString());
      if (message.type === type) {
        clearTimeout(timer);
        ws.off("message", handler);
        resolve(message);
      }
    };

    ws.on("message", handler);
  });
}

function collectMessages(
  ws: WebSocket,
  duration: number,
): Promise<ServerMessage[]> {
  return new Promise((resolve) => {
    const messages: ServerMessage[] = [];
    const handler = (data: WebSocket.Data) => {
      messages.push(JSON.parse(data.toString()));
    };
    ws.on("message", handler);
    setTimeout(() => {
      ws.off("message", handler);
      resolve(messages);
    }, duration);
  });
}

describe("PartyKit Server Integration Tests", () => {
  let connections: WebSocket[] = [];

  afterEach(() => {
    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
    connections = [];
  });

  describe("Host Connection", () => {
    it("should acknowledge host connection", async () => {
      const roomId = `host-ack-${Date.now()}`;
      const ws = await createConnection(roomId);
      connections.push(ws);

      send(ws, { type: "host_connect" });

      const messages = await collectMessages(ws, 500);
      const ack = messages.find((m) => m.type === "host_ack");

      expect(ack).toBeDefined();
      expect(ack?.type).toBe("host_ack");
    });

    it("should send room state after host connects", async () => {
      const roomId = `host-state-${Date.now()}`;
      const ws = await createConnection(roomId);
      connections.push(ws);

      send(ws, { type: "host_connect" });

      const messages = await collectMessages(ws, 500);
      const state = messages.find((m) => m.type === "room_state");

      expect(state).toBeDefined();
      if (state?.type === "room_state") {
        expect(state.players).toEqual([]);
        expect(state.leaderId).toBeNull();
        expect(state.currentGameId).toBeNull();
      }
    });
  });

  describe("Player Join", () => {
    it("should allow player to join", async () => {
      const room = `join-test-${Date.now()}`;
      const ws = await createConnection(room);
      connections.push(ws);

      send(ws, { type: "join", name: "TestPlayer" });
      const joined = await waitForMessage(ws, "joined");

      expect(joined.type).toBe("joined");
      if (joined.type === "joined") {
        expect(joined.playerName).toBe("TestPlayer");
        expect(joined.isLeader).toBe(true);
        expect(joined.playerColor).toBeDefined();
      }
    });

    it("should make first player the leader", async () => {
      const room = `leader-test-${Date.now()}`;

      const ws1 = await createConnection(room);
      connections.push(ws1);
      send(ws1, { type: "join", name: "Player1" });
      const joined1 = await waitForMessage(ws1, "joined");

      const ws2 = await createConnection(room);
      connections.push(ws2);
      send(ws2, { type: "join", name: "Player2" });
      const joined2 = await waitForMessage(ws2, "joined");

      expect(joined1.type).toBe("joined");
      expect(joined2.type).toBe("joined");
      if (joined1.type === "joined" && joined2.type === "joined") {
        expect(joined1.isLeader).toBe(true);
        expect(joined2.isLeader).toBe(false);
      }
    });

    it("should notify host when player joins", async () => {
      const room = `notify-test-${Date.now()}`;

      const host = await createConnection(room);
      connections.push(host);
      send(host, { type: "host_connect" });
      await waitForMessage(host, "host_ack");

      const player = await createConnection(room);
      connections.push(player);
      send(player, { type: "join", name: "NewPlayer" });

      const notification = await waitForMessage(host, "player_joined");

      expect(notification.type).toBe("player_joined");
      if (notification.type === "player_joined") {
        expect(notification.playerName).toBe("NewPlayer");
        expect(notification.isLeader).toBe(true);
      }
    });
  });

  describe("Player Input", () => {
    it("should broadcast input to host", async () => {
      const room = `input-test-${Date.now()}`;

      const host = await createConnection(room);
      connections.push(host);
      send(host, { type: "host_connect" });
      await waitForMessage(host, "host_ack");

      const playerJoinedPromise = waitForMessage(host, "player_joined");

      const player = await createConnection(room);
      connections.push(player);
      send(player, { type: "join", name: "Gamer" });
      await waitForMessage(player, "joined");
      await playerJoinedPromise;

      const inputPromise = waitForMessage(host, "player_input");
      send(player, { type: "input", button: "up", action: "press" });

      const input = await inputPromise;

      expect(input.type).toBe("player_input");
      if (input.type === "player_input") {
        expect(input.button).toBe("up");
        expect(input.action).toBe("press");
        expect(input.playerName).toBe("Gamer");
      }
    });
  });

  describe("Game Selection", () => {
    it("should allow leader to select game", async () => {
      const room = `game-select-${Date.now()}`;

      const host = await createConnection(room);
      connections.push(host);
      send(host, { type: "host_connect" });
      await waitForMessage(host, "host_ack");

      const playerJoinedPromise = waitForMessage(host, "player_joined");

      const leader = await createConnection(room);
      connections.push(leader);
      send(leader, { type: "join", name: "Leader" });
      await waitForMessage(leader, "joined");
      await playerJoinedPromise;

      const gameSelectedPromise = waitForMessage(host, "game_selected");
      send(leader, { type: "select_game", gameId: "pong" });

      const hostNotification = await gameSelectedPromise;

      expect(hostNotification.type).toBe("game_selected");
      if (hostNotification.type === "game_selected") {
        expect(hostNotification.gameId).toBe("pong");
      }
    });

    it("should reject game selection from non-leader", async () => {
      const room = `non-leader-${Date.now()}`;

      const leader = await createConnection(room);
      connections.push(leader);
      send(leader, { type: "join", name: "Leader" });
      await waitForMessage(leader, "joined");

      const player2 = await createConnection(room);
      connections.push(player2);
      send(player2, { type: "join", name: "Player2" });
      await waitForMessage(player2, "joined");

      send(player2, { type: "select_game", gameId: "pong" });

      const error = await waitForMessage(player2, "error");

      expect(error.type).toBe("error");
      if (error.type === "error") {
        expect(error.message).toContain("leader");
      }
    });
  });

  describe("Player Kick", () => {
    it("should allow leader to kick player", async () => {
      const room = `kick-test-${Date.now()}`;

      const leader = await createConnection(room);
      connections.push(leader);
      send(leader, { type: "join", name: "Leader" });
      await waitForMessage(leader, "joined");

      const player2JoinedPromise = waitForMessage(leader, "player_joined");

      const player2 = await createConnection(room);
      connections.push(player2);
      send(player2, { type: "join", name: "Player2" });
      const player2Joined = await waitForMessage(player2, "joined");
      await player2JoinedPromise;

      const kickedPromise = waitForMessage(player2, "player_kicked");

      if (player2Joined.type === "joined") {
        send(leader, { type: "kick", playerId: player2Joined.playerId });
      }

      const kicked = await kickedPromise;

      expect(kicked.type).toBe("player_kicked");
    });
  });

  describe("Leader Transfer", () => {
    it("should transfer leadership when leader leaves", async () => {
      const room = `transfer-${Date.now()}`;

      const host = await createConnection(room);
      connections.push(host);
      send(host, { type: "host_connect" });
      await waitForMessage(host, "host_ack");

      const leaderJoinedPromise = waitForMessage(host, "player_joined");

      const leader = await createConnection(room);
      connections.push(leader);
      send(leader, { type: "join", name: "Leader" });
      await waitForMessage(leader, "joined");
      await leaderJoinedPromise;

      const player2JoinedPromise = waitForMessage(host, "player_joined");

      const player2 = await createConnection(room);
      connections.push(player2);
      send(player2, { type: "join", name: "Player2" });
      await waitForMessage(player2, "joined");
      await player2JoinedPromise;

      const leaderChangedPromise = waitForMessage(host, "leader_changed");

      leader.close();

      connections = connections.filter((c) => c !== leader);

      const leaderChanged = await leaderChangedPromise;

      expect(leaderChanged.type).toBe("leader_changed");
    });
  });
});
