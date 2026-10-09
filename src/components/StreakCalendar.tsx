import React, { useState } from 'react';
import { Flame, Check, Calendar as CalendarIcon, Trophy, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { StudyStats } from '../types';

interface StreakCalendarProps {
  stats: StudyStats;
}

export const StreakCalendar: React.FC<StreakCalendarProps> = ({ stats }) => {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const today = new Date();
  const todayStr = today.toDateString();
  const lastStudyDateStr = stats.lastStudyDate ? new Date(stats.lastStudyDate).toDateString() : '';
  const practicedToday = lastStudyDateStr === todayStr;

  // Extract dates that had activity from dailyTrends and activities
  const practicedDatesSet = new Set<string>();

  // Add from activities
  stats.activities.forEach((act) => {
    if (act.timestamp) {
      practicedDatesSet.add(new Date(act.timestamp).toDateString());
    }
  });

  // Also include the streak days prior to today
  for (let i = 0; i < stats.studyStreakDays; i++) {
    const d = new Date(Date.now() - i * 86400000);
    practicedDatesSet.add(d.toDateString());
  }

  // Generate current 7-day rolling week window
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dateStr = d.toDateString();
    const isToday = dateStr === todayStr;
    const isPracticed = practicedDatesSet.has(dateStr);
    const dayName = d.toLocaleDateString(undefined, { weekday: 'narrow' }); // M, T, W, etc.
    const dayNum = d.getDate();

    return {
      date: d,
      dayName,
      dayNum,
      isToday,
      isPracticed,
    };
  });

  // Generate current calendar month days for month view
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const monthGridDays = [];
  // Pad preceding empty slots
  for (let p = 0; p < firstDayOfMonth; p++) {
    monthGridDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toDateString();
    monthGridDays.push({
      day,
      date: d,
      isToday: dateStr === todayStr,
      isPracticed: practicedDatesSet.has(dateStr),
      isPastOrToday: d <= today,
    });
  }

  const streakGoal = 7;
  const progressToGoal = Math.min(100, Math.round((stats.studyStreakDays / streakGoal) * 100));

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      {/* Header with Streak Counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-display font-bold text-slate-900 tabular-nums">
                {stats.studyStreakDays}
              </span>
              <span className="text-xs font-semibold text-slate-700">Day Streak</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {practicedToday ? 'Practiced today' : 'Study today to continue'}
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px]">
          <button
            onClick={() => setViewMode('week')}
            className={`px-2 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'week' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-2 py-1 font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Week View: 7-day strip */}
      {viewMode === 'week' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDays.map((item, idx) => (
              <div
                key={idx}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-between transition-all ${
                  item.isToday
                    ? 'ring-1.5 ring-indigo-600 bg-indigo-50/40'
                    : item.isPracticed
                    ? 'bg-amber-50/60'
                    : 'bg-slate-50/70'
                }`}
              >
                <span className="text-[10px] font-semibold text-slate-400 uppercase">
                  {item.dayName}
                </span>

                <div
                  className={`w-6 h-6 my-1 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                    item.isPracticed
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : item.isToday
                      ? 'border-2 border-indigo-600 text-indigo-700'
                      : 'text-slate-400'
                  }`}
                >
                  {item.isPracticed ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{item.dayNum}</span>
                  )}
                </div>

                <span className="text-[9px] text-slate-400 font-mono">
                  {item.isToday ? 'Today' : item.isPracticed ? 'Done' : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Month View: Calendar Grid */
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
            <span>{monthName}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {stats.dailyTrends.length} active sessions
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayInitial, idx) => (
              <span key={idx} className="font-semibold text-slate-400 py-0.5">
                {dayInitial}
              </span>
            ))}

            {monthGridDays.map((item, idx) => {
              if (!item) {
                return <div key={`empty-${idx}`} className="h-6" />;
              }

              return (
                <div
                  key={`day-${item.day}`}
                  className={`h-6 rounded-md flex items-center justify-center text-[11px] font-mono tabular-nums transition-all ${
                    item.isPracticed
                      ? 'bg-amber-500 text-white font-semibold'
                      : item.isToday
                      ? 'ring-1.5 ring-indigo-600 text-indigo-600 font-bold bg-indigo-50'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title={`${item.date.toLocaleDateString()}: ${item.isPracticed ? 'Studied' : 'Rest'}`}
                >
                  {item.day}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak Milestone Progress */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-[11px]">7-Day Milestone</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
            {stats.studyStreakDays} / {streakGoal} days
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progressToGoal}%` }}
          />
        </div>
      </div>
    </div>
  );
};
