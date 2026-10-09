import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { CheckCircle2, Clock, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { DailyTrendPoint } from '../types';

interface StudyTrendsChartProps {
  dailyTrends: DailyTrendPoint[];
  totalStudyMinutes: number;
  totalCardsMastered: number;
}

export const StudyTrendsChart: React.FC<StudyTrendsChartProps> = ({
  dailyTrends,
  totalStudyMinutes,
  totalCardsMastered,
}) => {
  const [activeMetric, setActiveMetric] = useState<'cards' | 'time'>('cards');

  // Calculate trends summary
  const totalWeeklyCards = dailyTrends.reduce((acc, d) => acc + d.cardsStudied, 0);
  const totalWeeklyMastered = dailyTrends.reduce((acc, d) => acc + d.cardsMastered, 0);
  const totalWeeklyMinutes = dailyTrends.reduce((acc, d) => acc + d.studyMinutes, 0);
  const avgDailyMinutes = Math.round(totalWeeklyMinutes / Math.max(1, dailyTrends.length));

  // Format hours and minutes
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Custom clean tooltip complying with anti-slop typography
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white rounded-lg p-3 shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[150px]">
          <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800">
            {label}
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-semibold tabular-nums text-white">
                {entry.name.includes('Time') ? `${entry.value} mins` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
      {/* Chart Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-display font-bold text-slate-900">
              Study Trends & Retention
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize daily cards mastered, review volume, and total focused study time.
          </p>
        </div>

        {/* View Toggle Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveMetric('cards')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMetric === 'cards'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cards Mastered</span>
          </button>
          <button
            onClick={() => setActiveMetric('time')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMetric === 'time'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Study Time</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-slate-50/80 rounded-xl border border-slate-100">
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Total Study Time</div>
          <div className="text-lg font-display font-bold text-slate-900 tabular-nums mt-0.5">
            {formatTime(totalStudyMinutes)}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 font-medium">Weekly Mastered</div>
          <div className="text-lg font-display font-bold text-emerald-600 tabular-nums mt-0.5">
            +{totalWeeklyMastered} <span className="text-xs font-normal text-slate-500">cards</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 font-medium">Weekly Reviews</div>
          <div className="text-lg font-display font-bold text-indigo-600 tabular-nums mt-0.5">
            {totalWeeklyCards} <span className="text-xs font-normal text-slate-500">studied</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-slate-500 font-medium">Avg Daily Pace</div>
          <div className="text-lg font-display font-bold text-slate-800 tabular-nums mt-0.5">
            {avgDailyMinutes} <span className="text-xs font-normal text-slate-500">min/day</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Area or Pristine Initial State */}
      {totalWeeklyCards === 0 && totalStudyMinutes === 0 ? (
        <div className="h-64 w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            No study records yet today
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
            You started your revision journey today! Complete a flashcard review or practice quiz to record your actual retention curve, cards mastered, and focused study time without dummy data.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === 'cards' ? (
              dailyTrends.length === 1 ? (
                <BarChart
                  data={dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: '#64748b' }}
                  />
                  <Bar
                    dataKey="cardsStudied"
                    name="Cards Studied"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="cardsMastered"
                    name="Cards Mastered"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              ) : (
                <AreaChart
                  data={dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMastered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorStudied" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: '#64748b' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cardsStudied"
                    name="Cards Studied"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStudied)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cardsMastered"
                    name="Cards Mastered"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorMastered)"
                  />
                </AreaChart>
              )
            ) : (
              <BarChart
                data={dailyTrends}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="barMinutes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit="m"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11, color: '#64748b' }}
                />
                <Bar
                  dataKey="studyMinutes"
                  name="Study Time (Minutes)"
                  fill="url(#barMinutes)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {dailyTrends.length === 1
              ? 'Tracking started today'
              : `Tracked study history (${dailyTrends.length} days)`}
          </span>
        </span>
        <span className="text-slate-400">
          Records update in real time after each flashcard and quiz session
        </span>
      </div>
    </div>
  );
};
