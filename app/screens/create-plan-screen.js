import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { publishToMQTT } from '../services/mqtt-service';

export default function CreatePlanScreen({ navigation }) {
  const [planName, setPlanName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState({
    preheat: false,
    coldSmoke: false,
    smoke: true,
    hold: false,
  });

  const [settings, setSettings] = useState({
    preheatTemp: 225,
    preheatTimeout: 30,
    coldSmokeGrill: 180,
    coldSmokeProbe: 110,
    coldSmokeDuration: 2,
    smokeGrill: 225,
    smokeProbe: 165,
    smokeDuration: 4,
    holdGrill: 160,
    holdProbe: 190,
    holdDuration: 2,
  });

  const toggleStage = (stage) => {
    if (stage === 'preheat' && !stages.preheat) {
      setStages({ ...stages, preheat: true, coldSmoke: false });
    } else if (stage === 'coldSmoke' && !stages.coldSmoke) {
      setStages({ ...stages, coldSmoke: true, preheat: false });
    } else {
      setStages({ ...stages, [stage]: !stages[stage] });
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const savePlan = () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }

    if (!stages.preheat && !stages.coldSmoke && !stages.smoke && !stages.hold) {
      Alert.alert('Error', 'Please select at least one stage');
      return;
    }

    const plan = {
      name: planName,
      description,
      stages,
      settings,
      createdAt: new Date().toISOString(),
    };

    // Send to Node-RED
    publishToMQTT('grill/plans/save', JSON.stringify(plan));

    Alert.alert('Success', 'Your smoke plan has been saved!', [
      {
        text: 'Start Now',
        onPress: () => {
          publishToMQTT('grill/plans/start', JSON.stringify(plan));
          navigation.navigate('Dashboard');
        },
      },
      {
        text: 'Save Only',
        onPress: () => navigation.navigate('Dashboard'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Smoke Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formSection}>
          <Text style={styles.label}>Plan Name</Text>
          <TextInput
            style={styles.input}
            value={planName}
            onChangeText={setPlanName}
            placeholder="Enter plan name"
            placeholderTextColor="#666"
          />

          <Text style={styles.label}>What's Cooking?</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you're smoking"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.stagesSection}>
          <Text style={styles.sectionTitle}>Plan Stages</Text>

          <View style={styles.stageRow}>
            <View style={styles.stageInfo}>
              <Ionicons name="flame" size={24} color="#e74c3c" />
              <Text style={styles.stageLabel}>Pre-Heat</Text>
            </View>
            <Switch
              value={stages.preheat}
              onValueChange={() => toggleStage('preheat')}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={stages.preheat ? '#fff' : '#f4f3f4'}
            />
          </View>

          {stages.preheat && (
            <View style={styles.stageSettings}>
              <Text style={styles.settingLabel}>Target Temperature (°F)</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={150}
                  maximumValue={500}
                  step={5}
                  value={settings.preheatTemp}
                  onValueChange={(value) => updateSetting('preheatTemp', value)}
                  minimumTrackTintColor="#e74c3c"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#e74c3c"
                />
                <Text style={styles.sliderValue}>{settings.preheatTemp}°F</Text>
              </View>

              <Text style={styles.settingLabel}>Timeout (minutes)</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={5}
                  maximumValue={60}
                  step={5}
                  value={settings.preheatTimeout}
                  onValueChange={(value) => updateSetting('preheatTimeout', value)}
                  minimumTrackTintColor="#e74c3c"
                  maximumTrackTintColor="#333"
                  thumbTintColor="#e74c3c"
                />
                <Text style={styles.sliderValue}>{settings.preheatTimeout} min</Text>
              </View>
            </View>
          )}

          {/* Add similar sections for coldSmoke, smoke, and hold stages */}
          {/* For brevity, I'm only showing the preheat stage here */}
          
          <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
            <Text style={styles.saveButtonText}>Save Smoke Plan</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 4,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  stagesSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  stageSettings: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#252525',
    borderRadius: 4,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 70,
    textAlign: 'right',
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
