"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

interface MicButtonProps {
  onResult: (text: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function MicButton({ onResult, className = "", size = "md" }: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  if (!supported) return null;

  const sizeClasses = size === "sm" 
    ? "w-8 h-8" 
    : "w-10 h-10";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative ${sizeClasses} rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
        listening
          ? "bg-red-500/20 border border-red-500/40"
          : "bg-white/5 border border-white/10 hover:bg-white/10"
      } ${className}`}
      title={listening ? "Stop listening" : "Voice input"}
    >
      {/* Pulse ring when listening */}
      {listening && (
        <>
          <div className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping opacity-30" />
          <div className="absolute inset-[-4px] rounded-2xl border border-red-400/20 animate-pulse" />
        </>
      )}
      {listening ? (
        <MicOff className={`${iconSize} text-red-400`} />
      ) : (
        <Mic className={`${iconSize} text-white/50`} />
      )}
    </button>
  );
}
