import React from 'react';

const LevelUpgrade = ({ 
  miningLevel, 
  levelUpgradeAdsWatched, 
  dailyLevelUpgrades,
  onWatchAd 
}) => {
  // Calculate progress percentage
  const progressPercentage = (levelUpgradeAdsWatched / 10) * 100;
  
  // Check if max level or daily limit reached
  const isMaxLevel = miningLevel >= 1000;
  const isDailyLimitReached = dailyLevelUpgrades >= 3;
  const isDisabled = isMaxLevel || isDailyLimitReached;
  
  // Get button text based on state
  const getButtonText = () => {
    if (isMaxLevel) return 'Maximum Level Reached';
    if (isDailyLimitReached) return 'Daily Limit Reached';
    return 'Watch Ad to Upgrade Level';
  };
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-4">Level Upgrade</h2>
      
      <div className="space-y-4">
        {/* Current level */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Current Level:</span>
          <span className="text-white font-medium">{miningLevel}/1000</span>
        </div>
        
        {/* Mining power */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Mining Power:</span>
          <span className="text-white font-medium">{(miningLevel * 0.01).toFixed(2)} coins/hour</span>
        </div>
        
        {/* Upgrade progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress: {levelUpgradeAdsWatched}/10 ads</span>
            <span>Daily: {dailyLevelUpgrades}/3 upgrades</span>
          </div>
          <div className="w-full bg-dark-light rounded-full h-3">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Next level preview */}
        {!isMaxLevel && (
          <div className="bg-dark-light rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Next Level:</span>
              <span className="text-white">{miningLevel + 1}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-gray-300">Mining Power:</span>
              <span className="text-primary">
                {((miningLevel + 1) * 0.01).toFixed(2)} coins/hour
              </span>
            </div>
          </div>
        )}
        
        {/* Upgrade button */}
        <button
          className={`w-full ${
            isDisabled ? 'bg-gray-700 cursor-not-allowed' : 'btn-primary'
          }`}
          onClick={onWatchAd}
          disabled={isDisabled}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
};

export default LevelUpgrade; 