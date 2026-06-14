"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Interview = {
  id: string;
  score: number;
  interview_type: string;
  duration_seconds: number;
  created_at: string;
};

type DashboardData = {
  totalInterviews: number;
  averageScore: number;
  bestScore: number;
  totalPracticeMinutes: number;
  atsScore: number;
  interviews: Interview[];
};

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>

      <h2 className="mt-4 text-4xl font-bold">{value}</h2>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<DashboardData>({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    totalPracticeMinutes: 0,
    atsScore: 0,
    interviews: [],
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await getToken();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard.");
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />

          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div>
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-500">
          Dashboard
        </span>

        <h1 className="mt-6 text-5xl font-bold">Interview Analytics</h1>

        <p className="mt-4 text-muted-foreground">
          Track your progress and improve interview performance.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Interviews" value={data.totalInterviews} />

        <StatCard title="Average Score" value={`${data.averageScore}/100`} />

        <StatCard title="Best Score" value={`${data.bestScore}/100`} />

        <StatCard
          title="Practice Time"
          value={`${data.totalPracticeMinutes}m`}
        />
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Current Resume</h2>

            <p className="mt-2 text-muted-foreground">
              Resume used for personalized interview generation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full bg-indigo-500/10 px-5 py-3 font-medium text-indigo-500">
              ATS Score: {data.atsScore}
            </div>

            <button
              onClick={() => router.push("/analysis")}
              className="rounded-full border border-border px-5 py-3 text-sm hover:bg-accent"
            >
              View Report
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-8">
        <h2 className="mb-8 text-2xl font-semibold">Performance Summary</h2>

        <div className="space-y-6">
          {[
            {
              label: "Technical Skills",
              score: 88,
            },
            {
              label: "Communication",
              score: 82,
            },
            {
              label: "Confidence",
              score: 85,
            },
            {
              label: "Problem Solving",
              score: 91,
            },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex justify-between text-sm">
                <span>{item.label}</span>

                <span className="text-muted-foreground">{item.score}/100</span>
              </div>

              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{
                    width: `${item.score}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-border bg-card p-8">
        <h2 className="mb-8 text-2xl font-semibold">Recent Interviews</h2>

        {data.interviews.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No interviews yet.</p>

            <button
              onClick={() => router.push("/uploadResume")}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 text-white"
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {data.interviews.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-border p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h3 className="font-semibold capitalize">
                    {item.interview_type}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <span className="font-semibold">{item.score}/100</span>

                  <span className="text-sm text-muted-foreground">
                    {Math.floor(item.duration_seconds / 60)} min
                  </span>

                  <button
                    onClick={() => router.push(`/interview/results/${item.id}`)}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <button
          onClick={() => router.push("/uploadResume")}
          className="rounded-2xl bg-indigo-600 py-4 font-semibold text-white hover:bg-indigo-500"
        >
          Upload New Resume
        </button>

        <button
          onClick={() => router.push("/analysis")}
          className="rounded-2xl border border-border py-4 font-semibold hover:bg-accent"
        >
          View ATS Analysis
        </button>
      </div>
    </main>
  );
}
