import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color?: string;
}

export function StatsCard({ icon, label, value, subValue, color = '#6c5ce7' }: StatsCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subValue && <Text style={styles.subValue}>{subValue}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  value: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    color: '#a0a0b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  subValue: {
    color: '#666680',
    fontSize: 11,
    marginTop: 2,
  },
});
