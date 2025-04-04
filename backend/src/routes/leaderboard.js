import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/leaderboard
 * @desc Get leaderboard data by timeframe
 * @access Public (no authentication required for leaderboard)
 */
router.get('/', async (req, res) => {
  try {
    const { timeframe = 'daily', limit = 20 } = req.query;
    
    // Validate timeframe parameter
    const validTimeframes = ['daily', 'weekly', 'monthly', 'alltime'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid timeframe parameter. Must be one of: daily, weekly, monthly, alltime' 
      });
    }
    
    // Parse limit parameter
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid limit parameter. Must be a number between 1 and 100' 
      });
    }
    
    let leaderboardData = [];
    
    if (timeframe === 'daily') {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Query daily stats for today
      const { data, error } = await supabase
        .from('daily_stats')
        .select(`
          user_id,
          rewards_earned,
          users!inner (
            id,
            username,
            first_name,
            last_name,
            photo_url,
            mining_level
          )
        `)
        .eq('date', today)
        .order('rewards_earned', { ascending: false })
        .limit(parsedLimit);
        
      if (error) {
        console.error('Error fetching daily leaderboard:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching leaderboard data' 
        });
      }
      
      // Format the daily leaderboard data
      leaderboardData = data.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: item.users.username,
        firstName: item.users.first_name,
        lastName: item.users.last_name,
        photoUrl: item.users.photo_url,
        miningLevel: item.users.mining_level,
        rewardAmount: parseFloat(item.rewards_earned || 0)
      }));
      
    } else if (timeframe === 'weekly') {
      // Calculate date for 7 days ago
      const date = new Date();
      date.setDate(date.getDate() - 7);
      const weekAgo = date.toISOString().split('T')[0];
      
      // Query weekly stats (sum of last 7 days)
      const { data, error } = await supabase
        .from('daily_stats')
        .select(`
          user_id,
          users!inner (
            id,
            username,
            first_name,
            last_name,
            photo_url,
            mining_level
          )
        `)
        .gte('date', weekAgo)
        .order('user_id')
        .limit(500); // Fetch more to aggregate
        
      if (error) {
        console.error('Error fetching weekly leaderboard:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching leaderboard data' 
        });
      }
      
      // Aggregate rewards by user
      const aggregatedData = {};
      
      for (const item of data) {
        const userId = item.user_id;
        
        if (!aggregatedData[userId]) {
          aggregatedData[userId] = {
            user_id: userId,
            username: item.users.username,
            first_name: item.users.first_name,
            last_name: item.users.last_name,
            photo_url: item.users.photo_url,
            mining_level: item.users.mining_level,
            total_rewards: 0
          };
        }
        
        // Fetch and sum rewards for this user in the date range
        const { data: rewards, error: rewardsError } = await supabase
          .from('daily_stats')
          .select('rewards_earned')
          .eq('user_id', userId)
          .gte('date', weekAgo);
          
        if (!rewardsError && rewards) {
          aggregatedData[userId].total_rewards = rewards.reduce(
            (sum, item) => sum + parseFloat(item.rewards_earned || 0), 
            0
          );
        }
      }
      
      // Convert to array and sort by rewards
      const sortedData = Object.values(aggregatedData)
        .sort((a, b) => b.total_rewards - a.total_rewards)
        .slice(0, parsedLimit);
      
      // Format the weekly leaderboard data
      leaderboardData = sortedData.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: item.username,
        firstName: item.first_name,
        lastName: item.last_name,
        photoUrl: item.photo_url,
        miningLevel: item.mining_level,
        rewardAmount: item.total_rewards
      }));
      
    } else if (timeframe === 'monthly') {
      // Calculate date for 30 days ago
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const monthAgo = date.toISOString().split('T')[0];
      
      // Query monthly stats (sum of last 30 days)
      const { data, error } = await supabase
        .from('daily_stats')
        .select(`
          user_id,
          users!inner (
            id,
            username,
            first_name,
            last_name,
            photo_url,
            mining_level
          )
        `)
        .gte('date', monthAgo)
        .order('user_id')
        .limit(500); // Fetch more to aggregate
        
      if (error) {
        console.error('Error fetching monthly leaderboard:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching leaderboard data' 
        });
      }
      
      // Aggregate rewards by user
      const aggregatedData = {};
      
      for (const item of data) {
        const userId = item.user_id;
        
        if (!aggregatedData[userId]) {
          aggregatedData[userId] = {
            user_id: userId,
            username: item.users.username,
            first_name: item.users.first_name,
            last_name: item.users.last_name,
            photo_url: item.users.photo_url,
            mining_level: item.users.mining_level,
            total_rewards: 0
          };
        }
        
        // Fetch and sum rewards for this user in the date range
        const { data: rewards, error: rewardsError } = await supabase
          .from('daily_stats')
          .select('rewards_earned')
          .eq('user_id', userId)
          .gte('date', monthAgo);
          
        if (!rewardsError && rewards) {
          aggregatedData[userId].total_rewards = rewards.reduce(
            (sum, item) => sum + parseFloat(item.rewards_earned || 0), 
            0
          );
        }
      }
      
      // Convert to array and sort by rewards
      const sortedData = Object.values(aggregatedData)
        .sort((a, b) => b.total_rewards - a.total_rewards)
        .slice(0, parsedLimit);
      
      // Format the monthly leaderboard data
      leaderboardData = sortedData.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: item.username,
        firstName: item.first_name,
        lastName: item.last_name,
        photoUrl: item.photo_url,
        miningLevel: item.mining_level,
        rewardAmount: item.total_rewards
      }));
      
    } else {
      // All-time leaderboard
      const { data, error } = await supabase
        .from('mining_rewards')
        .select(`
          user_id,
          users!inner (
            id,
            username,
            first_name,
            last_name,
            photo_url,
            mining_level
          )
        `)
        .order('user_id')
        .limit(500); // Fetch more to aggregate
        
      if (error) {
        console.error('Error fetching all-time leaderboard:', error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching leaderboard data' 
        });
      }
      
      // Aggregate rewards by user
      const aggregatedData = {};
      
      for (const item of data) {
        const userId = item.user_id;
        
        if (!aggregatedData[userId]) {
          aggregatedData[userId] = {
            user_id: userId,
            username: item.users.username,
            first_name: item.users.first_name,
            last_name: item.users.last_name,
            photo_url: item.users.photo_url,
            mining_level: item.users.mining_level,
            total_rewards: 0
          };
        }
        
        // Fetch and sum rewards for this user
        const { data: rewards, error: rewardsError } = await supabase
          .from('mining_rewards')
          .select('amount')
          .eq('user_id', userId);
          
        if (!rewardsError && rewards) {
          aggregatedData[userId].total_rewards = rewards.reduce(
            (sum, item) => sum + parseFloat(item.amount || 0), 
            0
          );
        }
      }
      
      // Convert to array and sort by rewards
      const sortedData = Object.values(aggregatedData)
        .sort((a, b) => b.total_rewards - a.total_rewards)
        .slice(0, parsedLimit);
      
      // Format the all-time leaderboard data
      leaderboardData = sortedData.map((item, index) => ({
        rank: index + 1,
        userId: item.user_id,
        username: item.username,
        firstName: item.first_name,
        lastName: item.last_name,
        photoUrl: item.photo_url,
        miningLevel: item.mining_level,
        rewardAmount: item.total_rewards
      }));
    }
    
    return res.status(200).json({
      success: true,
      timeframe,
      leaderboard: {
        data: leaderboardData,
        total: leaderboardData.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching leaderboard data' 
    });
  }
});

/**
 * @route GET /api/leaderboard/rank
 * @desc Get user's rank in the leaderboard
 * @access Private
 */
router.get('/rank', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'daily' } = req.query;
    
    // Validate timeframe parameter
    const validTimeframes = ['daily', 'weekly', 'monthly', 'alltime'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid timeframe parameter. Must be one of: daily, weekly, monthly, alltime' 
      });
    }
    
    let userRank = null;
    let totalUsers = 0;
    let userRewards = 0;
    
    if (timeframe === 'daily') {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get count of users with rewards today
      const { count } = await supabase
        .from('daily_stats')
        .select('*', { count: 'exact' })
        .eq('date', today)
        .gt('rewards_earned', 0);
        
      totalUsers = count || 0;
      
      // Get user's rewards for today
      const { data: userData, error: userError } = await supabase
        .from('daily_stats')
        .select('rewards_earned')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
        
      if (!userError && userData) {
        userRewards = parseFloat(userData.rewards_earned || 0);
        
        // Count users with more rewards than this user
        const { count: higherRanked } = await supabase
          .from('daily_stats')
          .select('*', { count: 'exact' })
          .eq('date', today)
          .gt('rewards_earned', userRewards);
          
        userRank = higherRanked + 1;
      }
      
    } else if (timeframe === 'alltime') {
      // For all time, we need to aggregate all mining rewards
      
      // Get user's total rewards
      const { data: userRewardsData, error: userError } = await supabase
        .from('mining_rewards')
        .select('amount')
        .eq('user_id', userId);
        
      if (!userError && userRewardsData) {
        userRewards = userRewardsData.reduce(
          (sum, item) => sum + parseFloat(item.amount || 0),
          0
        );
        
        // This is more complex and would require a custom SQL query
        // For simplicity, we'll just return null for all-time rank
        userRank = null;
      }
    }
    
    return res.status(200).json({
      success: true,
      timeframe,
      rank: userRank,
      totalUsers,
      rewards: userRewards
    });
    
  } catch (error) {
    console.error('Error fetching user rank:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching user rank' 
    });
  }
});

export default router; 