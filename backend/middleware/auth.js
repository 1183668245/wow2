const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { database } = require('../database/init');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

   
const isValidWalletAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

   
const generateToken = (walletAddress) => {
  return jwt.sign(
    { walletAddress },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

   
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

   
const getOrCreateUser = async (walletAddress, inviteCode = null) => {
  return new Promise((resolve, reject) => {
    const db = database.getDb();
    
    db.get(
      'SELECT id, wallet_address, nickname, avatar_file, lyrics_file, music_file, points FROM users WHERE wallet_address = ?',
      [walletAddress],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row) {
             
          resolve({
            id: row.id,
            walletAddress: row.wallet_address,
            nickname: row.nickname,
            avatarFile: row.avatar_file,
            lyricsFile: row.lyrics_file,
            musicFile: row.music_file,
            points: row.points
          });
        } else {
             
          const shareCode = generateShareCode();
          
          db.run(
            'INSERT INTO users (wallet_address, nickname, points, share_code) VALUES (?, ?, ?, ?)',
            [walletAddress, walletAddress, 5, shareCode],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              const newUserId = this.lastID;
              
                 
              if (inviteCode) {
                db.get(
                  'SELECT id FROM users WHERE share_code = ?',
                  [inviteCode],
                  (err, inviter) => {
                    if (!err && inviter) {
                         
                      db.run(
                        'UPDATE users SET points = points + 10 WHERE id = ?',
                        [inviter.id],
                        (err) => {
                          if (!err) {
                               
                            db.run(
                              'INSERT INTO point_rewards (user_id, action_type, points, description) VALUES (?, ?, ?, ?)',
                              [inviter.id, 'invite_register', 10, `邀请用户 ${walletAddress} 注册`],
                              (err) => {
                                if (err) console.error('Failed to record invite reward:', err);
                              }
                            );
                          }
                        }
                      );
                      
                         
                      db.run(
                        'INSERT OR REPLACE INTO share_stats (user_id, invited_users, total_rewards) VALUES (?, COALESCE((SELECT invited_users FROM share_stats WHERE user_id = ?), 0) + 1, COALESCE((SELECT total_rewards FROM share_stats WHERE user_id = ?), 0) + 10)',
                        [inviter.id, inviter.id, inviter.id]
                      );
                    }
                  }
                );
              }
              
              resolve({
                id: newUserId,
                walletAddress: walletAddress,
                nickname: walletAddress,
                avatarFile: null,
                lyricsFile: null,
                musicFile: null,
                points: 5
              });
            }
          );
        }
      }
    );
  });
};

   
const generateShareCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'aria';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = {
  isValidWalletAddress,
  generateToken,
  verifyToken,
  getOrCreateUser,
  generateShareCode
};