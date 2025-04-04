import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

/**
 * @route GET /api/user/profile
 * @desc Get user profile data
 * @access Private
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error } = await supabase
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
    
    // Format the profile data
    const profile = {
      id: userData.id,
      telegramId: userData.telegram_id,
      username: userData.username,
      firstName: userData.first_name,
      lastName: userData.last_name,
      photoUrl: userData.photo_url,
      miningLevel: userData.mining_level,
      walletBalance: parseFloat(userData.wallet_balance || 0),
      pendingRewards: parseFloat(userData.pending_rewards || 0),
      miningTimeSeconds: userData.mining_time_seconds,
      createdAt: userData.created_at
    };
    
    return res.status(200).json({
      success: true,
      profile
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user profile' 
    });
  }
});

/**
 * @route GET /api/user/stats
 * @desc Get user mining statistics
 * @access Private
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mining_level')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics' 
      });
    }
    
    // Get total rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('mining_rewards')
      .select('amount')
      .eq('user_id', userId);
      
    if (rewardsError) {
      console.error('Error fetching mining rewards:', rewardsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics' 
      });
    }
    
    const totalRewards = rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    
    // Get total mining time
    const { data: dailyStats, error: statsError } = await supabase
      .from('daily_stats')
      .select('mining_time_seconds')
      .eq('user_id', userId);
      
    if (statsError) {
      console.error('Error fetching daily stats:', statsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics' 
      });
    }
    
    const totalMiningTimeSeconds = dailyStats.reduce((sum, stat) => sum + stat.mining_time_seconds, 0);
    
    // Get level upgrades
    const { data: upgrades, error: upgradesError } = await supabase
      .from('mining_upgrades')
      .select('*')
      .eq('user_id', userId);
      
    if (upgradesError) {
      console.error('Error fetching level upgrades:', upgradesError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics' 
      });
    }
    
    const totalUpgrades = upgrades.length;
    
    // Get recent activities
    const { data: recentRewards, error: recentError } = await supabase
      .from('mining_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (recentError) {
      console.error('Error fetching recent rewards:', recentError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics' 
      });
    }
    
    // Format the statistics
    const stats = {
      miningLevel: userData.mining_level,
      totalRewards,
      totalMiningTimeHours: Math.round((totalMiningTimeSeconds / 3600) * 100) / 100,
      totalLevelUpgrades: totalUpgrades,
      recentActivity: recentRewards.map(reward => ({
        id: reward.id,
        amount: parseFloat(reward.amount),
        miningLevel: reward.mining_level,
        durationSeconds: reward.duration_seconds,
        durationHours: reward.duration_seconds / 3600,
        timestamp: reward.created_at
      }))
    };
    
    return res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user statistics' 
    });
  }
});

export default router; 