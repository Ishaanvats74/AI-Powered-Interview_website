"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

export default function Home() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkUser = async () => {
      try {
        const token = await getToken();

        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/check-user`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.log(error);
      }
    };

    checkUser();
  }, [user, isLoaded, getToken]);

  const handleStart = () => {
    router.push(
      isSignedIn ? "/uploadResume" : "/sign-up"
    );
  };

  return (
    <div className="relative">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="inline-flex rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-500">
              AI Interview Preparation Platform
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-tight md:text-7xl">
              Ace Your Next
              <span className="block text-indigo-500">
                Technical Interview
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Upload your resume, practice realistic AI interviews,
              and receive detailed feedback to improve your confidence,
              communication, and technical performance.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={handleStart}
                className="rounded-xl bg-indigo-600 px-8 py-4 font-medium text-white transition hover:bg-indigo-500"
              >
                Start Interview
              </button>

              <button className="rounded-xl border border-border px-8 py-4 font-medium hover:bg-accent">
                Learn More
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-medium">
                Interview Readiness
              </span>

              <span className="text-3xl font-bold text-indigo-500">
                87%
              </span>
            </div>

            <div className="space-y-5">
              {[
                ["Technical Skills", 91],
                ["Communication", 84],
                ["Confidence", 89],
                ["Problem Solving", 86],
              ].map(([label, score]) => (
                <div key={String(label)}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{label}</span>
                    <span>{score}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{
                        width: `${score}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold">
            How It Works
          </h2>

          <p className="mt-4 text-muted-foreground">
            Get interview ready in three simple steps.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Upload Resume",
              desc: "Analyze your skills and experience.",
            },
            {
              title: "Practice Interview",
              desc: "Speak with an AI interviewer.",
            },
            {
              title: "Receive Feedback",
              desc: "Get detailed scores and insights.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <h3 className="text-xl font-semibold">
                {item.title}
              </h3>

              <p className="mt-3 text-muted-foreground">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold">
            Everything You Need
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Resume Analysis",
            "ATS Score",
            "AI Voice Interview",
            "Interview Reports",
            "Performance Tracking",
            "Personalized Feedback",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-semibold">
                {feature}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border bg-card p-16 text-center">
          <h2 className="text-5xl font-bold">
            Ready To Get Interview Ready?
          </h2>

          <p className="mt-6 text-muted-foreground">
            Practice with AI and improve your chances
            of landing your next opportunity.
          </p>

          <button
            onClick={handleStart}
            className="mt-10 rounded-xl bg-indigo-600 px-8 py-4 font-medium text-white hover:bg-indigo-500"
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}