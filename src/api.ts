export async function postJson<TResponse, TBody extends Record<string, unknown>>(
  path: `/api/${string}`,
  body: TBody
): Promise<TResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : '';
  } catch {
    return '';
  }
}
