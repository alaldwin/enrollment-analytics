
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function apiGet<T>(
  endpoint: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()

    throw new Error(
      `API request failed (${response.status}): ${errorBody}`,
    )
  }

  return response.json() as Promise<T>
}
