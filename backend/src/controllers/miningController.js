const supabase = require('../utils/supabase');

/**
 * Get current mining status
 */
exports.getMiningStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user mining status
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching mining status:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching mining status'
      });
    }
    
    // Get active mining session if exists
    const { data: activeSession, error: sessionError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
      
    if (sessionError && sessionError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching active session:', sessionError);
    }
    
    // Calculate remaining time
    let miningTimeRemaining = user.mining_time_remaining;
    let isActive = false;
    let sessionStartTime = null;
    
    if (activeSession) {
      isActive = true;
      sessionStartTime = activeSession.start_time;
      
      // Calculate time elapsed since session started
      const startTime = new Date(activeSession.start_time);
      const now = new Date();
      const elapsedHours = (now - startTime) / (1000 * 60 * 60);
      
      // Update remaining time if session is still active but time has passed
      miningTimeRemaining = Math.max(0, user.mining_time_remaining - elapsedHours);
      
      // If time is up, stop the mining session
      if (miningTimeRemaining <= 0) {
        // Stop the session
        const { error: updateError } = await supabase
          .from('mining_sessions')
          .update({ is_active: false, end_time: now.toISOString() })
          .eq('id', activeSession.id);
        
        if (updateError) {
          console.error('Error stopping expired session:', updateError);
        }
        
        // Update user mining time
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ mining_time_remaining: 0 })
          .eq('id', userId);
        
        if (userUpdateError) {
          console.error('Error updating user mining time:', userUpdateError);
        }
        
        isActive = false;
        miningTimeRemaining = 0;
      }
    }
    
    return res.status(200).json({
      success: true,
      miningStatus: {
        isActive,
        miningTimeRemaining,
        sessionStartTime,
        miningLevel: user.mining_level,
        dailyMiningTimeUsed: user.daily_mining_time_used,
        levelUpgradeAdsWatched: user.level_upgrade_ads_watched,
        dailyLevelUpgrades: user.daily_level_upgrades
      }
    });
  } catch (error) {
    console.error('Error in getMiningStatus:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching mining status'
    });
  }
};

/**
 * Record ad view and add mining time
 */
exports.recordAdView = async (req, res) => {
  try {
    const userId = req.user.id;
    const { adId, duration } = req.body;
    
    // Verify ad was watched for minimum time (15 seconds)
    if (!duration || duration < 15) {
      return res.status(400).json({
        success: false,
        message: 'Ad must be watched for at least 15 seconds'
      });
    }
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
    
    // Check daily limit (24 hours)
    if (user.daily_mining_time_used >= 24) {
      return res.status(400).json({
        success: false,
        message: 'Daily mining time limit reached (24 hours)'
      });
    }
    
    // Record ad view
    const { error: adViewError } = await supabase
      .from('ad_views')
      .insert([{
        user_id: userId,
        ad_id: adId,
        duration,
        view_time: new Date().toISOString(),
        for_level_upgrade: false
      }]);
      
    if (adViewError) {
      console.error('Error recording ad view:', adViewError);
      return res.status(500).json({
        success: false,
        message: 'Error recording ad view'
      });
    }
    
    // Add 1 hour to mining time
    const newMiningTime = user.mining_time_remaining + 1;
    const newDailyUsed = user.daily_mining_time_used + 1;
    
    // Update user mining time
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mining_time_remaining: newMiningTime,
        daily_mining_time_used: newDailyUsed
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating mining time:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating mining time'
      });
    }
    
    return res.status(200).json({
      success: true,
      miningTime: {
        miningTimeRemaining: newMiningTime,
        dailyMiningTimeUsed: newDailyUsed,
        hourAdded: 1
      }
    });
  } catch (error) {
    console.error('Error in recordAdView:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording ad view'
    });
  }
};

/**
 * Record ad view for level upgrade
 */
exports.recordLevelUpgradeAd = async (req, res) => {
  try {
    const userId = req.user.id;
    const { adId, duration } = req.body;
    
    // Verify ad was watched for minimum time (15 seconds)
    if (!duration || duration < 15) {
      return res.status(400).json({
        success: false,
        message: 'Ad must be watched for at least 15 seconds'
      });
    }
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
    
    // Check if user has reached maximum level (1000)
    if (user.mining_level >= 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum mining level reached (1000)'
      });
    }
    
    // Check daily level upgrade limit (3 per day)
    if (user.daily_level_upgrades >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Daily level upgrade limit reached (3 upgrades)'
      });
    }
    
    // Record ad view
    const { error: adViewError } = await supabase
      .from('ad_views')
      .insert([{
        user_id: userId,
        ad_id: adId,
        duration,
        view_time: new Date().toISOString(),
        for_level_upgrade: true
      }]);
      
    if (adViewError) {
      console.error('Error recording ad view:', adViewError);
      return res.status(500).json({
        success: false,
        message: 'Error recording ad view'
      });
    }
    
    // Update level upgrade progress
    let newLevelUpgradeAdsWatched = user.level_upgrade_ads_watched + 1;
    let newMiningLevel = user.mining_level;
    let newDailyLevelUpgrades = user.daily_level_upgrades;
    let levelUpgraded = false;
    
    // Check if level should be upgraded (10 ads watched)
    if (newLevelUpgradeAdsWatched >= 10) {
      newMiningLevel = user.mining_level + 1;
      newLevelUpgradeAdsWatched = 0; // Reset ads watched count
      newDailyLevelUpgrades = user.daily_level_upgrades + 1;
      levelUpgraded = true;
      
      // Record level upgrade
      const { error: levelUpgradeError } = await supabase
        .from('level_upgrades')
        .insert([{
          user_id: userId,
          old_level: user.mining_level,
          new_level: newMiningLevel,
          upgrade_time: new Date().toISOString()
        }]);
        
      if (levelUpgradeError) {
        console.error('Error recording level upgrade:', levelUpgradeError);
      }
    }
    
    // Update user data
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mining_level: newMiningLevel,
        level_upgrade_ads_watched: newLevelUpgradeAdsWatched,
        daily_level_upgrades: newDailyLevelUpgrades
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user level data:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Error updating user level data'
      });
    }
    
    return res.status(200).json({
      success: true,
      levelData: {
        miningLevel: newMiningLevel,
        levelUpgradeAdsWatched: newLevelUpgradeAdsWatched,
        dailyLevelUpgrades: newDailyLevelUpgrades,
        levelUpgraded,
        adsRequiredForNextLevel: 10 - newLevelUpgradeAdsWatched
      }
    });
  } catch (error) {
    console.error('Error in recordLevelUpgradeAd:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error recording level upgrade ad view'
    });
  }
};

/**
 * Start mining session
 */
exports.startMining = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
    
    // Check if user has mining time available
    if (user.mining_time_remaining <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No mining time available'
      });
    }
    
    // Check if user already has an active session
    const { data: activeSessions, error: sessionError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
      
    if (sessionError) {
      console.error('Error checking active sessions:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Error checking active sessions'
      });
    }
    
    if (activeSessions && activeSessions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A mining session is already active'
      });
    }
    
    // Create new mining session
    const now = new Date().toISOString();
    const { data: newSession, error: createError } = await supabase
      .from('mining_sessions')
      .insert([{
        user_id: userId,
        start_time: now,
        mining_level: user.mining_level,
        is_active: true
      }])
      .select()
      .single();
      
    if (createError) {
      console.error('Error creating mining session:', createError);
      return res.status(500).json({
        success: false,
        message: 'Error starting mining session'
      });
    }
    
    return res.status(200).json({
      success: true,
      miningSession: {
        id: newSession.id,
        startTime: newSession.start_time,
        miningLevel: user.mining_level,
        miningTimeRemaining: user.mining_time_remaining
      }
    });
  } catch (error) {
    console.error('Error in startMining:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error starting mining session'
    });
  }
};

/**
 * Stop mining session
 */
exports.stopMining = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get active session
    const { data: activeSession, error: sessionError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
      
    if (sessionError) {
      if (sessionError.code === 'PGRST116') { // No rows returned
        return res.status(400).json({
          success: false,
          message: 'No active mining session found'
        });
      }
      
      console.error('Error fetching active session:', sessionError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching active mining session'
      });
    }
    
    // Calculate mining duration
    const startTime = new Date(activeSession.start_time);
    const now = new Date();
    const endTime = now.toISOString();
    const durationHours = (now - startTime) / (1000 * 60 * 60);
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
    
    // Calculate mining reward based on level and duration
    const miningRate = user.mining_level * 0.01; // Example rate calculation
    const miningReward = miningRate * durationHours;
    
    // Update mining session
    const { error: updateSessionError } = await supabase
      .from('mining_sessions')
      .update({
        is_active: false,
        end_time: endTime,
        duration_hours: durationHours,
        reward: miningReward
      })
      .eq('id', activeSession.id);
      
    if (updateSessionError) {
      console.error('Error updating mining session:', updateSessionError);
      return res.status(500).json({
        success: false,
        message: 'Error updating mining session'
      });
    }
    
    // Update user mining time
    const newMiningTimeRemaining = Math.max(0, user.mining_time_remaining - durationHours);
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        mining_time_remaining: newMiningTimeRemaining
      })
      .eq('id', userId);
      
    if (updateUserError) {
      console.error('Error updating user mining time:', updateUserError);
      return res.status(500).json({
        success: false,
        message: 'Error updating user mining time'
      });
    }
    
    // Record mining reward
    const { error: rewardError } = await supabase
      .from('mining_rewards')
      .insert([{
        user_id: userId,
        session_id: activeSession.id,
        amount: miningReward,
        mining_level: user.mining_level,
        duration_hours: durationHours,
        reward_time: endTime
      }]);
      
    if (rewardError) {
      console.error('Error recording mining reward:', rewardError);
    }
    
    return res.status(200).json({
      success: true,
      miningResult: {
        sessionId: activeSession.id,
        startTime: activeSession.start_time,
        endTime,
        durationHours,
        miningLevel: user.mining_level,
        miningReward,
        remainingMiningTime: newMiningTimeRemaining
      }
    });
  } catch (error) {
    console.error('Error in stopMining:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error stopping mining session'
    });
  }
};

/**
 * Get mining stats
 */
exports.getMiningStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user data'
      });
    }
    
    // Get total mining rewards
    const { data: totalRewards, error: rewardsError } = await supabase
      .rpc('get_total_mining_rewards', { user_id_param: userId });
      
    if (rewardsError) {
      console.error('Error calculating total rewards:', rewardsError);
      return res.status(500).json({
        success: false,
        message: 'Error calculating total rewards'
      });
    }
    
    // Get recent mining sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(5);
      
    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
      return res.status(500).json({
        success: false,
        message: 'Error fetching recent sessions'
      });
    }
    
    // Calculate mining rate
    const miningRate = user.mining_level * 0.01; // Example rate calculation
    
    return res.status(200).json({
      success: true,
      miningStats: {
        miningLevel: user.mining_level,
        miningRate,
        totalRewards: totalRewards || 0,
        miningTimeRemaining: user.mining_time_remaining,
        dailyMiningTimeUsed: user.daily_mining_time_used,
        levelUpgradeProgress: {
          current: user.level_upgrade_ads_watched,
          required: 10,
          dailyUpgradesUsed: user.daily_level_upgrades,
          dailyUpgradesLimit: 3
        },
        recentSessions: recentSessions || []
      }
    });
  } catch (error) {
    console.error('Error in getMiningStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching mining stats'
    });
  }
};

/**
 * Get mining rewards
 */
exports.getMiningRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get rewards with pagination
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data: rewards, error, count } = await supabase
      .from('mining_rewards')
      .select('*, mining_sessions!inner(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('reward_time', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching mining rewards:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching mining rewards'
      });
    }
    
    // Get total rewards
    const { data: totalRewards, error: totalError } = await supabase
      .rpc('get_total_mining_rewards', { user_id_param: userId });
      
    if (totalError) {
      console.error('Error calculating total rewards:', totalError);
      return res.status(500).json({
        success: false,
        message: 'Error calculating total rewards'
      });
    }
    
    return res.status(200).json({
      success: true,
      rewards: {
        items: rewards || [],
        total: count || 0,
        totalRewards: totalRewards || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getMiningRewards:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching mining rewards'
    });
  }
}; 