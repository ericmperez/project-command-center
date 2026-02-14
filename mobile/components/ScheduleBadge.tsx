import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { SchedulingEstimate } from '../lib/types';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  on_track: { color: '#00b894', label: 'On Track' },
  at_risk: { color: '#fdcb6e', label: 'At Risk' },
  behind: { color: '#e74c3c', label: 'Behind' },
};

interface ScheduleBadgeProps {
  status: SchedulingEstimate['status'];
}

export function ScheduleBadge({ status }: ScheduleBadgeProps) {
  if (status === 'no_deadline') return null;

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <Text style={[styles.badge, { backgroundColor: config.color + '22', color: config.color }]}>
      {config.label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
});
