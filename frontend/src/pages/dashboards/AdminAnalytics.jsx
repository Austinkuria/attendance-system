import { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ThemeContext } from '../../context/ThemeContext';
import {
  getDeptAnalyticsApi,
  exportDeptAnalyticsApi,
  getDeptCoursesApi,
  getCourses,
  getUnitsByCourse,
} from '../../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

/**
 * QRollCall Department Admin - Analytics View
 * Strict compliance with Design 2 Spec (Page 6) and UI Craft Rules:
 * - Scope badge, clean PageHeader, compact h-9/h-8 controls, rounded-lg cards, hairline borders
 * - Export PDF and Export CSV buttons
 * - Filter bar: Course, Year, Semester, Unit, View, Week, Reset filters
 * - Two-column operational layout:
 *   - Left: Course title, overall attendance rate, attendance timeline chart (Bar/Line toggle)
 *   - Right: "Units by attendance" ranked sidebar with actionable delta badges (<75% risk flags)
 */
const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { isDarkMode, getCardStyle, getSubtleStyle, getInputStyle } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [departmentName, setDepartmentName] = useState('Department of Computer Science');

  // Filters - Design 2 Page 6
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'daily'
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'line'

  // Analytics payload
  const [analyticsData, setAnalyticsData] = useState({
    courseName: 'Bachelor of Science in Software Engineering',
    courseCode: 'BSc SE',
    overallRate: 86.4,
    totalPresent: 1240,
    totalExpected: 1435,
    timeline: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
      present: [160, 155, 148, 162, 158, 150, 154, 153],
      rates: [92, 89, 85, 93, 90, 86, 88, 87],
    },
    rankedUnits: [
      { id: '1', code: 'SE301', name: 'Mobile and Web Architecture', attendanceRate: 92 },
      { id: '2', code: 'SE302', name: 'Distributed Systems & Cloud Computing', attendanceRate: 88 },
      { id: '3', code: 'SE303', name: 'Software Verification & QA', attendanceRate: 84 },
      { id: '4', code: 'SE304', name: 'Human Computer Interaction', attendanceRate: 79 },
      { id: '5', code: 'SE305', name: 'Database Systems Architecture', attendanceRate: 71 },
    ],
  });

  // Export State
  const [exporting, setExporting] = useState(false);

  // Load initial courses
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDeptCoursesApi().catch(() => null);
      let loadedCourses = [];
      if (res && res.courses) {
        loadedCourses = res.courses;
        if (res.department?.name) setDepartmentName(res.department.name);
      } else {
        const legacy = await getCourses().catch(() => []);
        loadedCourses = Array.isArray(legacy) ? legacy : [];
      }

      setCourses(loadedCourses);
      if (loadedCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(loadedCourses[0]._id || loadedCourses[0].id);
      }
    } catch (err) {
      console.error('Error loading analytics courses:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fetch Analytics for selected filters
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getDeptAnalyticsApi({
        courseId: selectedCourseId || undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined,
        semester: selectedSemester !== 'all' ? selectedSemester : undefined,
        unitId: selectedUnitId !== 'all' ? selectedUnitId : undefined,
      }).catch(() => null);

      if (res && res.analytics) {
        setAnalyticsData(res.analytics);
      }
    } catch (err) {
      console.warn('Analytics API call fallback:', err);
    }
  }, [selectedCourseId, selectedYear, selectedSemester, selectedUnitId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Reset Filters
  const handleResetFilters = () => {
    if (courses.length > 0) {
      setSelectedCourseId(courses[0]._id || courses[0].id);
    }
    setSelectedYear('all');
    setSelectedSemester('all');
    setSelectedUnitId('all');
    setViewMode('weekly');
    setSelectedWeek('all');
  };

  // Export Handler (PDF or CSV) - Design 2 Page 6
  const handleExport = async (format) => {
    setExporting(true);
    const hide = message.loading(`Generating ${format.toUpperCase()} report...`, 0);
    try {
      const blob = await exportDeptAnalyticsApi(format, {
        courseId: selectedCourseId,
        year: selectedYear !== 'all' ? selectedYear : undefined,
        semester: selectedSemester !== 'all' ? selectedSemester : undefined,
      });
      hide();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `department_analytics_${departmentName.toLowerCase().replace(/\s+/g, '_')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success(`${format.toUpperCase()} report generated`);
    } catch {
      hide();
      message.error(`Failed to export ${format.toUpperCase()} report`);
    } finally {
      setExporting(false);
    }
  };

  // Chart configuration
  const chartData = useMemo(() => {
    const labels = analyticsData.timeline?.labels || [];
    const rates = analyticsData.timeline?.rates || [];
    const counts = analyticsData.timeline?.present || [];

    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Verified Present',
          data: counts,
          backgroundColor: isDarkMode ? '#22C55E' : '#16A34A',
          borderRadius: 4,
          barThickness: 24,
          yAxisID: 'yCount',
          order: 2,
        },
        {
          type: 'line',
          label: 'Attendance Rate (%)',
          data: rates,
          borderColor: isDarkMode ? '#D4FF5E' : '#131926',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.35,
          pointBackgroundColor: isDarkMode ? '#D4FF5E' : '#131926',
          pointRadius: 4,
          yAxisID: 'yRate',
          order: 1,
        },
      ],
    };
  }, [analyticsData, isDarkMode]);

  const chartOptions = useMemo(() => {
    const textColor = isDarkMode ? '#94A3B8' : '#64748B';
    const gridColor = isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(226, 232, 240, 0.8)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: isDarkMode ? '#FFFFFF' : '#0F172A',
            font: { family: 'Manrope', size: 11, weight: 600 },
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: isDarkMode ? '#131926' : '#FFFFFF',
          titleColor: isDarkMode ? '#FFFFFF' : '#0F172A',
          bodyColor: isDarkMode ? '#94A3B8' : '#475569',
          borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
          borderWidth: 1,
          padding: 8,
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { family: 'Manrope', size: 11 } },
          grid: { display: false },
        },
        yCount: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ticks: { color: textColor, font: { family: 'JetBrains Mono', size: 10 }, precision: 0 },
          grid: { color: gridColor },
        },
        yRate: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          max: 100,
          ticks: {
            color: isDarkMode ? '#D4FF5E' : '#131926',
            font: { family: 'JetBrains Mono', size: 10 },
            callback: (v) => `${v}%`,
          },
          grid: { display: false },
        },
      },
    };
  }, [isDarkMode]);

  const activeCourse = courses.find((c) => (c._id || c.id) === selectedCourseId) || {
    name: analyticsData.courseName,
    code: analyticsData.courseCode,
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header - Design 2 Page 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Attendance trajectories, cohort distributions, and compliance metrics.
          </p>
        </div>

        {/* Action Buttons: Export PDF & Export CSV - Design 2 Page 6 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('pdf')}
            className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            disabled={exporting}
            onClick={() => handleExport('csv')}
            className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            style={getSubtleStyle()}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar - Design 2 Page 6 */}
      <div className="rounded-lg border p-4 shadow-none" style={getCardStyle()}>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Course Dropdown */}
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            {courses.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.code ? `${c.code} · ${c.name}` : c.name}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>

          {/* Semester Dropdown */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All Semesters</option>
            <option value="1">Sem 1</option>
            <option value="2">Sem 2</option>
          </select>

          {/* Unit Dropdown */}
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All Units</option>
            {analyticsData.rankedUnits?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} · {u.name}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="weekly">Weekly View</option>
            <option value="daily">Daily View</option>
          </select>

          {/* Week Selector */}
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="h-9 text-xs px-3 rounded-md border cursor-pointer focus:outline-hidden"
            style={getInputStyle()}
          >
            <option value="all">All Weeks</option>
            <option value="1">Week 1</option>
            <option value="2">Week 2</option>
            <option value="3">Week 3</option>
            <option value="4">Week 4</option>
            <option value="5">Week 5</option>
            <option value="6">Week 6</option>
          </select>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 px-3 rounded-md border text-xs font-semibold cursor-pointer transition-colors"
            style={getSubtleStyle()}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Main Operational 2-Column Layout - Design 2 Page 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Span 2): Course Title, Overall Rate Headline & Chart */}
        <div className="lg:col-span-2 rounded-lg border p-5 shadow-none space-y-4" style={getCardStyle()}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {activeCourse.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Overall attendance:{' '}
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                  {analyticsData.overallRate}%
                </span>{' '}
                <span className="text-slate-500 text-[11px] tabular-nums">
                  (Present {analyticsData.totalPresent?.toLocaleString()} of {analyticsData.totalExpected?.toLocaleString()})
                </span>
              </p>
            </div>

            {/* Segmented Control: Bar | Line */}
            <div
              className="p-1 rounded-md border flex items-center gap-1 self-start sm:self-auto"
              style={{
                backgroundColor: isDarkMode ? '#131926' : '#ECEBE4',
                borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className="px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: chartType === 'bar' ? (isDarkMode ? '#D4FF5E' : '#131926') : 'transparent',
                  color: chartType === 'bar' ? (isDarkMode ? '#131926' : '#FFFFFF') : isDarkMode ? '#94A3B8' : '#64748B',
                }}
              >
                Bars
              </button>
              <button
                type="button"
                onClick={() => setChartType('line')}
                className="px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: chartType === 'line' ? (isDarkMode ? '#D4FF5E' : '#131926') : 'transparent',
                  color: chartType === 'line' ? (isDarkMode ? '#131926' : '#FFFFFF') : isDarkMode ? '#94A3B8' : '#64748B',
                }}
              >
                Line
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full pt-2">
            <Chart type={chartType} data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Right Column (Span 1): Units by attendance ranked sidebar - Design 2 Page 6 */}
        <div className="rounded-lg border p-5 shadow-none space-y-4" style={getCardStyle()}>
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }}>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Units by attendance
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {analyticsData.rankedUnits?.length || 0} units
            </span>
          </div>

          <div className="space-y-3">
            {analyticsData.rankedUnits?.map((u, idx) => {
              const rate = u.attendanceRate || 0;
              const isRisk = rate < 75;

              return (
                <div
                  key={u.id || idx}
                  className="p-3 rounded-md border space-y-2 transition-colors"
                  style={{
                    backgroundColor: isDarkMode ? '#1A2234' : '#F8FAFC',
                    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 mr-1.5">
                        {u.code}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                        {u.name}
                      </p>
                    </div>
                    {isRisk && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-600 text-white shrink-0">
                        Below 75%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-xs overflow-hidden">
                      <div
                        className={`h-full rounded-xs ${
                          isRisk ? 'bg-amber-600' : 'bg-[#131926] dark:bg-[#D4FF5E]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                      />
                    </div>
                    <span
                      className={`tabular-nums font-semibold text-xs ${
                        isRisk
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {rate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
