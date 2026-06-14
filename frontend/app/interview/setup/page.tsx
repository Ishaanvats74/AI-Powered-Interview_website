"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InterviewSetupPage() {
  const router = useRouter();

  const [interviewType, setInterviewType] = useState("fullstack");

  const [difficulty, setDifficulty] = useState("medium");

  const [duration, setDuration] = useState("15");

  const startInterview = () => {
    sessionStorage.setItem(
      "interviewConfig",
      JSON.stringify({
        interviewType,
        difficulty,
        duration,
      }),
    );

    router.push("/vapi");
  };

  const types = [
    {
      id: "frontend",
      title: "Frontend",
      desc: "React, Next.js, UI Development",
    },
    {
      id: "backend",
      title: "Backend",
      desc: "APIs, Databases, Architecture",
    },
    {
      id: "fullstack",
      title: "Full Stack",
      desc: "Frontend + Backend",
    },
    {
      id: "behavioral",
      title: "Behavioral",
      desc: "Communication & Soft Skills",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-center">
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-500">
          Interview Configuration
        </span>

        <h1 className="mt-6 text-5xl font-bold">Customize Your Interview</h1>

        <p className="mt-4 text-muted-foreground">
          Configure your AI interview session before starting.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Resume Ready</h2>

            <p className="mt-2 text-muted-foreground">
              Personalized questions will be generated from your resume.
            </p>
          </div>

          <div className="rounded-full bg-green-500/10 px-5 py-2 font-medium text-green-500">
            Ready
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-8">
        <h2 className="mb-6 text-2xl font-semibold">Interview Type</h2>

        <div className="grid gap-4 md:grid-cols-2">
          {types.map((item) => (
            <button
              key={item.id}
              onClick={() => setInterviewType(item.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                interviewType === item.id
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <h3 className="font-semibold">{item.title}</h3>

              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8">
          <h2 className="mb-6 text-2xl font-semibold">Difficulty</h2>

          <div className="grid gap-4">
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`rounded-xl py-4 capitalize font-medium transition ${
                  difficulty === level
                    ? "bg-indigo-600 text-white"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8">
          <h2 className="mb-6 text-2xl font-semibold">Duration</h2>

          <div className="grid gap-4">
            {["10", "15", "20"].map((time) => (
              <button
                key={time}
                onClick={() => setDuration(time)}
                className={`rounded-xl py-4 font-medium transition ${
                  duration === time
                    ? "bg-indigo-600 text-white"
                    : "border border-border hover:bg-accent"
                }`}
              >
                {time} Minutes
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6">
        <h2 className="font-semibold text-indigo-500">Session Summary</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <span className="rounded-full bg-muted px-4 py-2 capitalize">
            {interviewType}
          </span>

          <span className="rounded-full bg-muted px-4 py-2 capitalize">
            {difficulty}
          </span>

          <span className="rounded-full bg-muted px-4 py-2">
            {duration} min
          </span>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-8">
        <h2 className="mb-4 text-xl font-semibold">Before You Start</h2>

        <ul className="space-y-3 text-muted-foreground">
          <li>• Allow microphone access.</li>
          <li>• Sit in a quiet environment.</li>
          <li>• Answer naturally and confidently.</li>
          <li>• Questions are based on your resume.</li>
          <li>• Communication and technical skills will be evaluated.</li>
        </ul>
      </div>

      <button
        onClick={startInterview}
        className="mt-10 w-full rounded-2xl bg-indigo-600 py-5 text-lg font-semibold text-white hover:bg-indigo-500"
      >
        Start AI Interview
      </button>
    </main>
  );
}
