import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all ad routes
router.use(authenticate);

/**
 * @route GET /api/ads/eligible
 * @desc Check if user is eligible to watch ads
 * @access Private
 */
router.get('/eligible', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data to check mining time
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mining_level, daily_mining_seconds')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking ad eligibility' 
      });
    }
    
    // Check daily ad view limit
    const today = new Date().toISOString().split('T')[0];
    
    const { data: adViews, error: adViewsError, count } = await supabase
      .from('ad_views')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);
      
    if (adViewsError) {
      console.error('Error fetching ad views:', adViewsError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error checking ad eligibility' 
      });
    }
    
    // Calculate daily limit based on level
    // Base limit is 3 ads per day, +1 ad for every 10 levels
    const dailyAdLimit = 3 + Math.floor(userData.mining_level / 10);
    
    // Check if user has reached the limit
    const isEligible = count < dailyAdLimit;
    
    // Get remaining daily mining time limit
    const dailyMiningLimitSeconds = await getDailyMiningLimit(userData.mining_level);
    const usedMiningTimeToday = await getDailyUsedMiningTime(userId);
    const remainingDailyTime = Math.max(0, dailyMiningLimitSeconds - usedMiningTimeToday);
    
    return res.status(200).json({
      success: true,
      eligible: isEligible && remainingDailyTime > 0,
      dailyAdLimit,
      adsWatchedToday: count,
      remainingAdsToday: Math.max(0, dailyAdLimit - count),
      remainingDailyMiningSeconds: remainingDailyTime
    });
    
  } catch (error) {
    console.error('Error checking ad eligibility:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error checking ad eligibility' 
    });
  }
});

/**
 * @route POST /api/ads/watch
 * @desc Record ad view and reward mining time
 * @access Private
 */
router.post('/watch', async (req, res) => {
  try {
    const userId = req.user.id;
    const { adId = null } = req.body;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mining_level, mining_time_seconds, daily_mining_seconds')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing advertisement' 
      });
    }
    
    // Check eligibility first
    const today = new Date().toISOString().split('T')[0];
    
    const { count } = await supabase
      .from('ad_views')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);
      
    // Calculate daily limit based on level
    const dailyAdLimit = 3 + Math.floor(userData.mining_level / 10);
    
    // Check if user has reached the limit
    if (count >= dailyAdLimit) {
      return res.status(400).json({ 
        success: false, 
        message: 'Daily advertisement limit reached' 
      });
    }
    
    // Check if user has remaining daily mining time
    const dailyMiningLimitSeconds = await getDailyMiningLimit(userData.mining_level);
    const usedMiningTimeToday = await getDailyUsedMiningTime(userId);
    const remainingDailyTime = Math.max(0, dailyMiningLimitSeconds - usedMiningTimeToday);
    
    if (remainingDailyTime <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Daily mining time limit reached' 
      });
    }
    
    // Reward is 1 hour (3600 seconds) of mining time
    const rewardTimeSeconds = 3600;
    
    // Update user's mining time
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mining_time_seconds: userData.mining_time_seconds + rewardTimeSeconds,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user mining time:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error processing advertisement' 
      });
    }
    
    // Record ad view
    const { error: adViewError } = await supabase
      .from('ad_views')
      .insert([{
        user_id: userId,
        ad_type: 'mining_time',
        ad_id: adId,
        reward_time_seconds: rewardTimeSeconds
      }]);
      
    if (adViewError) {
      console.error('Error recording ad view:', adViewError);
      // Continue despite error as the user mining time is already updated
    }
    
    return res.status(200).json({
      success: true,
      message: 'Advertisement reward claimed successfully',
      rewardTimeSeconds,
      totalMiningTimeSeconds: userData.mining_time_seconds + rewardTimeSeconds
    });
    
  } catch (error) {
    console.error('Error processing advertisement:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing advertisement' 
    });
  }
});

/**
 * @route GET /api/ads/history
 * @desc Get user's ad view history
 * @access Private
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Get ad views
    const { data: adViews, error, count } = await supabase
      .from('ad_views')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching ad history:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching ad history' 
      });
    }
    
    // Format ad views
    const formattedViews = adViews.map(view => ({
      id: view.id,
      adType: view.ad_type,
      adId: view.ad_id,
      rewardTimeSeconds: view.reward_time_seconds,
      rewardTimeHours: view.reward_time_seconds / 3600,
      createdAt: view.created_at
    }));
    
    return res.status(200).json({
      success: true,
      adViews: {
        data: formattedViews,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching ad history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching ad history' 
    });
  }
});

// Helper functions

/**
 * Get daily mining limit based on level
 * @param {number} level - Mining level
 * @returns {number} Daily mining limit in seconds
 */
async function getDailyMiningLimit(level) {
  try {
    const { data, error } = await supabase.rpc('get_daily_mining_limit', {
      mining_level: level
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting daily mining limit:', error);
    
    // Fallback to local calculation if RPC fails
    // Base daily limit is 3 hours (10800 seconds)
    // Each 10 levels adds 1 hour (3600 seconds) with max of 12 hours (43200 seconds)
    return Math.min(10800 + (Math.floor((level - 1) / 10) * 3600), 43200);
  }
}

/**
 * Get daily used mining time for a user
 * @param {string} userId - User ID
 * @returns {number} Used mining time today in seconds
 */
async function getDailyUsedMiningTime(userId) {
  try {
    // Check if there's an existing record for today
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_stats')
      .select('mining_time_seconds')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data ? data.mining_time_seconds : 0;
  } catch (error) {
    console.error('Error getting daily used mining time:', error);
    return 0;
  }
}

export default router; 