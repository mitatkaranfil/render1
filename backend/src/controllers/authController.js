const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const supabase = require('../utils/supabase');

/**
 * Authenticate user via Telegram credentials
 */
exports.authenticateTelegram = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  try {
    const { telegramId, initData, username, firstName, lastName, photoUrl } = req.body;
    
    // Verify Telegram initData - in a real implementation, this would validate
    // the initData from Telegram to ensure it's authentic
    // This is a simplified version for demonstration
    
    // Check if user exists in the database
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error fetching user:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error accessing user database' 
      });
    }
    
    // If user doesn't exist, create a new one
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          { 
            telegram_id: telegramId,
            username: username || '',
            first_name: firstName || '',
            last_name: lastName || '',
            photo_url: photoUrl || '',
            mining_level: 1,
            level_upgrade_ads_watched: 0,
            daily_level_upgrades: 0,
            mining_time_remaining: 0,
            daily_mining_time_used: 0,
            last_daily_reset: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ 
          success: false, 
          message: 'Error creating user account' 
        });
      }
      
      user = newUser;
    }
    
    // Check if daily stats need to be reset
    const today = new Date().toISOString().split('T')[0];
    const lastReset = user.last_daily_reset ? user.last_daily_reset.split('T')[0] : null;
    
    if (lastReset !== today) {
      // Reset daily stats
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          daily_mining_time_used: 0,
          daily_level_upgrades: 0,
          last_daily_reset: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error resetting daily stats:', updateError);
      }
      
      // Update user object
      user.daily_mining_time_used = 0;
      user.daily_level_upgrades = 0;
      user.last_daily_reset = new Date().toISOString();
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, telegramId: user.telegram_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        miningLevel: user.mining_level,
        levelUpgradeAdsWatched: user.level_upgrade_ads_watched,
        dailyLevelUpgrades: user.daily_level_upgrades,
        miningTimeRemaining: user.mining_time_remaining,
        dailyMiningTimeUsed: user.daily_mining_time_used
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

/**
 * Verify JWT token
 */
exports.verifyToken = async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token is required' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or token is invalid' 
      });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        miningLevel: user.mining_level,
        levelUpgradeAdsWatched: user.level_upgrade_ads_watched,
        dailyLevelUpgrades: user.daily_level_upgrades,
        miningTimeRemaining: user.mining_time_remaining,
        dailyMiningTimeUsed: user.daily_mining_time_used
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error in token verification' 
    });
  }
}; 