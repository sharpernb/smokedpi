import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Slider from '@react-native-community/slider';
import { connectToMQTT, publishToMQTT, subscribeTopic, isConnected } from '../services/mqtt-service';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen({ navigation }) {
  const [connected, setConnected] = useState(false);
  const [grillTemp, setGrillTemp] = useState(0);
  const [targetTemp, setTargetTemp] = useState(225);
  const [fanSpeed, setFanSpeed] = useState(0);
  const [lidStatus, setLidStatus] = useState(false);
  const [hopperStatus, setHopperStatus] = useState(false);
  const [ashStatus, setAshStatus] = useState(false);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [tempHistory, setTempHistory] = useState([0, 0, 0, 0, 0, 0]);

  // Connect to MQTT when component mounts
  useEffect(() => {
    const connectMQTT = async () => {
      try {
        // Use the default URL (wss://grill.sharper.casa/ws)
        await connectToMQTT();
        setConnected(true);

        // Subscribe to topics
        subscribeTopic('grill/temp', (message) => {
          setGrillTemp(Number.parseFloat(message));
          setTempHistory((prev) => [...prev.slice(1), Number.parseFloat(message)]);
        });

        subscribeTopic('grill/target', (message) => {
          setTargetTemp(Number.parseFloat(message));
        });

        subscribeTopic('grill/fan', (message) => {
          setFanSpeed(Number.parseFloat(message));
        });

        subscribeTopic('grill/status/lid', (message) => {
          setLidStatus(message === '1');
        });

        subscribeTopic('grill/status/hopper', (message) => {
          setHopperStatus(message === '1');
        });

        subscribeTopic('grill/status/ash', (message) => {
          setAshStatus(message === '1');
        });

        subscribeTopic('grill/power', (message) => {
          setIsPoweredOn(message === 'true');
        });
      } catch (error) {
        Alert.alert('Connection Error', 'Failed to connect to your smoker. Please check your network settings.');
      }
    };

    connectMQTT();

    // Poll for updates every 10 seconds as a backup
    const interval = setInterval(() => {
      if (isConnected()) {
        publishToMQTT('grill/command', 'getStatus');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handlePowerToggle = (value) => {
    setIsPoweredOn(value);
    publishToMQTT('grill/power', value ? 'true' : 'false');
  };

  const handleTargetTempChange = (value) => {
    setTargetTemp(value);
    publishToMQTT('grill/target', value.toString());
  };

  const getStatusColor = (status) => {
    return status ? '#4CAF50' : '#F44336';
  };

  const getTempColor = () => {
    if (grillTemp < 150) return '#3498db'; // Blue for low temp
    if (grillTemp < 300) return '#2ecc71'; // Green for medium temp
    return '#e74c3c'; // Red for high temp
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smoke Sharper</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>{connected ? 'Connected' : 'Disconnected'}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Power Control */}
        <View style={styles.powerSection}>
          <Text style={styles.sectionTitle}>Smoker Power</Text>
          <Switch
            value={isPoweredOn}
            onValueChange={handlePowerToggle}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={isPoweredOn ? '#fff' : '#f4f3f4'}
          />
        </View>

        {/* Temperature Display */}
        <View style={styles.tempSection}>
          <View style={styles.tempDisplay}>
            <Ionicons name="flame" size={24} color={getTempColor()} />
            <Text style={[styles.tempValue, { color: getTempColor() }]}>{grillTemp}°F</Text>
          </View>
          <Text style={styles.tempLabel}>Current Grill Temperature</Text>
        </View>

        {/* Temperature Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Temperature History</Text>
          <LineChart
            data={{
              labels: ['5m', '4m', '3m', '2m', '1m', 'Now'],
              datasets: [
                {
                  data: tempHistory,
                  color: (opacity = 1) => `rgba(46, 204, 113, ${opacity})`,
                  strokeWidth: 2,
                },
                {
                  data: Array(6).fill(targetTemp),
                  color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
                  strokeWidth: 2,
                  strokeDashArray: [5, 5],
                },
              ],
            }}
            width={screenWidth - 40}
            height={180}
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
        </View>

        {/* Target Temperature Control */}
        <View style={styles.controlSection}>
          <Text style={styles.sectionTitle}>Target Temperature</Text>
          <Text style={styles.targetTemp}>{targetTemp}°F</Text>
          <Slider
            style={styles.slider}
            minimumValue={125}
            maximumValue={750}
            step={5}
            value={targetTemp}
            onValueChange={handleTargetTempChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#000000"
            thumbTintColor="#4CAF50"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>125°F</Text>
            <Text style={styles.sliderLabel}>750°F</Text>
          </View>
        </View>

        {/* Fan Speed Display */}
        <View style={styles.fanSection}>
          <Text style={styles.sectionTitle}>Fan Speed</Text>
          <View style={styles.fanDisplay}>
            <Ionicons
              name="fan"
              size={24}
              color="#3498db"
              style={[styles.fanIcon, { transform: [{ rotate: `${fanSpeed * 3.6}deg` }] }]}
            />
            <Text style={styles.fanValue}>{fanSpeed}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${fanSpeed}%`, backgroundColor: fanSpeed > 80 ? '#e74c3c' : '#3498db' },
              ]}
            />
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Smoker Status</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="restaurant-outline" size={24} color={getStatusColor(lidStatus)} />
              <Text style={styles.statusLabel}>Lid</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(lidStatus) }]}>
                {lidStatus ? 'Closed' : 'Open'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons name="flame" size={24} color={getStatusColor(hopperStatus)} />
              <Text style={styles.statusLabel}>Hopper</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(hopperStatus) }]}>
                {hopperStatus ? 'Closed' : 'Open'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons name="trash-outline" size={24} color={getStatusColor(ashStatus)} />
              <Text style={styles.statusLabel}>Ash Bin</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(ashStatus) }]}>
                {ashStatus ? 'Closed' : 'Open'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('CreatePlan')}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Create Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('History')}>
            <Ionicons name="analytics-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#aaa',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  powerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  tempSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  tempDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tempLabel: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  controlSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  targetTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  fanSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  fanDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fanIcon: {
    marginRight: 8,
  },
  fanValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  statusSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#2d98cd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
