import React, { useState, useEffect, useCallback } from 'react';
import { formatDuration } from '../../utils/formatting';

const Ad = ({ onComplete, onError, minDuration = 15 }) => {
  const [timeWatched, setTimeWatched] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [adData, setAdData] = useState(null);
  const [error, setError] = useState(null);

  // Simulate fetching ad data
  useEffect(() => {
    const fetchAd = async () => {
      try {
        // In a real implementation, this would be an API call to get an ad
        // For now, we'll simulate with mock data
        const mockAds = [
          {
            id: 'ad1',
            title: 'Boost your crypto portfolio',
            description: 'Discover the best crypto investments for 2023',
            imageUrl: 'https://via.placeholder.com/300x200?text=Crypto+Ad',
            ctaUrl: '#'
          },
          {
            id: 'ad2',
            title: 'Web3 Revolution',
            description: 'Join the future of decentralized applications',
            imageUrl: 'https://via.placeholder.com/300x200?text=Web3+Ad',
            ctaUrl: '#'
          },
          {
            id: 'ad3',
            title: 'Earn while you learn',
            description: 'Learn about blockchain and earn rewards',
            imageUrl: 'https://via.placeholder.com/300x200?text=Learn+Ad',
            ctaUrl: '#'
          }
        ];
        
        // Pick a random ad from the mock ads
        const randomAd = mockAds[Math.floor(Math.random() * mockAds.length)];
        setAdData(randomAd);
      } catch (err) {
        console.error('Error fetching ad:', err);
        setError('Failed to load advertisement');
        
        if (onError) {
          onError(err);
        }
      }
    };
    
    fetchAd();
  }, [onError]);

  // Timer for ad duration
  useEffect(() => {
    if (!adData || isComplete) return;
    
    const timer = setInterval(() => {
      setTimeWatched(prev => {
        const newTime = prev + 1;
        
        // Calculate progress percentage
        const newProgress = Math.min((newTime / minDuration) * 100, 100);
        setProgress(newProgress);
        
        // Check if the ad is complete
        if (newTime >= minDuration && !isComplete) {
          setIsComplete(true);
          clearInterval(timer);
          
          if (onComplete) {
            onComplete();
          }
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [adData, isComplete, minDuration, onComplete]);

  if (error) {
    return (
      <div className="bg-error/20 rounded-lg p-4 text-center">
        <p className="text-error font-medium mb-2">Error Loading Advertisement</p>
        <p className="text-sm text-gray-300 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-primary rounded-lg text-white"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!adData) {
    return (
      <div className="bg-card-bg rounded-lg p-4 animate-pulse">
        <div className="w-full h-40 bg-dark-light rounded-lg mb-4"></div>
        <div className="h-5 bg-dark-light rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-dark-light rounded w-full mb-6"></div>
        <div className="w-full h-2 bg-dark-light rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-lg overflow-hidden">
      {/* Ad Content */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-medium">Advertisement</h3>
          <span className="text-xs text-gray-400">
            {isComplete ? 'Complete!' : `Please watch for ${formatDuration(minDuration - timeWatched, false)}`}
          </span>
        </div>
        
        {/* Ad Image */}
        <div className="mb-4 w-full h-40 overflow-hidden rounded-lg">
          <img 
            src={adData.imageUrl} 
            alt={adData.title} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Ad Details */}
        <h4 className="text-white font-medium mb-1">{adData.title}</h4>
        <p className="text-gray-300 text-sm mb-4">{adData.description}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-dark rounded-full h-2 mb-4">
          <div 
            className={`h-2 rounded-full ${isComplete ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Call to Action */}
        <button 
          className={`w-full py-2 rounded-lg font-medium ${
            isComplete 
              ? 'bg-success text-white' 
              : 'bg-gray-700 text-gray-400'
          }`}
          disabled={!isComplete}
          onClick={onComplete}
        >
          {isComplete ? 'Continue Mining' : 'Please Wait...'}
        </button>
      </div>
      
      {/* Ad Attribution */}
      <div className="bg-dark px-4 py-2 text-xs text-gray-400">
        Powered by Cosmofy Ads Network
      </div>
    </div>
  );
};

export default Ad; 