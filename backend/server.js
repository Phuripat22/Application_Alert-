// ไฟล์: server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// ================= NETPIE CONFIG =================
const NETPIE_CLIENT_ID = '474c906a-922b-469a-b4ee-34725ef2a35d';
const NETPIE_TOKEN = 'WAbG3GJ5Za1PvCxgDx7KtAavWRyzcL9P';

const AUTH_KEY = `${NETPIE_CLIENT_ID}:${NETPIE_TOKEN}`;
const NETPIE_URL = 'https://api.netpie.io/v2/device/shadow/data';

// ================= CACHE DATA =================
let latestSensorData = {
  current_speed: 0,
  critical_speed: 0,
  direction: "STRAIGHT",
  status: "SAFE"
};
// ================= FETCH FROM NETPIE =================
const fetchFromNetpie = async () => {
  try {

    const response = await axios.get(NETPIE_URL, {
      headers: {
        Authorization: `Device ${AUTH_KEY}`
      }
    });

    const data = response.data.data ? response.data.data : response.data;

    latestSensorData = {
      current_speed: data.current_speed || 0,
      critical_speed: data.critical_speed || 0,
      vx_kmh: data.vx_kmh || 0,
      vy_kmh: data.vy_kmh || 0,
      heading_deg: data.heading_deg || 0,
      direction: data.direction || "STRAIGHT",
      status: data.status || "SAFE"
    };

    console.log("✅ Update from NETPIE:");
    console.log(latestSensorData);

  } catch (error) {

    if (error.response) {
      console.error("❌ NETPIE ERROR:", error.response.status);
    } else {
      console.error("❌ CONNECTION ERROR:", error.message);
    }

  }
};

// ================= AUTO FETCH =================
setInterval(fetchFromNetpie, 2000);
fetchFromNetpie();

// ================= API =================
app.get('/api/sensor', (req, res) => {
  res.json(latestSensorData);
});

// ================= START SERVER =================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});