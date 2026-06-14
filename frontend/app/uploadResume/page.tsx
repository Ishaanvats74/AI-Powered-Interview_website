"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function UploadResumePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      return;
    }

    setError(null);
    setPdfFile(file);
  };

  const handleUpload = async () => {
    if (!pdfFile || !user) return;

    setUploading(true);
    setError(null);

    try {
      const token = await getToken();

      const form = new FormData();
      form.append("file", pdfFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      if (!response.ok) {
        const err = await response.json();

        throw new Error(
          err.detail || "Upload failed."
        );
      }

      router.push("/analysis");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center">
        <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-500">
          Resume Based Interview
        </span>

        <h1 className="mt-6 text-5xl font-bold">
          Upload Your Resume
        </h1>

        <p className="mt-4 text-muted-foreground">
          We'll analyze your skills and create a personalized AI interview.
        </p>
      </div>

      <div className="mt-12 rounded-3xl border border-border bg-card p-8 md:p-12">
        {!pdfFile ? (
          <label
            htmlFor="resume"
            className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border p-12 transition hover:bg-accent"
          >
            <div className="rounded-2xl bg-indigo-500/10 p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-12 w-12 text-indigo-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V3m0 13.5l-4.5-4.5M12 16.5l4.5-4.5M4.5 21h15"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-semibold">
              Upload Resume
            </h2>

            <p className="mt-3 text-center text-muted-foreground">
              PDF only • Maximum size 10 MB
            </p>

            <span className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white">
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
          <div className="rounded-2xl border border-border bg-muted p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-green-500">
                  Resume Selected
                </h3>

                <p className="mt-2 break-all">
                  {pdfFile.name}
                </p>

                <p className="text-sm text-muted-foreground">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <label
                htmlFor="replace-resume"
                className="cursor-pointer rounded-xl border border-border px-4 py-2 hover:bg-accent"
              >
                Replace

                <input
                  id="replace-resume"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {pdfFile && (
          <div className="mt-6 rounded-2xl border border-border bg-muted p-6">
            <h3 className="font-semibold">
              Interview Details
            </h3>

            <p className="mt-3 text-muted-foreground">
              Estimated Duration: 15–20 minutes
            </p>

            <p className="mt-2 text-muted-foreground">
              Questions will be generated from your resume.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!pdfFile || uploading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing Resume...
            </>
          ) : (
            "Analyze Resume"
          )}
        </button>
      </div>
    </main>
  );
}