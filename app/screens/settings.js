import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publishToMQTT, subscribeTopic, connectToMQTT } from '../services/mqtt-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    serverAddress: 'ws://192.168.86.48:1880/ws',
    notifications: true,
    tempAlerts: true,
    lidOpenAlerts: true,
    hopperAlerts: true,
    ashBinAlerts: true,
    tempUnit: 'F',
    autoConnect: true,
    debugMode: false,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    deviceName: 'Raspberry Pi Smoker Controller',
    firmwareVersion: '1.0.0',
    uptime: '0h 0m',
  });

  // Load settings from AsyncStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('smokerSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Request system info from Node-RED
    publishToMQTT('grill/system/info/request', 'true');

    // Subscribe to system info updates
    subscribeTopic('grill/system/info', (message) => {
      try {
        // Handle both string and object formats
        const info = typeof message === 'string' ? JSON.parse(message) : message;
        setDeviceInfo(info);
      } catch (error) {
        console.error('Failed to parse system info:', error);
      }
    });

    return () => {
      // Clean up subscription
      // unsubscribeTopic('grill/system/info');
    };
  }, []);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save settings to AsyncStorage
    try {
      await AsyncStorage.setItem('smokerSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }

    // Save settings to Node-RED if applicable
    if (key !== 'serverAddress') {
      publishToMQTT('grill/settings/update', JSON.stringify({ [key]: value }));
    }
  };

  const saveServerSettings = async () => {
    try {
      // Save server address to AsyncStorage
      await AsyncStorage.setItem('serverAddress', settings.serverAddress);
      
      // Attempt to connect to the new server
      await connectToMQTT(settings.serverAddress);
      setIsConnected(true);
      
      // Subscribe to system info topic
      subscribeTopic('grill/system/info', (message) => {
        try {
          // Handle both string and object formats
          const info = typeof message === 'string' ? JSON.parse(message) : message;
          setDeviceInfo(info);
        } catch (error) {
          console.error('Failed to parse system info:', error);
        }
      });
      
      // Request system info
      publishToMQTT('grill/system/info/request', 'true');
      
      Alert.alert('Connection Successful', 'Connected to the smoker controller.');
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to the server. Please check the address and try again.');
      setIsConnected(false);
    }
  };

  const resetController = () => {
    Alert.alert(
      'Reset Controller',
      'Are you sure you want to reset the smoker controller? This will stop any active cooking session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            publishToMQTT('grill/system/reset', 'true');
            Alert.alert('Reset Initiated', 'The smoker controller is resetting.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Server Address</Text>
            <View style={styles.serverAddressContainer}>
              <TextInput
                style={styles.serverAddressInput}
                value={settings.serverAddress}
                onChangeText={(value) => updateSetting('serverAddress', value)}
                placeholder="ws://192.168.86.48:1880/ws"
                placeholderTextColor="#666"
              />
              <TouchableOpacity style={styles.saveButton} onPress={saveServerSettings}>
                <Text style={styles.saveButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto Connect on Start</Text>
            <Switch
              value={settings.autoConnect}
              onValueChange={(value) => updateSetting('autoConnect', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.autoConnect ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Temperature Alerts</Text>
            <Switch
              value={settings.tempAlerts}
              onValueChange={(value) => updateSetting('tempAlerts', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.tempAlerts ? '#fff' : '#f4f3f4'}
              disabled={!settings.notifications}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Lid Open Alerts</Text>
            <Switch
              value={settings.lidOpenAlerts}
              onValueChange={(value) => updateSetting('lidOpenAlerts', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.lidOpenAlerts ? '#fff' : '#f4f3f4'}
              disabled={!settings.notifications}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Hopper Alerts</Text>
            <Switch
              value={settings.hopperAlerts}
              onValueChange={(value) => updateSetting('hopperAlerts', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.hopperAlerts ? '#fff' : '#f4f3f4'}
              disabled={!settings.notifications}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Ash Bin Alerts</Text>
            <Switch
              value={settings.ashBinAlerts}
              onValueChange={(value) => updateSetting('ashBinAlerts', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.ashBinAlerts ? '#fff' : '#f4f3f4'}
              disabled={!settings.notifications}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Temperature Unit</Text>
            <View style={styles.tempUnitContainer}>
              <TouchableOpacity
                style={[styles.tempUnitButton, settings.tempUnit === 'F' && styles.tempUnitButtonActive]}
                onPress={() => updateSetting('tempUnit', 'F')}
              >
                <Text style={[styles.tempUnitText, settings.tempUnit === 'F' && styles.tempUnitTextActive]}>°F</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tempUnitButton, settings.tempUnit === 'C' && styles.tempUnitButtonActive]}
                onPress={() => updateSetting('tempUnit', 'C')}
              >
                <Text style={[styles.tempUnitText, settings.tempUnit === 'C' && styles.tempUnitTextActive]}>°C</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Debug Mode</Text>
            <Switch
              value={settings.debugMode}
              onValueChange={(value) => updateSetting('debugMode', value)}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={settings.debugMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Device Name</Text>
            <Text style={styles.infoValue}>{deviceInfo.deviceName}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Firmware Version</Text>
            <Text style={styles.infoValue}>{deviceInfo.firmwareVersion}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Uptime</Text>
            <Text style={styles.infoValue}>{deviceInfo.uptime}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System</Text>

          <TouchableOpacity style={styles.resetButton} onPress={resetController}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Reset Controller</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 14,
    color: '#ddd',
  },
  serverAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  serverAddressInput: {
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 8,
    color: '#fff',
    flex: 1,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tempUnitContainer: {
    flexDirection: 'row',
  },
  tempUnitButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  tempUnitButtonActive: {
    backgroundColor: '#4CAF50',
  },
  tempUnitText: {
    color: '#ddd',
    fontSize: 14,
  },
  tempUnitTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
