import React, { useEffect, useState } from 'react';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';

const AdPlayer = ({ onComplete, onSkip, adService }) => {
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isSkippable, setIsSkippable] = useState(false);
  const [adInfo, setAdInfo] = useState(null);
  
  useEffect(() => {
    // Set up ad callback
    const handleAdEvent = (event) => {
      if (event.type === 'progress') {
        setSecondsWatched(event.secondsWatched);
      } else if (event.type === 'skippable') {
        setIsSkippable(true);
      } else if (event.type === 'completed') {
        onComplete(event);
      }
    };
    
    // Start playing the ad
    adService.playAd(handleAdEvent)
      .then(() => {
        setAdInfo(adService.getCurrentAd());
      })
      .catch(error => {
        console.error('Error playing ad:', error);
        // Close the ad player on error
        onComplete({ type: 'error', error });
      });
    
    // Clean up when component unmounts
    return () => {
      adService.stopAd();
    };
  }, [adService, onComplete]);
  
  // Handle skip button click
  const handleSkip = () => {
    if (isSkippable) {
      adService.skipAd();
      onSkip({ secondsWatched });
    }
  };
  
  // Calculate remaining time to skippable
  const remainingToSkippable = Math.max(0, 15 - secondsWatched);
  
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Ad content placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="bg-card-bg rounded-xl p-6 w-full max-w-md text-center">
          <h3 className="text-xl font-bold text-white mb-4">
            {adInfo?.title || 'Advertisement'}
          </h3>
          
          <div className="bg-dark h-44 rounded-lg flex items-center justify-center mb-4">
            <div className="text-primary text-6xl">Ad</div>
          </div>
          
          <p className="text-gray-300 mb-4">
            {adInfo?.description || 'Watch this advertisement to continue'}
          </p>
          
          {/* Countdown timer */}
          <div className="flex justify-center mb-6">
            <CountdownCircleTimer
              isPlaying
              duration={60}
              colors={['#3390ec', '#F7B801', '#A30000', '#A30000']}
              colorsTime={[60, 30, 10, 0]}
              size={100}
              strokeWidth={6}
              trailColor="#2f2f2f"
            >
              {({ remainingTime }) => (
                <div className="flex flex-col items-center">
                  <div className="text-lg font-bold">{remainingTime}</div>
                  <div className="text-xs">seconds</div>
                </div>
              )}
            </CountdownCircleTimer>
          </div>
          
          {/* Skip notice */}
          <div className="text-sm text-gray-400 mt-2">
            {!isSkippable 
              ? `Ad can be skipped in ${remainingToSkippable} seconds` 
              : 'You can skip this ad now'}
          </div>
        </div>
      </div>
      
      {/* Skip button */}
      <div className="bg-card-bg p-4 flex justify-between items-center">
        <div className="text-white text-sm">
          {secondsWatched} / 60 seconds watched
        </div>
        <button
          className={`px-4 py-2 rounded ${
            isSkippable ? 'bg-primary text-white' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          onClick={handleSkip}
          disabled={!isSkippable}
        >
          Skip Ad
        </button>
      </div>
    </div>
  );
};

export default AdPlayer;