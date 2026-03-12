// ไฟล์: server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------------------------------------ผผ
// ⚠️ ส่วนสำคัญ: ตั้งค่า Netpie V2 ตรงนี้
// 1. ไปก๊อปปี้ Client ID จากหน้า Device บนเว็บ Netpie มาใส่ตรงนี้
const NETPIE_CLIENT_ID = '474c906a-922b-469a-b4ee-34725ef2a35d'; 

// 2. Token ของคุณ (อันเดิมที่ก๊อปมา)
const NETPIE_TOKEN = 'WAbG3GJ5Za1PvCxgDx7KtAavWRyzcL9P'; 

// ระบบจะเอามาต่อกันเป็นรูปร่าง Client_ID:Token ให้อัตโนมัติ
const AUTH_KEY = `${NETPIE_CLIENT_ID}:${NETPIE_TOKEN}`;
const NETPIE_URL = 'https://api.netpie.io/v2/device/shadow/data';
// ---------------------------------------------------------

// ตัวแปรสำหรับเก็บข้อมูลล่าสุด (Cache) 
// 🔄 อัปเดต: เปลี่ยนชื่อคีย์ให้ตรงกับ Arduino Payload
let latestSensorData = {
  current_speed: 0,
  critical_speed: 0,
  status: "SAFE",
  dir: "CENTER",
  radius: 0
};

// --- LOGIC: Backend ไปดึงข้อมูลจาก Netpie ---
const fetchFromNetpie = async () => {
  try {
    const response = await axios.get(NETPIE_URL, {
      headers: {
        // ใช้รูปแบบ Device ตามด้วย Client_ID:Token
        'Authorization': `Device ${AUTH_KEY}`
      }
    });

    // Netpie ส่งข้อมูลมาในก้อน data แกะเอาไปอัปเดตตัวแปร latestSensorData
    const data = response.data.data ? response.data.data : response.data;

    // 🔄 อัปเดต: ดึงข้อมูลจากคีย์ใหม่ที่มาจาก NETPIE
    latestSensorData = {
      current_speed: data.current_speed || 0,
      critical_speed: data.critical_speed || 0,
      status: data.status || "SAFE",
      dir: data.dir || "CENTER",
      radius: data.radius || 0
    };

    console.log("✅ อัปเดตข้อมูลจาก Netpie สำเร็จ:", latestSensorData);

  } catch (error) {
    // โชว์ Error แบบเจาะจง จะได้รู้ง่ายขึ้น
    if (error.response) {
      console.error(`❌ Error จาก Netpie: Status Code ${error.response.status} - ตรวจสอบ Client ID และ Token อีกครั้ง`);
    } else {
      console.error("❌ Error การเชื่อมต่อ:", error.message);
    }
  }
};

// สั่งให้ดึงข้อมูลจาก Netpie อัตโนมัติทุกๆ 2 วินาที
setInterval(fetchFromNetpie, 2000);
// ดึงครั้งแรกตอนเปิด Server
fetchFromNetpie();

// --- API Endpoint: ให้แอป React Native มาเรียกใช้ ---
app.get('/api/sensor', (req, res) => {
  res.json(latestSensorData); // ส่งข้อมูลที่เก็บไว้ออกไปให้แอป
});

// เริ่มรัน Server ที่ Port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend Server กำลังรันที่ http://localhost:${PORT}`);
});