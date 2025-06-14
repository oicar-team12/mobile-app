import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Dimensions,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Expo's vector icons

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ScheduleScreenNew from '../screens/ScheduleScreenNew';
import ShiftScreen from '../screens/ShiftScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom Animated Tab Bar
const AnimatedTabBar = ({ state, descriptors, navigation }) => {
  const iconSize = 26;
  const activeColor = '#6C5DD3'; // A vibrant purple
  const inactiveColor = '#8E8E93'; // Muted gray
  const backgroundColor = '#1F2937'; // Dark cool gray

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;
          const animatedValue = new Animated.Value(isFocused ? 1 : 0);

          useEffect(() => {
            Animated.timing(animatedValue, {
              toValue: isFocused ? 1 : 0,
              duration: 250,
              easing: Easing.out(Easing.ease),
              useNativeDriver: false, // color and transform animations might need this
            }).start();
          }, [isFocused]);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = (routeName) => {
            switch (routeName) {
              case 'Schedule': return isFocused ? 'calendar' : 'calendar-outline';
              case 'Profile': return isFocused ? 'person-circle' : 'person-circle-outline';
              default: return 'ellipse-outline';
            }
          };

          const iconColorInterpolation = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [inactiveColor, activeColor],
          });

          const textOpacityInterpolation = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });
          
          const scaleInterpolation = animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1.1],
          });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
            >
              <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleInterpolation }] }]}>
                <Animated.Text style={{ color: iconColorInterpolation }}>
                  <Ionicons name={iconName(route.name)} size={iconSize} />
                </Animated.Text>
              </Animated.View>
              <Animated.Text style={[
                styles.tabLabel,
                { color: iconColorInterpolation, opacity: textOpacityInterpolation }
              ]}>
                {label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Schedule" component={ScheduleScreenNew} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS, // Smooth horizontal transition
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#6C5DD3" />
  </View>
);

// Root Navigator with Authentication Flow
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid, // Fade transition
      }}
    >
      {isAuthenticated() ? (
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

// App Container
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90, // Increased height for better touch area and aesthetics
    backgroundColor: 'transparent', // Make wrapper transparent
    justifyContent: 'flex-end',
  },
  tabBar: {
    flexDirection: 'row',
    height: 70, // Actual tab bar height
    backgroundColor: '#1F2937', // Dark cool gray
    borderTopLeftRadius: 25, // Rounded top corners
    borderTopRightRadius: 25,
    paddingHorizontal: 10,
    alignItems: 'center', // Vertically center icons and text
    justifyContent: 'space-around', // Distribute items evenly
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5, // Shadow upwards
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15, // Elevation for Android
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    marginBottom: 4, // Space between icon and label
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212', // Very dark background for loading
  },
});

export default AppNavigator;

