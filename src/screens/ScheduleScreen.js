import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { StatusBar } from "expo-status-bar";
import ShiftService from "../services/ShiftService";
import { format, parseISO, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

const ScheduleScreen = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Current date range for fetching schedules
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Format the current week range for display
  const currentWeekFormatted = useCallback(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday as first day
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
  }, [currentDate]);
  
  // Calculate start and end dates for API requests
  const getDateRange = useCallback(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    };
  }, [currentDate]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentDate(prevDate => subWeeks(prevDate, 1));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentDate(prevDate => addWeeks(prevDate, 1));
  };

  const fetchAssignedShifts = useCallback(async () => {
    console.log('--- Step 1: Starting fetchAssignedShifts ---');
    setLoading(true);
    setError(null);

    try {
        const dateRange = getDateRange();
        console.log('--- Step 2: Date range created ---', dateRange);
        const groupId = 1;

        console.log('--- Step 3: Calling getMyAssignedShifts ---');
        const scheduleResponse = await ShiftService.getMyAssignedShifts(groupId, dateRange);
        console.log('--- Step 4: API response received ---');
        console.log('RAW Schedule API Response:', JSON.stringify(scheduleResponse, null, 2));

        console.log('--- Step 5: Starting data processing ---');
        const displayShiftsList = [];
        if (scheduleResponse && Array.isArray(scheduleResponse)) {
            for (const scheduleItem of scheduleResponse) {
                console.log('Processing item:', JSON.stringify(scheduleItem));
                if (scheduleItem && scheduleItem.shift && scheduleItem.shift.date) {
                    const shift = scheduleItem.shift;
                    // Intentionally avoiding date formatting for now to isolate the error
                    displayShiftsList.push({
                        id: String(shift.id),
                        day: shift.date, // Raw date string
                        date: '',
                        shift: `${shift.startTime || ''} - ${shift.endTime || ''}`,
                        location: shift.location || 'No location',
                        notes: shift.notes || ''
                    });
                }
            }
        }
        console.log('--- Step 6: Data processing finished ---');

        setSchedules(displayShiftsList);
        console.log('--- Step 7: State updated ---');

    } catch (err) {
        console.error('--- !!! ERROR CAUGHT in fetchAssignedShifts !!! ---');
        console.error('Error Message:', err.message);
        console.error('Error Name:', err.name);
        // The stack is the most important part for debugging
        if (err.stack) {
            console.error('Error Stack:', err.stack);
        }
        // Log the full error object to see all properties
        console.error('Full Error Object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        setError('A critical error occurred. See console for details.');
    } finally {
        setLoading(false);
        setRefreshing(false);
        console.log('--- Step 8: fetchAssignedShifts finished ---');
    }
}, [getDateRange]);


  // Pull to refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssignedShifts();
  }, [fetchAssignedShifts]);

  // Load data on component mount and when date range changes
  useEffect(() => {
    fetchAssignedShifts();
  }, [currentDate, fetchAssignedShifts]);
  
  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleItem}>
      <View style={styles.dateContainer}>
        <Text style={styles.day}>{item.day || 'No date'}</Text>
      </View>
      <View style={styles.shiftContainer}>
        <Text style={styles.shift}>{item.shift || 'No time'}</Text>
        <Text style={styles.location}>{item.location || 'No location'}</Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      <View style={styles.weekSelector}>
        <TouchableOpacity style={styles.weekArrow} onPress={goToPreviousWeek}>
          <Text style={styles.weekArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.weekText}>{currentWeekFormatted()}</Text>
        <TouchableOpacity style={styles.weekArrow} onPress={goToNextWeek}>
          <Text style={styles.weekArrowText}>→</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B7BEC" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAssignedShifts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : schedules.length > 0 ? (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scheduleList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4B7BEC"]} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No shifts assigned for this week</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E232C",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2A3242",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  weekArrow: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  weekArrowText: {
    fontSize: 18,
    color: "#4B7BEC",
    fontWeight: "bold",
  },
  weekText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
  scheduleList: {
    padding: 15,
  },
  scheduleItem: {
    flexDirection: "row",
    backgroundColor: "#2A3242",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateContainer: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: "#3A4357",
    paddingRight: 15,
  },
  day: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: "#AEAEB2",
  },
  shiftContainer: {
    flex: 1,
    paddingLeft: 15,
  },
  shift: {
    fontSize: 16,
    fontWeight: "500",
    color: "white",
    marginBottom: 5,
  },
  location: {
    fontSize: 14,
    color: "#AEAEB2",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#AEAEB2",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#4B7BEC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4B7BEC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  notes: {
    fontSize: 12,
    color: "#AEAEB2",
    fontStyle: "italic",
    marginTop: 5,
  },
});

export default ScheduleScreen;
