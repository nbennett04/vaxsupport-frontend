"use client";
import React, { useEffect, useState } from "react";

import ModelTable from "@/components/model-table";
import { axiosInstance } from "@/utils/axiosInstance";
import { ModelType } from "@/types/dataTypes";
import Loader from "@/components/loader";

type CreatePayload = {
  name: string;
  key: string;
  description?: string;
};

// If axiosInstance already has baseURL="/api", set this to "/admin/models"
const BASE = "/admin/models";

// helper: timestamp from createdAt/updatedAt
const getTs = (row: Partial<ModelType>) => {
  const s = row.createdAt || row.updatedAt;
  const n = s ? Date.parse(s) : NaN;
  return Number.isNaN(n) ? 0 : n;
};

export default function ModelsPage() {
  const [models, setModels] = useState<ModelType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreatePayload>({
    name: "",
    key: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`${BASE}/all`);

      // Normalize server -> UI shape; ensure `active` is boolean
      const normalized: ModelType[] = (res.data || []).map((x: any) => ({
        id: String(x.id ?? x._id ?? ""),
        name: x.name ?? "",
        key: x.key ?? "",
        description: x.description ?? "",
        active: Boolean(x.active),
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
      }));

      // Sort newest first (createdAt, fallback updatedAt), stable tie-breaker by id
      normalized.sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1; // active on top
        const diff = getTs(b) - getTs(a); // newest first
        if (diff !== 0) return diff;
        return String(b.id).localeCompare(String(a.id)); // deterministic tie-break
      });

      setModels(normalized);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load models.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setForm({ name: "", key: "", description: "" });
    setError(null);
    setIsAddOpen(true);
  };
  const closeAdd = () => setIsAddOpen(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await axiosInstance.post(`${BASE}/add`, {
        name: form.name?.trim(),
        key: form.key?.trim(),
        description: form.description?.trim() || "",
      });
      setIsAddOpen(false);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to create model.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Loader isLoading={isLoading} />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Models</h1>
        <button
          onClick={openAdd}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
        >
          + Add Model
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <ModelTable data={models} fetchData={fetchData} basePath={BASE} />

      {/* Add Model Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAdd} aria-hidden />
          <div className="relative z-10 w-[92%] max-w-lg rounded-2xl border bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-semibold">Add Model</h2>
              <button
                onClick={closeAdd}
                className="rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. Primary API Key"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Key</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                  value={form.key}
                  onChange={(e) => setForm((s) => ({ ...s, key: e.target.value }))}
                  placeholder="e.g. ft:gpt-4o-mini:your-model"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Description</label>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Optional notes…"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black"
                  disabled={creating}
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
