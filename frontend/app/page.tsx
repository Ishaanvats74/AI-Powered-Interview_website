"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();
  const user = useUser();

  console.log(user.isSignedIn);

  const handleToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background Grid */}
      <div
        className="absolute inset-0 -z-20 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow Effects */}
      <div className="absolute left-1/2 top-20 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="absolute right-0 top-96 -z-10 h-[400px] w-[400px] rounded-full bg-purple-600/20 blur-[120px]" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/50 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold">
            Interview<span className="text-indigo-500">AI</span>
          </h1>

          <div className="flex items-center gap-4">
            {user.isSignedIn ? (
              <>
                <button
                  onClick={() => router.push("/uploadResume")}
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-medium transition hover:bg-indigo-500"
                >
                  Upload Resume
                </button>

                <UserButton />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-zinc-700 px-5 py-2 font-medium hover:bg-zinc-900">
                    Sign In
                  </button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <button className="rounded-xl bg-indigo-600 px-5 py-2 font-medium transition hover:bg-indigo-500">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 lg:flex-row">
        <div className="flex-1">
          <div className="mb-6 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
            AI-Powered Interview Practice
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl text-6xl font-bold leading-tight md:text-8xl"
          >
            Turn Every Interview Into Your
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
              {" "}
              Strongest Performance
            </span>
          </motion.h1>

          <p className="mt-8 max-w-2xl text-lg text-zinc-400">
            Upload your resume, practice real-time AI interviews, and receive
            detailed feedback on communication, technical skills, confidence,
            and problem-solving.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => {
                if (user.isSignedIn) {
                  router.push("/uploadResume");
                } else {
                  router.push("/sign-up");
                }
              }}
              className="rounded-xl bg-indigo-600 px-8 py-4 font-semibold transition hover:bg-indigo-500"
            >
              Start Interview
            </button>

            <button className="rounded-xl border border-zinc-700 px-8 py-4 font-semibold transition hover:bg-zinc-900">
              Watch Demo
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-400">
            <span>✓ Resume Aware Questions</span>
            <span>✓ Real-Time Voice Interview</span>
            <span>✓ Instant Feedback</span>
          </div>

          {/* Stats */}
          <div className="mt-16 flex flex-wrap gap-10">
            <div>
              <h3 className="text-3xl font-bold">10K+</h3>
              <p className="text-zinc-500">Interviews Conducted</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">92%</h3>
              <p className="text-zinc-500">Success Rate</p>
            </div>

            <div>
              <h3 className="text-3xl font-bold">4.9★</h3>
              <p className="text-zinc-500">User Rating</p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <div className="mt-16 flex-1 lg:mt-0">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 backdrop-blur-xl">
            <div className="mb-6 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>

            <div className="rounded-xl bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span>resume.pdf</span>
                <span className="text-green-400">✓ Uploaded</span>
              </div>

              <div className="space-y-2 text-sm text-zinc-400">
                <p>React.js</p>
                <p>Next.js</p>
                <p>FastAPI</p>
                <p>PostgreSQL</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-zinc-900 p-4">
              <h3 className="mb-3 font-semibold">Interview Readiness Score</h3>

              <div className="text-center">
                <span className="text-6xl font-bold text-indigo-500">87</span>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              {[
                { label: "Technical Skills", score: 91 },
                { label: "Communication", score: 84 },
                { label: "Confidence", score: 89 },
                { label: "Problem Solving", score: 86 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span>{item.score}</span>
                  </div>

                  <div className="h-2 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="mb-16 text-center text-5xl font-bold">How It Works</h2>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Upload Resume",
              desc: "AI analyzes your skills, projects and experience.",
            },
            {
              title: "Start Interview",
              desc: "Talk naturally with an AI interviewer in real time.",
            },
            {
              title: "Get Insights",
              desc: "Receive scores, feedback and growth suggestions.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <h3 className="mb-4 text-xl font-semibold">{item.title}</h3>

              <p className="text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Interview Preview */}
      <section className="mx-auto max-w-7xl px-6 py-32">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-indigo-400">
              Live AI Interview
            </span>

            <h2 className="mt-6 text-5xl font-bold">
              Practice Like It's A Real Interview
            </h2>

            <p className="mt-6 text-zinc-400">
              Have natural conversations with an AI interviewer tailored to your
              resume, projects and career goals.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="mb-6">
              <span className="text-indigo-400">AI Interviewer</span>

              <p className="mt-3 rounded-xl bg-zinc-900 p-4">
                Tell me about a project where you solved a challenging technical
                problem.
              </p>
            </div>

            <div>
              <span className="text-green-400">Candidate</span>

              <p className="mt-3 rounded-xl bg-zinc-900 p-4">
                I built an AI-powered interview coach using Next.js, FastAPI,
                Gemini and Vapi...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="mb-16 text-center text-5xl font-bold">
          Everything You Need
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Resume Parsing",
            "Voice Interviews",
            "ATS Analysis",
            "AI Feedback",
            "Performance Reports",
            "Progress Tracking",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/40"
            >
              <h3 className="text-lg font-semibold">{feature}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="mb-16 text-center text-5xl font-bold">
          Trusted By Students & Professionals
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            "Helped me prepare for frontend interviews and improve confidence.",
            "The AI feedback was surprisingly accurate and actionable.",
            "I landed my internship after practicing here for a week.",
          ].map((review) => (
            <div
              key={review}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <p className="text-zinc-400">{review}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-16 text-center backdrop-blur-xl">
          <h2 className="text-5xl font-bold">Ready To Land Your Dream Job?</h2>

          <p className="mt-6 text-zinc-400">
            Practice with AI, improve your skills and confidently walk into your
            next interview.
          </p>

          <button
            onClick={() => {
              if (user.isSignedIn) {
                router.push("/uploadResume");
              } else {
                router.push("/sign-up");
              }
            }}
            className="mt-10 rounded-xl bg-indigo-600 px-8 py-4 font-semibold transition hover:bg-indigo-500"
          >
            Start Free Interview
          </button>

          <button
            onClick={handleToTop}
            className="ml-4 mt-10 rounded-xl border border-zinc-700 px-8 py-4 font-semibold transition hover:bg-zinc-900"
          >
            Back To Top
          </button>
        </div>
      </section>
    </main>
  );
}
