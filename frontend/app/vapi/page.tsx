"use client";

import Vapi from "@vapi-ai/web";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: string;
  text: string;
};

export default function Page() {
  const router = useRouter();
  const [liveTranscript, setLiveTranscript] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    if (!vapiRef.current) {
      vapiRef.current = new Vapi("57e231a9-93f0-41b4-a7a9-bff2bf3c49d0");
    }

    const vapi = vapiRef.current;

    vapi.on("speech-start", () => {
      console.log('speech started')
      setIsSpeaking(true);
    });

    vapi.on("speech-end", () => {
      console.log('speech end')
      setIsSpeaking(false);
    });

    vapi.on("call-start", () => {
      console.log('call started')
      setIsCallActive(true);
    });

    vapi.on("call-end", () => {
      console.log('call end')
      setIsCallActive(false);
      setIsSpeaking(false);
    });

    vapi.on("message", (message) => {
      if (message.type === "transcript") {
        console.log("TRANSCRIPT:", message);
      }
      if (message.type !== "transcript") return;

      if (message.transcriptType === "partial") {
        setLiveTranscript(message.transcript);
      }
      if (message.type === "transcript" && message.transcriptType === "final") {
        setConversation((prev) => [
          ...prev,
          {
            role: message.role,
            text: message.transcript,
          },
        ]);
        setLiveTranscript("");
      }
    });

    vapi.on("error", (e) => {
      console.error(e);
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const handleStart = async () => {
    if (!vapiRef.current) return;

    try {
      setConversation([]);
      await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

      await vapiRef.current.start("97b6b036-19a2-4484-b414-e3ed10d9cfb1");
    } catch (error) {
      console.error(error);
    }
  };

  const handleStop = async () => {
    if (!vapiRef.current) return;

    try {
      await vapiRef.current.stop();
    } catch (error) {
      console.error(error);
    }
  };

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

      <div className="absolute left-1/2 top-20 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold">
            Interview
            <span className="text-indigo-500">AI</span>
          </h1>

          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-700 px-5 py-2 hover:bg-zinc-900"
          >
            Exit
          </button>
        </div>
      </nav>

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

          {/* Status */}
          <div className="flex justify-center">
            <div
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                isCallActive
                  ? "bg-green-500/20 text-green-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {isCallActive ? "Interview In Progress" : "Ready To Start"}
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
              disabled={isCallActive}
              className="flex-1 rounded-2xl bg-indigo-600 py-4 font-semibold transition hover:bg-indigo-500 disabled:opacity-50"
            >
              Start Interview
            </button>

            <button
              onClick={handleStop}
              disabled={!isCallActive}
              className="flex-1 rounded-2xl border border-red-500 py-4 font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              End Interview
            </button>
          </div>

          {/* Transcript */}
          <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold">Live Transcript</h2>

            <div className="max-h-[500px] space-y-4 overflow-y-auto">
              {conversation.length === 0 && (
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
                  <p className="mb-2 text-sm uppercase text-zinc-400">
                    {msg.role}
                  </p>

                  <p>{msg.text}</p>
                </div>
              ))}
              {liveTranscript !== "" && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <p className="mb-2 text-sm uppercase text-yellow-400">Live</p>

                  <p>{liveTranscript}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
