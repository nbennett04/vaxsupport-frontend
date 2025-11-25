"use client";
import React, { useState } from "react";
import { axiosInstance } from "@/utils/axiosInstance";
import { ModelType } from "@/types/dataTypes";

type Props = {
  data: ModelType[];
  fetchData: () => Promise<void> | void;
  basePath: string; // e.g. "/admin/models"
};

// Robust getter: prefer id, but fall back safely
const getRowId = (row: Partial<ModelType> & { _id?: string }) =>
  String(row?.id ?? (row as any)?._id ?? "");

// format in user’s locale/timezone
const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ModelTable({ data, fetchData, basePath }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModelType> & { key?: string }>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Activate confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const startEdit = (row: ModelType) => {
    const id = getRowId(row);
    setEditingId(id);
    setEditForm({
      name: row.name ?? "",
      key: row.key ?? "",
      description: row.description ?? "",
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    try {
      setBusyId(id);
      setError(null);
      await axiosInstance.put(`${basePath}/${id}`, {
        name: editForm.name?.toString().trim(),
        key: editForm.key?.toString().trim(),
        description: editForm.description?.toString().trim() ?? "",
      });
      setEditingId(null);
      setEditForm({});
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to update model.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this model? This cannot be undone.")) return;
    try {
      setBusyId(id);
      setError(null);
      await axiosInstance.delete(`${basePath}/${id}`);
      await fetchData();
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to delete model.");
    } finally {
      setBusyId(null);
    }
  };

  // === Activate flow ===
  const openActivateConfirm = (id: string, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
    setConfirmError(null);
    setConfirmOpen(true);
  };

  const closeActivateConfirm = () => {
    if (confirmLoading) return;
    setConfirmOpen(false);
    setConfirmId(null);
    setConfirmName("");
    setConfirmError(null);
  };

  const confirmActivate = async () => {
  if (!confirmId) {
    setConfirmError("Invalid model id.");
    return;
  }
  try {
    setConfirmLoading(true);
    setConfirmError(null);

    // ✅ match your backend route & method:
    await axiosInstance.post(`${basePath}/activate/${confirmId}`);

    setConfirmOpen(false);
    setConfirmId(null);
    setConfirmName("");
    await fetchData();
  } catch (e: any) {
    console.error(e);
    setConfirmError(e?.response?.data?.message || e?.response?.data?.detail || "Failed to activate model.");
  } finally {
    setConfirmLoading(false);
  }
};

  // Simple switch UI
  const Switch = ({
    checked,
    onChange,
    disabled,
    label,
  }: {
    checked: boolean;
    onChange?: () => void;
    disabled?: boolean;
    label?: string;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle"}
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        checked
          ? "bg-green-500/80 dark:bg-green-500"
          : "bg-neutral-300 dark:bg-neutral-700",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white transition",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );

  return (
    <div className="w-full overflow-x-auto rounded-2xl border dark:border-neutral-800">
      {error && (
        <div className="m-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <table className="min-w-[1120px] w-full border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-sm">
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900">Name</th>
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900">Key</th>
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900">Description</th>
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900">Status</th>
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900">Created at</th>
            <th className="sticky top-0 z-[1] bg-neutral-50 px-4 py-3 font-medium dark:bg-neutral-900 w-[260px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(!data || data.length === 0) && (
            <tr>
              <td className="px-4 py-5 text-sm text-neutral-500 dark:text-neutral-400" colSpan={6}>
                No models found.
              </td>
            </tr>
          )}

          {data?.map((row, idx) => {
            const id = getRowId(row);
            const hasId = !!id;
            const isEditing = editingId === id;
            const isBusy = busyId === id;
            const isActive = row.active;

            return (
              <tr key={id || `row-${idx}`} className="border-t text-sm dark:border-neutral-800">
                <td className="px-4 py-3 align-top">
                  {isEditing ? (
                    <input
                      className="w-full rounded-lg border px-2 py-1 outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                      value={String(editForm.name ?? "")}
                      onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Name"
                    />
                  ) : (
                    <span className="font-medium">{row.name}</span>
                  )}
                </td>

                <td className="px-4 py-3 align-top">
                  {isEditing ? (
                    <input
                      className="w-full rounded-lg border px-2 py-1 outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                      value={String(editForm.key ?? "")}
                      onChange={(e) => setEditForm((s) => ({ ...s, key: e.target.value }))}
                      placeholder="Key"
                    />
                  ) : (
                    <code className="rounded bg-neutral-100 px-2 py-1 text-[12px] dark:bg-neutral-800">
                      {row.key}
                    </code>
                  )}
                </td>

                <td className="px-4 py-3 align-top">
                  {isEditing ? (
                    <textarea
                      className="w-full rounded-lg border px-2 py-1 outline-none focus:ring dark:border-neutral-700 dark:bg-neutral-800"
                      rows={2}
                      value={String(editForm.description ?? "")}
                      onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                      placeholder="Description"
                    />
                  ) : (
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {row.description || "—"}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
                      ].join(" ")}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>

                    {/* Toggle: only allows turning ON (activation) from here */}
                    <Switch
                      checked={isActive}
                      disabled={isActive || isBusy || isEditing || !hasId}
                      label="Activate model"
                      onChange={() => {
                        if (!isActive && hasId) openActivateConfirm(id, row.name || "this model");
                      }}
                    />
                  </div>
                </td>

                {/* Created at */}
                <td className="px-4 py-3 align-top">
                  {row.createdAt ? (
                    <span className="whitespace-nowrap" title={new Date(row.createdAt).toISOString()}>
                      {formatDateTime(row.createdAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-3 align-top">
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        onClick={cancelEdit}
                        disabled={isBusy}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-lg bg-black px-3 py-1 text-xs text-white hover:opacity-90 dark:bg-white dark:text-black"
                        onClick={() => hasId && saveEdit(id)}
                        disabled={isBusy || !hasId}
                      >
                        {isBusy ? "Saving…" : "Save"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-lg border px-3 py-1 text-xs hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        onClick={() => startEdit(row)}
                        disabled={isBusy || !hasId}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg border border-red-500 px-3 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-900/20"
                        onClick={() => hasId && handleDelete(id)}
                        disabled={isBusy || !hasId}
                      >
                        {isBusy ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Activate Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeActivateConfirm} aria-hidden />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl border bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Activate model</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Do you want to activate model <span className="font-medium">“{confirmName}”</span>?
              </p>
            </div>

            {confirmError && (
              <div className="mb-3 rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-200">
                {confirmError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                onClick={closeActivateConfirm}
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black"
                onClick={confirmActivate}
                disabled={confirmLoading}
              >
                {confirmLoading ? "Activating…" : "Yes, Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
