import React, { useState, useEffect, useCallback } from 'react';
import { 
  getMiningStatus, 
  startMining, 
  stopMining, 
  collectReward, 
  upgradeLevel,
  watchAdvertisement
} from '../services/api';
import Loader from '../components/ui/Loader';
import Ad from '../components/mining/Ad';
import { formatDuration, formatNumber } from '../utils/formatting';

const Mining = () => {
  const [miningStatus, setMiningStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdWatching, setIsAdWatching] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  // Fetch mining status function
  const fetchMiningStatus = useCallback(async () => {
    try {
      const response = await getMiningStatus();
      
      if (response.success) {
        setMiningStatus(response.miningStatus);
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Error fetching mining status');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch mining status on component mount
  useEffect(() => {
    fetchMiningStatus();
    
    const intervalId = setInterval(fetchMiningStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchMiningStatus]);

  // Handle ad watching
  const handleWatchAd = () => {
    setIsAdWatching(true);
  };
  
  const handleAdComplete = async () => {
    try {
      const response = await watchAdvertisement();
      
      if (response.success) {
        // Start mining after successful ad watch
        const miningResponse = await startMining();
        if (miningResponse.success) {
          await fetchMiningStatus();
        } else {
          setError(miningResponse.message);
        }
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Error processing advertisement');
      console.error(error);
    } finally {
      setIsAdWatching(false);
    }
  };
  
  const handleAdError = (err) => {
    setError('Error loading advertisement: ' + (err?.message || 'Unknown error'));
    setIsAdWatching(false);
  };
  
  // Handle mining actions
  const handleStopMining = async () => {
    try {
      const response = await stopMining();
      
      if (response.success) {
        await fetchMiningStatus();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Error stopping mining session');
      console.error(error);
    }
  };
  
  const handleCollectReward = async () => {
    setIsCollecting(true);
    
    try {
      const response = await collectReward();
      
      if (response.success) {
        await fetchMiningStatus();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Error collecting reward');
      console.error(error);
    } finally {
      setIsCollecting(false);
    }
  };
  
  const handleUpgradeLevel = async () => {
    setIsUpgrading(true);
    
    try {
      const response = await upgradeLevel();
      
      if (response.success) {
        await fetchMiningStatus();
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Error upgrading mining level');
      console.error(error);
    } finally {
      setIsUpgrading(false);
    }
  };
  
  if (isLoading) {
    return <Loader message="Loading mining status..." />;
  }
  
  // If watching an ad, show the ad component
  if (isAdWatching) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Advertisement</h1>
        <Ad 
          onComplete={handleAdComplete} 
          onError={handleAdError}
          minDuration={15}
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Mining Dashboard</h1>
      
      {error && (
        <div className="bg-error/20 border border-error/50 rounded-lg p-3 mb-4">
          <p className="text-white text-sm">{error}</p>
        </div>
      )}
      
      {/* Mining Status Card */}
      <div className="bg-card-bg rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Mining Status</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            miningStatus?.isActive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
          }`}>
            {miningStatus?.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        {miningStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-dark rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Mining Level</p>
                <p className="text-white font-semibold text-lg">{miningStatus.miningLevel}</p>
              </div>
              
              <div className="p-3 bg-dark rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Mining Rate</p>
                <p className="text-white font-semibold text-lg">
                  {formatNumber(miningStatus.miningRate, 6)} coins/hr
                </p>
              </div>
              
              <div className="p-3 bg-dark rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Available Mining Time</p>
                <p className="text-white font-semibold text-lg">
                  {formatDuration(miningStatus.availableMiningSeconds)}
                </p>
              </div>
              
              <div className="p-3 bg-dark rounded-lg">
                <p className="text-gray-400 text-sm mb-1">Remaining Today</p>
                <p className="text-white font-semibold text-lg">
                  {formatDuration(miningStatus.remainingDailySeconds)}
                </p>
              </div>
            </div>
            
            {miningStatus.isActive && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Time Remaining</p>
                <div className="w-full bg-dark rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full" 
                    style={{ 
                      width: `${(miningStatus.remainingSessionSeconds / miningStatus.sessionDurationSeconds) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-400">
                    {formatDuration(miningStatus.remainingSessionSeconds)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDuration(miningStatus.sessionDurationSeconds)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Actions Card */}
      <div className="bg-card-bg rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Mining Actions</h2>
        
        <div className="space-y-4">
          {!miningStatus?.isActive && (
            <div>
              <button
                className="w-full py-3 bg-primary rounded-lg text-white font-medium hover:bg-primary-dark transition-colors"
                onClick={handleWatchAd}
                disabled={
                  miningStatus?.availableMiningSeconds <= 0 || 
                  miningStatus?.remainingDailySeconds <= 0
                }
              >
                Watch Ad to Start Mining
              </button>
              
              {(miningStatus?.availableMiningSeconds <= 0 || miningStatus?.remainingDailySeconds <= 0) && (
                <p className="text-error text-sm mt-2">
                  {miningStatus?.availableMiningSeconds <= 0 
                    ? "You've reached your mining limit. Upgrade your level for more time."
                    : "You've reached your daily mining limit. Come back tomorrow!"}
                </p>
              )}
            </div>
          )}
          
          {miningStatus?.isActive && (
            <button
              className="w-full py-3 border border-primary bg-transparent rounded-lg text-primary font-medium hover:bg-primary/10 transition-colors"
              onClick={handleStopMining}
            >
              Stop Mining
            </button>
          )}
          
          <button
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              miningStatus?.canUpgrade 
                ? 'bg-success text-white hover:bg-success-dark' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleUpgradeLevel}
            disabled={!miningStatus?.canUpgrade || isUpgrading}
          >
            {isUpgrading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Upgrading...
              </span>
            ) : (
              `Upgrade to Level ${miningStatus?.miningLevel + 1} (${formatNumber(miningStatus?.upgradeRequirement, 6)} coins)`
            )}
          </button>
          
          <button
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              miningStatus?.pendingRewards > 0 
                ? 'bg-warning text-white hover:bg-warning-dark' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleCollectReward}
            disabled={miningStatus?.pendingRewards <= 0 || isCollecting}
          >
            {isCollecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Collecting...
              </span>
            ) : (
              `Collect ${formatNumber(miningStatus?.pendingRewards, 6)} Coins`
            )}
          </button>
        </div>
      </div>
      
      {/* Mining Info Card */}
      <div className="bg-card-bg rounded-xl p-4">
        <h2 className="text-xl font-semibold text-white mb-4">Mining Information</h2>
        
        <div className="space-y-3 text-sm text-gray-300">
          <p>1. Watch ads to earn mining time (1 hour per ad)</p>
          <p>2. You can mine for up to {miningStatus?.maxDailyMiningHours} hours per day</p>
          <p>3. Upgrade your mining level to increase your mining rate</p>
          <p>4. Each level increases your mining rate by 5%</p>
          <p>5. Higher levels also provide more daily mining time</p>
        </div>
      </div>
    </div>
  );
};

export default Mining; 