import React, { useState, useEffect } from 'react';

const MiningStatus = ({ 
  isActive, 
  miningTimeRemaining, 
  miningLevel, 
  dailyMiningTimeUsed,
  onToggleMining 
}) => {
  const [remainingTime, setRemainingTime] = useState(miningTimeRemaining);
  const [timer, setTimer] = useState(null);
  
  // Format hours to display
  const formatHours = (hours) => {
    const fullHours = Math.floor(hours);
    const minutes = Math.floor((hours - fullHours) * 60);
    return `${fullHours}h ${minutes}m`;
  };
  
  // Start countdown timer when mining is active
  useEffect(() => {
    if (isActive && miningTimeRemaining > 0) {
      // Clear existing timer
      if (timer) clearInterval(timer);
      
      // Initialize remaining time
      setRemainingTime(miningTimeRemaining);
      
      // Create new timer
      const intervalId = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = Math.max(0, prev - 1/3600); // Decrease by 1 second
          
          // Stop timer if time runs out
          if (newTime <= 0) {
            clearInterval(intervalId);
            // This won't stop mining on the backend, that will happen on next status fetch
          }
          
          return newTime;
        });
      }, 1000);
      
      setTimer(intervalId);
      
      return () => clearInterval(intervalId);
    } else {
      // Update remaining time when not active
      setRemainingTime(miningTimeRemaining);
      
      // Clear timer if mining stops
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
    }
  }, [isActive, miningTimeRemaining]);
  
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-4">Mining Status</h2>
      
      <div className="space-y-4">
        {/* Mining level */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Mining Level:</span>
          <span className="text-white font-medium">{miningLevel}/1000</span>
        </div>
        
        {/* Mining rate */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Mining Rate:</span>
          <span className="text-white font-medium">{(miningLevel * 0.01).toFixed(2)} coins/hour</span>
        </div>
        
        {/* Mining time */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Remaining Time:</span>
          <span className="text-white font-medium">{formatHours(remainingTime)}</span>
        </div>
        
        {/* Mining status indicator */}
        <div className="flex items-center mt-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
          <span className={`text-sm ${isActive ? 'text-success' : 'text-gray-500'}`}>
            {isActive ? 'Mining Active' : 'Mining Inactive'}
          </span>
        </div>
        
        {/* Action button */}
        <button
          className={`w-full mt-2 ${
            isActive ? 'bg-error hover:bg-error/80' : 'bg-success hover:bg-success/80'
          } text-white py-2 px-4 rounded-lg transition-colors`}
          onClick={onToggleMining}
          disabled={!isActive && remainingTime <= 0}
        >
          {isActive ? 'Stop Mining' : 'Start Mining'}
        </button>
      </div>
    </div>
  );
};

export default MiningStatus; 