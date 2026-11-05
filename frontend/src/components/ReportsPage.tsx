
import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getEnrollmentReport } from '../services/analytics'
import type { EnrollmentReport } from '../types/analytics'

interface ReportsPageProps {
  accessToken: string
}

export default function ReportsPage({ accessToken }: ReportsPageProps) {
  const [report, setReport] = useState<EnrollmentReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function fetchReport() {
      try {
        setLoading(true)
        setError('')

        const result = await getEnrollmentReport(accessToken)

        if (!cancelled) {
          setReport(result)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load enrollment report.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchReport()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const formatNumber = (value: number) => value.toLocaleString()

    const exportReportCSV = () => {
    if (!report) return

    const rows: (string | number | null)[][] = [
      ['ENROLLMENT DATA ANALYTICS AND REPORTING SYSTEM'],
      ['Enrollment Analytics Report'],
      ['Generated At', new Date().toLocaleString()],
      [],

      ['KEY PERFORMANCE INDICATORS'],
      ['Metric', 'Value'],
      ['Total Enrollments', kpis.total_enrollments],
      ['Total Students', kpis.total_students],
      ['Total Programs', kpis.total_programs],
      ['Total Campuses', kpis.total_campuses],
      ['Total Academic Periods', kpis.total_academic_periods],
      ['Total Units Enrolled', kpis.total_units_enrolled],
      [],

      ['ENROLLMENT STATUS'],
      ['Status', 'Records'],
      ['Enrolled', kpis.enrolled_records],
      ['Dropped', kpis.dropped_records],
      ['Leave of Absence', kpis.loa_records],
      [],

      ['ENROLLMENT BY YEAR LEVEL'],
      ['Year Level', 'Enrollments', 'Students', 'Units'],
      ...report.year_level.map((item) => [
        item.year_level_name,
        item.total_enrollments,
        item.total_students,
        item.total_units,
      ]),
      [],

      ['ACADEMIC PERIOD SUMMARY'],
      ['Academic Year', 'Trimester', 'Enrollments', 'Students', 'Units'],
      ...report.academic_periods.map((item) => [
        item.academic_year,
        item.trimester,
        item.total_enrollments,
        item.total_students,
        item.total_units,
      ]),
      [],

      ['CAMPUS SUMMARY'],
      ['Campus', 'Enrollments', 'Students', 'Units'],
      ...report.campuses.map((item) => [
        item.campus,
        item.total_enrollments,
        item.total_students,
        item.total_units,
      ]),
      [],

      ['PROGRAM SUMMARY'],
      ['Program Code', 'Program', 'Enrollments', 'Students', 'Units'],
      ...report.programs.map((item) => [
        item.program_code,
        item.program,
        item.total_enrollments,
        item.total_students,
        item.total_units,
      ]),
      [],

      ['ENROLLMENT TRENDS'],
      [
        'Academic Year',
        'Trimester',
        'Enrollments',
        'Enrollment Change',
        'Growth Percentage',
      ],
      ...report.trends.map((item) => [
        item.academic_year,
        item.trimester,
        item.total_enrollments,
        item.enrollment_change,
        item.enrollment_growth_percentage === null
          ? null
          : `${item.enrollment_growth_percentage}%`,
      ]),
    ]

    const escapeCSV = (value: string | number | null) => {
      if (value === null) return ''

      let text = String(value)

      // Protect text cells against spreadsheet formula injection.
      if (
        typeof value === 'string' &&
        /^[=+\-@\t\r]/.test(text)
      ) {
        text = `'${text}`
      }

      return `"${text.replace(/"/g, '""')}"`
    }

    const csvContent = rows
      .map((row) => row.map(escapeCSV).join(','))
      .join('\r\n')

    const blob = new Blob(
      ['\uFEFF' + csvContent],
      { type: 'text/csv;charset=utf-8;' },
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `enrollment-analytics-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p className="text-sm text-slate-600">Loading enrollment report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <h2 className="font-semibold text-red-400">
          Unable to load report
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Reload page
        </button>
      </div>
    )
  }

  if (!report) return null

  const { kpis } = report

  const summaryCards = [
    {
      title: 'Total Enrollments',
      value: kpis.total_enrollments,
      description: 'All academic periods',
      color: 'text-blue-600',
    },
    {
      title: 'Total Programs',
      value: kpis.total_programs,
      description: 'Available programs',
      color: 'text-purple-400',
    },
    {
      title: 'Total Campuses',
      value: kpis.total_campuses,
      description: 'Across all locations',
      color: 'text-cyan-400',
    },
    {
      title: 'Total Units',
      value: kpis.total_units_enrolled,
      description: 'Units enrolled',
      color: 'text-emerald-400',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Enrollment Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Consolidated enrollment statistics, academic trends, and institutional summaries.
          </p>
        </div>

        <button
          onClick={exportReportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <span>↓</span>
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-600">{card.title}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
              {formatNumber(card.value)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Enrollment status */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Enrollment Status Summary</h2>
        <p className="mt-1 text-xs text-slate-500">
          Distribution of student enrollment records by status.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-500/5 p-4">
            <p className="text-sm text-slate-600">Enrolled</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatNumber(kpis.enrolled_records)}
            </p>
          </div>

          <div className="rounded-xl bg-red-500/5 p-4">
            <p className="text-sm text-slate-600">Dropped</p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              {formatNumber(kpis.dropped_records)}
            </p>
          </div>

          <div className="rounded-xl bg-amber-500/5 p-4">
            <p className="text-sm text-slate-600">Leave of Absence</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">
              {formatNumber(kpis.loa_records)}
            </p>
          </div>
        </div>
      </section>

      {/* Year-level chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900">
            Enrollment by Year Level
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Comparison of enrollment totals across first to fourth year.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={report.year_level}
              margin={{ top: 10, right: 15, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#ffffff12"
                vertical={false}
              />
              <XAxis
                dataKey="year_level_name"
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  backgroundColor: '#171727',
                  border: '1px solid #ffffff20',
                  borderRadius: '12px',
                  color: '#ffffff',
                }}
              />
              <Bar
                dataKey="total_enrollments"
                name="Enrollments"
                fill="#818cf8"
                radius={[6, 6, 0, 0]}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Academic period trends */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">
            Academic Period Summary
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enrollment totals for each academic year and trimester.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Academic Year</th>
                <th className="px-4 py-3 font-medium">Trimester</th>
                <th className="px-4 py-3 text-right font-medium">Enrollments</th>
                <th className="px-4 py-3 text-right font-medium">Students</th>
                <th className="px-4 py-3 text-right font-medium">Units</th>
              </tr>
            </thead>
            <tbody>
              {report.academic_periods.map((period, index) => (
                <tr
                  key={`${period.academic_year}-${period.trimester}-${index}`}
                  className="border-b border-slate-100 text-slate-600"
                >
                  <td className="px-4 py-3">{period.academic_year}</td>
                  <td className="px-4 py-3">{period.trimester}</td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(period.total_enrollments)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(period.total_students)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(period.total_units)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Campus summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">Campus Summary</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enrollment distribution across campuses.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Campus</th>
                <th className="px-4 py-3 text-right font-medium">Enrollments</th>
                <th className="px-4 py-3 text-right font-medium">Students</th>
                <th className="px-4 py-3 text-right font-medium">Units</th>
              </tr>
            </thead>
            <tbody>
              {[...report.campuses]
                .sort((a, b) => b.total_enrollments - a.total_enrollments)
                .map((campus) => (
                  <tr
                    key={campus.campus_key}
                    className="border-b border-slate-100 text-slate-600"
                  >
                    <td className="px-4 py-3">{campus.campus}</td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(campus.total_enrollments)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(campus.total_students)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(campus.total_units)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Program summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">Program Summary</h2>
          <p className="mt-1 text-xs text-slate-500">
            Enrollment totals grouped by academic program.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Program Code</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 text-right font-medium">Enrollments</th>
                <th className="px-4 py-3 text-right font-medium">Students</th>
                <th className="px-4 py-3 text-right font-medium">Units</th>
              </tr>
            </thead>
            <tbody>
              {[...report.programs]
                .sort((a, b) => b.total_enrollments - a.total_enrollments)
                .map((program) => (
                  <tr
                    key={program.program_key}
                    className="border-b border-slate-100 text-slate-600"
                  >
                    <td className="px-4 py-3">{program.program_code}</td>
                    <td className="px-4 py-3">{program.program}</td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(program.total_enrollments)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(program.total_students)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(program.total_units)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enrollment trends */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-5">
          <h2 className="font-semibold text-slate-900">Enrollment Trends</h2>
          <p className="mt-1 text-xs text-slate-500">
            Changes in enrollment compared with the previous academic period.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Academic Year</th>
                <th className="px-4 py-3 font-medium">Trimester</th>
                <th className="px-4 py-3 text-right font-medium">Enrollments</th>
                <th className="px-4 py-3 text-right font-medium">Change</th>
                <th className="px-4 py-3 text-right font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {report.trends.map((trend, index) => (
                <tr
                  key={`${trend.academic_year}-${trend.trimester}-${index}`}
                  className="border-b border-slate-100 text-slate-600"
                >
                  <td className="px-4 py-3">{trend.academic_year}</td>
                  <td className="px-4 py-3">{trend.trimester}</td>
                  <td className="px-4 py-3 text-right">
                    {formatNumber(trend.total_enrollments)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trend.enrollment_change === null
                      ? '—'
                      : formatNumber(trend.enrollment_change)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trend.enrollment_growth_percentage === null
                      ? '—'
                      : `${Number(trend.enrollment_growth_percentage).toFixed(2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
