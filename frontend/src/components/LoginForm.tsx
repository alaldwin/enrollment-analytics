import { useState, type FormEvent } from 'react'
import {
  login,
  register,
  forgotPassword,
  verifyPasswordResetCode,
  resetPassword,
  type TokenResponse,
} from '../services/auth'

interface LoginFormProps {
  onLoginSuccess: (token: TokenResponse) => void
}

export default function LoginForm({
  onLoginSuccess,
}: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Password reset states
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [isResetPassword, setIsResetPassword] = useState(false)

  const [resetEmail, setResetEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resetToken, setResetToken] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegistering) {
        const newUser = await register({
          username,
          email,
          password,
        })

        setSuccess(
          `Account created successfully for ${newUser.username}. You can now sign in.`,
        )
        setIsRegistering(false)
        setPassword('')
      } else {
        const token = await login({ username, password })
        onLoginSuccess(token)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await forgotPassword({
        email: resetEmail.trim(),
      })

      setSuccess(result.message)
      setIsForgotPassword(false)
      setIsVerifyingCode(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to request password reset.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await verifyPasswordResetCode({
        email: resetEmail.trim(),
        code: verificationCode.trim(),
      })

      // Keep the reset token internally.
      // Never display it to the user.
      setResetToken(result.reset_token)

      setVerificationCode('')
      setIsVerifyingCode(false)
      setIsResetPassword(true)
      setSuccess('Email verified. You can now create a new password.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to verify your code.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
      })

      setResetToken('')
      setNewPassword('')
      setConfirmPassword('')
      setVerificationCode('')

      setIsResetPassword(false)
      setIsVerifyingCode(false)
      setIsForgotPassword(false)
      setIsRegistering(false)

      setSuccess(
        `${result.message} Please sign in with your new password.`,
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset password.',
      )
    } finally {
      setLoading(false)
    }
  }

  function switchMode() {
    setIsRegistering((current) => !current)
    setError('')
    setSuccess('')
    setPassword('')
  }

  function backToSignIn() {
    setIsForgotPassword(false)
    setIsVerifyingCode(false)
    setIsResetPassword(false)

    setResetEmail('')
    setVerificationCode('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')

    setError('')
    setSuccess('')
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const buttonClass =
    'w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'

  const backButtonClass =
    'w-full text-sm text-blue-600 hover:text-blue-700'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

      {/* STEP 3: Create New Password */}
      {isResetPassword ? (
        <form
          onSubmit={handleResetPassword}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Create New Password
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your email has been verified. Choose a new password.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm text-slate-700">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
              placeholder="Enter your new password"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm text-slate-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
              placeholder="Confirm your new password"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={buttonClass}
          >
            {loading ? 'Updating password...' : 'Update Password'}
          </button>

          <button
            type="button"
            onClick={backToSignIn}
            className={backButtonClass}
          >
            Back to Sign In
          </button>
        </form>

      ) : isVerifyingCode ? (

        /* STEP 2: Verify Email Code */
        <form
          onSubmit={handleVerifyCode}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Verify Your Email
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              We sent a six-digit verification code to {resetEmail}.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="verificationCode" className="text-sm text-slate-700">
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              minLength={6}
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(
                  event.target.value.replace(/\D/g, '').slice(0, 6),
                )
              }
              autoComplete="one-time-code"
              required
              placeholder="Enter your 6-digit code"
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
            <p className="text-xs text-slate-500">
              The verification code expires after 10 minutes.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className={buttonClass}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={backToSignIn}
            className={backButtonClass}
          >
            Back to Sign In
          </button>
        </form>

      ) : isForgotPassword ? (

        /* STEP 1: Request Verification Code */
        <form
          onSubmit={handleForgotPassword}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your registered email to receive a verification code.
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="resetEmail" className="text-sm text-slate-700">
              Email Address
            </label>
            <input
              id="resetEmail"
              type="email"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="Enter your registered email"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={buttonClass}
          >
            {loading ? 'Sending verification code...' : 'Send Verification Code'}
          </button>

          <button
            type="button"
            onClick={backToSignIn}
            className={backButtonClass}
          >
            Back to Sign In
          </button>
        </form>

      ) : (

        /* LOGIN / REGISTRATION */
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              Enrollment Analytics
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isRegistering
                ? 'Create your analytics account'
                : 'Sign in to access the analytics dashboard'}
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-slate-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
              className={inputClass}
              placeholder="Enter your username"
            />
          </div>

          {isRegistering && (
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className={inputClass}
                placeholder="Enter your email"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
              minLength={isRegistering ? 8 : undefined}
              maxLength={128}
              required
              className={inputClass}
              placeholder="Enter your password"
            />
            {isRegistering && (
              <p className="text-xs text-slate-500">
                Password must contain at least 8 characters.
              </p>
            )}
          </div>

          {!isRegistering && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true)
                  setError('')
                  setSuccess('')
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={buttonClass}
          >
            {loading
              ? isRegistering
                ? 'Creating account...'
                : 'Signing in...'
              : isRegistering
                ? 'Create account'
                : 'Sign in'}
          </button>

          <p className="text-center text-sm text-slate-500">
            {isRegistering
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </p>
        </form>
      )}
    </div>
  )
}