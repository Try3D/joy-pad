import { generateRoomCode } from "@joypad/shared";
import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, useSearchParams } from "react-router-dom";
import { ControllerView } from "./components/ControllerView";
import { HostJoinPicker } from "./components/HostJoinPicker";
import { HostView } from "./components/HostView";
import { JoinForm } from "./components/JoinForm";
import { NameEntry } from "./components/NameEntry";

type ViewState = "picker" | "join-form" | "name-entry" | "host" | "controller";

const SESSION_KEY = "joypad_session";

interface Session {
  roomCode: string;
  role: "host" | "controller";
  playerName?: string;
}

function getSession(): Session | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as Session;
    if (session.roomCode && /^[A-Z]{6}$/.test(session.roomCode)) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

function setSession(session: Session): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

function getInitialSessionState(): {
  roomCode: string;
  playerName: string;
  view: ViewState;
} {
  const session = getSession();
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get("room");

  if (roomParam && /^[A-Z]{6}$/.test(roomParam)) {
    if (session && session.roomCode === roomParam) {
      return {
        roomCode: session.roomCode,
        playerName: session.playerName || "",
        view: (session.role === "host" ? "host" : "controller") as ViewState,
      };
    }
    return {
      roomCode: roomParam,
      playerName: "",
      view: "name-entry" as ViewState,
    };
  }

  if (session) {
    return {
      roomCode: session.roomCode,
      playerName: session.playerName || "",
      view: (session.role === "host" ? "host" : "controller") as ViewState,
    };
  }

  return { roomCode: "", playerName: "", view: "picker" as ViewState };
}

function AppContent() {
  const initial = getInitialSessionState();

  const [roomCode, setRoomCode] = useState(initial.roomCode);
  const [playerName, setPlayerName] = useState(initial.playerName);
  const [view, setViewState] = useState<ViewState>(initial.view);
  const [, setSearchParams] = useSearchParams();

  const setView = useCallback((newView: ViewState) => {
    setViewState(newView);
  }, []);

  useEffect(() => {
    if (roomCode && view !== "picker") {
      setSearchParams({ room: roomCode });
    }
  }, [roomCode, view, setSearchParams]);

  const handleHostGame = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setSession({ roomCode: code, role: "host" });
    setSearchParams({ room: code });
    setView("host");
  }, [setSearchParams, setView]);

  const handleJoinGameClick = useCallback(() => {
    setView("join-form");
  }, [setView]);

  const handleEnterRoomCode = useCallback(
    (code: string) => {
      setRoomCode(code);
      setView("name-entry");
    },
    [setView],
  );

  const handleNameSubmit = useCallback(
    (name: string) => {
      setPlayerName(name);
      setSession({ roomCode, role: "controller", playerName: name });
      setSearchParams({ room: roomCode });
      setView("controller");
    },
    [roomCode, setSearchParams, setView],
  );

  const handleBackFromJoinForm = useCallback(() => {
    setView("picker");
  }, [setView]);

  const handleLeaveRoom = useCallback(() => {
    clearSession();
    setRoomCode("");
    setPlayerName("");
    setSearchParams({});
    setView("picker");
  }, [setSearchParams, setView]);

  switch (view) {
    case "picker":
      return (
        <HostJoinPicker
          onHostGame={handleHostGame}
          onJoinGame={handleJoinGameClick}
        />
      );

    case "join-form":
      return (
        <JoinForm
          onJoin={handleEnterRoomCode}
          onBack={handleBackFromJoinForm}
        />
      );

    case "name-entry":
      return <NameEntry onSubmit={handleNameSubmit} roomCode={roomCode} />;

    case "host":
      return <HostView roomCode={roomCode} onLeave={handleLeaveRoom} />;

    case "controller":
      return (
        <ControllerView
          roomCode={roomCode}
          playerName={playerName}
          onLeave={handleLeaveRoom}
        />
      );

    default:
      return null;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
