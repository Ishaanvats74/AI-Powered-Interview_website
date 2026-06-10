"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function UploadResumePage() {
  const [pdfFile, setPdfFile] = useState<File>();
  const router = useRouter();
  const { user } = useUser();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }
    setPdfFile(file);
  };
  const handleUpload = async () => {
    if (!pdfFile) return;
    const result = await UploadPdf(pdfFile);
    if (!result) return;
    router.push("/vapi");
  };
  const UploadPdf = async (file: File) => {
    const form = new FormData();
    form.append(`file`, file);
    form.append("userId", user!.id);
    const response = await fetch("http://127.0.0.1:8000/UploadResume", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    return result;
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

      <div className="absolute left-1/2 top-20 -z-10 h-125 w-125 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

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
            Back
          </button>
        </div>
      </nav>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-10 backdrop-blur-xl">
          {/* Heading */}
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
              Resume Based Interview
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Upload Your Resume
            </h1>

            <p className="mt-4 text-zinc-400">
              We&apos;ll analyze your skills, projects, and experience to create
              a personalized AI interview.
            </p>
          </div>

          {/* Upload Area */}
          {!pdfFile ? (
            <label
              htmlFor="resume"
              className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-700 p-10 sm:p-16 transition-all  duration-300 hover:border-indigo-500 hover:bg-indigo-500/5 "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mb-6 h-16 w-16 text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V3m0 13.5l-4.5-4.5M12 16.5l4.5-4.5M4.5 21h15"
                />
              </svg>

              <h2 className="text-xl sm:text-2xl font-semibold">
                Drag & Drop Resume
              </h2>

              <p className="mt-3 text-zinc-400 text-center">
                PDF only • Max 10MB
              </p>

              <span className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-medium">
                Browse Files
              </span>

              <input
                id="resume"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-green-400">
                    ✓ Resume Uploaded
                  </h3>

                  <p className="mt-1 text-white break-all">{pdfFile.name}</p>

                  <p className="text-sm text-zinc-400">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <label
                  htmlFor="resume"
                  className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 hover:bg-zinc-900"
                >
                  Replace
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Uploaded File */}
          {pdfFile && (
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{pdfFile.name}</h3>

                  <p className="text-sm text-zinc-400">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm text-green-400">
                  Uploaded
                </span>
              </div>

              {/* Preview Analysis */}
              <div className="mt-6 ">
                <div className="rounded-xl bg-zinc-950 p-4">
                  <h4 className="mb-3 font-semibold">Interview Details</h4>

                  <p className="text-zinc-400">
                    Estimated Duration: 15-20 Minutes
                  </p>

                  <p className="mt-2 text-zinc-400">
                    Questions will be tailored to your resume.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleUpload}
            disabled={!pdfFile}
            className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 sm:py-5 text-base sm:text-lg font-semibold transition-all duration-300 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Resume & Start Interview
          </button>
        </div>
      </section>
    </main>
  );
}
