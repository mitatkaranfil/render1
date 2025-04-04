import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useMiningStore } from '../store/miningStore';
import { recordAdView, recordLevelUpgradeAd } from '../services/api';
import AdService from '../services/adService';

// Components
import Loader from '../components/ui/Loader';
import AdPlayer from '../components/ads/AdPlayer';
import MiningStatus from '../components/mining/MiningStatus';
import LevelUpgrade from '../components/mining/LevelUpgrade';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { 
    isActive, 
    miningTimeRemaining, 
    miningLevel, 
    dailyMiningTimeUsed,
    levelUpgradeAdsWatched,
    dailyLevelUpgrades,
    isLoading,
    error,
    fetchMiningStatus,
    startMiningSession,
    stopMiningSession,
    resetError
  } = useMiningStore();
  
  const [adVisible, setAdVisible] = useState(false);
  const [adType, setAdType] = useState('mining'); // 'mining' or 'upgrade'
  const [notification, setNotification] = useState(null);
  
  // Fetch mining status on component mount
  useEffect(() => {
    fetchMiningStatus();
    
    // Initialize ad service
    AdService.init();
    
    // Polling for mining status updates
    const intervalId = setInterval(() => {
      if (!adVisible) {
        fetchMiningStatus();
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchMiningStatus, adVisible]);
  
  // Show notification
  const showNotification = (message, type = 'info', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };
  
  // Handle ad completion for mining time
  const handleWatchAdForMining = async () => {
    try {
      // Check daily limit
      if (dailyMiningTimeUsed >= 24) {
        showNotification('Daily mining time limit reached (24 hours)', 'error');
        return;
      }
      
      setAdType('mining');
      
      // Load ad
      await AdService.loadAd();
      setAdVisible(true);
    } catch (error) {
      console.error('Error loading ad:', error);
      showNotification('Error loading advertisement', 'error');
    }
  };
  
  // Handle ad completion for level upgrade
  const handleWatchAdForLevelUpgrade = async () => {
    try {
      // Check max level
      if (miningLevel >= 1000) {
        showNotification('Maximum mining level reached (1000)', 'error');
        return;
      }
      
      // Check daily upgrade limit
      if (dailyLevelUpgrades >= 3) {
        showNotification('Daily level upgrade limit reached (3 upgrades)', 'error');
        return;
      }
      
      setAdType('upgrade');
      
      // Load ad
      await AdService.loadAd();
      setAdVisible(true);
    } catch (error) {
      console.error('Error loading ad:', error);
      showNotification('Error loading advertisement', 'error');
    }
  };
  
  // Handle ad completion
  const handleAdCompleted = async ({ type, ad, secondsWatched }) => {
    setAdVisible(false);
    
    if (secondsWatched < 15) {
      showNotification('You need to watch the ad for at least 15 seconds', 'error');
      return;
    }
    
    try {
      if (adType === 'mining') {
        // Record ad view for mining time
        const result = await recordAdView({
          adId: ad.id,
          duration: secondsWatched
        });
        
        if (result.success) {
          showNotification('Successfully added 1 hour of mining time!', 'success');
          fetchMiningStatus();
        } else {
          showNotification(result.message || 'Failed to add mining time', 'error');
        }
      } else if (adType === 'upgrade') {
        // Record ad view for level upgrade
        const result = await recordLevelUpgradeAd({
          adId: ad.id,
          duration: secondsWatched
        });
        
        if (result.success) {
          if (result.levelData.levelUpgraded) {
            showNotification(`Congratulations! Mining level upgraded to ${result.levelData.miningLevel}!`, 'success');
          } else {
            showNotification(`Progress: ${result.levelData.levelUpgradeAdsWatched}/10 ads for next level`, 'success');
          }
          fetchMiningStatus();
        } else {
          showNotification(result.message || 'Failed to progress level upgrade', 'error');
        }
      }
    } catch (error) {
      console.error('Error processing ad completion:', error);
      showNotification('Error processing ad completion', 'error');
    }
  };
  
  // Handle ad skipped
  const handleAdSkipped = ({ secondsWatched }) => {
    setAdVisible(false);
    
    if (secondsWatched < 15) {
      showNotification('You need to watch the ad for at least 15 seconds', 'error');
    } else {
      showNotification('Ad skipped but time will be counted', 'info');
      handleAdCompleted({ type: 'skipped', ad: AdService.getCurrentAd(), secondsWatched });
    }
  };
  
  // Handle start/stop mining
  const toggleMining = async () => {
    if (isActive) {
      const result = await stopMiningSession();
      if (result) {
        showNotification(`Mining stopped. You earned ${result.miningReward.toFixed(6)} coins!`, 'success');
      }
    } else {
      if (miningTimeRemaining <= 0) {
        showNotification('You need to watch ads to get mining time', 'error');
        return;
      }
      
      const started = await startMiningSession();
      if (started) {
        showNotification('Mining started!', 'success');
      }
    }
  };
  
  if (isLoading && !adVisible) {
    return <Loader fullScreen message="Loading mining data..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* User welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome, {user?.firstName || 'Miner'}!</h1>
        <p className="text-gray-300">Start mining cryptocurrency today</p>
      </div>
      
      {/* Error notification */}
      {error && (
        <div className="bg-error/20 border border-error/50 rounded-lg p-3 mb-4 flex justify-between items-center">
          <p className="text-white text-sm">{error}</p>
          <button onClick={resetError} className="text-white">✕</button>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`rounded-lg p-3 mb-4 text-white ${
          notification.type === 'success' ? 'bg-success/20 border border-success/50' : 
          notification.type === 'error' ? 'bg-error/20 border border-error/50' : 
          'bg-primary/20 border border-primary/50'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Main content */}
      <div className="space-y-6">
        {/* Mining status */}
        <MiningStatus 
          isActive={isActive}
          miningTimeRemaining={miningTimeRemaining}
          miningLevel={miningLevel}
          dailyMiningTimeUsed={dailyMiningTimeUsed}
          onToggleMining={toggleMining}
        />
        
        {/* Level upgrade */}
        <LevelUpgrade 
          miningLevel={miningLevel}
          levelUpgradeAdsWatched={levelUpgradeAdsWatched}
          dailyLevelUpgrades={dailyLevelUpgrades}
          onWatchAd={handleWatchAdForLevelUpgrade}
        />
        
        {/* Actions */}
        <div className="card flex justify-center">
          <button
            className="btn-primary w-full text-lg"
            onClick={handleWatchAdForMining}
            disabled={dailyMiningTimeUsed >= 24}
          >
            Watch Ad to Get Mining Time
          </button>
        </div>
        
        {/* Daily limit info */}
        <div className="bg-dark-light rounded-lg p-3">
          <p className="text-sm text-center text-gray-300">
            Daily mining limit: {dailyMiningTimeUsed}/24 hours
          </p>
        </div>
      </div>
      
      {/* Ad player modal */}
      {adVisible && (
        <AdPlayer
          onComplete={handleAdCompleted}
          onSkip={handleAdSkipped}
          adService={AdService}
        />
      )}
    </div>
  );
};

export default Dashboard; 