import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  UsersRound,
  ClipboardList,
  GraduationCap,
  Building2,
} from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

import type {
  EnrollmentKPIs,
  YearLevelAnalytics,
  AcademicPeriodAnalytics,
} from '../types/analytics'

interface OverviewDashboardProps {
  analytics: EnrollmentKPIs | null
  analyticsLoading: boolean
  analyticsError: string | null
  yearLevelData: YearLevelAnalytics[]
  yearLevelLoading: boolean
  yearLevelError: string | null
  academicPeriodData: AcademicPeriodAnalytics[]
  academicPeriodLoading: boolean
  academicPeriodError: string | null
}

const YEAR_LEVEL_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
]

const numberFormat = (value: number) =>
  value.toLocaleString()

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  value: number | undefined
  description: string
  icon: LucideIcon
  accent: string
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-indigo-500/30">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{title}</p>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
        {value === undefined ? '—' : numberFormat(value)}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      {children}
    </section>
  )
}

export default function OverviewDashboard({
  analytics,
  analyticsLoading,
  analyticsError,
  yearLevelData,
  yearLevelLoading,
  yearLevelError,
  academicPeriodData,
  academicPeriodLoading,
  academicPeriodError,
}: OverviewDashboardProps) {
  const trendData = academicPeriodData.map((period) => ({
    period: `${period.academic_year} ${period.trimester}`,
    enrollments: period.total_enrollments,
  }))

  const distributionData = yearLevelData.map((item, index) => ({
    name: item.year_level_name,
    value: item.total_enrollments,
    color: YEAR_LEVEL_COLORS[index % YEAR_LEVEL_COLORS.length],
  }))

  const totalYearLevelEnrollments = distributionData.reduce(
    (sum, item) => sum + item.value,
    0,
  )



  return (
    <div className="space-y-6">
      {/* Overview heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Enrollment Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor enrollment performance and academic statistics.
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Analytics Dashboard
        </div>
      </div>

      {/* KPI cards */}
      {analyticsError && (
        <div
          role="alert"
          className="rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300"
        >
          Unable to load analytics: {analyticsError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Students"
          value={analytics?.total_students}
          description="Student records"
          icon={UsersRound}
          accent="bg-blue-50 text-blue-600"
        />

        <KpiCard
          title="Total Enrollments"
          value={analytics?.total_enrollments}
          description="Enrollment records"
          icon={ClipboardList}
          accent="bg-purple-500/10 text-purple-400"
        />

        <KpiCard
          title="Total Programs"
          value={analytics?.total_programs}
          description="Available programs"
          icon={GraduationCap}
          accent="bg-cyan-500/10 text-cyan-400"
        />

        <KpiCard
          title="Total Campuses"
          value={analytics?.total_campuses}
          description="Across all locations"
          icon={Building2}
          accent="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {analyticsLoading && (
        <p className="text-sm text-blue-700">
          Refreshing enrollment analytics...
        </p>
      )}

      {/* Main charts */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-5">
        <div className="min-w-0 xl:col-span-3">
          <Panel
            title="Enrollment Trend"
            subtitle="Enrollment records across academic years and trimesters"
          >
            {academicPeriodLoading ? (
              <div className="flex h-80 items-center justify-center text-sm text-blue-700">
                Loading enrollment trends...
              </div>
            ) : academicPeriodError ? (
              <div
                role="alert"
                className="flex h-80 items-center justify-center text-sm text-red-400"
              >
                {academicPeriodError}
              </div>
            ) : trendData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-slate-600">
                No academic-period data available.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="enrollmentGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#818cf8"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#818cf8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.07)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="period"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      angle={-15}
                      textAnchor="end"
                      height={55}
                    />

                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => Number(value).toLocaleString()}
                    />

                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} enrollments`,
                        'Enrollments',
                      ]}
                      contentStyle={{
                        backgroundColor: '#151522',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#ffffff',
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="enrollments"
                      name="Enrollments"
                      stroke="#818cf8"
                      strokeWidth={3}
                      fill="url(#enrollmentGradient)"
                      activeDot={{
                        r: 6,
                        stroke: '#a5b4fc',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 xl:col-span-2">
          <Panel
            title="Enrollment by Year Level"
            subtitle="Distribution across academic year levels"
          >
            {yearLevelLoading ? (
              <div className="flex h-80 items-center justify-center text-sm text-blue-700">
                Loading year-level data...
              </div>
            ) : yearLevelError ? (
              <div
                role="alert"
                className="flex h-80 items-center justify-center text-sm text-red-400"
              >
                {yearLevelError}
              </div>
            ) : distributionData.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-slate-600">
                No year-level data available.
              </div>
            ) : (
              <>
                <div className="relative h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={105}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {distributionData.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} enrollments`,
                          'Total',
                        ]}
                        contentStyle={{
                          backgroundColor: '#151522',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#ffffff',
                        }}
                      />

                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs text-slate-600">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7">
                    <span className="text-2xl font-bold text-slate-900">
                      {numberFormat(totalYearLevelEnrollments)}
                    </span>
                    <span className="text-xs text-slate-500">
                      Enrollments
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  {distributionData.map((item) => {
                    const percentage =
                      totalYearLevelEnrollments > 0
                        ? (item.value / totalYearLevelEnrollments) * 100
                        : 0

                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate text-xs text-slate-600">
                            {item.name}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs font-medium text-slate-900">
                            {numberFormat(item.value)}
                          </span>
                          <span className="w-12 text-right text-xs text-slate-500">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
