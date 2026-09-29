const extraOrigins = () =>
  (process.env.CLIENT_URLS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const configuredOrigins = () =>
  new Set(
    [process.env.CLIENT_URL, ...extraOrigins()].filter(Boolean) as string[]
  );

const isPrivateLanHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

const isLocalDevOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    const localPort = ["8080", "8081", "5173", "4173", ""].includes(url.port);
    return isPrivateLanHost(url.hostname) && localPort;
  } catch {
    return false;
  }
};

const isAllowedVercelOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (configuredOrigins().has(origin)) return true;
  if (isLocalDevOrigin(origin)) return true;
  if (isAllowedVercelOrigin(origin)) return true;
  return false;
};
