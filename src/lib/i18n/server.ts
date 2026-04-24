import "server-only";
import { cookies } from "next/headers";
import { dictionaries, type Locale } from "./dict";

const COOKIE = "kessoku-locale";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(COOKIE)?.value;
  return c === "fr" ? "fr" : "en";
}

export async function getDict() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
