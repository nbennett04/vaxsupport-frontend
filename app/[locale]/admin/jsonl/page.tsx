"use client";
import React, { useMemo, useState } from "react";
import { axiosInstance } from "@/utils/axiosInstance";

// If axiosInstance has baseURL="/api", use "/tools/qa-to-jsonl" here.
// Otherwise use the full path "/api/tools/qa-to-jsonl".
const ENDPOINT = "/admin/tools/qa-to-jsonl";

export default function GetJsonlPage() {
  const [system, setSystem] = useState("");
  const [text, setText] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple QA parser for a live pair count
  const pairCount = useMemo(() => {
    const lines = String(text || "").split(/\r?\n/);
    let q: string | null = null;
    let count = 0;
    const QRE = /^\s*Q\s*[:\-]\s*(.*)$/i;
    const ARE = /^\s*A\s*[:\-]\s*(.*)$/i;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const qMatch = line.match(QRE);
      if (qMatch) {
        q = qMatch[1].trim();
        continue;
      }
      const aMatch = line.match(ARE);
      if (aMatch && q !== null) {
        count += 1;
        q = null;
      }
    }
    return count;
  }, [text]);

  const parseFilenameFromContentDisposition = (cd?: string | null) => {
    if (!cd) return "qa_dataset.jsonl";
    const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    try {
      return decodeURIComponent(match?.[1] || "qa_dataset.jsonl");
    } catch {
      return match?.[1] || "qa_dataset.jsonl";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Please paste Q/A text.");
      return;
    }
    if (pairCount === 0) {
      setError("No Q/A pairs detected. Use lines like:\nQ : your question\nA : your answer");
      return;
    }

    try {
      setDownloading(true);

      const res = await axiosInstance.post(
        ENDPOINT,
        { system, text },
        { responseType: "blob", validateStatus: () => true }
      );

      if (res.status < 200 || res.status >= 300) {
        // When responseType=blob, errors also come as Blob
        let msg = `Export failed (${res.status})`;
        try {
          const asText = await (res.data as Blob).text();
          const maybeJson = JSON.parse(asText);
          msg = maybeJson?.message || maybeJson?.detail || msg;
        } catch {
          // keep default msg
        }
        throw new Error(msg);
      }

      const blob = res.data as Blob;
      const filename = parseFilenameFromContentDisposition(res.headers["content-disposition"]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "qa_dataset.jsonl";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setDownloading(false);
    }
  };

  const fillSample = () => {
    setSystem("You are a knowledgeable and friendly assistant trained to provide accurate, up-to-date information on vaccinations.Your purpose is to help users with all their vaccination-related queries, including vaccine schedules, eligibility, safety, side effects, benefits, and guidance for various age groups, travel, pregnancy, and medical conditions.You are designed to support users by offering reliable information from trusted health organizations like the WHO and CDC, ensuring that every response is helpful, clear, and informative.");
    setText(
      [
        "Q : What is the vaccination schedule?",
        "A : The vaccination schedule depends on the type of vaccine.\nGenerally, it is recommended to follow the timeline provided by your healthcare provider or the local health authority.",
        "",
        "Q : Are vaccines available for everyone?",
        "A : Vaccines are generally available for eligible age groups and health conditions. Please consult your healthcare provider to confirm eligibility.",
      ].join("\n")
    );
  };

  const resetForm = () => {
    setSystem("");
    setText("");
    setError(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-semibold">Generate JSONL </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* System Prompt */}
        <div>
          <label className="mb-1 block text-sm font-medium">System Prompt (optional)</label>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
            rows={3}
            placeholder="e.g. Answer concisely and helpfully."
            value={system}
            onChange={(e) => setSystem(e.target.value)}
          />
          <p className="mt-1 text-xs text-neutral-500">
             This will be included as a <code>system</code> message in every training example.
          </p>
        </div>

        {/* Q/A Text */}
        <div>
          <div className="flex items-center justify-between">
            <label className="mb-1 block text-sm font-medium">Q/A Text</label>
            <div className="text-xs text-neutral-500">Pairs detected: {pairCount}</div>
          </div>
          <textarea
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
            rows={14}
            placeholder={'Q : question here\nA : answer here\n\nQ : question here\nA : answer here'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={fillSample}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Fill sample
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Reset
            </button>
          </div>
        </div>

        {error && (
          <div className="whitespace-pre-line rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="submit"
            disabled={downloading}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {downloading ? "Generating…" : "Download JSONL"}
          </button>
        </div>
      </form>
    </div>
  );
}
