import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet, Dimensions } from "react-native";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import ScheduleScreen from "../screens/ScheduleScreen";
import AvailabilityScreen from "../screens/AvailabilityScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

// Custom Tab Bar Icons
const TabIcons = {
  Schedule: "📆",
  Availability: "⏰",
  Profile: "👤",
};

// Floating Tab Bar
function FloatingTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              <View style={styles.tabButtonWrapper} onTouchEnd={onPress}>
                <View
                  style={[
                    styles.tabButton,
                    isFocused ? styles.activeTabButton : null,
                  ]}
                >
                  <Text style={styles.tabIcon}>{TabIcons[route.name]}</Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.activeTabLabel : null,
                    ]}
                    numberOfLines={1}
                  >
                    {label === "Availability" ? "Avail" : label}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: "Schedule",
        }}
      />
      <Tab.Screen
        name="Availability"
        component={AvailabilityScreen}
        options={{
          tabBarLabel: "Availability",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePlaceholder}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  );
};

// Placeholder for Profile screen
const ProfilePlaceholder = () => (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1E232C",
    }}
  >
    <Text style={{ color: "white", fontSize: 18 }}>
      Profile Screen (Coming Soon)
    </Text>
  </View>
);

// Root Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#2A3242",
    borderRadius: 30,
    height: 65,
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "space-between",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    // Shadow for Android
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabButtonWrapper: {
    width: "100%",
    alignItems: "center",
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "#3D4A63",
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    color: "#8E8E93",
    textAlign: "center",
  },
  activeTabLabel: {
    color: "#4B7BEC",
    fontWeight: "600",
  },
});

export default AppNavigator;
