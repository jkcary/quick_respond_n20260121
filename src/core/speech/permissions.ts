/**
 * Microphone permission handling
 * Cross-platform support for Web/Electron/Capacitor
 */

export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  PROMPT = 'prompt',
  UNKNOWN = 'unknown',
}

export interface PermissionResult {
  status: PermissionStatus;
  error?: string;
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<PermissionResult> {
  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        status: PermissionStatus.DENIED,
        error: 'Microphone access not supported in this browser',
      };
    }

    // Request permission by accessing the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop all tracks immediately (we just needed permission)
    stream.getTracks().forEach((track) => track.stop());

    return {
      status: PermissionStatus.GRANTED,
    };
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return {
          status: PermissionStatus.DENIED,
          error: 'Microphone permission denied by user',
        };
      }
      if (error.name === 'NotFoundError') {
        return {
          status: PermissionStatus.DENIED,
          error: 'No microphone device found',
        };
      }
    }

    return {
      status: PermissionStatus.DENIED,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check current microphone permission status
 * Note: Not all browsers support the Permissions API
 */
export async function checkMicrophonePermission(): Promise<PermissionStatus> {
  try {
    // Try using Permissions API if available
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as PermissionStatus;
    }

    // Fallback: return UNKNOWN if Permissions API not available
    return PermissionStatus.UNKNOWN;
  } catch {
    return PermissionStatus.UNKNOWN;
  }
}

/**
 * Check if Web Speech API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return (
    'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window
  );
}

/**
 * Check if Speech Synthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Check if microphone is available
 */
export async function isMicrophoneAvailable(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'audioinput');
  } catch {
    return false;
  }
}
