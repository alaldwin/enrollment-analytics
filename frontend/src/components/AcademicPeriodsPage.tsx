import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getAcademicPeriodAnalytics } from '../services/academicperiods'
import type { AcademicPeriodAnalytics } from '../types/analytics'

interface AcademicPeriodsPageProps {
  accessToken: string
}

const trimesterOrder: Record<string, number> = {
  '1st': 1,
  '2nd': 2,
  '3rd': 3,
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-PH').format(value)
}

export default function AcademicPeriodsPage({
  accessToken,
}: AcademicPeriodsPageProps) {
  const [data, setData] = useState<AcademicPeriodAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadAcademicPeriods() {
      try {
        setLoading(true)
        setError(null)

        const result = await getAcademicPeriodAnalytics(accessToken)
        setData(result)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load academic period analytics.',
        )
      } finally {
        setLoading(false)
      }
    }

    if (accessToken) {
      void loadAcademicPeriods()
    }
  }, [accessToken])

  const sortedData = useMemo(() => {
    return [...data].sort(
      (a, b) =>
        a.academic_year_start - b.academic_year_start ||
        (trimesterOrder[a.trimester] ?? 99) -
          (trimesterOrder[b.trimester] ?? 99),
    )
  }, [data])

  const filteredData = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) return sortedData

    return sortedData.filter(
      (item) =>
        item.academic_year.toLowerCase().includes(query) ||
        item.trimester.toLowerCase().includes(query),
    )
  }, [sortedData, search])

  const totalEnrollments = data.reduce(
    (sum, item) => sum + item.total_enrollments,
    0,
  )

  const totalStudents = data.reduce(
    (sum, item) => sum + item.total_students,
    0,
  )

  const totalUnits = data.reduce(
    (sum, item) => sum + item.total_units,
    0,
  )

  const academicYears = new Set(data.map((item) => item.academic_year)).size

  const averageEnrollments =
    data.length > 0 ? Math.round(totalEnrollments / data.length) : 0

  const chartData = Array.from(
    new Set(sortedData.map((item) => item.academic_year)),
  ).map((academicYear) => {
    const periods = sortedData.filter(
      (item) => item.academic_year === academicYear,
    )

    return {
      academicYear,
      firstTrimester:
        periods.find((item) => item.trimester === '1st')
          ?.total_enrollments ?? 0,
      secondTrimester:
        periods.find((item) => item.trimester === '2nd')
          ?.total_enrollments ?? 0,
    }
  })

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-slate-400">
        Loading academic period analytics...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
        <p className="font-semibold">Unable to load academic periods</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Academic Periods Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Analyze enrollment performance across academic years and trimesters.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Academic Years',
            value: formatNumber(academicYears),
            description: 'Distinct academic years',
          },
          {
            label: 'Academic Periods',
            value: formatNumber(data.length),
            description: 'Year and trimester combinations',
          },
          {
            label: 'Total Enrollments',
            value: formatNumber(totalEnrollments),
            description: 'Across all academic periods',
          },
          {
            label: 'Average Enrollments',
            value: formatNumber(averageEnrollments),
            description: 'Per academic period',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Enrollment Trend */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Enrollment by Academic Period
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Compare enrollment totals across each academic year and trimester.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 5, bottom: 45 }}
            >
              <defs>
                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                </linearGradient>

                <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="#fb923c" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff12"
                vertical={false}
              />

              <XAxis
                dataKey="academicYear"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
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
                  color: '#ffffff',
                }}
                formatter={(value, name) => [
                  formatNumber(Number(value)),
                  name,
                ]}
              />

              <Area
                type="monotone"
                dataKey="firstTrimester"
                name="1st Trimester"
                stroke="#818cf8"
                strokeWidth={3}
                fill="url(#enrollmentGradient)"
                dot={{ r: 5, fill: '#818cf8' }}
                activeDot={{ r: 7 }}
              />

              <Area
                type="monotone"
                dataKey="secondTrimester"
                name="2nd Trimester"
                stroke="#fb923c"
                strokeWidth={3}
                fill="url(#studentsGradient)"
                dot={{ r: 5, fill: '#fb923c' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-400">Total Student Records</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(totalStudents)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-400">Total Units Enrolled</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatNumber(totalUnits)}
          </p>
        </div>
      </div>

      {/* Academic Period Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Academic Period Breakdown
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Enrollment statistics for each academic period.
            </p>
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search academic year or trimester..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 sm:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-100 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-4">Academic Year</th>
                <th className="px-5 py-4">Trimester</th>
                <th className="px-5 py-4 text-right">Enrollments</th>
                <th className="px-5 py-4 text-right">Students</th>
                <th className="px-5 py-4 text-right">Units</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredData.map((item) => (
                <tr
                  key={`${item.academic_year}-${item.trimester}`}
                  className="transition hover:bg-blue-50"
                >
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {item.academic_year}
                  </td>
                  <td className="px-5 py-4">{item.trimester}</td>
                  <td className="px-5 py-4 text-right">
                    {formatNumber(item.total_enrollments)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {formatNumber(item.total_students)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {formatNumber(item.total_units)}
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No academic periods found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}