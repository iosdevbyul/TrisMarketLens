export type RawResearchComparison = Record<string, unknown>;

export type ResearchComparisonGroup = {
  contractId: string;
  records: RawResearchComparison[];
  modelKeys: string[];
  runCount: number;
  comparablePairCount: number;
};

export type ResearchComparisonClassification = {
  comparable: ResearchComparisonGroup[];
  unclassified: RawResearchComparison[];
  total: number;
};

function boundedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" && value.length <= 256 ? value : null;
}

export function comparisonContractId(value: RawResearchComparison): string | null {
  return boundedString(value.comparisonContractId);
}

export function comparisonModelKey(value: RawResearchComparison): string | null {
  return boundedString(value.modelKey) ?? boundedString(value.modelId);
}

/**
 * Comparison is permitted only within an exact backend-supplied fingerprint.
 * Never infer one from model names, timestamps, scores, or research periods.
 */
export function classifyResearchComparisons(records: readonly RawResearchComparison[]): ResearchComparisonClassification {
  const groups = new Map<string, RawResearchComparison[]>();
  const unclassified: RawResearchComparison[] = [];
  for (const record of records) {
    const contract = comparisonContractId(record);
    if (!contract) {
      unclassified.push(record);
      continue;
    }
    const group = groups.get(contract) ?? [];
    group.push(record);
    groups.set(contract, group);
  }

  const comparable: ResearchComparisonGroup[] = [...groups].map(([contractId, entries]) => {
    const keys = new Set(entries.map(comparisonModelKey).filter((key): key is string => key !== null));
    return {
      contractId,
      records: entries,
      modelKeys: [...keys].sort(),
      runCount: entries.length,
      comparablePairCount: entries.length * (entries.length - 1) / 2,
    };
  }).sort((a, b) => b.runCount - a.runCount || a.contractId.localeCompare(b.contractId));
  return { comparable, unclassified, total: records.length };
}
