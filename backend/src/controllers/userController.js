const supabase = require('../utils/supabase');

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user profile'
      });
    }
    
    // Get mining stats
    const { data: totalRewards, error: rewardsError } = await supabase
      .rpc('get_total_mining_rewards', { user_id_param: userId });
      
    if (rewardsError) {
      console.error('Error calculating total rewards:', rewardsError);
    }
    
    // Format and return user profile
    return res.status(200).json({
      success: true,
      profile: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        miningLevel: user.mining_level,
        totalRewards: totalRewards || 0,
        miningTimeRemaining: user.mining_time_remaining,
        dailyMiningTimeUsed: user.daily_mining_time_used,
        lastActive: user.updated_at,
        joinedAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user profile'
    });
  }
};

/**
 * Update user profile
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, firstName, lastName, photoUrl } = req.body;
    
    // Update user data
    const { data, error } = await supabase
      .from('users')
      .update({
        username: username || req.user.username,
        first_name: firstName || req.user.first_name,
        last_name: lastName || req.user.last_name,
        photo_url: photoUrl || req.user.photo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating user profile'
      });
    }
    
    return res.status(200).json({
      success: true,
      profile: {
        id: data.id,
        telegramId: data.telegram_id,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        photoUrl: data.photo_url,
        updatedAt: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user profile'
    });
  }
};

/**
 * Get user mining level
 */
exports.getUserLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user level data
    const { data: user, error } = await supabase
      .from('users')
      .select('mining_level, level_upgrade_ads_watched, daily_level_upgrades')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching user level:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user level'
      });
    }
    
    // Get level upgrade history
    const { data: upgrades, error: upgradesError } = await supabase
      .from('level_upgrades')
      .select('*')
      .eq('user_id', userId)
      .order('upgrade_time', { ascending: false })
      .limit(10);
      
    if (upgradesError) {
      console.error('Error fetching level upgrades:', upgradesError);
    }
    
    // Calculate mining rate
    const miningRate = user.mining_level * 0.01; // Example rate calculation
    
    return res.status(200).json({
      success: true,
      levelData: {
        currentLevel: user.mining_level,
        miningRate,
        progressToNextLevel: {
          current: user.level_upgrade_ads_watched,
          required: 10,
          percentage: (user.level_upgrade_ads_watched / 10) * 100
        },
        dailyUpgrades: {
          used: user.daily_level_upgrades,
          remaining: 3 - user.daily_level_upgrades,
          limit: 3
        },
        recentUpgrades: upgrades || []
      }
    });
  } catch (error) {
    console.error('Error in getUserLevel:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching user level data'
    });
  }
};

/**
 * Get leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { timeframe = 'daily', limit = 10 } = req.query;
    let leaderboardData;
    let error;
    
    // Get appropriate leaderboard based on timeframe
    switch (timeframe) {
      case 'daily':
        // Daily leaderboard based on mining rewards earned today
        const today = new Date().toISOString().split('T')[0];
        const todayStart = `${today}T00:00:00.000Z`;
        const todayEnd = `${today}T23:59:59.999Z`;
        
        ({ data: leaderboardData, error } = await supabase
          .from('mining_rewards')
          .select('user_id, users!inner(username, first_name, photo_url, mining_level)')
          .gte('reward_time', todayStart)
          .lte('reward_time', todayEnd)
          .order('amount', { ascending: false })
          .limit(parseInt(limit)));
        break;
        
      case 'weekly':
        // Weekly leaderboard based on total mining level
        ({ data: leaderboardData, error } = await supabase
          .from('users')
          .select('id, username, first_name, photo_url, mining_level')
          .order('mining_level', { ascending: false })
          .limit(parseInt(limit)));
        break;
        
      case 'alltime':
        // All-time leaderboard based on total rewards using RPC function
        // This assumes you have a function in the database to get total rewards per user
        ({ data: leaderboardData, error } = await supabase
          .rpc('get_leaderboard', { limit_param: parseInt(limit) }));
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid timeframe. Options are: daily, weekly, alltime'
        });
    }
    
    if (error) {
      console.error(`Error fetching ${timeframe} leaderboard:`, error);
      return res.status(500).json({
        success: false,
        message: `Error fetching ${timeframe} leaderboard`
      });
    }
    
    // Format leaderboard data
    const formattedLeaderboard = leaderboardData.map((entry, index) => {
      // For daily and weekly which have nested user data
      if (entry.users) {
        return {
          rank: index + 1,
          userId: entry.user_id,
          username: entry.users.username,
          firstName: entry.users.first_name,
          photoUrl: entry.users.photo_url,
          miningLevel: entry.users.mining_level,
          rewardAmount: entry.amount || 0
        };
      }
      
      // For all-time which comes from RPC
      return {
        rank: index + 1,
        userId: entry.id || entry.user_id,
        username: entry.username,
        firstName: entry.first_name,
        photoUrl: entry.photo_url,
        miningLevel: entry.mining_level,
        rewardAmount: entry.total_rewards || 0
      };
    });
    
    return res.status(200).json({
      success: true,
      leaderboard: {
        timeframe,
        data: formattedLeaderboard
      }
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching leaderboard data'
    });
  }
}; 