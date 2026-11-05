
import {
  useState,
} from 'react'

import LoginForm from './components/LoginForm'
import type { TokenResponse } from './services/auth'

import { useEffect } from 'react'
import { getEnrollmentKPIs } from './services/analytics'
import type { EnrollmentKPIs } from './types/analytics'
import { getYearLevelAnalytics } from './services/yearLevel'
import type { YearLevelAnalytics } from './types/analytics'

import {
  getAcademicPeriodAnalytics,
} from './services/academicperiods'

import type {
  AcademicPeriodAnalytics,
} from './types/analytics'

import EnrollmentsPage from './components/EnrollmentsPage'
import ProgramsPage from './components/ProgramsPage'
import CampusPage from './components/Campuses'
import AcademicPeriodsPage from './components/AcademicPeriodsPage'
import ReportsPage from './components/ReportsPage'
import UserManagementPage from './components/UserManagementPage'
import OverviewDashboard from './components/OverviewDashboard'


type NavItem = {
  label: string
  icon: string
}

const navigation: NavItem[] = [
  { label: 'Overview', icon: '▦' },
  { label: 'Enrollments', icon: '▤' },
  { label: 'Programs', icon: '▧' },
  { label: 'Campuses', icon: '⌖' },
  { label: 'Academic Periods', icon: '▣' },
  { label: 'Reports', icon: '▥' },
  { label: 'User Management', icon: '♙' },
]



function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
  userRole,
}: {
  activePage: string
  onNavigate: (page: string) => void
  mobileOpen: boolean
  onClose: () => void
  userRole: 'admin' | 'analyst' | 'dean' | 'guest' | null
}) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-blue-100 bg-[#dbeafe] transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-blue-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-slate-900">
            E
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-slate-900">
              ENROLLMENT
            </h1>
            <p className="text-xs text-slate-500">Analytics Platform</p>
          </div>
        </div>

        <div className="px-5 pt-8">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Main Menu
          </p>

          <nav className="space-y-1">
            {navigation
              .filter((item) => {
                if (userRole === 'guest' && item.label !== 'Overview') {
                  return false
                }

                if (item.label === 'Reports' && userRole === 'dean') {
                  return false
                }

                if (item.label === 'User Management' && userRole !== 'admin') {
                  return false
                }

                return true
              })
              .map((item) => {
              const active = activePage === item.label

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.label)
                    onClose()
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                    active
                      ? 'bg-blue-600/10 font-medium text-blue-700'
                      : 'text-slate-600 hover:bg-blue-100 hover:text-slate-900'
                  }`}
                >
                  <span className="w-5 text-center text-lg">{item.icon}</span>
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-blue-100 p-5">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-medium text-slate-700">
              Enrollment Analytics
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Data-driven academic insights
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-3/4 rounded-full bg-blue-600" />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Development version
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}


function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'admin' | 'analyst' | 'dean' | 'guest' | null>(null)
  const [activePage, setActivePage] = useState('Overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [analytics, setAnalytics] = useState<EnrollmentKPIs | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  const [yearLevelData, setYearLevelData] = useState<YearLevelAnalytics[]>([])
  const [yearLevelLoading, setYearLevelLoading] = useState(false)
  const [yearLevelError, setYearLevelError] = useState<string | null>(null)

  const [academicPeriodData, setAcademicPeriodData] = useState<AcademicPeriodAnalytics[]>([])
  const [academicPeriodLoading, setAcademicPeriodLoading] = useState(false)
  const [academicPeriodError, setAcademicPeriodError] = useState<string | null>(null)

  function handleLoginSuccess(token: TokenResponse) {
    setAccessToken(token.access_token)
    setUserRole(token.role)
  }

  function handleLogout() {
    setAccessToken(null)
    setAnalytics(null)
    setAnalyticsError(null)
    setYearLevelData([])
    setYearLevelError(null)
    setUserRole(null)
  }

  useEffect(() => {
    if (!accessToken) return

    let cancelled = false

    async function fetchAnalytics() {
      setAnalyticsLoading(true)
      setAnalyticsError(null)

      try {
        const data = await getEnrollmentKPIs(accessToken!)

        if (!cancelled) {
          setAnalytics(data)
        }
      } catch (error) {
        if (!cancelled) {
          setAnalyticsError(
            error instanceof Error
              ? error.message
              : 'Failed to load analytics data.',
          )
        }
      } finally {
        if (!cancelled) {
          setAnalyticsLoading(false)
        }
      }
    }

    fetchAnalytics()

      return () => {
        cancelled = true
      }
    }, [accessToken])

    useEffect(() => {
      if (!accessToken) return

      let cancelled = false

      async function fetchYearLevels() {
        setYearLevelLoading(true)
        setYearLevelError(null)

        try {
          const data = await getYearLevelAnalytics(accessToken!)

          if (!cancelled) {
            setYearLevelData(data)
          }
        } catch (error) {
          if (!cancelled) {
            setYearLevelError(
              error instanceof Error
                ? error.message
                : 'Failed to load year-level analytics.',
            )
          }
        } finally {
          if (!cancelled) {
            setYearLevelLoading(false)
          }
        }
      }

    fetchYearLevels()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || userRole === 'guest') return

    let cancelled = false

    async function fetchAcademicPeriods() {
      setAcademicPeriodLoading(true)
      setAcademicPeriodError(null)

      try {
        const data = await getAcademicPeriodAnalytics(accessToken!)

        if (!cancelled) {
          setAcademicPeriodData(data)
        }
      } catch (error) {
        if (!cancelled) {
          setAcademicPeriodError(
            error instanceof Error
              ? error.message
              : 'Failed to load academic-period analytics.',
          )
        }
      } finally {
        if (!cancelled) {
          setAcademicPeriodLoading(false)
        }
      }
    }

    fetchAcademicPeriods()

    return () => {
      cancelled = true
    }
  }, [accessToken, userRole])

  useEffect(() => {
    if (
      (userRole === 'guest' && activePage !== 'Overview') ||
      (userRole === 'dean' && activePage === 'Reports') ||
      (userRole !== 'admin' && activePage === 'User Management')
    ) {
      setActivePage('Overview')
    }
  }, [userRole, activePage])


  if (!accessToken) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-[#eff6ff] text-slate-800">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        userRole={userRole}
      />

      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-blue-100 bg-[#eff6ff]/90 px-5 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-blue-100 px-3 py-2 text-slate-700 lg:hidden"
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-slate-500">Pages / {activePage}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {activePage}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">Signed in</p>
              <p className="text-xs text-slate-500">Authenticated user</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-blue-100 px-3 py-2 text-xs text-slate-700 transition hover:border-rose-300 hover:text-rose-600"
            >
              Sign out
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-600/20 font-semibold text-blue-700">
              A
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] p-5 sm:p-8">
          {activePage === 'Overview' ? (
            <OverviewDashboard
              analytics={analytics}
              analyticsLoading={analyticsLoading}
              analyticsError={analyticsError}
              yearLevelData={yearLevelData}
              yearLevelLoading={yearLevelLoading}
              yearLevelError={yearLevelError}
              academicPeriodData={academicPeriodData}
              academicPeriodLoading={academicPeriodLoading}
              academicPeriodError={academicPeriodError}
            />
          ) : activePage === 'Enrollments' ? (
            <EnrollmentsPage accessToken={accessToken} />
          ) : activePage === 'Programs' ? (
            <ProgramsPage accessToken={accessToken} />
          ) : activePage === 'Campuses' ? (
            <CampusPage accessToken={accessToken} />
          ) : activePage === 'Academic Periods' ? (
            <AcademicPeriodsPage accessToken={accessToken} />
          ) : activePage === 'Reports' ? (
            <ReportsPage accessToken={accessToken} />
          ) : activePage === 'User Management' && userRole === 'admin' ? (
            <UserManagementPage accessToken={accessToken} />
          ) : (
            
            <div className="min-h-[500px] rounded-2xl border border-blue-100 bg-[#dbeafe] p-8">
              <h1 className="text-2xl font-bold text-slate-900">
                {activePage}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                {activePage === 'Enrollments' && 'View and analyze student enrollment records.'}
                {activePage === 'Programs' && 'Explore enrollment statistics by academic program.'}
                {activePage === 'Campuses' && 'Explore enrollment statistics across campuses.'}
                {activePage === 'Academic Periods' && 'Analyze enrollment across academic years and semesters.'}
                {activePage === 'Reports' && 'Generate and review enrollment analytics reports.'}
              </p>
            </div>
          )}

          <footer className="mt-10 border-t border-blue-100 py-6 text-center text-xs text-slate-500">
            Enrollment Analytics and Reporting System
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
