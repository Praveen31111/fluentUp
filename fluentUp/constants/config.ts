// ========================================================
// FluentUp - Mobile App Configuration & Server Endpoints
// ========================================================
// Yeh file mobile app ke liye backend API aur WebSocket endpoints
// configure karti hai.
// ========================================================

import { Platform } from 'react-native';

// Local Wi-Fi IP address (physical Android/iOS phone testing ke liye)
// Agar aap phone par Expo Go use kar rahe hain toh yeh IP address
// aapke phone ko aapke computer ke server se connect karega.
const DEV_MACHINE_IP = '10.212.115.138';

// Android Emulator: 10.0.2.2 points to host machine localhost
// Physical Device: DEV_MACHINE_IP
// Web: localhost
export const API_BASE_URL = Platform.select({
  android: `http://${DEV_MACHINE_IP}:3000/api`,
  ios: `http://${DEV_MACHINE_IP}:3000/api`,
  default: 'http://localhost:3000/api',
});

// WebSocket Server URL (Signaling Gateway)
export const WS_BASE_URL = Platform.select({
  android: `http://${DEV_MACHINE_IP}:3000`,
  ios: `http://${DEV_MACHINE_IP}:3000`,
  default: 'http://localhost:3000',
});
