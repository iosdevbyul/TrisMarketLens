"use server";

import { redirect } from "next/navigation";
import { getAIManagementSnapshot, requestAIManagementOperation, stringValue } from "@/data/AIModelManagementDataSource";

const destination = "/ai-research-models";

function modelKey(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(value) ? value : null;
}

function move(notice: string, job?: string): never {
  const params = new URLSearchParams({ notice });
  if (job) params.set("job", job);
  redirect(destination + "?" + params.toString());
}

export async function requestModelValidation(formData: FormData): Promise<void> {
  const key = modelKey(formData.get("modelKey"));
  if (!key) move("invalid-model");
  const snapshot = await getAIManagementSnapshot();
  if (snapshot.state !== "available") move("connection-error");
  if (!snapshot.models.some((model) => model.key === key || model.modelKey === key)) move("unknown-model");
  const result = await requestAIManagementOperation("validate", { modelKey: key });
  if (!result.ok) move("backend-" + result.status);
  const job = stringValue(result.data.jobId);
  if (!job || !/^[a-f0-9]{64}$/i.test(job)) move("invalid-response");
  move("validation-started", job);
}

export async function selectValidatedResearchModel(formData: FormData): Promise<void> {
  if (formData.get("approve") !== "yes") move("approval-required");
  const key = modelKey(formData.get("modelKey"));
  const receipt = formData.get("validationId");
  const expected = formData.get("expectedSelectionVersion");
  if (!key || typeof receipt !== "string" || !/^[a-zA-Z0-9_.:-]{1,128}$/.test(receipt) ||
      typeof expected !== "string" || !/^(0|[1-9][0-9]{0,9})$/.test(expected)) move("invalid-request");

  const snapshot = await getAIManagementSnapshot();
  if (snapshot.state !== "available" || !snapshot.active) move("connection-error");
  if (!snapshot.models.some((model) => model.key === key || model.modelKey === key)) move("unknown-model");
  if (snapshot.active.busy === true) move("backend-409");
  if (snapshot.active.selectionVersion !== Number(expected)) move("backend-409");

  const result = await requestAIManagementOperation("select", {
    modelKey: key,
    validationId: receipt,
    expectedSelectionVersion: Number(expected),
    approve: true,
  });
  if (!result.ok) move("backend-" + result.status);
  move("selection-submitted");
}
