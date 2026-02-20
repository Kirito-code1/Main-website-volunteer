export function getLoginUrl() {
  const configuredAuthSite =
    process.env.NEXT_PUBLIC_AUTH_SITE_URL ||
    process.env.NEXT_PUBLIC_MAIN_SITE_URL ||
    "https://main-website-volunteer.vercel.app";

  return `${configuredAuthSite.replace(/\/$/, "")}/login`;
}

export async function hydrateSessionFromUrl(supabase) {
  if (typeof window === "undefined" || !supabase?.auth?.setSession) {
    return false;
  }

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const searchParams = url.searchParams;

  const accessToken =
    hashParams.get("access_token") || searchParams.get("access_token");
  const refreshToken =
    hashParams.get("refresh_token") || searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("Failed to hydrate auth session from URL:", error.message);
    return false;
  }

  const authKeys = [
    "access_token",
    "refresh_token",
    "expires_at",
    "expires_in",
    "token_type",
    "type",
    "provider_token",
    "provider_refresh_token",
    "code",
  ];

  authKeys.forEach((key) => {
    searchParams.delete(key);
    hashParams.delete(key);
  });

  const nextSearch = searchParams.toString();
  const nextHash = hashParams.toString();
  const cleanUrl =
    `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}` +
    `${nextHash ? `#${nextHash}` : ""}`;

  window.history.replaceState({}, "", cleanUrl);
  return true;
}
