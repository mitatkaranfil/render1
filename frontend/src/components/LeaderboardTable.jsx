import React from 'react';
import PropTypes from 'prop-types';
import { formatNumber } from '../utils/formatters';

const LeaderboardTable = ({ data, timeframe }) => {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  return (
    <div className="leaderboard-table bg-card-bg rounded-xl overflow-hidden">
      {/* Headers */}
      <div className="grid grid-cols-12 py-3 px-4 border-b border-dark-light text-sm font-medium text-gray-400">
        <div className="col-span-1">#</div>
        <div className="col-span-7">Miner</div>
        <div className="col-span-2 text-center">Level</div>
        <div className="col-span-2 text-right">Rewards</div>
      </div>
      
      {/* Rows */}
      {safeData.length > 0 ? (
        <div className="divide-y divide-dark-light">
          {safeData.map((user, index) => (
            <div 
              key={user.id || user.userId || index} 
              className="grid grid-cols-12 py-3 px-4 hover:bg-dark-light transition-colors"
            >
              <div className="col-span-1 font-medium text-gray-400">
                {user.rank || index + 1}
              </div>
              
              <div className="col-span-7 flex items-center">
                {user.photoUrl ? (
                  <img 
                    src={user.photoUrl} 
                    alt={user.firstName || user.first_name || ''} 
                    className="w-8 h-8 rounded-full mr-3"
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full mr-3 flex items-center justify-center">
                    <span className="text-white text-xs">
                      {(user.firstName || user.first_name || '').charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="text-white font-medium">
                    {user.firstName || user.first_name || ''} {user.lastName || user.last_name || ''}
                  </div>
                  {(user.username) && (
                    <div className="text-gray-400 text-xs">
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-span-2 text-center flex items-center justify-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  (user.miningLevel || user.level || user.mining_level || 0) > 100 ? 'bg-primary/20 text-primary' :
                  (user.miningLevel || user.level || user.mining_level || 0) > 50 ? 'bg-success/20 text-success' :
                  'bg-gray-700/50 text-gray-300'
                }`}>
                  {user.miningLevel || user.level || user.mining_level || 0}
                </span>
              </div>
              
              <div className="col-span-2 text-right text-primary font-medium">
                {formatNumber(user.rewardAmount || user.score || user.rewards || 0, 6)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

LeaderboardTable.propTypes = {
  data: PropTypes.array,
  timeframe: PropTypes.string.isRequired
};

LeaderboardTable.defaultProps = {
  data: []
};

export default LeaderboardTable; 