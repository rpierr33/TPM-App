// Token getter — set by the React auth provider, used by queryClient
let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export async function getAuthToken(): Promise<string | null> {
  return tokenGetter ? tokenGetter() : null;
}
