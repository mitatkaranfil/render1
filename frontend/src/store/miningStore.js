import { create } from 'zustand';
import { getMiningStatus, startMining, stopMining } from '../services/api';

export const useMiningStore = create((set, get) => ({
  isActive: false,
  miningTimeRemaining: 0,
  sessionStartTime: null,
  miningLevel: 1,
  dailyMiningTimeUsed: 0,
  levelUpgradeAdsWatched: 0,
  dailyLevelUpgrades: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  
  // Fetch mining status
  fetchMiningStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await getMiningStatus();
      
      if (response.success && response.miningStatus) {
        set({
          isActive: response.miningStatus.isActive,
          miningTimeRemaining: response.miningStatus.miningTimeRemaining,
          sessionStartTime: response.miningStatus.sessionStartTime,
          miningLevel: response.miningStatus.miningLevel,
          dailyMiningTimeUsed: response.miningStatus.dailyMiningTimeUsed,
          levelUpgradeAdsWatched: response.miningStatus.levelUpgradeAdsWatched,
          dailyLevelUpgrades: response.miningStatus.dailyLevelUpgrades,
          lastUpdated: new Date().toISOString()
        });
      } else {
        set({ error: response.message || 'Failed to fetch mining status' });
      }
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Start mining session
  startMiningSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await startMining();
      
      if (response.success && response.miningSession) {
        set({
          isActive: true,
          sessionStartTime: response.miningSession.startTime,
          miningTimeRemaining: response.miningSession.miningTimeRemaining,
          lastUpdated: new Date().toISOString()
        });
        return true;
      } else {
        set({ error: response.message || 'Failed to start mining session' });
        return false;
      }
    } catch (error) {
      set({ error: error.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Stop mining session
  stopMiningSession: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await stopMining();
      
      if (response.success && response.miningResult) {
        set({
          isActive: false,
          sessionStartTime: null,
          miningTimeRemaining: response.miningResult.remainingMiningTime,
          lastUpdated: new Date().toISOString()
        });
        return response.miningResult;
      } else {
        set({ error: response.message || 'Failed to stop mining session' });
        return null;
      }
    } catch (error) {
      set({ error: error.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Update mining time
  updateMiningTime: (newTime) => set({ miningTimeRemaining: newTime }),
  
  // Update mining level
  updateMiningLevel: (newLevel) => set({ miningLevel: newLevel }),
  
  // Update level upgrade progress
  updateLevelUpgradeProgress: (adsWatched, dailyUpgrades) => set({
    levelUpgradeAdsWatched: adsWatched,
    dailyLevelUpgrades: dailyUpgrades
  }),
  
  // Update daily mining time used
  updateDailyMiningTimeUsed: (timeUsed) => set({ dailyMiningTimeUsed: timeUsed }),
  
  // Reset error
  resetError: () => set({ error: null })
})); 