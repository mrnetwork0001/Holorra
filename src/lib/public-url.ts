/**
 * Absolute, publicly reachable URL for a file under /public.
 * The Aholo cloud fetches model and image inputs itself, so it needs a URL it
 * can reach: the deployed origin in production, and the live site when the app
 * runs on localhost (where the cloud cannot see our files).
 */
export const PUBLIC_SITE = "https://holorra.xyz";

export function publicAssetUrl(path: string): string {
  if (typeof window === "undefined") return PUBLIC_SITE + path;
  const { hostname, origin } = window.location;
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  return (local ? PUBLIC_SITE : origin) + path;
}
