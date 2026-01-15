import type { Button } from "@joypad/shared";
import { useCallback, useState } from "react";

interface DPadProps {
  onButtonPress: (button: Button) => void;
  onButtonRelease: (button: Button) => void;
  color?: string;
}

interface DPadButtonProps {
  button: Button;
  icon: string;
  isPressed: boolean;
  onPress: () => void;
  onRelease: () => void;
  color?: string;
  className?: string;
}

function DPadButton({
  button,
  icon,
  isPressed,
  onPress,
  onRelease,
  color,
  className = "",
}: DPadButtonProps) {
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onPress();
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    },
    [onPress],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onRelease();
    },
    [onRelease],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onPress();
    },
    [onPress],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onRelease();
    },
    [onRelease],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (isPressed) {
        e.preventDefault();
        onRelease();
      }
    },
    [isPressed, onRelease],
  );

  return (
    <button
      type="button"
      className={`
        flex items-center justify-center
        select-none touch-none
        transition-colors duration-75 border-2
        font-mono text-2xl
        ${
          isPressed
            ? "border-accent bg-accent text-bg"
            : "border-border bg-surface hover:bg-surface-light text-text"
        }
        ${className}
      `}
      style={isPressed ? { backgroundColor: color || "#3B82F6" } : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      aria-label={button}
    >
      {icon}
    </button>
  );
}

export function DPad({ onButtonPress, onButtonRelease, color }: DPadProps) {
  const [pressedButtons, setPressedButtons] = useState<Set<Button>>(new Set());

  const handlePress = useCallback(
    (button: Button) => {
      setPressedButtons((prev) => new Set(prev).add(button));
      onButtonPress(button);
    },
    [onButtonPress],
  );

  const handleRelease = useCallback(
    (button: Button) => {
      setPressedButtons((prev) => {
        const next = new Set(prev);
        next.delete(button);
        return next;
      });
      onButtonRelease(button);
    },
    [onButtonRelease],
  );

  return (
    <div className="flex justify-center items-center gap-8">
      <div className="grid grid-cols-3 gap-2 w-fit">
        <div />
        <DPadButton
          button="up"
          icon="▲"
          isPressed={pressedButtons.has("up")}
          onPress={() => handlePress("up")}
          onRelease={() => handleRelease("up")}
          color={color}
          className="w-16 h-16"
        />
        <div />

        <DPadButton
          button="left"
          icon="◀"
          isPressed={pressedButtons.has("left")}
          onPress={() => handlePress("left")}
          onRelease={() => handleRelease("left")}
          color={color}
          className="w-16 h-16"
        />
        <div className="w-16 h-16" />
        <DPadButton
          button="right"
          icon="▶"
          isPressed={pressedButtons.has("right")}
          onPress={() => handlePress("right")}
          onRelease={() => handleRelease("right")}
          color={color}
          className="w-16 h-16"
        />

        <div />
        <DPadButton
          button="down"
          icon="▼"
          isPressed={pressedButtons.has("down")}
          onPress={() => handlePress("down")}
          onRelease={() => handleRelease("down")}
          color={color}
          className="w-16 h-16"
        />
        <div />
      </div>

      <div className="flex flex-col gap-3 items-center">
        <DPadButton
          button="a"
          icon="A"
          isPressed={pressedButtons.has("a")}
          onPress={() => handlePress("a")}
          onRelease={() => handleRelease("a")}
          color={color}
          className="w-20 h-20 text-3xl font-bold"
        />
        <span className="text-text-secondary text-xs font-mono">SELECT</span>
      </div>
    </div>
  );
}
