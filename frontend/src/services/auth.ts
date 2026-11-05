const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  role: 'admin' | 'analyst' | 'dean' | 'guest'
}

export async function login(
  credentials: LoginRequest,
): Promise<TokenResponse> {
  const formData = new URLSearchParams()

  formData.append('username', credentials.username)
  formData.append('password', credentials.password)

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formData.toString(),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || `Login failed (${response.status})`,
    )
  }

  return data as TokenResponse
}

// Registration

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  user_id: string
  username: string
  email: string
  role: 'admin' | 'analyst' | 'dean' | 'guest'
  is_active: boolean
}

export async function register(
  user: RegisterRequest,
): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(user),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || `Registration failed (${response.status})`,
    )
  }

  return data as RegisterResponse
}

// Forgot Password

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
}

export async function forgotPassword(
  request: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/forgot-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || `Password reset request failed (${response.status})`,
    )
  }

  return data as ForgotPasswordResponse
}

// Verify Password Reset Code

export interface VerifyPasswordResetCodeRequest {
  email: string
  code: string
}

export interface VerifyPasswordResetCodeResponse {
  message: string
  reset_token: string
}

export async function verifyPasswordResetCode(
  request: VerifyPasswordResetCodeRequest,
): Promise<VerifyPasswordResetCodeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/verify-reset-code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || `Code verification failed (${response.status})`,
    )
  }

  return data as VerifyPasswordResetCodeResponse
}

// Reset Password

export interface ResetPasswordRequest {
  reset_token: string
  new_password: string
}

export interface ResetPasswordResponse {
  message: string
}

export async function resetPassword(
  request: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/reset-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
    },
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || `Password reset failed (${response.status})`,
    )
  }

  return data as ResetPasswordResponse
}