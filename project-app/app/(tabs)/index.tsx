import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, Platform, StatusBar, Image, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  const [sensorData, setSensorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // ⚠️ เปลี่ยนเป็น IP Address เครื่องคอมพิวเตอร์ของคุณ
  const API_URL = 'http://192.168.1.107:3000/api/sensor';

  // แอนิเมชันสำหรับแสง 3 ทิศทาง
  const leftGlowAnim = useRef(new Animated.Value(0)).current;
  const straightGlowAnim = useRef(new Animated.Value(0)).current;
  const rightGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const json = await response.json();
        setSensorData(json);
        setErrorMessage(null);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("ไม่สามารถดึงข้อมูลจาก Backend ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, []);

  // Effect สำหรับควบคุมการเด้งของแสงตามทิศทาง
  useEffect(() => {
    const dir = sensorData?.dir || 'STRAIGHT';
    
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
  }, [sensorData?.dir]);

  // ฟังก์ชันดึงสีหลักตามสถานะ (ปรับสีแดงให้สดขึ้น และดักจับคำว่า DANGEROUS)
  const getStatusColor = (status) => {
    if (status === 'SAFE') return '#4CAF50';                         // สีเขียว
    if (status === 'RISKY' || status === 'RISK') return '#FFB300';   // สีเหลือง/ส้ม
    if (status === 'SKIDDING' || status === 'DANGEROUS') return '#FF2020'; // สีแดงสด
    return '#607D8B';                                                // สีเทา (ค่าเริ่มต้น)
  };

  // ฟังก์ชันแปลงข้อความสถานะให้แสดงผลบน UI
  const getDisplayStatus = (status) => {
    if (status === 'SAFE') return 'ปลอดภัย';
    if (status === 'SKIDDING' || status === 'DANGEROUS') return 'อันตราย';
    if (status === 'RISKY' || status === 'RISK') return 'เสี่ยง';
    return status || '--';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: '#FFF' }}>กำลังเชื่อมต่อ Backend...</Text>
      </View>
    );
  }

  if (errorMessage && !sensorData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#FF2020', fontSize: 18, fontWeight: 'bold' }}>⚠️ เกิดข้อผิดพลาด</Text>
        <Text style={{ marginTop: 10, color: '#FFF' }}>{errorMessage}</Text>
      </View>
    );
  }

  const currentStatus = sensorData?.status;
  const activeColor = getStatusColor(currentStatus);
  const inactiveColor = '#E0E0E0'; 
  const direction = sensorData?.dir || 'STRAIGHT';

  // กำหนดสีของลูกศร
  const leftColor = direction === 'LEFT' ? activeColor : inactiveColor;
  const straightColor = direction === 'STRAIGHT' ? activeColor : inactiveColor;
  const rightColor = direction === 'RIGHT' ? activeColor : inactiveColor;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. การ์ดแสดงสถานะหลัก */}
      <View style={[styles.statusCard, { backgroundColor: activeColor }]}>
        <Text style={styles.statusValue}>{getDisplayStatus(currentStatus)}</Text>
      </View>

      {/* 2. กล่องตรงกลาง (ลูกศรทิศทาง + รูปรถ + แสงไล่ระดับตามทิศทาง) */}
      <View style={styles.directionBox}>
        
        {/* --- แสงไล่ระดับฝั่งซ้าย --- */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: leftGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.2, y: 0.5 }} 
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* --- แสงไล่ระดับฝั่งบน --- */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: straightGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.2 }} 
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* --- แสงไล่ระดับฝั่งขวา --- */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: rightGlowAnim }]}>
          <LinearGradient
            colors={[activeColor, 'rgba(255,255,255,0)']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0.8, y: 0.5 }} 
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* เนื้อหาข้างใน (ลูกศร + รถ) */}
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

      {/* 3. กล่อง Current Speed */}
      <View style={styles.dataListCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={24} color="black" />
          <Text style={styles.cardTitle}>Current Speed</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dataText}>ความเร็วปัจจุบัน:</Text>
          <Text style={[styles.dataValueHighlight, { color: activeColor }]}>
            {sensorData?.current_speed ?? "-"} km/h
          </Text>
        </View>
      </View>

      {/* 4. กล่อง Critical Speed */}
      <View style={styles.dataListCard}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="source-branch" size={24} color="black" />
          <Text style={styles.cardTitle}>Critical Speed</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dataText}>ความเร็วที่ปลอดภัย:</Text>
          <Text style={[styles.dataValueHighlight, { color: activeColor }]}>
            {sensorData?.critical_speed ?? "-"} km/h
          </Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
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
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10, 
  },
  arrowContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  riderImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
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
    color: '#000',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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