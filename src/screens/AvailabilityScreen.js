import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const AvailabilityScreen = () => {
  // Days of the week
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Time slots
  const timeSlots = [
    { id: "morning", label: "Morning (8am - 12pm)" },
    { id: "afternoon", label: "Afternoon (12pm - 4pm)" },
    { id: "evening", label: "Evening (4pm - 8pm)" },
    { id: "night", label: "Night (8pm - 12am)" },
  ];

  // Initial availability state
  const [availability, setAvailability] = useState({
    Sunday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
    Monday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
    Tuesday: {
      morning: false,
      afternoon: true,
      evening: true,
      night: false,
      notAvailable: false,
    },
    Wednesday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
    Thursday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
    Friday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
    Saturday: {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: true,
    },
  });

  const toggleTimeSlot = (day, timeSlot) => {
    const updatedAvailability = { ...availability };
    // Toggle the selected time slot
    updatedAvailability[day][timeSlot] = !updatedAvailability[day][timeSlot];

    // Update not available status based on time slot selection
    const isAnyTimeSlotSelected =
      updatedAvailability[day].morning ||
      updatedAvailability[day].afternoon ||
      updatedAvailability[day].evening ||
      updatedAvailability[day].night;

    updatedAvailability[day].notAvailable = !isAnyTimeSlotSelected;

    setAvailability(updatedAvailability);
  };

  const clearDay = (day) => {
    const updatedAvailability = { ...availability };
    updatedAvailability[day] = {
      morning: false,
      afternoon: false,
      evening: false,
      night: false,
      notAvailable: false,
    };
    setAvailability(updatedAvailability);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Availability</Text>
        <Text style={styles.headerSubtitle}>
          Set your availability for each day and time slot
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {days.map((day) => (
          <View key={day} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{day}</Text>
              {availability[day].notAvailable ? (
                <Text style={styles.notAvailableText}>Not available</Text>
              ) : (
                <TouchableOpacity onPress={() => clearDay(day)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.timeSlotGrid}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotButton,
                    availability[day][slot.id] && styles.timeSlotSelected,
                  ]}
                  onPress={() => toggleTimeSlot(day, slot.id)}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radioOuter,
                        availability[day][slot.id] && styles.radioOuterSelected,
                      ]}
                    >
                      {availability[day][slot.id] && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </View>
                  <Text style={styles.timeSlotText}>{slot.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  daySection: {
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2A3242",
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  notAvailableText: {
    color: "#FF6961",
    fontSize: 14,
  },
  clearText: {
    color: "#4B7BEC",
    fontSize: 14,
  },
  timeSlotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  timeSlotButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: "#343948",
    borderRadius: 8,
    margin: "1%",
    padding: 12,
  },
  timeSlotSelected: {
    borderColor: "#4B7BEC",
    borderWidth: 1,
  },
  radioContainer: {
    marginRight: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: "#8E8E93",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: "#4B7BEC",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4B7BEC",
  },
  timeSlotText: {
    color: "white",
    fontSize: 14,
    flex: 1,
  },
});

export default AvailabilityScreen;
