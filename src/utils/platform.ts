/**
 * Platform detection and capability checking
 */

import type { PlatformCapabilities } from '@/types';
import { Platform } from '@/types';
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '@/core/speech';

/**
 * Detect current platform
 */
export function getPlatform(): Platform {
  // Check for Electron
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return Platform.Electron;
  }

  // Check for Capacitor
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const capacitor = (window as any).Capacitor;

    if (capacitor.getPlatform() === 'android') {
      return Platform.Android;
    }

    if (capacitor.getPlatform() === 'ios') {
      return Platform.iOS;
    }
  }

  // Default to web
  return Platform.Web;
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return getPlatform() === Platform.Electron;
}

/**
 * Check if running in Capacitor (Android/iOS)
 */
export function isCapacitor(): boolean {
  const platform = getPlatform();
  return platform === Platform.Android || platform === Platform.iOS;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === Platform.Android;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === Platform.iOS;
}

/**
 * Check if running in a browser (Web)
 */
export function isWeb(): boolean {
  return getPlatform() === Platform.Web;
}

/**
 * Check if microphone access is supported
 */
export function hasMicrophoneSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia
  );
}

/**
 * Get platform capabilities
 */
export function getPlatformCapabilities(): PlatformCapabilities {
  const platform = getPlatform();

  return {
    platform,
    hasFileSystem: platform === Platform.Electron,
    hasNativeMenus: platform === Platform.Electron,
    requiresMicPermission: platform === Platform.Android || platform === Platform.iOS || platform === Platform.Web,
    hasSpeechRecognition: isSpeechRecognitionSupported(),
    hasTextToSpeech: isSpeechSynthesisSupported(),
  };
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  const platform = getPlatform();
  return platform === Platform.Android || platform === Platform.iOS;
}

/**
 * Check if running on desktop
 */
export function isDesktop(): boolean {
  const platform = getPlatform();
  return platform === Platform.Electron || platform === Platform.Web;
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : '';
}

/**
 * Check if browser supports Web Workers
 */
export function hasWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * Check if browser supports Service Workers
 */
export function hasServiceWorkers(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Check if browser supports IndexedDB
 */
export function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Check if browser supports LocalStorage
 */
export function hasLocalStorage(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Get app version from environment or package.json
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
}
