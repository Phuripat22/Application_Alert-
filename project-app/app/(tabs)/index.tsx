import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, Platform, StatusBar, Image, Animated, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Vibration } from 'react-native';

export default function App() {

  const [language, setLanguage] = useState("TH");

  const [sensorData, setSensorData] = useState({
    status: "SAFE",
    direction: "STRAIGHT",
    current_speed: 0,
    critical_speed: 0
  });

  const leftGlowAnim = useRef(new Animated.Value(0)).current;
  const straightGlowAnim = useRef(new Animated.Value(0)).current;
  const rightGlowAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null);

  // ================= FETCH BACKEND =================
  useEffect(() => {

    const fetchSensorData = async () => {
      try {
        const response = await fetch("http://192.xx.xxx/api/sensor");
        const data = await response.json();
        setSensorData(data);
      } catch (error) {
        console.log("Backend error:", error);
      }
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 1000);
    return () => clearInterval(interval);

  }, []);

  // ================= DIRECTION LIGHT =================
  useEffect(() => {

    const dir = sensorData?.direction || 'STRAIGHT';

    Animated.parallel([
      Animated.timing(leftGlowAnim, {
        toValue: dir === 'LEFT' ? 0.6 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(straightGlowAnim, {
        toValue: dir === 'STRAIGHT' ? 0.6 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rightGlowAnim, {
        toValue: dir === 'RIGHT' ? 0.6 : 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

  }, [sensorData?.direction]);

  const getStatusColor = (status) => {
    if (status === "--") return "#9E9E9E";
    if (status === 'SAFE') return '#4CAF50';
    if (status === 'RISKY' || status === 'RISK') return '#FFB300';
    if (status === 'DANGER' || status === 'SKIDDING' || status === 'DANGEROUS') return '#FF2020';
    return '#607D8B';
  };

  const getDisplayStatus = (status) => {

    if (language === "TH") {
      if (status === 'SAFE') return 'ปลอดภัย';
      if (status === 'DANGER' || status === 'SKIDDING' || status === 'DANGEROUS') return 'อันตราย';
      if (status === 'RISKY' || status === 'RISK') return 'เสี่ยง';
    }

    if (language === "EN") {
      if (status === 'SAFE') return 'SAFE';
      if (status === 'DANGER' || status === 'SKIDDING' || status === 'DANGEROUS') return 'DANGEROUS';
      if (status === 'RISKY' || status === 'RISK') return 'RISKY';
    }

    return status || '--';
  };

  // ================= STATUS ALERT =================
  useEffect(() => {

    const status = sensorData?.status;

    if (status === 'SAFE') {
      stopWarningSound();
      stopVibration();
    }

    if (status === 'RISKY' || status === 'RISK') {
      playWarningSound(false);
      startRiskVibration();
    }

    if (status === 'DANGER' || status === 'DANGEROUS' || status === 'SKIDDING') {
      playWarningSound(true);
      startDangerVibration();
    }

  }, [sensorData?.status]);

  const stopWarningSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log("Stop sound error:", error);
    }
  };

  const playWarningSound = async (isDanger = false) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/Alert.mp3'),
        { shouldPlay: true, isLooping: true }
      );

      soundRef.current = sound;

      if (isDanger) {
        await sound.setRateAsync(0.5, true);
      }

    } catch (error) {
      console.log("Sound error:", error);
    }
  };

  const startRiskVibration = () => {
    Vibration.vibrate([0, 300, 300], true);
  };

  const startDangerVibration = () => {
    Vibration.vibrate([0, 2000], true);
  };

  const stopVibration = () => {
    Vibration.cancel();
  };

  // ================= CRITICAL SPEED FONT SIZE =================
  const getCriticalSpeedFontSize = (criticalSpeed) => {
    if (criticalSpeed >= 100) return 17; // ลดลง 3 ขนาดจาก 20
    return 20;
  };

  const speed = sensorData?.current_speed || 0;
  const currentStatus = speed === 0 ? "SAFE" : sensorData?.status;
  const activeColor = getStatusColor(currentStatus);
  const inactiveColor = '#E0E0E0';

  const direction = sensorData?.direction || 'STRAIGHT';
  const leftColor = direction === 'LEFT' ? activeColor : inactiveColor;
  const straightColor = direction === 'STRAIGHT' ? activeColor : inactiveColor;
  const rightColor = direction === 'RIGHT' ? activeColor : inactiveColor;

  return (

    <SafeAreaView style={styles.container}>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 }}>
        <TouchableOpacity onPress={() => setLanguage("TH")} style={{ marginRight: 10 }}>
          <Text style={{ color: language === "TH" ? "#FFF" : "#AAA" }}>TH</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setLanguage("EN")}>
          <Text style={{ color: language === "EN" ? "#FFF" : "#AAA" }}>EN</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statusCard, { backgroundColor: activeColor }]}>
        <Text style={styles.statusValue}>{getDisplayStatus(currentStatus)}</Text>
      </View>

      <View style={styles.directionBox}>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: leftGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.2, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: straightGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.2 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { opacity: rightGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0.8, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.contentWrapper}>
          <View style={styles.arrowContainer}>
            <MaterialCommunityIcons name="arrow-top-left-thick" size={50} color={leftColor} />
            <MaterialCommunityIcons name="arrow-up-thick" size={50} color={straightColor} />
            <MaterialCommunityIcons name="arrow-top-right-thick" size={50} color={rightColor} />
          </View>
          <Image
            source={require('../../assets/images/rider.png')}
            style={styles.riderImage}
            resizeMode="contain"
          />
        </View>

      </View>

      <View style={styles.dataListCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={24} color="black" />
          <Text style={styles.cardTitle}>
            {language === "TH" ? "ความเร็วปัจจุบัน" : "Current Speed"}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dataText}>Current Speed:</Text>
          <Text style={[styles.dataValueHighlight, { color: activeColor }]}>
            {sensorData?.current_speed.toFixed(2)} km/h
          </Text>
        </View>
      </View>

      <View style={styles.dataListCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="source-branch" size={24} color="black" />
          <Text style={styles.cardTitle}>
            {language === "TH" ? "ความเร็ววิกฤต" : "Critical Speed"}
          </Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dataText}>Critical Speed:</Text>

          {/* ===== UPDATED: dynamic font size ===== */}
          <Text style={[
            styles.dataValueHighlight,
            {
              color: activeColor,
              fontSize: getCriticalSpeedFontSize(sensorData?.critical_speed)
            }
          ]}>
            {sensorData?.critical_speed.toFixed(2)} km/h
          </Text>
          {/* ======================================= */}

        </View>
      </View>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50,
  },

  statusCard: {
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 15,
  },

  statusValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  directionBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },

  contentWrapper: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  arrowContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },

  riderImage: {
    width: 150,
    height: 120,
  },

  dataListCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },

  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dataText: {
    fontSize: 16,
    color: '#555',
  },

  dataValueHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
  },

});