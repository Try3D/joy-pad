import QRCode from "qrcode";
import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export function QRCodeDisplay({ url, size = 200 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 2,
        color: {
          dark: "#1a1b26",
          light: "#7aa2f7",
        },
      });
    }
  }, [url, size]);

  return <canvas ref={canvasRef} />;
}
