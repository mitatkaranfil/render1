import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getUserProfile, getMiningRewards } from '../services/api';
import Loader from '../components/ui/Loader';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const profileResponse = await getUserProfile();
        if (profileResponse.success) {
          setProfile(profileResponse.user || profileResponse.profile); // Handle both response formats
          updateUser(profileResponse.user || profileResponse.profile);
        } else {
          setError(profileResponse.message || 'Failed to fetch profile');
        }
        
        // Fetch mining rewards
        const rewardsResponse = await getMiningRewards();
        if (rewardsResponse.success && rewardsResponse.rewards) {
          // Handle both formats (array or object with items property)
          if (Array.isArray(rewardsResponse.rewards)) {
            setRewards(rewardsResponse.rewards);
          } else if (rewardsResponse.rewards && rewardsResponse.rewards.items) {
            setRewards(rewardsResponse.rewards.items);
          } else {
            setRewards([]);
          }
        } else {
          setRewards([]);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Error fetching profile data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchProfileData();
  }, [updateUser]);
  
  if (isLoading) {
    return <Loader fullScreen message="Loading profile..." />;
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>
      
      {error && (
        <div className="bg-error/20 border border-error/50 rounded-lg p-3 mb-4">
          <p className="text-white text-sm">{error}</p>
        </div>
      )}
      
      {/* User profile card */}
      {profile && (
        <div className="card mb-6">
          <div className="flex items-center">
            {profile.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={profile.firstName || profile.first_name} 
                className="w-16 h-16 rounded-full mr-4 border-2 border-primary" 
              />
            ) : (
              <div className="w-16 h-16 rounded-full mr-4 bg-primary flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {(profile.firstName || profile.first_name || '').charAt(0) || 'U'}
                </span>
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile.firstName || profile.first_name} {profile.lastName || profile.last_name}
              </h2>
              {(profile.username) && (
                <p className="text-gray-400">@{profile.username}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Mining statistics */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold text-white mb-4">Mining Statistics</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-300">Mining Level</span>
            <span className="text-white font-medium">{profile?.miningLevel || profile?.level || 0}/1000</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Mining Rate</span>
            <span className="text-white font-medium">
              {((profile?.miningLevel || profile?.level || profile?.mining_rate || 0) * 0.01).toFixed(2)} coins/hour
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Total Rewards</span>
            <span className="text-white font-medium">
              {(profile?.totalRewards || profile?.balance || 0).toFixed(6)} coins
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-300">Available Mining Time</span>
            <span className="text-white font-medium">
              {Math.floor(profile?.miningTimeRemaining || 6)}h {Math.floor(((profile?.miningTimeRemaining || 0) % 1) * 60)}m
            </span>
          </div>
        </div>
      </div>
      
      {/* Recent rewards */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4">Recent Rewards</h2>
        
        {rewards && rewards.length > 0 ? (
          <div className="space-y-3">
            {rewards.map((reward, index) => (
              <div key={reward.id || index} className="bg-dark-light rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {new Date(reward.reward_time || reward.date || Date.now()).toLocaleDateString()}
                  </span>
                  <span className="text-primary font-medium">
                    +{(reward.amount || 0).toFixed(6)} coins
                  </span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">
                    Level: {reward.mining_level || 1}
                  </span>
                  <span className="text-gray-400">
                    Duration: {(reward.duration_hours || 1).toFixed(1)}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No mining rewards yet</p>
        )}
      </div>
    </div>
  );
};

export default Profile; 