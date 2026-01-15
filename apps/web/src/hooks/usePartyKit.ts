import type {
  Action,
  Button,
  ControllerLayout,
  InputLogEntry,
  Player,
  ServerMessage,
} from "@joypad/shared";
import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";

type GameConfig = Record<string, unknown>;

const PARTYKIT_HOST = "localhost:1999";

interface UseHostOptions {
  roomId: string;
  onError?: (message: string) => void;
}

interface UseHostReturn {
  isConnected: boolean;
  players: Player[];
  inputLog: InputLogEntry[];
  leaderId: string | null;
  currentGameId: string | null;
  activeLayout: ControllerLayout;
  activeConfig: GameConfig | null;
  selectGame: (gameId: string) => void;
}

export function useHost({ roomId, onError }: UseHostOptions): UseHostReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [inputLog, setInputLog] = useState<InputLogEntry[]>([]);
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [activeLayout, setActiveLayout] = useState<ControllerLayout>("dpad");
  const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const selectGame = useCallback((gameId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "select_game", gameId }));
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;
    if (socketRef.current) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "host_connect" }));
    });

    socket.addEventListener("message", (event) => {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case "host_ack":
          setIsConnected(true);
          break;

        case "room_state":
          setPlayers(message.players);
          setLeaderId(message.leaderId);
          setCurrentGameId(message.currentGameId);
          setActiveLayout(message.layout || "dpad");
          setActiveConfig(message.config);
          break;

        case "player_joined":
          setPlayers((prev) => {
            if (prev.some((p) => p.id === message.playerId)) return prev;
            return [
              ...prev,
              {
                id: message.playerId,
                name: message.playerName,
                color: message.playerColor,
                isLeader: message.isLeader,
              },
            ];
          });
          if (message.isLeader) {
            setLeaderId(message.playerId);
          }
          break;

        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== message.playerId));
          break;

        case "player_kicked":
          setPlayers((prev) => prev.filter((p) => p.id !== message.playerId));
          break;

        case "leader_changed":
          setLeaderId(message.playerId);
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              isLeader: p.id === message.playerId,
            })),
          );
          break;

        case "player_input":
          setInputLog((prev) => {
            const newLog = [
              ...prev,
              {
                sequenceId: message.sequenceId,
                playerId: message.playerId,
                playerName: message.playerName,
                playerColor: message.playerColor,
                button: message.button,
                action: message.action,
                modifiers: message.modifiers,
                timestamp: message.timestamp,
              },
            ];
            return newLog.slice(-500);
          });
          break;

        case "game_selected":
          setCurrentGameId(message.gameId || null);
          setActiveLayout(message.layout || "dpad");
          setActiveConfig(message.config);
          break;

        case "error":
          onErrorRef.current?.(message.message);
          break;
      }
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", () => {
      onErrorRef.current?.("Connection error");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId]);

  return {
    isConnected,
    players,
    inputLog,
    leaderId,
    currentGameId,
    activeLayout,
    activeConfig,
    selectGame,
  };
}

interface UseControllerOptions {
  roomId: string;
  playerName: string;
  onKicked?: (reason: string) => void;
  onError?: (message: string) => void;
}

interface UseControllerReturn {
  isConnected: boolean;
  players: Player[];
  myPlayer: Player | null;
  isLeader: boolean;
  currentGameId: string | null;
  activeLayout: ControllerLayout;
  activeConfig: GameConfig | null;
  sendInput: (button: Button, action: Action, modifiers?: string[]) => void;
  kickPlayer: (playerId: string) => void;
  selectGame: (gameId: string) => void;
}

export function useController({
  roomId,
  playerName,
  onKicked,
  onError,
}: UseControllerOptions): UseControllerReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [activeLayout, setActiveLayout] = useState<ControllerLayout>("dpad");
  const [activeConfig, setActiveConfig] = useState<GameConfig | null>(null);

  const onKickedRef = useRef(onKicked);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onKickedRef.current = onKicked;
    onErrorRef.current = onError;
  }, [onKicked, onError]);

  useEffect(() => {
    if (!roomId || !playerName) return;
    if (socketRef.current) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "join", name: playerName }));
    });

    socket.addEventListener("message", (event) => {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case "joined":
          setIsConnected(true);
          setMyPlayer({
            id: message.playerId,
            name: message.playerName,
            color: message.playerColor,
            isLeader: message.isLeader,
          });
          setIsLeader(message.isLeader);
          break;

        case "room_state":
          setPlayers(message.players);
          setCurrentGameId(message.currentGameId);
          setActiveLayout(message.layout || "dpad");
          setActiveConfig(message.config);
          break;

        case "player_joined":
          setPlayers((prev) => {
            if (prev.some((p) => p.id === message.playerId)) return prev;
            return [
              ...prev,
              {
                id: message.playerId,
                name: message.playerName,
                color: message.playerColor,
                isLeader: message.isLeader,
              },
            ];
          });
          break;

        case "player_left":
          setPlayers((prev) => prev.filter((p) => p.id !== message.playerId));
          break;

        case "player_kicked":
          setPlayers((prev) => prev.filter((p) => p.id !== message.playerId));
          if (myPlayer && message.playerId === myPlayer.id) {
            onKickedRef.current?.(message.reason);
          }
          break;

        case "leader_changed":
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              isLeader: p.id === message.playerId,
            })),
          );
          if (myPlayer && message.playerId === myPlayer.id) {
            setIsLeader(true);
            setMyPlayer((prev) => (prev ? { ...prev, isLeader: true } : null));
          } else {
            setIsLeader(false);
          }
          break;

        case "game_selected":
          setCurrentGameId(message.gameId || null);
          setActiveLayout(message.layout || "dpad");
          setActiveConfig(message.config);
          break;

        case "error":
          onErrorRef.current?.(message.message);
          break;
      }
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("error", () => {
      onErrorRef.current?.("Connection error");
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, playerName]);

  const sendInput = useCallback(
    (button: Button, action: Action, modifiers?: string[]) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({ type: "input", button, action, modifiers }),
        );
      }
    },
    [],
  );

  const kickPlayer = useCallback((playerId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "kick", playerId }));
    }
  }, []);

  const selectGame = useCallback((gameId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "select_game", gameId }));
    }
  }, []);

  return {
    isConnected,
    players,
    myPlayer,
    isLeader,
    currentGameId,
    activeLayout,
    activeConfig,
    sendInput,
    kickPlayer,
    selectGame,
  };
}
