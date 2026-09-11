// ========================================================
// FluentUp - Audio Device Detection & Routing Service
// ========================================================
// Yeh service phone me wired earphones aur Bluetooth neckband / earbuds
// ko dynamically detect karti hai:
// 1. Agar earphone/neckband connect ho -> Earphone option enable karti hai aur audio+mic route karti hai.
// 2. Agar disconnect ho -> Sirf Speaker vs Earpiece available rakhti hai.
// 3. Bluetooth SCO / Wired Mic ko hardware level par set karti hai.
// ========================================================

import { Platform } from 'react-native';

// Dynamic import of native ExponentAV helper from expo-av
let ExponentAV: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExponentAV = require('expo-av/build/ExponentAV').default;
} catch (e) {
  console.warn('Notice: ExponentAV native audio module not loaded:', e);
}

let webrtcModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  webrtcModule = require('react-native-webrtc');
} catch (e) {}

export interface ConnectedAudioDevice {
  name: string;
  type: string;
  uid: string;
}

export interface AudioDeviceStatus {
  hasHeadset: boolean;
  headsetName: string | null;
  headsetUid: string | null;
  isBluetooth: boolean;
  isWired: boolean;
  devices: ConnectedAudioDevice[];
}

/**
 * Live audio hardware inputs inspect karta hai:
 * Checks both WebRTC mediaDevices and Expo-AV ExponentAV
 * Returns: whether a wired or wireless earphone/neckband is currently connected.
 */
export async function detectAudioDevices(): Promise<AudioDeviceStatus> {
  if (Platform.OS === 'web') {
    return {
      hasHeadset: false,
      headsetName: null,
      headsetUid: null,
      isBluetooth: false,
      isWired: false,
      devices: [],
    };
  }

  let inputs: ConnectedAudioDevice[] = [];

  // 1. Check native WebRTC enumerateDevices (Most accurate on Android & iOS in React Native)
  if (webrtcModule && webrtcModule.mediaDevices && typeof webrtcModule.mediaDevices.enumerateDevices === 'function') {
    try {
      const devices = await webrtcModule.mediaDevices.enumerateDevices();
      if (Array.isArray(devices)) {
        for (const d of devices) {
          if (d.kind === 'audioinput' || d.kind === 'audiooutput') {
            inputs.push({
              name: d.label || d.deviceId || 'Audio Device',
              type: d.kind,
              uid: d.deviceId || '',
            });
          }
        }
      }
    } catch (webrtcErr) {
      // ignore
    }
  }

  // 2. Check native ExponentAV getAvailableInputs
  if (ExponentAV && typeof ExponentAV.getAvailableInputs === 'function') {
    try {
      const avInputs: ConnectedAudioDevice[] = (await ExponentAV.getAvailableInputs()) || [];
      if (Array.isArray(avInputs) && avInputs.length > 0) {
        inputs = [...inputs, ...avInputs];
      }
    } catch (avErr) {
      // ignore
    }
  }

  try {
    // Check for Bluetooth Neckband / Earbuds / Headset
    const bluetoothDevice = inputs.find((d) => {
      const type = (d.type || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return (
        type.includes('bluetooth') ||
        type.includes('sco') ||
        name.includes('bluetooth') ||
        name.includes('neckband') ||
        name.includes('buds') ||
        name.includes('airpod') ||
        name.includes('boat') ||
        name.includes('oneplus') ||
        name.includes('realme') ||
        name.includes('noise') ||
        name.includes('wireless')
      );
    });

    // Check for Wired 3.5mm or USB-C Headset
    const wiredDevice = inputs.find((d) => {
      const type = (d.type || '').toLowerCase();
      const name = (d.name || '').toLowerCase();
      return (
        type === 'microphonewired' ||
        type.includes('wired') ||
        type.includes('headset') ||
        name.includes('headset') ||
        name.includes('earphone') ||
        name.includes('headphone') ||
        name.includes('wired')
      );
    });

    const activeHeadset = bluetoothDevice || wiredDevice;

    return {
      hasHeadset: !!activeHeadset,
      headsetName: activeHeadset ? activeHeadset.name : null,
      headsetUid: activeHeadset ? activeHeadset.uid : null,
      isBluetooth: !!bluetoothDevice,
      isWired: !!wiredDevice && !bluetoothDevice,
      devices: inputs,
    };
  } catch (err: any) {
    console.warn('Could not inspect audio devices:', err?.message || err);
    return {
      hasHeadset: false,
      headsetName: null,
      headsetUid: null,
      isBluetooth: false,
      isWired: false,
      devices: [],
    };
  }
}

/**
 * Preferred hardware recording input set karta hai (e.g. Earphone mic / Bluetooth SCO mic)
 */
export async function setPreferredAudioInput(uid: string): Promise<boolean> {
  if (Platform.OS === 'web' || !ExponentAV || typeof ExponentAV.setInput !== 'function') {
    return false;
  }

  try {
    await ExponentAV.setInput(uid);
    console.log(`🎙️ Hardware mic routed to device UID: ${uid}`);
    return true;
  } catch (err: any) {
    console.warn('Could not set preferred audio input:', err?.message || err);
    return false;
  }
}
