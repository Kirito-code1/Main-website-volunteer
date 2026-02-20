export function getLoginUrl() {
  const configuredAuthSite =
    process.env.NEXT_PUBLIC_AUTH_SITE_URL ||
    process.env.NEXT_PUBLIC_MAIN_SITE_URL ||
    "https://main-website-volunteer.vercel.app";

  return `${configuredAuthSite.replace(/\/$/, "")}/login`;
}
