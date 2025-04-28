import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { subscribeTopic, publishToMQTT } from '../services/mqtt-service';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    // Request session history from Node-RED
    publishToMQTT('grill/history/request', 'all');

    // Subscribe to history updates
    subscribeTopic('grill/history/data', (message) => {
      try {
        // Handle both string and object formats
        const data = typeof message === 'string' ? JSON.parse(message) : message;
        setSessions(data);
      } catch (error) {
        console.error('Failed to parse history data:', error);
      }
    });

    return () => {
      // Clean up subscription
      // unsubscribeTopic('grill/history/data');
    };
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderSessionItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.sessionItem, selectedSession?.id === item.id && styles.selectedSession]}
      onPress={() => setSelectedSession(item)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionName}>{item.name || 'Unnamed Session'}</Text>
        <Text style={styles.sessionDate}>{formatDate(item.startTime)}</Text>
      </View>
      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="thermometer-outline" size={16} color="#e74c3c" />
          <Text style={styles.detailText}>Max: {item.maxTemp}°F</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#3498db" />
          <Text style={styles.detailText}>{item.duration} min</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smoking History</Text>
      </View>

      <View style={styles.content}>
        {selectedSession ? (
          <View style={styles.sessionDetail}>
            <View style={styles.sessionDetailHeader}>
              <Text style={styles.sessionDetailName}>{selectedSession.name || 'Unnamed Session'}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedSession(null)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sessionDetailDate}>{formatDate(selectedSession.startTime)}</Text>

            {selectedSession.description && (
              <Text style={styles.sessionDescription}>{selectedSession.description}</Text>
            )}

            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Temperature Profile</Text>
              <LineChart
                data={{
                  labels: selectedSession.timePoints || ['Start', '', '', '', '', 'End'],
                  datasets: [
                    {
                      data: selectedSession.tempPoints || [0, 0, 0, 0, 0, 0],
                      color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                      strokeWidth: 2,
                    },
                    {
                      data: selectedSession.targetPoints || [0, 0, 0, 0, 0, 0],
                      color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                      strokeWidth: 2,
                      strokeDashArray: [5, 5],
                    },
                  ],
                }}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: '#1e2923',
                  backgroundGradientFrom: '#222',
                  backgroundGradientTo: '#333',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#ffa726',
                  },
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
                  <Text style={styles.legendText}>Actual Temp</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
                  <Text style={styles.legendText}>Target Temp</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Max Temp</Text>
                <Text style={styles.statValue}>{selectedSession.maxTemp}°F</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Temp</Text>
                <Text style={styles.statValue}>{selectedSession.avgTemp}°F</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{selectedSession.duration} min</Text>
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sessionsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#555" />
                <Text style={styles.emptyText}>No smoking sessions recorded yet</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  sessionsList: {
    padding: 16,
  },
  sessionItem: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedSession: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sessionDate: {
    fontSize: 12,
    color: '#aaa',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    color: '#ddd',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  sessionDetail: {
    flex: 1,
    padding: 16,
  },
  sessionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDetailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  sessionDetailDate: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  chartContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    color: '#ddd',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});
