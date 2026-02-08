import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XpBarProps {
  level: number;
  progressPercent: number;
  progressXp: number;
  nextLevelXp: number;
  currentLevelXp: number;
  totalXp: number;
}

export function XpBar({ level, progressPercent, progressXp, nextLevelXp, currentLevelXp, totalXp }: XpBarProps) {
  const xpNeeded = nextLevelXp - currentLevelXp;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LV {level}</Text>
        </View>
        <Text style={styles.xpText}>
          {progressXp} / {xpNeeded} XP
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progressPercent}%` }]} />
      </View>
      <Text style={styles.totalXp}>{totalXp} total XP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#6c5ce7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  levelText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  xpText: {
    color: '#a0a0b8',
    fontSize: 14,
    fontWeight: '500',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#2d2d44',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    borderRadius: 5,
  },
  totalXp: {
    color: '#666680',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
});
