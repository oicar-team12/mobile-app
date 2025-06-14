import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList, // Changed from FlatList to the appropriate component for sectioned data.
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ScheduleService from '../services/ScheduleService';
import ShiftService from '../services/ShiftService';
import { format, parseISO, addDays } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ScheduleScreenNew = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [shifts, setShifts] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedFilter]); // Re-run animation when filter changes for tab content

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const getDisplayDate = (dateString) => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const date = parseISO(dateString);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today';
    if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  const defaultGroupId = 1; // Placeholder

  const fetchData = async (isRefresh = false) => {
    if (!user) return;

    if (!isRefresh) setLoading(true);

    try {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 30), 'yyyy-MM-dd');

      // The /schedules endpoint returns all necessary data, including the nested shift object.
      // No need to call /shifts separately.
      const schedulesData = await ScheduleService.getSchedules(defaultGroupId, { userId: user.id, startDate, endDate });

      const processedSchedules = schedulesData
        .map(item => {
          const shift = item.shift;

          // The root cause of the bug is that the date is nested in `item.shift.date`.
          // This check now correctly validates the data structure.
          if (!shift || !shift.date) {
            console.warn('Skipping schedule item with invalid shift data:', item);
            return null;
          }

          try {
            return {
              ...item, // Keep the original data like the 'users' array
              shift: shift, // The full shift object
              displayDate: getDisplayDate(shift.date),
              startTimeFormatted: formatTime(shift.startTime),
              endTimeFormatted: formatTime(shift.endTime),
              isPast: new Date(`${shift.date}T${shift.endTime || '23:59:59'}`) < today,
              sortDate: new Date(`${shift.date}T${shift.startTime || '00:00:00'}`)
            };
          } catch (error) {
            console.error('Failed to process schedule item:', error, item);
            return null;
          }
        })
        .filter(Boolean) // Remove nulls from items that failed validation
        .sort((a, b) => a.sortDate - b.sortDate);

      setSchedules(processedSchedules);

    } catch (error) {
      console.error('Error fetching schedule data:', error);
      Alert.alert('Error', 'Unable to load your schedule. Please try again.');
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (selectedFilter === 'upcoming') return !schedule.isPast;
    if (selectedFilter === 'past') return schedule.isPast;
    return true;
  });

  const groupedSchedules = filteredSchedules.reduce((groups, schedule) => {
    const { displayDate } = schedule;
    if (!groups[displayDate]) groups[displayDate] = [];
    groups[displayDate].push(schedule);
    return groups;
  }, {});

  const sections = Object.keys(groupedSchedules).map(date => ({
    date,
    data: groupedSchedules[date],
  }));

  const renderScheduleItem = ({ item: schedule, index }) => (
    <Animated.View style={[
      styles.scheduleItem,
      {
        opacity: fadeAnim, // Apply to individual items if desired, or to sections
        transform: [{ translateY: slideAnim }], // Example for item animation
      }
    ]}>
      <View style={styles.timeSection}>
        <Ionicons name="time-outline" size={18} color="#A5B4FC" style={styles.timeIcon} />
        <Text style={styles.timeText}>
          {schedule.startTimeFormatted} - {schedule.endTimeFormatted}
        </Text>
      </View>
      <View style={styles.detailsSection}>
        <Text style={styles.titleText}>{schedule.shift?.name || 'Shift'}</Text>
        {schedule.locationName && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" style={styles.detailIcon} />
            <Text style={styles.locationText}>{schedule.locationName}</Text>
          </View>
        )}
        {schedule.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#8E8E93" style={styles.detailIcon} />
            <Text style={styles.notesText} numberOfLines={2}>{schedule.notes}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5DD3" />
        <Text style={styles.loadingText}>Loading Schedule...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </Animated.View>
      
      <View style={styles.filterContainer}>
        {['upcoming', 'past', 'all'].map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === filter && styles.activeFilterTabText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => {
          // Use the shift ID for a stable key, falling back to the index for safety.
          return item.shift?.id?.toString() || index.toString();
        }}
        renderItem={renderScheduleItem}
        renderSectionHeader={({ section: { date } }) => (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.sectionHeader}>{date}</Text>
          </Animated.View>
        )}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6C5DD3']}
            tintColor="#6C5DD3"
          />
        }
        ListEmptyComponent={
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="calendar-outline" size={60} color="#4B5563" />
            <Text style={styles.emptyText}>
              {selectedFilter === 'upcoming'
                ? 'No upcoming shifts scheduled'
                : selectedFilter === 'past'
                ? 'No past shifts found'
                : 'No shifts found'}
            </Text>
          </Animated.View>
        }
        contentContainerStyle={
          sections.length === 0
            ? styles.emptyListContentContainer
            : { paddingBottom: 20, paddingHorizontal: 15 }
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#9CA3AF',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: '#6C5DD3',
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  filterTabText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 12,
    marginTop: 10,
    paddingLeft: 5, // Align with cards
  },
  scheduleItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#6C5DD3',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    color: '#A5B4FC', // Lighter purple for time
    fontWeight: '600',
    fontSize: 15,
  },
  detailsSection: {
    flex: 1,
  },
  titleText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  locationText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  notesText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 15,
  },
  emptyListContentContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  }
});

export default ScheduleScreenNew;
