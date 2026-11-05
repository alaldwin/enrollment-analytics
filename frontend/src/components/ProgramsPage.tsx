

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useEffect, useMemo, useState } from 'react'
import { getProgramAnalytics } from '../services/programs'
import type { ProgramAnalytics } from '../types/analytics'
import { getProgramEnrollmentTrends } from '../services/programTrends'
import type { ProgramEnrollmentTrend } from '../types/analytics'

interface ProgramsPageProps {
  accessToken: string
}

export default function ProgramsPage({
  accessToken,
}: ProgramsPageProps) {
  const [programs, setPrograms] = useState<ProgramAnalytics[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [trends, setTrends] = useState<ProgramEnrollmentTrend[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [trendError, setTrendError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchPrograms() {
      try {
        setLoading(true)
        setError('')

        const result = await getProgramAnalytics(accessToken)

        if (!cancelled) {
          setPrograms(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load program analytics.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchPrograms()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    let cancelled = false

    async function fetchTrends() {
      try {
        setTrendLoading(true)
        setTrendError('')

        const result = await getProgramEnrollmentTrends(accessToken)

        if (!cancelled) {
          setTrends(result)

          const totals = new Map<string, number>()

          result.forEach((item) => {
            totals.set(
              item.program_code,
              (totals.get(item.program_code) ?? 0) +
                item.total_enrollments,
            )
          })

          const topCodes = [...totals.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([code]) => code)

          setSelectedPrograms(topCodes)
        }
      } catch (err) {
        if (!cancelled) {
          setTrendError(
            err instanceof Error
              ? err.message
              : 'Unable to load program trends.',
          )
        }
      } finally {
        if (!cancelled) {
          setTrendLoading(false)
        }
      }
    }

    fetchTrends()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const filteredPrograms = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return programs

    return programs.filter((program) =>
      [
        program.program_code,
        program.program,
        program.course ?? '',
      ].some((value) => value.toLowerCase().includes(term)),
    )
  }, [programs, search])

  const totalEnrollments = programs.reduce(
    (sum, program) => sum + program.total_enrollments,
    0,
  )

  const totalStudents = programs.reduce(
    (sum, program) => sum + program.total_students,
    0,
  )

  const totalUnits = programs.reduce(
    (sum, program) => sum + program.total_units,
    0,
  )

 const programCodes = useMemo(
    () => [...new Set(trends.map((item) => item.program_code))].sort(),
    [trends],
  )

  const chartData = useMemo(() => {
    const periods = new Map<
      string,
      {
        label: string
        academic_year_start: number
        trimester_order: number
        [key: string]: string | number
      }
    >()

    const trimesterOrder: Record<string, number> = {
      '1st': 1,
      '2nd': 2,
      '3rd': 3,
      '4th': 4,
    }

    trends.forEach((item) => {
      const key = `${item.academic_year_start}-${item.trimester}`

      if (!periods.has(key)) {
        periods.set(key, {
          label: `${item.academic_year} · ${item.trimester}`,
          academic_year_start: item.academic_year_start,
          trimester_order: trimesterOrder[item.trimester] ?? 99,
        })
      }

      const period = periods.get(key)!
      period[item.program_code] = item.total_enrollments
    })

    return [...periods.values()]
      .sort(
        (a, b) =>
          a.academic_year_start - b.academic_year_start ||
          a.trimester_order - b.trimester_order,
      )
  }, [trends])

  const toggleProgram = (code: string) => {
    setSelectedPrograms((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    )
  }

  const chartColors = [
    '#818cf8',
    '#34d399',
    '#f59e0b',
    '#f472b6',
    '#38bdf8',
  ]

  const formatNumber = (value: number) =>
    value.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Programs Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Explore enrollment distribution and performance across academic programs.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5">
          <p className="text-sm text-slate-600">Total Programs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatNumber(programs.length)}
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


      {/* Program Enrollment Trends */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Program Enrollment Trends
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Compare enrollment trends across academic programs.
          </p>
        </div>

        {/* Program selectors */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">
            Select Programs to Compare
          </p>

          <div className="flex flex-wrap gap-2">
            {programCodes.map((code) => {
              const selected = selectedPrograms.includes(code)
              const color = chartColors[
                selectedPrograms.indexOf(code) % chartColors.length
              ]

              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleProgram(code)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    selected
                      ? 'border-indigo-400/40 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200'
                  }`}
                >
                  {selected && (
                    <span
                      className="mr-2 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  {code}
                </button>
              )
            })}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {selectedPrograms.length} programs selected
          </p>
        </div>

        {/* Line chart */}
        {trendLoading ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-slate-600">
            Loading program trends...
          </div>
        ) : trendError ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-red-400">
            {trendError}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-slate-600">
            No program trend data available.
          </div>
        ) : selectedPrograms.length === 0 ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-slate-600">
            Select at least one program to display the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 5, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff12"
              />

              <XAxis
                dataKey="label"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={65}
              />

              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#171729',
                  border: '1px solid #37375a',
                  borderRadius: '12px',
                  color: '#ffffff',
                }}
                labelStyle={{ color: '#c7d2fe' }}
                formatter={(value, name) => [
                  formatNumber(Number(value)),
                  String(name),
                ]}
              />

              <Legend
                wrapperStyle={{
                  color: '#d1d5db',
                  fontSize: '12px',
                  paddingTop: '15px',
                }}
              />

              {selectedPrograms.map((code, index) => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  name={code}
                  stroke={chartColors[index % chartColors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label
          htmlFor="program-search"
          className="mb-2 block text-xs font-medium text-slate-600"
        >
          Search Programs
        </label>

        <input
          id="program-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search program code, program name, or college..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500"
        />
      </div>

      {/* Program rankings */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Program Enrollment Rankings
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Programs ranked by total enrollment, highest to lowest.
          </p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Loading program analytics...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-400">
            {error}
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-600">
            No programs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-5 py-4">Program</th>
                  <th className="px-5 py-4">College</th>
                  <th className="px-5 py-4 text-right">Enrollments</th>
                  <th className="px-5 py-4 text-right">Students</th>
                  <th className="px-5 py-4 text-right">Units</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredPrograms.map((program, index) => (
                  <tr
                    key={program.program_key}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-semibold text-blue-700">
                      #{index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {program.program}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {program.program_code}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {program.course ?? '—'}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-900">
                      {formatNumber(program.total_enrollments)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatNumber(program.total_students)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatNumber(program.total_units)}
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
              Showing {filteredPrograms.length} of {programs.length} programs
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
