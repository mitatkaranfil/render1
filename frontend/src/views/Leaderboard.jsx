import React, { useState, useEffect } from 'react';
import { getLeaderboard, getUserRank } from '../services/api';
import { formatNumber } from '../utils/formatters';
import TimeframeSelector from '../components/TimeframeSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import UserRankCard from '../components/UserRankCard';
import LeaderboardTable from '../components/LeaderboardTable';
import ErrorMessage from '../components/ErrorMessage';

const Leaderboard = () => {
  const [timeframe, setTimeframe] = useState('daily');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch leaderboard data
        const response = await getLeaderboard(timeframe);
        if (response.success) {
          // Handle different response structures:
          // { leaderboard: [...] } or { leaderboard: { data: [...] } }
          if (Array.isArray(response.leaderboard)) {
            setLeaderboardData(response.leaderboard);
          } else if (response.leaderboard && Array.isArray(response.leaderboard.data)) {
            setLeaderboardData(response.leaderboard.data);
          } else if (response.leaderboard) {
            // Just in case it's directly an object without data property
            setLeaderboardData(response.leaderboard);
          } else {
            setLeaderboardData([]);
          }
        } else {
          setError('Failed to fetch leaderboard data');
          setLeaderboardData([]);
        }
        
        // Fetch user's rank
        const rankResponse = await getUserRank(timeframe);
        if (rankResponse.success) {
          // Handle both possible response structures
          setUserRank(rankResponse.userRank ? rankResponse : rankResponse.userRank);
        }
        
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('An error occurred while fetching the leaderboard');
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [timeframe]);
  
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };
  
  const timeframeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'alltime', label: 'All Time' }
  ];
  
  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">Top Miners</h1>
      
      <TimeframeSelector 
        options={timeframeOptions}
        selectedValue={timeframe}
        onChange={handleTimeframeChange}
      />
      
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {userRank && <UserRankCard userRank={userRank} timeframe={timeframe} />}
          
          <LeaderboardTable 
            data={leaderboardData || []} 
            timeframe={timeframe} 
          />
          
          {(!leaderboardData || leaderboardData.length === 0) && (
            <div className="no-data-message">
              No data available for this timeframe
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Leaderboard; 