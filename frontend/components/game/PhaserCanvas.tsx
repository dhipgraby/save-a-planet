"use client";
import { useEffect, useRef } from "react";
import { createPhaserGame } from "@/lib/game/createGame";

export default function PhaserCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Avoid SSR issues by running only on client
    const parent = containerRef.current;
    gameRef.current = createPhaserGame(parent);
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-[85vh] flex items-center justify-center rounded-[20px] border border-gray-700 bg-gray-900/50 overflow-hidden">
      <div ref={containerRef} className="w-full h-full max-h-[90vh]" />
    </div>
  );
}
