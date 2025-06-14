import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { format } from 'date-fns';
import UserService from '../services/UserService';
import ShiftService from '../services/ShiftService';

const ShiftScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [assignedShifts, setAssignedShifts] = useState([]);
  const [error, setError] = useState(null);

  // Fetch user's groups
  const fetchUserGroups = async () => {
    try {
      const userGroups = await UserService.getMyGroups();
      setGroups(userGroups);
      
      // If there are groups, select the first one
      if (userGroups.length > 0) {
        setSelectedGroupId(userGroups[0].id);
      }
      
      return userGroups;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      setError('Failed to fetch your groups. Please try again later.');
      return [];
    }
  };

  // Fetch assigned shifts for the selected group
  const fetchAssignedShifts = async (groupId) => {
    if (!groupId) return;
    
    try {
      // Get current date
      const today = new Date();
      
      // Create date ranges for the next 30 days
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30),
        'yyyy-MM-dd'
      );
      
      const shifts = await ShiftService.getMyAssignedShifts(groupId, {
        startDate,
        endDate
      });
      
      setAssignedShifts(shifts);
    } catch (error) {
      console.error('Error fetching assigned shifts:', error);
      setError('Failed to fetch your shifts. Please try again later.');
    }
  };

  // Get the current user
  const [currentUser, setCurrentUser] = useState(null);
  
  // Load current user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = await UserService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Error loading user info:', err);
      }
    };
    
    loadUserInfo();
  }, []);
  
  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userGroups = await fetchUserGroups();
        
        if (userGroups.length > 0) {
          await fetchAssignedShifts(userGroups[0].id);
        }
      } catch (err) {
        console.error('Error in initial data load:', err);
        setError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // When selected group changes, fetch shifts for that group
  useEffect(() => {
    if (selectedGroupId) {
      fetchAssignedShifts(selectedGroupId);
    }
  }, [selectedGroupId]);

  // Pull-to-refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await fetchUserGroups();
      if (selectedGroupId) {
        await fetchAssignedShifts(selectedGroupId);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  // Format time to display
  const formatTime = (timeString) => {
    // Convert HH:MM:SS to HH:MM format
    return timeString?.substring(0, 5);
  };
  
  // Format date to display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Check if current user is in the assigned users list
  const isUserAssignedToShift = async (scheduleItem) => {
    try {
      const currentUser = await UserService.getCurrentUser();
      return scheduleItem.users.some(user => user.id === currentUser.id);
    } catch (error) {
      console.error('Error checking if user is assigned to shift:', error);
      return false;
    }
  };

  // Switch between groups
  const handleGroupChange = (groupId) => {
    setSelectedGroupId(groupId);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your shifts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.noGroupContainer}>
        <Text style={styles.noGroupText}>
          You haven't been assigned to any group yet. Please contact your manager.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedGroup = groups.find(group => group.id === selectedGroupId) || {};

  return (
    <View style={styles.container}>
      {/* Group selector if user belongs to multiple groups */}
      {groups.length > 1 && (
        <View style={styles.groupSelector}>
          <Text style={styles.sectionTitle}>Your Groups:</Text>
          <FlatList
            horizontal
            data={groups}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupItem,
                  item.id === selectedGroupId ? styles.selectedGroupItem : null,
                ]}
                onPress={() => handleGroupChange(item.id)}
              >
                <Text
                  style={[
                    styles.groupItemText,
                    item.id === selectedGroupId ? styles.selectedGroupItemText : null,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Group info */}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{selectedGroup.name}</Text>
        <Text style={styles.roleText}>
          You are assigned as an {selectedGroup.role || 'EMPLOYEE'}
        </Text>
      </View>

      {/* Assigned shifts list */}
      <Text style={styles.sectionTitle}>Your Assigned Shifts:</Text>
      {assignedShifts.length === 0 ? (
        <View style={styles.noShiftsContainer}>
          <Text style={styles.noShiftsText}>
            You don't have any shifts assigned in the next 30 days.
          </Text>
        </View>
      ) : (
        <FlatList
          data={assignedShifts}
          keyExtractor={(item, index) => (item.shift.id ? item.shift.id.toString() : `shift-${index}`)}
          renderItem={({ item }) => (
            <View style={styles.shiftItem}>
              <Text style={styles.shiftDate}>{formatDate(item.shift.date)}</Text>
              <View style={styles.shiftTimeContainer}>
                <Text style={styles.shiftTime}>
                  {formatTime(item.shift.startTime)} - {formatTime(item.shift.endTime)}
                </Text>
              </View>
              {item.shift.note && (
                <Text style={styles.shiftNote}>{item.shift.note}</Text>
              )}
              {item.users.length > 1 && currentUser && (
                <View style={styles.assignedUsersContainer}>
                  <Text style={styles.assignedUsersLabel}>Also assigned:</Text>
                  {item.users
                    .filter(user => user.id !== currentUser.id)
                    .map((user, idx, filteredArray) => (
                      <Text key={`user-${user.id}`} style={styles.assignedUserName}>
                        {user.firstName} {user.lastName}{idx < filteredArray.length - 1 ? ', ' : ''}
                      </Text>
                    ))}
                </View>
              )}
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noGroupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGroupText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  groupSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  groupItem: {
    backgroundColor: '#e9ecef',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedGroupItem: {
    backgroundColor: '#007bff',
  },
  groupItemText: {
    color: '#495057',
    fontSize: 14,
  },
  selectedGroupItemText: {
    color: '#fff',
    fontWeight: '500',
  },
  groupInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  roleText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  noShiftsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noShiftsText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  shiftItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 8,
  },
  shiftTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftTime: {
    fontSize: 15,
    color: '#495057',
    fontWeight: '500',
  },
  assignedUsersContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  assignedUsersLabel: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
  },
  assignedUserName: {
    fontSize: 13,
    color: '#495057',
    marginLeft: 8,
  },
  shiftNote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6c757d',
    marginTop: 5,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default ShiftScreen;
