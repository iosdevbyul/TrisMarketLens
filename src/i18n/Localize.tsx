import { getTranslator } from "@/i18n/server";

/** Server-rendered static interface copy. Never localize backend identifiers or model data. */
export async function Localize({ text }: { text: string }) {
  const t = await getTranslator();
  return <>{t(text)}</>;
}
