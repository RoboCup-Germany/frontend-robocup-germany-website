const ensureLeadingSlash = (value = "/") => {
  const normalized = String(value || "/").trim() || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const trimTrailingSlash = (value = "") => String(value).replace(/\/+$/, "");
const trimLeadingSlash = (value = "") => String(value).replace(/^\/+/, "");
const basePrefix = (value = "/") => (value === "/" ? "" : trimTrailingSlash(value));

const appBaseURL = ensureLeadingSlash(process.env.NUXT_APP_BASE_URL || "/");
const appBuildAssetsDir = ensureLeadingSlash(process.env.NUXT_APP_BUILD_ASSETS_DIR || "/_nuxt/");
const appCdnURL = trimTrailingSlash(String(process.env.NUXT_APP_CDN_URL || "").trim());

export const baseURL = () => appBaseURL;

export const buildAssetsURL = (path = "") => {
  const suffix = String(path || "").replace(/^\/+/, "");
  let prefix = `${basePrefix(appBaseURL)}/${trimLeadingSlash(appBuildAssetsDir)}`;
  if (!prefix.endsWith("/")) {
    prefix = `${prefix}/`;
  }
  if (appCdnURL) {
    prefix = `${appCdnURL}${prefix}`;
  }
  return suffix ? `${prefix}${suffix}` : prefix;
};

export const publicAssetsURL = (path = "") => {
  const suffix = String(path || "");
  if (!suffix) {
    return appBaseURL;
  }

  if (suffix.startsWith("http://") || suffix.startsWith("https://")) {
    return suffix;
  }

  const normalizedPath = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const prefixedPath = `${basePrefix(appBaseURL)}${normalizedPath}` || "/";
  return appCdnURL ? `${appCdnURL}${prefixedPath}` : prefixedPath;
};
