import axios from 'axios';

// Get API URL from environment variables, fallback to default if not available
const API_URL = import.meta.env.VITE_API_URL || 'https://cosmofybot1-18d79623b815.herokuapp.com/api';
// SKIP_AUTH'u false olarak zorluyoruz, bunu hiçbir şekilde etkinleştirmeyeceğiz
const SKIP_AUTH = false;

// Debug log to see what URL is being used
console.log('API URL:', API_URL);
console.log('Skip Auth:', SKIP_AUTH);

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  timeout: 30000,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN'
});

// Add a request interceptor to add the auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Mock data for development and testing
const mockMiningStatus = {
  success: true,
  miningStatus: {
    isActive: false,
    miningLevel: 5,
    miningRate: 10,
    balance: 1000,
    pendingReward: 0,
    availableMiningSeconds: 3600,
    remainingDailySeconds: 7200,
    sessionDurationSeconds: 900,
    remainingSessionSeconds: 0,
    lastMiningTime: new Date().toISOString(),
    upgradeCost: 500
  }
};

// Authentication
export const authenticateUser = async (telegramData) => {
  // Debug için telegramData içeriğini logla
  console.log('Auth request payload:', JSON.stringify(telegramData, null, 2));
  
  // If SKIP_AUTH is true, return a mock successful auth
  if (SKIP_AUTH) {
    console.log('Bypassing authentication with mock data (SKIP_AUTH=true)');
    return {
      success: true,
      user: {
        id: 12345,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        language_code: 'en',
        balance: 1000,
        level: 5,
        mining_rate: 10,
        is_mining: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      token: 'mock-jwt-token-for-development'
    };
  }

  try {
    console.log('Sending auth request to:', `${API_URL}/auth/login`);
    const response = await apiClient.post('/auth/login', telegramData);
    console.log('Auth response:', response.data);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Daha detaylı hata log'ları
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Authentication failed',
      error: error.message
    };
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};

// User Profile
export const getUserProfile = async () => {
  if (SKIP_AUTH) {
    return {
      success: true,
      user: {
        id: 12345,
        first_name: 'Dev',
        last_name: 'User',
        username: 'devuser',
        language_code: 'en',
        balance: 1000,
        level: 5,
        mining_rate: 10,
        is_mining: false
      }
    };
  }

  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch profile' };
  }
};

// Mining Operations
export const startMining = async () => {
  if (SKIP_AUTH) {
    mockMiningStatus.miningStatus.isActive = true;
    mockMiningStatus.miningStatus.remainingSessionSeconds = mockMiningStatus.miningStatus.sessionDurationSeconds;
    mockMiningStatus.miningStatus.lastMiningTime = new Date().toISOString();
    return { success: true, message: 'Mining started successfully' };
  }

  try {
    const response = await apiClient.post('/mining/start');
    return response.data;
  } catch (error) {
    console.error('Error starting mining:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to start mining' };
  }
};

export const stopMining = async () => {
  if (SKIP_AUTH) {
    mockMiningStatus.miningStatus.isActive = false;
    mockMiningStatus.miningStatus.pendingReward += 100; // Mock reward
    return { success: true, message: 'Mining stopped successfully' };
  }

  try {
    const response = await apiClient.post('/mining/stop');
    return response.data;
  } catch (error) {
    console.error('Error stopping mining:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to stop mining' };
  }
};

export const getMiningStatus = async () => {
  if (SKIP_AUTH) {
    return mockMiningStatus;
  }

  try {
    const response = await apiClient.get('/mining/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching mining status:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch mining status' };
  }
};

export const collectReward = async () => {
  if (SKIP_AUTH) {
    mockMiningStatus.miningStatus.balance += mockMiningStatus.miningStatus.pendingReward;
    mockMiningStatus.miningStatus.pendingReward = 0;
    return { 
      success: true, 
      message: 'Reward collected successfully',
      reward: 100,
      newBalance: mockMiningStatus.miningStatus.balance
    };
  }

  try {
    const response = await apiClient.post('/mining/collect');
    return response.data;
  } catch (error) {
    console.error('Error collecting reward:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to collect reward' };
  }
};

export const upgradeLevel = async () => {
  if (SKIP_AUTH) {
    if (mockMiningStatus.miningStatus.balance >= mockMiningStatus.miningStatus.upgradeCost) {
      mockMiningStatus.miningStatus.balance -= mockMiningStatus.miningStatus.upgradeCost;
      mockMiningStatus.miningStatus.miningLevel += 1;
      mockMiningStatus.miningStatus.miningRate += 5;
      mockMiningStatus.miningStatus.upgradeCost *= 1.5;
      return { 
        success: true, 
        message: 'Mining level upgraded successfully',
        newLevel: mockMiningStatus.miningStatus.miningLevel,
        newMiningRate: mockMiningStatus.miningStatus.miningRate,
        newBalance: mockMiningStatus.miningStatus.balance
      };
    } else {
      return { success: false, message: 'Insufficient funds for upgrading' };
    }
  }

  try {
    const response = await apiClient.post('/mining/upgrade');
    return response.data;
  } catch (error) {
    console.error('Error upgrading level:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to upgrade level' };
  }
};

export const getMiningRewards = async () => {
  if (SKIP_AUTH) {
    return { 
      success: true, 
      rewards: {
        items: [
          { 
            id: 1, 
            reward_time: new Date().toISOString(), 
            amount: 100, 
            mining_level: 5,
            duration_hours: 2.5
          },
          { 
            id: 2, 
            reward_time: new Date(Date.now() - 86400000).toISOString(), 
            amount: 200, 
            mining_level: 4,
            duration_hours: 3.0
          },
          { 
            id: 3, 
            reward_time: new Date(Date.now() - 172800000).toISOString(), 
            amount: 150, 
            mining_level: 3,
            duration_hours: 1.5
          }
        ],
        total: 3
      }
    };
  }

  try {
    const response = await apiClient.get('/mining/rewards');
    return response.data;
  } catch (error) {
    console.error('Error fetching mining rewards:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch mining rewards' };
  }
};

// Advertisement
export const watchAdvertisement = async () => {
  if (SKIP_AUTH) {
    mockMiningStatus.miningStatus.availableMiningSeconds += 900;
    return { success: true, message: 'Advertisement watched successfully' };
  }

  try {
    const response = await apiClient.post('/ads/watch');
    return response.data;
  } catch (error) {
    console.error('Error watching advertisement:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to process advertisement' };
  }
};

export const getEligibleAds = async () => {
  if (SKIP_AUTH) {
    return { 
      success: true, 
      ads: [
        { id: 1, type: 'video', reward: 15, duration: 30 },
        { id: 2, type: 'banner', reward: 10, duration: 15 }
      ]
    };
  }

  try {
    const response = await apiClient.get('/ads/eligible');
    return response.data;
  } catch (error) {
    console.error('Error fetching eligible ads:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to fetch eligible ads' };
  }
};

// Leaderboard
export const getLeaderboard = async (timeframe = 'daily', limit = 20) => {
  if (SKIP_AUTH) {
    const mockUsers = Array(limit).fill(0).map((_, index) => ({
      id: 1000 + index,
      username: `user${index}`,
      first_name: `User ${index}`,
      score: 1000 - (index * 50),
      rank: index + 1
    }));
    
    return { 
      success: true, 
      leaderboard: {
        data: mockUsers,
        total: mockUsers.length,
        page: 1,
        limit
      }
    };
  }

  try {
    const response = await apiClient.get(`/leaderboard?timeframe=${timeframe}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to get leaderboard' };
  }
};

export const getUserRank = async (timeframe = 'daily') => {
  if (SKIP_AUTH) {
    return { 
      success: true, 
      userRank: {
        rank: 5,
        score: 750,
        total_users: 100,
        timeframe
      }
    };
  }

  try {
    const response = await apiClient.get(`/leaderboard/rank?timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error('Get user rank error:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to get user rank' };
  }
};

export default {
  authenticateUser,
  logout,
  getUserProfile,
  startMining,
  stopMining,
  getMiningStatus,
  collectReward,
  upgradeLevel,
  getMiningRewards,
  watchAdvertisement,
  getEligibleAds,
  getLeaderboard,
  getUserRank,
}; 