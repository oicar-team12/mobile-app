import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Animated,
  Alert,
  Dimensions
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { user, logout, loading: authLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleLogout = async () => {
    try {
      setModalVisible(false);
      await logout();
    } catch (error) {
      setModalVisible(false);
      console.error("Logout failed:", error.message || "An error occurred");
      Alert.alert("Logout Failed", error.message || "An unexpected error occurred during logout.");
    }
  };

  if (authLoading && !user) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.containerLoading}> 
        <View style={styles.centeredContent}>
            <ActivityIndicator size="large" color="#6C5DD3" />
            <Text style={styles.loadingText}>Loading Profile...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  if (!user) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.containerLoading}>
        <View style={styles.centeredContent}>
            <Text style={styles.errorText}>User not found or not logged in.</Text>
        </View>
      </LinearGradient>
    );
  }

  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const email = user.email || 'No email provided';

  const getInitials = () => {
    let initialsStr = "";
    if (firstName && firstName.length > 0) {
      initialsStr += firstName[0];
    }
    if (lastName && lastName.length > 0) {
      initialsStr += lastName[0];
    }
    if (!initialsStr && email && email.length > 0) {
        initialsStr = email[0];
    }
    return initialsStr.toUpperCase() || 'U';
  };
  const initials = getInitials();

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.nameText}>{firstName} {lastName}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </Animated.View>

        <Animated.View style={[styles.menuSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <ProfileMenuItem icon="person-circle-outline" text="Account Details" onPress={() => Alert.alert("Coming Soon!", "Edit profile functionality will be added soon.")} />
          <ProfileMenuItem icon="settings-outline" text="App Settings" onPress={() => Alert.alert("Coming Soon!", "App settings will be available in a future update.")} />
          <ProfileMenuItem icon="help-circle-outline" text="Help & Support" onPress={() => Alert.alert("Support", "Contact support@shiftsync.app for assistance.")} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', alignItems: 'center' }}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" style={{marginRight: 10}} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalView, {transform: [{scale: scaleAnim}]}]}>
            <Ionicons name="alert-circle-outline" size={50} color="#FBBF24" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>Confirm Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out from ShiftSync?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogout}
                disabled={authLoading}
              >
                {authLoading ? <ActivityIndicator color="#FFF" size="small"/> : <Text style={styles.modalButtonText}>Sign Out</Text>}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const ProfileMenuItem = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.6}>
    <Ionicons name={icon} size={24} color="#A5B4FC" style={styles.menuItemIcon} />
    <Text style={styles.menuItemText}>{text}</Text>
    <Ionicons name="chevron-forward-outline" size={22} color="#6B7280" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  containerLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  centeredContent: { 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 16
  },
  errorText: { 
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: height * 0.05, 
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#6C5DD3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6C5DD3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emailText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  menuSection: {
    width: '100%',
    marginBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemIcon: {
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 17,
    color: '#E5E7EB',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    width: width * 0.85,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: width * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: '#4B5563',
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  }
});

export default ProfileScreen;
