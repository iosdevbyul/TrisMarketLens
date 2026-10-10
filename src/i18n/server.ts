import { cookies } from "next/headers";
import { translate } from "./translations";
export async function getLocale(): Promise<"en" | "ko"> {
  return (await cookies()).get("tris-locale")?.value === "ko" ? "ko" : "en";
}
export async function getTranslator() {
  const locale = await getLocale();
  return (text: string) => translate(locale, text);
}
