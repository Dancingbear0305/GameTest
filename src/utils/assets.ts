// Data assets are relative to public/, with the deployment base applied once.
export function assetUrl(path?: string): string | undefined {
  return path ? `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}` : undefined;
}
