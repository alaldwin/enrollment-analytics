
import { useEffect, useState } from 'react'
import { getEnrollments } from '../services/enrollments'
import type {
  EnrollmentListResponse,
} from '../types/analytics'

interface EnrollmentsPageProps {
  accessToken: string
}

export default function EnrollmentsPage({
  accessToken,
}: EnrollmentsPageProps) {
  const [data, setData] = useState<EnrollmentListResponse | null>(null)
  const [page, setPage] = useState(1)
  const [yearLevel, setYearLevel] = useState('')
  const [enrollmentStatus, setEnrollmentStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const pageSize = 10

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 400)

    return () => clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    let cancelled = false

    async function fetchEnrollments() {
      try {
        setLoading(true)
        setError('')

        const result = await getEnrollments(accessToken, {
          page,
          page_size: pageSize,
          year_level: yearLevel ? Number(yearLevel) : undefined,
          enrollment_status: enrollmentStatus || undefined,
          search: debouncedSearch || undefined,
        })

        if (!cancelled) {
          setData(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load enrollment records.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchEnrollments()

    return () => {
      cancelled = true
    }
  }, [accessToken, page, yearLevel, enrollmentStatus, debouncedSearch])

  function handleYearLevelChange(value: string) {
    setYearLevel(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setEnrollmentStatus(value)
    setPage(1)
  }

  function getStatusStyle(status: string) {
    switch (status.toLowerCase()) {
      case 'enrolled':
        return 'bg-emerald-500/10 text-emerald-400'
      case 'dropped':
        return 'bg-red-500/10 text-red-400'
      case 'loa':
        return 'bg-amber-500/10 text-amber-400'
      default:
        return 'bg-gray-500/10 text-slate-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Enrollments
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Browse and analyze student enrollment records.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5">
        <p className="text-sm text-slate-600">
          Total enrollment records
        </p>
        <p className="mt-2 text-3xl font-bold text-slate-900">
          {data?.pagination.total.toLocaleString() ?? '—'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Records matching the selected filters
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="year-level"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
          <div className="flex-1">
            <label
              htmlFor="enrollment-search"
              className="mb-2 block text-xs font-medium text-slate-600"
            >
              Search Enrollment
            </label>

            <input
              id="enrollment-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Student ID, program, or campus..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
            Year Level
          </label>
          <select
            id="year-level"
            value={yearLevel}
            onChange={(event) =>
              handleYearLevelChange(event.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          >
            <option value="">All Year Levels</option>
            <option value="1">First Year</option>
            <option value="2">Second Year</option>
            <option value="3">Third Year</option>
            <option value="4">Fourth Year</option>
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="enrollment-status"
            className="mb-2 block text-xs font-medium text-slate-600"
          >
            Enrollment Status
          </label>
          <select
            id="enrollment-status"
            value={enrollmentStatus}
            onChange={(event) =>
              handleStatusChange(event.target.value)
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Dropped">Dropped</option>
            <option value="Loa">LOA</option>
          </select>
        </div>
      </div>

      {/* Enrollment table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Enrollment Records
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Detailed student enrollment information
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Loading enrollment records...
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <p className="mt-2 text-xs text-slate-500">
              Check your login permissions and backend connection.
            </p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No enrollment records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-4">Student ID</th>
                  <th className="px-5 py-4">Program</th>
                  <th className="px-5 py-4">College</th>
                  <th className="px-5 py-4">Campus</th>
                  <th className="px-5 py-4">Academic Period</th>
                  <th className="px-5 py-4">Year Level</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Units</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {data.items.map((record) => (
                  <tr
                    key={record.enrollment_key}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-blue-700">
                      {record.student_id ?? '—'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="max-w-xs">
                        <p className="font-medium text-slate-900">
                          {record.program ?? '—'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.program_code ?? '—'}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.course ?? '—'}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {record.campus ?? '—'}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {record.academic_year ?? '—'}
                      <span className="ml-2 text-xs text-slate-500">
                        {record.trimester ?? ''}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {record.year_level_name}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(record.enrollment_status)}`}
                      >
                        {record.enrollment_status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {record.total_units_enrolled}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && data && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Page {data.pagination.page} of{' '}
              {data.pagination.total_pages}
              {' · '}
              {data.pagination.total.toLocaleString()} records
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!data.pagination.has_previous}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={!data.pagination.has_next}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
