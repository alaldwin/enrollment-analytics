
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getCampusAnalytics } from '../services/campuses'
import type { CampusAnalytics } from '../types/analytics'

interface CampusPageProps {
  accessToken: string
}

export default function CampusPage({
  accessToken,
}: CampusPageProps) {
  const [campuses, setCampuses] = useState<CampusAnalytics[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchCampuses() {
      try {
        setLoading(true)
        setError('')

        const result = await getCampusAnalytics(accessToken)

        if (!cancelled) {
          setCampuses(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load campus analytics.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCampuses()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const filteredCampuses = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return campuses

    return campuses.filter((campus) =>
      campus.campus.toLowerCase().includes(term),
    )
  }, [campuses, search])

  const totalEnrollments = campuses.reduce(
    (sum, campus) => sum + campus.total_enrollments,
    0,
  )

  const totalStudents = campuses.reduce(
    (sum, campus) => sum + campus.total_students,
    0,
  )

  const totalUnits = campuses.reduce(
    (sum, campus) => sum + campus.total_units,
    0,
  )

  const chartData = useMemo(
    () =>
      [...campuses]
        .sort((a, b) => b.total_enrollments - a.total_enrollments)
        .map((campus) => ({
          campus: campus.campus,
          enrollments: campus.total_enrollments,
        })),
    [campuses],
  )

  const formatNumber = (value: number) =>
    value.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Campuses Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Compare enrollment distribution and student statistics across campuses.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5">
          <p className="text-sm text-slate-600">Total Campuses</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(campuses.length)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Total Enrollments</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(totalEnrollments)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Total Students</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(totalStudents)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Total Units</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(totalUnits)}
          </p>
        </div>
      </div>

      {/* Campus enrollment comparison */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Campus Enrollment Comparison
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Compare total enrollment across all campuses.
          </p>
        </div>

        {loading ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-slate-600">
            Loading campus analytics...
          </div>
        ) : error ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-red-400">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-slate-600">
            No campus data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff12"
              />

              <XAxis
                dataKey="campus"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: '#171729',
                  border: '1px solid #37375a',
                  borderRadius: '12px',
                  color: '#9ca3af',
                }}
                formatter={(value) => [
                  formatNumber(Number(value)),
                  'Enrollments',
                ]}
              />
              <Bar
                dataKey="enrollments"
                name="Enrollments"
                fill="#818cf8"
                activeBar={false}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label
          htmlFor="campus-search"
          className="mb-2 block text-xs font-medium text-slate-600"
        >
          Search Campuses
        </label>

        <input
          id="campus-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search campus name..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500"
        />
      </div>

      {/* Campus rankings */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Campus Enrollment Rankings
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Campuses ranked by total enrollment, highest to lowest.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Loading campus analytics...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-400">
            {error}
          </div>
        ) : filteredCampuses.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No campuses found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Campus</th>
                  <th className="px-5 py-4 text-right">Enrollments</th>
                  <th className="px-5 py-4 text-right">Students</th>
                  <th className="px-5 py-4 text-right">Units</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredCampuses.map((campus, index) => (
                  <tr
                    key={campus.campus_key}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-blue-700">
                      #{index + 1}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-900">
                      {campus.campus}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {formatNumber(campus.total_enrollments)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatNumber(campus.total_students)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatNumber(campus.total_units)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div className="border-t border-slate-200 px-5 py-4">
            <p className="text-xs text-slate-600">
              Showing {filteredCampuses.length} of {campuses.length} campuses
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
