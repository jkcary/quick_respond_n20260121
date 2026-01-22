/**
 * Platform detection and capability checking
 */

import type { Platform, PlatformCapabilities } from '@/types';
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
    return 'electron';
  }

  // Check for Capacitor
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const capacitor = (window as any).Capacitor;

    if (capacitor.getPlatform() === 'android') {
      return 'android';
    }

    if (capacitor.getPlatform() === 'ios') {
      return 'ios';
    }
  }

  // Default to web
  return 'web';
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return getPlatform() === 'electron';
}

/**
 * Check if running in Capacitor (Android/iOS)
 */
export function isCapacitor(): boolean {
  const platform = getPlatform();
  return platform === 'android' || platform === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

/**
 * Check if running in a browser (Web)
 */
export function isWeb(): boolean {
  return getPlatform() === 'web';
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
    hasFileSystem: platform === 'electron',
    hasNativeMenus: platform === 'electron',
    requiresMicPermission: platform === 'android' || platform === 'ios' || platform === 'web',
    hasSpeechRecognition: isSpeechRecognitionSupported(),
    hasTextToSpeech: isSpeechSynthesisSupported(),
  };
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  const platform = getPlatform();
  return platform === 'android' || platform === 'ios';
}

/**
 * Check if running on desktop
 */
export function isDesktop(): boolean {
  const platform = getPlatform();
  return platform === 'electron' || platform === 'web';
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
