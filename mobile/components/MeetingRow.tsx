import React from 'react';
import { View, Text, StyleSheet, Pressable, ActionSheetIOS } from 'react-native';
import type { Meeting, MeetingStatus } from '../lib/types';

const STATUS_COLORS: Record<MeetingStatus, string> = {
  upcoming: '#3498db',
  completed: '#00b894',
  cancelled: '#a0a0b8',
};

interface MeetingRowProps {
  meeting: Meeting;
  onUpdateStatus: (meetingId: string, status: MeetingStatus) => void;
  onDelete: (meetingId: string) => void;
}

export function MeetingRow({ meeting, onUpdateStatus, onDelete }: MeetingRowProps) {
  const statusColor = STATUS_COLORS[meeting.status];

  const handleLongPress = () => {
    const options = ['Mark Completed', 'Cancel Meeting', 'Delete', 'Dismiss'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;

    ActionSheetIOS.showActionSheetWithOptions(
      { options, destructiveButtonIndex, cancelButtonIndex, title: meeting.title },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          onUpdateStatus(meeting.id, 'completed');
        } else if (buttonIndex === 1) {
          onUpdateStatus(meeting.id, 'cancelled');
        } else if (buttonIndex === 2) {
          onDelete(meeting.id);
        }
      }
    );
  };

  const date = new Date(meeting.meeting_date);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onLongPress={handleLongPress}
    >
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>{meeting.title}</Text>
        <Text style={styles.dateText}>{dateStr} at {timeStr}</Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {meeting.status}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.7,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    color: '#e0e0f0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    color: '#a0a0b8',
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
