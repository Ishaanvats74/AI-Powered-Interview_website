"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Analysis = {
  ats_score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

function InsightCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h3 className="mb-6 text-xl font-semibold">{title}</h3>

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

export default function AnalysisPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<Analysis>({
    ats_score: 0,
    strengths: [],
    weaknesses: [],
    suggestions: [],
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const token = await getToken();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/analysis`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(
            err.detail || "Failed to fetch analysis."
          );
        }

        const result = await response.json();
        setAnalysis(result);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />

          <p className="mt-4 text-muted-foreground">
            Analyzing your resume...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">
          Resume Analysis Failed
        </h2>

        <p className="mt-3 text-muted-foreground">
          {error}
        </p>

        <button
          onClick={() => router.push("/uploadResume")}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white"
        >
          Upload Resume
        </button>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-center">
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-500">
          ATS Resume Report
        </span>

        <h1 className="mt-6 text-5xl font-bold">
          Resume Analysis Complete
        </h1>

        <p className="mt-4 text-muted-foreground">
          Here's how your resume performs against ATS systems.
        </p>
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted-foreground">
              ATS Score
            </p>

            <h2 className="mt-2 text-6xl font-bold">
              {analysis.ats_score}
            </h2>
          </div>

          <div className="rounded-2xl bg-indigo-500/10 px-6 py-4 text-indigo-500 font-medium">
            Resume Ready
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <InsightCard
          title="Strengths"
          items={analysis.strengths}
        />

        <InsightCard
          title="Weaknesses"
          items={analysis.weaknesses}
        />

        <InsightCard
          title="Suggestions"
          items={analysis.suggestions}
        />
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-10 text-center">
        <h2 className="text-3xl font-bold">
          Ready For Your Interview?
        </h2>

        <p className="mt-4 text-muted-foreground">
          Your AI interviewer will generate questions based on this resume.
        </p>

        <button
          onClick={() => router.push("/interview/setup")}
          className="mt-8 rounded-xl bg-indigo-600 px-8 py-4 text-white hover:bg-indigo-500"
        >
          Start Interview
        </button>
      </div>
    </main>
  );
}