
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface EnrollmentStatusChartProps {
  enrolled: number
  dropped: number
  loa: number
}

const STATUS_COLORS = {
  enrolled: '#34d399',
  dropped: '#fb7185',
  loa: '#fbbf24',
}

export default function EnrollmentStatusChart({
  enrolled,
  dropped,
  loa,
}: EnrollmentStatusChartProps) {
  const data = [
    { name: 'Enrolled', value: enrolled, color: STATUS_COLORS.enrolled },
    { name: 'Dropped', value: dropped, color: STATUS_COLORS.dropped },
    { name: 'LOA', value: loa, color: STATUS_COLORS.loa },
  ]

  const total = enrolled + dropped + loa

  return (
    <div className="w-full">
      <div className="relative h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={100}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} records`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#151522',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#ffffff',
              }}
              itemStyle={{ color: '#ffffff' }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">
            Total Records
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {data.map((item) => {
          const percentage =
            total > 0 ? (item.value / total) * 100 : 0

          return (
            <div key={item.name} className="text-center">
              <div className="mb-2 flex items-center justify-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-600">
                  {item.name}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-900">
                {item.value.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {percentage.toFixed(2)}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
