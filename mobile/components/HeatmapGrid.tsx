import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { HeatmapDay } from '../lib/types';

interface HeatmapGridProps {
  data: HeatmapDay[];
}

function getColor(count: number): string {
  if (count === 0) return '#27272a80';
  if (count <= 2) return '#064e3b';
  if (count <= 4) return '#047857';
  return '#10b981';
}

const CELL_SIZE = 10;
const GAP = 2;

export function HeatmapGrid({ data }: HeatmapGridProps) {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    const dataMap = new Map<string, number>();
    for (const d of data) {
      dataMap.set(d.date, d.count);
    }

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);
    const dayOfWeek = startDate.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(startDate.getDate() + mondayOffset);

    const weeks: { date: string; count: number }[][] = [];
    const months: { label: string; col: number }[] = [];
    let lastMonth = -1;

    const current = new Date(startDate);
    let weekIdx = 0;

    while (current <= today || weeks.length < 52) {
      const week: { date: string; count: number }[] = [];

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
        });

        current.setDate(current.getDate() + 1);
      }

      weeks.push(week);
      weekIdx++;
      if (weeks.length >= 53) break;
    }

    return { grid: weeks, monthLabels: months };
  }, [data]);

  const dayLabels = ['M', '', 'W', '', 'F', '', ''];

  return (
    <View>
      {/* Month labels */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.monthRow}>
            <View style={{ width: 20 }} />
            {monthLabels.map((m, i) => (
              <Text
                key={i}
                style={[
                  styles.monthLabel,
                  { position: 'absolute', left: 20 + m.col * (CELL_SIZE + GAP) },
                ]}
              >
                {m.label}
              </Text>
            ))}
          </View>

          <View style={styles.gridContainer}>
            {/* Day labels */}
            <View style={styles.dayLabels}>
              {dayLabels.map((label, i) => (
                <View key={i} style={{ height: CELL_SIZE, marginBottom: GAP, justifyContent: 'center' }}>
                  <Text style={styles.dayLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Grid */}
            <View style={styles.weeksRow}>
              {grid.map((week, wi) => (
                <View key={wi} style={styles.weekColumn}>
                  {week.map((cell, di) => (
                    <View
                      key={`${wi}-${di}`}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: cell.count < 0 ? 'transparent' : getColor(cell.count),
                        },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {[0, 1, 3, 5].map((count) => (
              <View
                key={count}
                style={[styles.legendCell, { backgroundColor: getColor(count) }]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 4,
    position: 'relative',
  },
  monthLabel: {
    color: '#71717a',
    fontSize: 9,
  },
  gridContainer: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 20,
    marginRight: 2,
  },
  dayLabel: {
    color: '#71717a',
    fontSize: 8,
  },
  weeksRow: {
    flexDirection: 'row',
  },
  weekColumn: {
    marginRight: GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginBottom: GAP,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 3,
  },
  legendText: {
    color: '#71717a',
    fontSize: 9,
  },
  legendCell: {
    width: 8,
    height: 8,
    borderRadius: 1,
  },
});
