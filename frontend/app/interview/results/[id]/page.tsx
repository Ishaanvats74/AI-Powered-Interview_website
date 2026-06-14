"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type ResultData = {
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  duration_seconds: number;
  interview_type: string;
};

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="mb-6 text-xl font-semibold">{title}</h2>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-muted p-4 text-sm leading-relaxed"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InterviewResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<ResultData>({
    score: 0,
    feedback: "",
    strengths: [],
    weaknesses: [],
    recommendations: [],
    duration_seconds: 0,
    interview_type: "",
  });

  useEffect(() => {
    const loadResults = async () => {
      try {
        const token = await getToken();
        const id = params?.id;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/interview-result/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          const err = await response.json();

          throw new Error(err.detail || "Failed to load results.");
        }

        const data = await response.json();
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [getToken, params?.id]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />

          <p className="mt-4 text-muted-foreground">Generating feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Failed To Load Results</h2>

        <p className="mt-3 text-muted-foreground">{error}</p>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white"
        >
          Dashboard
        </button>
      </div>
    );
  }

  const minutes = Math.floor(result.duration_seconds / 60);

  const performanceLabel =
    result.score >= 80
      ? "Excellent"
      : result.score >= 60
        ? "Good"
        : "Needs Improvement";

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-center">
        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-500">
          Interview Complete
        </span>

        <h1 className="mt-6 text-5xl font-bold">Performance Report</h1>

        <p className="mt-4 text-muted-foreground">
          Detailed AI evaluation of your interview.
        </p>
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground">Overall Score</p>

            <h2 className="mt-2 text-7xl font-bold">{result.score}</h2>
          </div>

          <div className="rounded-2xl bg-indigo-500/10 px-6 py-4 font-medium text-indigo-500">
            {performanceLabel}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Interview Type</p>

          <h3 className="mt-3 text-2xl font-bold capitalize">
            {result.interview_type}
          </h3>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Duration</p>

          <h3 className="mt-3 text-2xl font-bold">{minutes} mins</h3>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Performance</p>

          <h3 className="mt-3 text-2xl font-bold">{performanceLabel}</h3>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-8">
        <h2 className="mb-4 text-2xl font-semibold">AI Feedback</h2>

        <p className="leading-8 text-muted-foreground">{result.feedback}</p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <InsightCard title="Strengths" items={result.strengths} />

        <InsightCard title="Weaknesses" items={result.weaknesses} />

        <InsightCard title="Recommendations" items={result.recommendations} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <button
          onClick={() => router.push("/uploadResume")}
          className="rounded-2xl bg-indigo-600 py-4 font-semibold text-white hover:bg-indigo-500"
        >
          New Interview
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-2xl border border-border py-4 font-semibold hover:bg-accent"
        >
          Dashboard
        </button>
      </div>
    </main>
  );
}
