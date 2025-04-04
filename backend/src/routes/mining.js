import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all mining routes
router.use(authenticate);

/**
 * @route GET /api/mining/status
 * @desc Get user's mining status
 * @access Private
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching mining status' 
      });
    }
    
    // Calculate mining rate based on level
    const miningRate = await calculateMiningRate(userData.mining_level);
    
    // Calculate upgrade requirement
    const upgradeRequirement = await calculateUpgradeCost(userData.mining_level);
    
    // Check if mining is active
    const isActive = userData.mining_start_time && userData.mining_end_time && 
                     new Date(userData.mining_end_time) > new Date();
    
    // Calculate remaining time in current session if active
    let remainingSessionSeconds = 0;
    let sessionDurationSeconds = 0;
    
    if (isActive) {
      const currentTime = new Date();
      const endTime = new Date(userData.mining_end_time);
      remainingSessionSeconds = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      
      const startTime = new Date(userData.mining_start_time);
      sessionDurationSeconds = Math.floor((endTime - startTime) / 1000);
    }
    
    // Calculate available mining time
    const availableMiningSeconds = await getAvailableMiningTime(userId);
    
    // Calculate daily mining limit based on level
    const dailyMiningLimit = await getDailyMiningLimit(userData.mining_level);
    
    // Check if user can upgrade mining level
    const canUpgrade = userData.wallet_balance >= upgradeRequirement;
    
    // Format the response
    const miningStatus = {
      isActive,
      miningLevel: userData.mining_level,
      miningRate,
      availableMiningSeconds,
      remainingDailySeconds: dailyMiningLimit,
      maxDailyMiningHours: Math.floor(dailyMiningLimit / 3600),
      pendingRewards: parseFloat(userData.pending_rewards || 0),
      walletBalance: parseFloat(userData.wallet_balance || 0),
      upgradeRequirement,
      canUpgrade,
      remainingSessionSeconds,
      sessionDurationSeconds
    };
    
    return res.status(200).json({
      success: true,
      miningStatus
    });
    
  } catch (error) {
    console.error('Error fetching mining status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching mining status' 
    });
  }
});

/**
 * @route POST /api/mining/start
 * @desc Start mining session
 * @access Private
 */
router.post('/start', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error starting mining session' 
      });
    }
    
    // Check if mining is already active
    if (userData.mining_start_time && userData.mining_end_time && 
        new Date(userData.mining_end_time) > new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mining session already active' 
      });
    }
    
    // Check if user has available mining time
    if (userData.mining_time_seconds <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No mining time available. Watch ads to earn more mining time.' 
      });
    }
    
    // Check daily mining limit
    const dailyLimit = await getDailyMiningLimit(userData.mining_level);
    if (dailyLimit <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Daily mining limit reached. Come back tomorrow.' 
      });
    }
    
    // Calculate session duration (min of available time and daily limit)
    const sessionDuration = Math.min(userData.mining_time_seconds, dailyLimit);
    
    // Set mining start and end times
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (sessionDuration * 1000));
    
    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mining_start_time: startTime,
        mining_end_time: endTime,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user mining session:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error starting mining session' 
      });
    }
    
    // Create mining session record
    const { error: sessionError } = await supabase
      .from('mining_sessions')
      .insert([{
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        mining_level: userData.mining_level,
        duration_hours: sessionDuration / 3600,
        is_active: true
      }]);
      
    if (sessionError) {
      console.error('Error creating mining session record:', sessionError);
      // Continue despite error as the user session is already updated
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mining session started',
      startTime,
      endTime,
      durationSeconds: sessionDuration
    });
    
  } catch (error) {
    console.error('Error starting mining session:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error starting mining session' 
    });
  }
});

/**
 * @route POST /api/mining/stop
 * @desc Stop mining session and collect rewards
 * @access Private
 */
router.post('/stop', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error stopping mining session' 
      });
    }
    
    // Check if mining is active
    if (!userData.mining_start_time || !userData.mining_end_time || 
        new Date(userData.mining_start_time) > new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'No active mining session' 
      });
    }
    
    // Calculate mining duration and rewards
    const startTime = new Date(userData.mining_start_time);
    const currentTime = new Date();
    const endTime = new Date(userData.mining_end_time);
    
    // Use the earlier of current time or scheduled end time
    const actualEndTime = currentTime < endTime ? currentTime : endTime;
    
    // Calculate duration in seconds
    const durationSeconds = Math.floor((actualEndTime - startTime) / 1000);
    
    // Calculate rewards based on duration and mining rate
    const miningRate = await calculateMiningRate(userData.mining_level);
    const rewardAmount = (miningRate / 3600) * durationSeconds;
    
    // Update user record with rewards and reset mining session
    const { error: updateError } = await supabase
      .from('users')
      .update({
        pending_rewards: userData.pending_rewards + rewardAmount,
        mining_time_seconds: Math.max(0, userData.mining_time_seconds - durationSeconds),
        mining_start_time: null,
        mining_end_time: null,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user mining session:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error stopping mining session' 
      });
    }
    
    // Update mining session record
    const { data: sessions, error: sessionQueryError } = await supabase
      .from('mining_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('start_time', { ascending: false })
      .limit(1);
      
    if (!sessionQueryError && sessions && sessions.length > 0) {
      const sessionId = sessions[0].id;
      
      await supabase
        .from('mining_sessions')
        .update({
          end_time: actualEndTime,
          duration_hours: durationSeconds / 3600,
          reward: rewardAmount,
          is_active: false
        })
        .eq('id', sessionId);
    }
    
    // Create mining reward record
    await supabase
      .from('mining_rewards')
      .insert([{
        user_id: userId,
        amount: rewardAmount,
        mining_level: userData.mining_level,
        duration_seconds: durationSeconds
      }]);
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's an existing record for today
    const { data: existingStat, error: statQueryError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (!statQueryError && existingStat) {
      // Update existing record
      await supabase
        .from('daily_stats')
        .update({
          mining_time_seconds: existingStat.mining_time_seconds + durationSeconds,
          rewards_earned: existingStat.rewards_earned + rewardAmount
        })
        .eq('id', existingStat.id);
    } else {
      // Create new record
      await supabase
        .from('daily_stats')
        .insert([{
          user_id: userId,
          date: today,
          mining_time_seconds: durationSeconds,
          rewards_earned: rewardAmount
        }]);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mining session stopped',
      durationSeconds,
      rewardAmount
    });
    
  } catch (error) {
    console.error('Error stopping mining session:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error stopping mining session' 
    });
  }
});

/**
 * @route POST /api/mining/collect
 * @desc Collect pending rewards
 * @access Private
 */
router.post('/collect', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error collecting rewards' 
      });
    }
    
    // Check if there are pending rewards
    if (!userData.pending_rewards || userData.pending_rewards <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pending rewards to collect' 
      });
    }
    
    const pendingAmount = parseFloat(userData.pending_rewards);
    const currentBalance = parseFloat(userData.wallet_balance || 0);
    
    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: currentBalance + pendingAmount,
        pending_rewards: 0,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user balance:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error collecting rewards' 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rewards collected successfully',
      collectedAmount: pendingAmount,
      newBalance: currentBalance + pendingAmount
    });
    
  } catch (error) {
    console.error('Error collecting rewards:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error collecting rewards' 
    });
  }
});

/**
 * @route POST /api/mining/upgrade
 * @desc Upgrade mining level
 * @access Private
 */
router.post('/upgrade', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error upgrading mining level' 
      });
    }
    
    // Calculate upgrade cost
    const currentLevel = userData.mining_level;
    const upgradeCost = await calculateUpgradeCost(currentLevel);
    
    // Check if user has enough balance
    if (userData.wallet_balance < upgradeCost) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance to upgrade mining level' 
      });
    }
    
    const newLevel = currentLevel + 1;
    const newBalance = parseFloat(userData.wallet_balance) - upgradeCost;
    
    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mining_level: newLevel,
        wallet_balance: newBalance,
        updated_at: new Date()
      })
      .eq('id', userId);
      
    if (updateError) {
      console.error('Error updating user level:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Error upgrading mining level' 
      });
    }
    
    // Record upgrade in history
    const { error: historyError } = await supabase
      .from('mining_upgrades')
      .insert([{
        user_id: userId,
        old_level: currentLevel,
        new_level: newLevel,
        cost: upgradeCost
      }]);
      
    if (historyError) {
      console.error('Error recording upgrade history:', historyError);
      // Continue despite error as the user level is already updated
    }
    
    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    
    // Check if there's an existing record for today
    const { data: existingStat, error: statQueryError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();
    
    if (!statQueryError && existingStat) {
      // Update existing record
      await supabase
        .from('daily_stats')
        .update({
          level_ups: existingStat.level_ups + 1
        })
        .eq('id', existingStat.id);
    } else {
      // Create new record
      await supabase
        .from('daily_stats')
        .insert([{
          user_id: userId,
          date: today,
          level_ups: 1
        }]);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Mining level upgraded successfully',
      oldLevel: currentLevel,
      newLevel,
      cost: upgradeCost,
      newBalance
    });
    
  } catch (error) {
    console.error('Error upgrading mining level:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error upgrading mining level' 
    });
  }
});

/**
 * @route GET /api/mining/rewards
 * @desc Get user's mining rewards history
 * @access Private
 */
router.get('/rewards', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    // Get rewards history
    const { data: rewards, error, count } = await supabase
      .from('mining_rewards')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching rewards history:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching rewards history' 
      });
    }
    
    // Format rewards
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      amount: parseFloat(reward.amount),
      miningLevel: reward.mining_level,
      durationSeconds: reward.duration_seconds,
      durationHours: reward.duration_seconds / 3600,
      createdAt: reward.created_at
    }));
    
    return res.status(200).json({
      success: true,
      rewards: {
        data: formattedRewards,
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching rewards history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching rewards history' 
    });
  }
});

// Helper functions

/**
 * Calculate mining rate based on level
 * @param {number} level - Mining level
 * @returns {number} Mining rate in coins per hour
 */
async function calculateMiningRate(level) {
  try {
    const { data, error } = await supabase.rpc('calculate_mining_rate', {
      mining_level: level
    });
    
    if (error) throw error;
    
    return parseFloat(data);
  } catch (error) {
    console.error('Error calculating mining rate:', error);
    
    // Fallback to local calculation if RPC fails
    const baseRate = 0.000100; // 0.0001 coins per hour
    const levelMultiplier = 1 + ((level - 1) * 0.05); // 5% increase per level
    
    return baseRate * levelMultiplier;
  }
}

/**
 * Calculate upgrade cost based on current level
 * @param {number} currentLevel - Current mining level
 * @returns {number} Cost to upgrade to the next level
 */
async function calculateUpgradeCost(currentLevel) {
  try {
    const { data, error } = await supabase.rpc('calculate_upgrade_cost', {
      current_level: currentLevel
    });
    
    if (error) throw error;
    
    return parseFloat(data);
  } catch (error) {
    console.error('Error calculating upgrade cost:', error);
    
    // Fallback to local calculation if RPC fails
    const baseCost = 0.001; // Base cost for level 1 to 2
    const exponentialFactor = 1.8; // Cost increases exponentially
    
    return baseCost * (Math.pow(exponentialFactor, currentLevel));
  }
}

/**
 * Get available mining time for a user
 * @param {string} userId - User ID
 * @returns {number} Available mining time in seconds
 */
async function getAvailableMiningTime(userId) {
  try {
    const { data, error } = await supabase.rpc('get_available_mining_time', {
      user_id: userId
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error getting available mining time:', error);
    
    // Fallback to fetching user data if RPC fails
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('mining_time_seconds, mining_start_time, mining_end_time')
      .eq('id', userId)
      .single();
      
    if (userError) throw userError;
    
    // If not mining, return full mining time
    if (!userData.mining_start_time || !userData.mining_end_time) {
      return userData.mining_time_seconds;
    }
    
    // If mining is active, calculate remaining time
    const currentTime = new Date();
    const startTime = new Date(userData.mining_start_time);
    const endTime = new Date(userData.mining_end_time);
    
    // If mining session is over, return full mining time
    if (currentTime > endTime) {
      return userData.mining_time_seconds;
    }
    
    // Calculate used time
    const usedTimeSeconds = Math.floor((currentTime - startTime) / 1000);
    
    // Return remaining time
    return Math.max(0, userData.mining_time_seconds - usedTimeSeconds);
  }
}

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

export default router; 