import type { Button } from "@joypad/shared";
import { useCallback, useEffect, useRef, useState } from "react";

interface KeyboardControllerProps {
  onInput: (
    button: Button,
    action: "press" | "release",
    modifiers?: string[],
  ) => void;
  color?: string;
}

export function KeyboardController({
  onInput,
  onRestart,
  config,
  color = "#3B82F6",
}: KeyboardControllerProps & { onRestart?: () => void; config?: any }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);
  const [charsTyped, setCharsTyped] = useState(0);

  useEffect(() => {
    const focusInput = () => {
      inputRef.current?.focus();
    };

    focusInput();

    window.addEventListener("click", focusInput);
    return () => window.removeEventListener("click", focusInput);
  }, []);

  useEffect(() => {
    setCharsTyped(0);
  }, [config?.text]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push("ctrl");
      if (e.shiftKey) modifiers.push("shift");
      if (e.altKey) modifiers.push("alt");
      if (e.metaKey) modifiers.push("meta");

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(
            e.key,
          )
        ) {
          e.preventDefault();
        }
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setCharsTyped((prev) => prev + 1);
      }

      onInput(e.key, "press", modifiers);
      setIsKeyboardActive(true);
    },
    [onInput],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent | KeyboardEvent) => {
      const modifiers: string[] = [];
      if (e.ctrlKey) modifiers.push("ctrl");
      if (e.shiftKey) modifiers.push("shift");
      if (e.altKey) modifiers.push("alt");
      if (e.metaKey) modifiers.push("meta");

      onInput(e.key, "release", modifiers);
    },
    [onInput],
  );

  const showRestart =
    onRestart && config?.text && charsTyped >= config.text.length;

  useEffect(() => {
    const onGlobalDown = (e: KeyboardEvent) => handleKeyDown(e);
    const onGlobalUp = (e: KeyboardEvent) => handleKeyUp(e);

    window.addEventListener("keydown", onGlobalDown);
    window.addEventListener("keyup", onGlobalUp);

    return () => {
      window.removeEventListener("keydown", onGlobalDown);
      window.removeEventListener("keyup", onGlobalUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div
      className="flex flex-col items-center justify-center p-8 w-full h-full cursor-text relative"
      onClick={() => inputRef.current?.focus()}
    >
      {showRestart && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Restart Game?")) {
              onRestart();
            }
          }}
          className="absolute top-4 right-4 px-4 py-2 bg-text text-bg font-mono font-bold border-2 border-transparent hover:border-accent active:bg-accent active:text-text z-50 text-xs sm:text-sm"
        >
          RESTART
        </button>
      )}

      <textarea
        ref={inputRef}
        className="opacity-0 absolute top-0 left-0 w-0 h-0 resize-none overflow-hidden"
        onFocus={() => setIsKeyboardActive(true)}
        onBlur={() => setIsKeyboardActive(false)}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div
        className={`
          flex flex-col items-center justify-center
          border-4 p-8 transition-colors duration-200
          ${isKeyboardActive ? "border-accent bg-accent/10" : "border-border bg-surface"}
        `}
        style={{ borderColor: isKeyboardActive ? color : undefined }}
      >
        <div className="text-4xl mb-4 font-mono font-bold tracking-wider">
          {isKeyboardActive ? "[ KEYBOARD ]" : "[ TAP HERE ]"}
        </div>
        <div className="text-xl font-mono font-bold text-text text-center">
          {isKeyboardActive ? "ACTIVE" : "ACTIVATE"}
        </div>
        <div className="text-sm font-mono text-text-secondary mt-2 text-center">
          {isKeyboardActive ? "Type to play!" : "Tap to open keyboard"}
        </div>
      </div>
    </div>
  );
}
