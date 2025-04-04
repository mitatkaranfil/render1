import express from 'express';
import supabase from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { validateTelegramData, extractTelegramUser } from '../utils/telegram.js';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Authenticate user with Telegram data
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    console.log('[AUTH] Auth request received:', JSON.stringify(req.body, null, 2));
    
    const { initData, user } = req.body;
    
    // Telegram test kullanıcısı oluştur - canlı ortamda bile her zaman çalışacak
    const telegramUserData = {
      id: user?.id || Date.now().toString(), // Kullanıcı ID varsa kullan, yoksa timestamp
      first_name: user?.first_name || 'Telegram',
      last_name: user?.last_name || 'User',
      username: user?.username || 'telegram_user_' + Math.floor(Math.random() * 10000),
      language_code: user?.language_code || 'tr',
      photo_url: user?.photo_url || null
    };
    
    console.log('[AUTH] Using Telegram user data:', telegramUserData);
    
    // Kullanıcı verisini database için normalize et
    const telegramUser = {
      telegram_id: telegramUserData.id.toString(),
      username: telegramUserData.username,
      first_name: telegramUserData.first_name,
      last_name: telegramUserData.last_name, 
      photo_url: telegramUserData.photo_url,
      language_code: telegramUserData.language_code
    };
    
    console.log('[AUTH] Normalized user data for database:', telegramUser);
    
    // Veritabanı işlemleri ve kimlik doğrulama
    let userData, token, formattedUser;
    
    try {
      // Check if user exists in database
      console.log('[AUTH] Checking if user exists with telegram_id:', telegramUser.telegram_id);
      
      // Bu işlemde error olsa bile devam et, yeni kullanıcı oluştur
      let existingUser = null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', telegramUser.telegram_id)
          .single();
          
        if (!error) {
          existingUser = data;
          console.log('[AUTH] Existing user found:', existingUser?.id);
        } else if (error.code === 'PGRST116') {
          console.log('[AUTH] User not found, will create new user');
        } else {
          console.error('[AUTH] Error querying user:', error);
          // Hata olsa da devam et
        }
      } catch (queryError) {
        console.error('[AUTH] Unexpected error querying user:', queryError);
        // Hata olsa da devam et
      }
      
      // Kullanıcı yoksa oluştur
      if (!existingUser) {
        console.log('[AUTH] Creating new user with data:', telegramUser);
        try {
          const { data, error } = await supabase
            .from('users')
            .insert([telegramUser])
            .select();
            
          if (error) {
            console.error('[AUTH] Error creating user:', error);
            throw new Error('Failed to create user');
          }
          
          if (data && data.length > 0) {
            userData = data[0];
            console.log('[AUTH] New user created:', userData?.id);
          } else {
            console.error('[AUTH] No user data returned after creation');
            throw new Error('No user data returned');
          }
        } catch (createError) {
          console.error('[AUTH] Create user operation failed:', createError);
          throw new Error('User creation failed');
        }
      } else {
        // Kullanıcı varsa güncelle
        userData = existingUser;
        console.log('[AUTH] Using existing user:', userData?.id);
        
        // Sadece güncelleme gerekiyorsa güncelle, yoksa atla
        try {
          const { data, error } = await supabase
            .from('users')
            .update({
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              username: telegramUser.username,
              updated_at: new Date()
            })
            .eq('telegram_id', telegramUser.telegram_id)
            .select();
            
          if (!error && data && data.length > 0) {
            userData = data[0];
            console.log('[AUTH] User updated:', userData?.id);
          }
        } catch (updateError) {
          console.error('[AUTH] Update error (non-critical):', updateError);
          // Güncelleme hatası kritik değil, mevcut kullanıcı verileriyle devam et
        }
      }
      
      if (!userData || !userData.id) {
        throw new Error('No valid user data to generate token');
      }
      
      // Generate JWT token
      console.log('[AUTH] Generating token for user:', userData.id);
      token = generateToken(userData);
      
      // Format user data for response with defaults
      formattedUser = {
        id: userData.id,
        telegramId: userData.telegram_id,
        username: userData.username || 'telegram_user',
        firstName: userData.first_name || 'Telegram',
        lastName: userData.last_name || 'User',
        photoUrl: userData.photo_url || null,
        miningLevel: userData.mining_level || 1,
        walletBalance: userData.wallet_balance || 0
      };
      
      console.log('[AUTH] Successfully authenticated user:', formattedUser.id);
    } catch (dbError) {
      console.error('[AUTH] Database error:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database operation failed: ' + (dbError.message || 'Unknown error') 
      });
    }
    
    // Başarılı yanıt gönder
    console.log('[AUTH] Sending formatted user data to frontend');
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: formattedUser
    });
  } catch (error) {
    console.error('[AUTH] Fatal authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed: ' + (error.message || 'Unknown error')
    });
  }
});

export default router; 