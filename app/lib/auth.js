export function getLoginUrl() {
  const configuredAuthSite =
    process.env.NEXT_PUBLIC_AUTH_SITE_URL ||
    process.env.NEXT_PUBLIC_MAIN_SITE_URL ||
    "https://main-website-volunteer.vercel.app";

  return `${configuredAuthSite.replace(/\/$/, "")}/login`;
}

export async function hydrateSessionFromUrl(supabase) {
  if (typeof window === "undefined") return false;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("Failed to hydrate session from URL:", error.message);
    return false;
  }

  ["access_token", "refresh_token", "token_type", "expires_in", "expires_at", "provider_token", "provider_refresh_token", "type"].forEach((param) => {
    searchParams.delete(param);
  });

  const sanitizedSearch = searchParams.toString();
  const sanitizedUrl = `${window.location.pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ""}`;
  window.history.replaceState({}, "", sanitizedUrl);

  return true;
}
