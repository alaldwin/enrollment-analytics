
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export type UserRole = 'admin' | 'analyst' | 'dean' | 'guest'

export interface User {
  user_id: string
  username: string
  email: string
  role: UserRole
  is_active: boolean
  created_at?: string
  updated_at?: string
}

async function apiRequest<T>(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'PATCH',
  body?: object,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  if (!response.ok) {
    const errorBody = await response.text()

    throw new Error(
      `API request failed (${response.status}): ${errorBody}`,
    )
  }

  return response.json() as Promise<T>
}

export async function getUsers(
  accessToken: string,
): Promise<User[]> {
  return apiRequest<User[]>(
    '/auth/users',
    accessToken,
    'GET',
  )
}

export async function updateUserRole(
  accessToken: string,
  userId: string,
  role: UserRole,
): Promise<User> {
  return apiRequest<User>(
    `/auth/users/${userId}/role`,
    accessToken,
    'PATCH',
    { role },
  )
}

export async function updateUserStatus(
  accessToken: string,
  userId: string,
  isActive: boolean,
): Promise<User> {
  return apiRequest<User>(
    `/auth/users/${userId}/status`,
    accessToken,
    'PATCH',
    { is_active: isActive },
  )
}
