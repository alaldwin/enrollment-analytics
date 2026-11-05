
interface EnrollmentStatusInsightsProps {
  enrolled: number
  dropped: number
  loa: number
}

export default function EnrollmentStatusInsights({
  enrolled,
  dropped,
  loa,
}: EnrollmentStatusInsightsProps) {
  const total = enrolled + dropped + loa
  const nonEnrolled = dropped + loa

  const statuses = [
    { name: 'Enrolled', value: enrolled },
    { name: 'Dropped', value: dropped },
    { name: 'LOA', value: loa },
  ]

  const highestStatus = statuses.reduce(
    (highest, current) =>
      current.value > highest.value ? current : highest,
    statuses[0],
  )

  const enrollmentRate =
    total > 0 ? (enrolled / total) * 100 : 0

  const nonEnrolledRate =
    total > 0 ? (nonEnrolled / total) * 100 : 0

  const insights = [
    {
      title: 'Enrollment Rate',
      value: `${enrollmentRate.toFixed(2)}%`,
      description: 'Records with Enrolled status',
      color: 'text-emerald-400',
    },
    {
      title: 'Non-Enrolled Records',
      value: nonEnrolled.toLocaleString(),
      description: `${nonEnrolledRate.toFixed(2)}% of all records`,
      color: 'text-rose-400',
    },
    {
      title: 'Most Common Status',
      value: total > 0 ? highestStatus.name : '—',
      description:
        total > 0
          ? `${highestStatus.value.toLocaleString()} records`
          : 'No records available',
      color: 'text-blue-600',
    },
  ]

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-semibold text-slate-600">
        Enrollment Status Insights
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="rounded-xl bg-slate-50 p-4"
          >
            <p className="text-xs text-slate-500">
              {insight.title}
            </p>

            <p className={`mt-2 text-xl font-bold ${insight.color}`}>
              {insight.value}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {insight.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
