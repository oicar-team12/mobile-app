import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const ScheduleScreen = () => {
  // Mock data for schedule - would come from API in a real app
  const [schedule, setSchedule] = useState([
    {
      id: "1",
      day: "Monday",
      date: "Apr 5",
      shift: "Morning (8am - 12pm)",
      location: "Main Store",
    },
    {
      id: "2",
      day: "Tuesday",
      date: "Apr 6",
      shift: "Afternoon (12pm - 4pm)",
      location: "Downtown",
    },
    {
      id: "3",
      day: "Thursday",
      date: "Apr 8",
      shift: "Evening (4pm - 8pm)",
      location: "Main Store",
    },
    {
      id: "4",
      day: "Friday",
      date: "Apr 9",
      shift: "Morning (8am - 12pm)",
      location: "Downtown",
    },
    {
      id: "5",
      day: "Saturday",
      date: "Apr 10",
      shift: "Night (8pm - 12am)",
      location: "Main Store",
    },
  ]);

  // Mock data for filter options
  const [currentWeek, setCurrentWeek] = useState("April 5 - April 11");
  const [filterActive, setFilterActive] = useState(false);

  const renderScheduleItem = ({ item }) => (
    <View style={styles.scheduleItem}>
      <View style={styles.dateContainer}>
        <Text style={styles.day}>{item.day}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.shiftContainer}>
        <Text style={styles.shift}>{item.shift}</Text>
        <Text style={styles.location}>{item.location}</Text>
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
        <TouchableOpacity style={styles.weekArrow}>
          <Text style={styles.weekArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.weekText}>{currentWeek}</Text>
        <TouchableOpacity style={styles.weekArrow}>
          <Text style={styles.weekArrowText}>→</Text>
        </TouchableOpacity>
      </View>

      {schedule.length > 0 ? (
        <FlatList
          data={schedule}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scheduleList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No shifts assigned</Text>
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
  },
});

export default ScheduleScreen;
