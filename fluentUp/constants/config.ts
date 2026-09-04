// ========================================================
// FluentUp - Mobile App Configuration & Server Endpoints
// ========================================================
// Yeh file mobile app ke liye backend API aur WebSocket endpoints
// configure karti hai.
// ========================================================

import { Platform } from 'react-native';

// Production Cloud Backend (Render.com)
const CLOUD_BACKEND_URL = 'https://fluentup-backend.onrender.com';

// Local Wi-Fi IP address (physical Android/iOS phone testing ke liye)
const DEV_MACHINE_IP = '10.212.115.138';

// Set to true agar local machine server se test karna ho, false for live cloud backend
const USE_LOCAL_SERVER = false;

const BASE_SERVER_URL = USE_LOCAL_SERVER ? `http://${DEV_MACHINE_IP}:3000` : CLOUD_BACKEND_URL;

// HTTP API Base URL
export const API_BASE_URL = `${BASE_SERVER_URL}/api`;

// WebSocket Server URL (Signaling Gateway)
export const WS_BASE_URL = BASE_SERVER_URL;

