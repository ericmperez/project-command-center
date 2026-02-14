'use client';

import { useMemo, useState } from 'react';
import type { HeatmapDay } from '@/lib/types';

interface HeatmapGridProps {
  data: HeatmapDay[];
}

function getColor(count: number): string {
  if (count === 0) return 'bg-zinc-800/50';
  if (count <= 2) return 'bg-emerald-900';
  if (count <= 4) return 'bg-emerald-700';
  return 'bg-emerald-500';
}

function getColorHex(count: number): string {
  if (count === 0) return '#27272a80';
  if (count <= 2) return '#064e3b';
  if (count <= 4) return '#047857';
  return '#10b981';
}

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const dataMap = new Map<string, number>();
    for (const d of data) {
      dataMap.set(d.date, d.count);
    }

    // Build 52 columns x 7 rows grid
    // Start from 52 weeks ago, align to start of week (Monday)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363); // 52 weeks = 364 days, but we want today to be included
    // Align to Monday
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    const current = new Date(startDate);
    let weekIdx = 0;

    while (current <= today || weeks.length < 52) {
      const week: { date: string; count: number; dayOfWeek: number }[] = [];

      for (let day = 0; day < 7; day++) {
        const dateStr = current.toISOString().split('T')[0];
        const isFuture = current > today;

        if (day === 0) {
          const month = current.getMonth();
          if (month !== lastMonth) {
            months.push({
              label: current.toLocaleDateString('en-US', { month: 'short' }),
              col: weekIdx,
            });
            lastMonth = month;
          }
        }

        week.push({
          date: dateStr,
          count: isFuture ? -1 : (dataMap.get(dateStr) ?? 0),
          dayOfWeek: day,
        });

        current.setDate(current.getDate() + 1);
      }

      weeks.push(week);
      weekIdx++;

      if (weeks.length >= 53) break;
    }

    return { grid: weeks, monthLabels: months };
  }, [data]);

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];
  const cellSize = 12;
  const gap = 2;
  const labelWidth = 28;
  const headerHeight = 16;

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex" style={{ paddingLeft: labelWidth, marginBottom: 4 }}>
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-zinc-500 absolute"
            style={{ left: labelWidth + m.col * (cellSize + gap) }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex" style={{ marginTop: headerHeight }}>
        {/* Day labels */}
        <div className="flex flex-col" style={{ width: labelWidth, gap }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="text-[10px] text-zinc-500 flex items-center"
              style={{ height: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex" style={{ gap }}>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col" style={{ gap }}>
              {week.map((cell, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`rounded-sm ${cell.count < 0 ? 'bg-transparent' : getColor(cell.count)} cursor-default transition-colors`}
                  style={{ width: cellSize, height: cellSize }}
                  onMouseEnter={(e) => {
                    if (cell.count >= 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parentRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
                      if (parentRect) {
                        const dateObj = new Date(cell.date + 'T00:00:00');
                        const formatted = dateObj.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                        setTooltip({
                          x: rect.left - parentRect.left + cellSize / 2,
                          y: rect.top - parentRect.top - 8,
                          text: `${formatted}: ${cell.count} completion${cell.count !== 1 ? 's' : ''}`,
                        });
                      }
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-zinc-700 text-zinc-100 text-[11px] px-2 py-1 rounded shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full z-10"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end text-[10px] text-zinc-500">
        <span>Less</span>
        {[0, 1, 3, 5].map((count) => (
          <div
            key={count}
            className={`rounded-sm ${getColor(count)}`}
            style={{ width: 10, height: 10 }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
