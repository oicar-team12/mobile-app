import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import AvailabilityService from '../services/AvailabilityService';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const getWeekDays = (startDate) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    days.push({
      date,
      dayName: format(date, 'EEE'), // Short day name
      dateString: format(date, 'yyyy-MM-dd'),
      dayOfMonth: format(date, 'd'),
    });
  }
  return days;
};

const timeSlots = [
  { id: 'morning', label: 'Morning', subLabel: '8am - 12pm', startTime: '08:00:00', endTime: '12:00:00', icon: 'sunny-outline' },
  { id: 'afternoon', label: 'Afternoon', subLabel: '12pm - 4pm', startTime: '12:00:00', endTime: '16:00:00', icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening', subLabel: '4pm - 8pm', startTime: '16:00:00', endTime: '20:00:00', icon: 'cloudy-night-outline' },
  { id: 'night', label: 'Night', subLabel: '8pm - 12am', startTime: '20:00:00', endTime: '23:59:59', icon: 'moon-outline' },
];

const AvailabilityScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingStates, setSavingStates] = useState({}); // For individual slot saving
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [days, setDays] = useState(getWeekDays(new Date()));
  const [availabilities, setAvailabilities] = useState({});
  const [selectedDate, setSelectedDate] = useState(days[0]?.dateString || '');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [currentWeekStart]); // Animate when week changes

  useEffect(() => {
    const loadAvailabilities = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const startDate = days[0].dateString;
        const endDate = days[days.length - 1].dateString;
        const defaultGroupId = 1; // Placeholder
        
        const data = await AvailabilityService.getAvailabilities(
          defaultGroupId,
          { userId: user.id, startDate, endDate }
        );
        
        const availMap = {};
        if (data.length > 0 && data[0].availabilities) {
          data[0].availabilities.forEach(avail => {
            timeSlots.forEach(slot => { // Assume if a date is available, all its slots are initially marked based on this logic
              if(avail.date === format(parseISO(avail.date), 'yyyy-MM-dd')) { // Ensure date format matches
                 availMap[`${avail.date}_${slot.startTime}`] = { ...avail, startTime: slot.startTime, endTime: slot.endTime };
              }
            });
          });
        }
        setAvailabilities(availMap);
      } catch (error) {
        console.error('Failed to load availabilities:', error);
        Alert.alert('Error', 'Failed to load your availabilities.');
      } finally {
        setLoading(false);
      }
    };
    loadAvailabilities();
  }, [user, days]); // Reload when user or displayed days change

  const defaultGroupId = 1; // Placeholder

  const toggleAvailability = async (date, timeSlot) => {
    if (!user) return;
    const slotKey = `${format(date, 'yyyy-MM-dd')}_${timeSlot.startTime}`;
    setSavingStates(prev => ({ ...prev, [slotKey]: true }));

    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const existing = availabilities[slotKey];
      
      if (existing && existing.id) { // Ensure existing.id is present for deletion
        await AvailabilityService.removeAvailability(defaultGroupId, existing.id);
        setAvailabilities(prev => {
          const newAvail = { ...prev };
          delete newAvail[slotKey];
          return newAvail;
        });
      } else {
        const newAvailability = await AvailabilityService.addAvailability(defaultGroupId, {
          date: dateString,
          available: true, // Backend might only need this
          // userId: user.id, // Often included in service calls implicitly or explicitly
        });
        // The backend might return the full object including an ID. Store it.
        setAvailabilities(prev => ({
          ...prev,
          [slotKey]: { 
            ...newAvailability, // This should contain the ID from backend
            date: dateString, 
            startTime: timeSlot.startTime, 
            endTime: timeSlot.endTime 
          }
        }));
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
      Alert.alert('Error', 'Failed to update availability.');
       // Revert optimistic UI update or handle error state
       // For now, just stop saving indicator
    } finally {
      setSavingStates(prev => ({ ...prev, [slotKey]: false }));
    }
  };

  const isTimeSlotAvailable = (date, timeSlot) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return !!availabilities[`${dateString}_${timeSlot.startTime}`];
  };

  const changeWeek = (direction) => {
    const newWeekStart = direction === 'next' ? addDays(currentWeekStart, 7) : subDays(currentWeekStart, 7);
    setCurrentWeekStart(newWeekStart);
    const newDays = getWeekDays(newWeekStart);
    setDays(newDays);
    setSelectedDate(newDays[0].dateString); // Select first day of new week
    // Reset animations for new week view
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5DD3" />
        <Text style={styles.loadingText}>Loading Availability...</Text>
      </LinearGradient>
    );
  }

  const currentSelectedFullDate = days.find(d => d.dateString === selectedDate)?.date || new Date();

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.header, {opacity: fadeAnim, transform: [{translateY: slideAnim}]}]}>
        <Text style={styles.title}>My Availability</Text>
        <Text style={styles.subtitle}>Tap on time slots to set your availability for the week.</Text>
      </Animated.View>

      <Animated.View style={[styles.weekNavigation, {opacity: fadeAnim}]}>
        <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.navButton}>
          <Ionicons name="chevron-back-outline" size={28} color="#6C5DD3" />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {format(days[0].date, 'MMM d')} - {format(days[days.length - 1].date, 'MMM d, yyyy')}
        </Text>
        <TouchableOpacity onPress={() => changeWeek('next')} style={styles.navButton}>
          <Ionicons name="chevron-forward-outline" size={28} color="#6C5DD3" />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.daysContainer}>
        {days.map((day, index) => (
          <Animated.View key={day.dateString} style={{opacity: fadeAnim, transform: [{scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange:[0.85, 1]})}]}}>
            <TouchableOpacity
              style={[styles.dayTab, selectedDate === day.dateString && styles.selectedDayTab]}
              onPress={() => setSelectedDate(day.dateString)}
            >
              <Text style={[styles.dayTabText, selectedDate === day.dateString && styles.selectedDayTabText]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dayTabDate, selectedDate === day.dateString && styles.selectedDayTabDate]}>
                {day.dayOfMonth}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <ScrollView style={styles.timeSlotsContainer} contentContainerStyle={{paddingBottom: 20}}>
        {timeSlots.map((timeSlot) => {
          const isAvailable = isTimeSlotAvailable(currentSelectedFullDate, timeSlot);
          const slotKey = `${selectedDate}_${timeSlot.startTime}`;
          const isSaving = savingStates[slotKey];

          return (
            <Animated.View key={timeSlot.id} style={{opacity: fadeAnim, transform: [{translateY: slideAnim}]}}>
            <TouchableOpacity
              style={[styles.timeSlot, isAvailable && styles.timeSlotSelected, isSaving && styles.timeSlotSaving]}
              onPress={() => toggleAvailability(currentSelectedFullDate, timeSlot)}
              disabled={isSaving}
            >
              <Ionicons 
                name={isAvailable ? timeSlot.icon.replace('-outline', '') : timeSlot.icon} 
                size={26} 
                color={isAvailable ? '#6C5DD3' : '#9CA3AF'} 
                style={styles.timeSlotIcon} 
              />
              <View style={styles.timeSlotTextContainer}>
                <Text style={[styles.timeSlotText, isAvailable && styles.timeSlotTextSelected]}>
                  {timeSlot.label}
                </Text>
                <Text style={[styles.timeSlotSubText, isAvailable && styles.timeSlotSubTextSelected]}>
                  {timeSlot.subLabel}
                </Text>
              </View>
              {isSaving ? (
                <ActivityIndicator size="small" color={isAvailable ? '#6C5DD3' : '#9CA3AF'} />
              ) : (
                <Ionicons 
                  name={isAvailable ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={isAvailable ? '#6C5DD3' : '#4B5563'} 
                />
              )}
            </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>Selected: {format(currentSelectedFullDate, 'EEEE, MMM d, yyyy')}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 26, // Adjusted size
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  navButton: {
    padding: 8, // Smaller padding for touch area
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  weekText: {
    color: '#E5E7EB',
    fontSize: 17,
    fontWeight: '600',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dayTab: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10, // Give a bit more horizontal space
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    minWidth: width / 7.8, // Distribute width more evenly
    marginHorizontal: 2, // Minimal margin
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedDayTab: {
    backgroundColor: '#6C5DD3',
    borderColor: 'rgba(108, 93, 211, 0.7)',
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  dayTabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedDayTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTabDate: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedDayTabDate: {
    color: '#FFFFFF',
  },
  timeSlotsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  timeSlotSelected: {
    backgroundColor: 'rgba(108, 93, 211, 0.15)',
    borderColor: '#6C5DD3',
  },
  timeSlotSaving: {
    opacity: 0.7,
  },
  timeSlotIcon: {
    marginRight: 15,
  },
  timeSlotTextContainer: {
    flex: 1,
  },
  timeSlotText: {
    color: '#E5E7EB',
    fontSize: 17,
    fontWeight: '600',
  },
  timeSlotTextSelected: {
    color: '#A5B4FC', // Lighter purple for selected text
  },
  timeSlotSubText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
  timeSlotSubTextSelected: {
    color: '#A5B4FC',
  },
  footerInfo: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.1)', // Subtle footer background
    alignItems: 'center',
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default AvailabilityScreen;
