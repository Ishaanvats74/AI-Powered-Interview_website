"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { vapi } from "../lib/vapi";

type Message = {
  role: string;
  text: string;
};

export default function VapiPage() {
  const router = useRouter();
  const { getToken, userId } = useAuth();
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const vapiRef = useRef(vapi);
  const startTimeRef = useRef<number | null>(null);
  const conversationRef = useRef<Message[]>([]);
  const isCleaningUp = useRef(false);

  const handleSaveInterview = async () => {
    if (conversationRef.current.length === 0) return;
    setSaving(true);
    try {
      const token = await getToken();
      const config = JSON.parse(
        sessionStorage.getItem("interviewConfig") || "{}",
      );
      const durationSeconds = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/save-interview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: conversationRef.current,
            interview_type: config.interviewType || "fullstack",
            difficulty: config.difficulty || "medium",
            duration_seconds: durationSeconds,
          }),
        },
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to save interview");
      }

      const result = await response.json();
      router.push(`/interview/results/${result.interview_id}`);
    } catch (error) {
      console.error("Failed to save interview:", error);
      setError("Failed to save interview. Please try again.");
      setSaving(false);
    }
  };

  useEffect(() => {
    const vapi = vapiRef.current;

    // Speech events
    const handleSpeechStart = () => setIsSpeaking(true);
    const handleSpeechEnd = () => setIsSpeaking(false);

    // Call lifecycle events
    const handleCallStart = () => {
      setIsCallActive(true);
      startTimeRef.current = Date.now();
      setError(null);
    };

    const handleCallEnd = () => {
      if (isCleaningUp.current) return;
      setIsCallActive(false);
      setIsSpeaking(false);
      handleSaveInterview();
    };

    // Message handler
    const handleMessage = (message: any) => {
      if (message.type !== "transcript") return;

      if (message.transcriptType === "partial") {
        setLiveTranscript(message.transcript);
      }

      if (message.transcriptType === "final") {
        setConversation((prev) => {
          const updated = [
            ...prev,
            {
              role: message.role,
              text: message.transcript,
            },
          ];
          conversationRef.current = updated;
          return updated;
        });
        setLiveTranscript("");
      }
    };

    // Error handler
    const handleError = (e: any) => {
      console.error("Vapi error:", e);
      setError("An error occurred during the interview. Please try again.");
      setIsCallActive(false);
    };

    // Attach listeners
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    return () => {
      isCleaningUp.current = true;
      // Remove listeners
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
    };
  }, []);

  const handleStart = async () => {
    if (!vapiRef.current) return;
    try {
      setError(null);
      setConversation([]);
      conversationRef.current = [];

      await navigator.mediaDevices.getUserMedia({ audio: true });

      const config = JSON.parse(
        sessionStorage.getItem("interviewConfig") || "{}",
      );

      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!, {
        variableValues: {
          userId: userId,
          interviewType: config.interviewType || "fullstack",
          difficulty: config.difficulty || "medium",
          duration: config.duration || "15",
        },
      });
    } catch (error) {
      console.error("Failed to start interview:", error);
      setError(
        "Failed to start interview. Please check your microphone and try again.",
      );
    }
  };

  const handleStop = async () => {
    if (!vapiRef.current) return;
    try {
      await vapiRef.current.stop();
    } catch (error) {
      console.error("Failed to stop interview:", error);
      setError("Failed to stop interview. Please try again.");
    }
  };

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, liveTranscript]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 -z-20 bg-black" />
      <div
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right,#27272a 1px,transparent 1px),linear-gradient(to bottom,#27272a 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute left-1/2 top-20 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-10 backdrop-blur-xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
              Live AI Interview
            </div>
            <h1 className="text-3xl font-bold sm:text-5xl">
              Voice Interview Session
            </h1>
            <p className="mt-4 text-zinc-400">
              Talk naturally with your AI interviewer.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Status */}
          <div className="flex justify-center mb-6">
            <div
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                saving
                  ? "bg-yellow-500/20 text-yellow-400"
                  : isCallActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {saving
                ? "Saving interview..."
                : isCallActive
                  ? "● Interview In Progress"
                  : "Ready To Start"}
            </div>
          </div>

          {/* Voice Orb */}
          <div className="flex justify-center py-12">
            <div
              className={`flex h-40 w-40 items-center justify-center rounded-full border-4 border-indigo-500 transition-all duration-300 ${
                isSpeaking
                  ? "scale-110 bg-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.6)]"
                  : "bg-zinc-900"
              }`}
            >
              <span className="text-5xl">🎙️</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={handleStart}
              disabled={isCallActive || saving}
              className="flex-1 rounded-2xl bg-indigo-600 py-4 font-semibold transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Interview
            </button>
            <button
              onClick={handleStop}
              disabled={!isCallActive}
              className="flex-1 rounded-2xl border border-red-500 py-4 font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              End Interview
            </button>
            <button
              onClick={() => router.push("/")}
              disabled={isCallActive}
              className="flex-1 rounded-2xl border border-zinc-600 py-4 font-semibold text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Exit
            </button>
          </div>

          {/* Transcript */}
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Live Transcript</h2>
            <div className="max-h-125 space-y-4 overflow-y-auto">
              {conversation.length === 0 && !liveTranscript && (
                <p className="text-zinc-500">
                  Transcript will appear here once the interview starts.
                </p>
              )}
              {conversation.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 ${
                    msg.role === "assistant"
                      ? "border border-indigo-500/20 bg-indigo-500/10"
                      : "bg-zinc-800"
                  }`}
                >
                  <p className="mb-2 text-xs uppercase tracking-wider text-zinc-400">
                    {msg.role === "assistant" ? "AI Interviewer" : "You"}
                  </p>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              ))}
              {liveTranscript && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-yellow-400">
                    Live
                  </p>
                  <p className="text-sm leading-relaxed">{liveTranscript}</p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
