/**
 * Electron Preload Script
 * Exposes safe IPC methods to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposed API for renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Load vocabulary data from local filesystem
   */
  loadVocabulary: (filePath: string) => {
    return ipcRenderer.invoke('load-vocabulary', filePath);
  },

  /**
   * Save user data to local filesystem
   */
  saveUserData: (key: string, data: any) => {
    return ipcRenderer.invoke('save-user-data', key, data);
  },

  /**
   * Load user data from local filesystem
   */
  loadUserData: (key: string) => {
    return ipcRenderer.invoke('load-user-data', key);
  },

  /**
   * Listen for navigation events from main process
   */
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  /**
   * Listen for show-about events
   */
  onShowAbout: (callback: () => void) => {
    ipcRenderer.on('show-about', () => callback());
  },

  /**
   * Get platform information
   */
  getPlatform: () => {
    return process.platform;
  },
});

/**
 * TypeScript declaration for window.electronAPI
 * Add this to a .d.ts file in your src/types folder
 */
declare global {
  interface Window {
    electronAPI: {
      loadVocabulary: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      saveUserData: (key: string, data: any) => Promise<{ success: boolean; error?: string }>;
      loadUserData: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
      onNavigate: (callback: (path: string) => void) => void;
      onShowAbout: (callback: () => void) => void;
      getPlatform: () => string;
    };
  }
}
