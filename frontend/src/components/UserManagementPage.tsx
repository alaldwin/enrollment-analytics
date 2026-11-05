import { useCallback, useEffect, useState } from 'react'
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
  type User,
  type UserRole,
} from '../services/users'

interface UserManagementPageProps {
  accessToken: string
}

export default function UserManagementPage({
  accessToken,
}: UserManagementPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getUsers(accessToken)
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load users.',
      )
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function handleRoleChange(userId: string, role: UserRole) {
    setUpdatingUserId(userId)
    setError(null)

    try {
      const updatedUser = await updateUserRole(accessToken, userId, role)

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.user_id === userId ? updatedUser : user,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update user role.',
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function handleStatusChange(userId: string, isActive: boolean) {
    setUpdatingUserId(userId)
    setError(null)

    try {
      const updatedUser = await updateUserStatus(
        accessToken,
        userId,
        isActive,
      )

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.user_id === userId ? updatedUser : user,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update user status.',
      )
    } finally {
      setUpdatingUserId(null)
    }
  }

  const activeUsers = users.filter((user) => user.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage registered accounts, access roles, and account status.
          </p>
        </div>

        <button
          onClick={() => void loadUsers()}
          disabled={loading}
          className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-blue-300 hover:text-slate-900 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh users'}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total accounts', value: users.length },
          { label: 'Active accounts', value: activeUsers },
          { label: 'Inactive accounts', value: users.length - activeUsers },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {item.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900">Registered users</h2>
          <p className="mt-1 text-xs text-slate-500">
            Change account roles and access status.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-blue-700">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Account actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {users.map((user) => {
                  const updating = updatingUserId === user.user_id

                  return (
                    <tr key={user.user_id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">
                          {user.username}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={user.role}
                          disabled={updating}
                          onChange={(event) =>
                            void handleRoleChange(
                              user.user_id,
                              event.target.value as UserRole,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="dean">Dean</option>
                          <option value="guest">Guest</option>
                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            user.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <button
                          disabled={updating}
                          onClick={() =>
                            void handleStatusChange(
                              user.user_id,
                              !user.is_active,
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-blue-300 hover:text-slate-900 disabled:opacity-50"
                        >
                          {updating
                            ? 'Updating...'
                            : user.is_active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}