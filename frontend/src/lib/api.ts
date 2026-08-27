export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem(
    "aquasentinel_token"
  );

  return fetch(
    `http://127.0.0.1:8000${url}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }
  );
}