const express = require('express');
const { verifyToken, generateShareCode } = require('../middleware/auth');
const { database } = require('../database/init');

const router = express.Router();

   
router.get('/link', verifyToken, (req, res) => {
  const db = database.getDb();
  
  db.get(
    'SELECT id, share_code FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      let shareCode = user.share_code;
      
         
      if (!shareCode) {
        shareCode = generateShareCode();
        db.run(
          'UPDATE users SET share_code = ? WHERE id = ?',
          [shareCode, user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to generate share code' });
            }
            
            const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${shareCode}`;
            res.json({
              success: true,
              shareCode: shareCode,
              shareLink: shareLink
            });
          }
        );
      } else {
        const shareLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${shareCode}`;
        res.json({
          success: true,
          shareCode: shareCode,
          shareLink: shareLink
        });
      }
    }
  );
});

   
router.post('/copy-reward', verifyToken, (req, res) => {
  const db = database.getDb();
  
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
         
      db.get(
        'SELECT id FROM point_rewards WHERE user_id = ? AND action_type = "copy_share_link"',
        [user.id],
        (err, existingReward) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (existingReward) {
            return res.status(400).json({ 
              error: 'Copy reward already claimed',
              message: '您已经获得过复制奖励了！'
            });
          }
          
             
          db.run(
            'UPDATE users SET points = points + 5 WHERE id = ?',
            [user.id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update points' });
              }
              
                 
              db.run(
                'INSERT INTO point_rewards (user_id, action_type, points, description) VALUES (?, ?, ?, ?)',
                [user.id, 'copy_share_link', 5, '复制分享链接奖励'],
                (err) => {
                  if (err) {
                    console.error('Failed to record reward:', err);
                  }
                  
                  res.json({
                    success: true,
                    message: '恭喜！获得5积分奖励',
                    points: 5
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

   
router.get('/stats', verifyToken, (req, res) => {
  const db = database.getDb();
  
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.get(
        'SELECT * FROM share_stats WHERE user_id = ?',
        [user.id],
        (err, stats) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            invitedUsers: stats?.invited_users || 0,
            totalRewards: stats?.total_rewards || 0
          });
        }
      );
    }
  );
});

   
router.post('/register-with-code', (req, res) => {
  const { walletAddress, shareCode } = req.body;
  const db = database.getDb();
  
  if (!shareCode) {
    return res.status(400).json({ error: 'Share code is required' });
  }
  
     
  db.get(
    'SELECT id FROM users WHERE share_code = ?',
    [shareCode],
    (err, inviter) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!inviter) {
        return res.status(404).json({ error: 'Invalid share code' });
      }
      
         
      db.run(
        'UPDATE share_stats SET invited_users = invited_users + 1, total_rewards = total_rewards + 0.1 WHERE user_id = ?',
        [inviter.id],
        (err) => {
          if (err) {
            console.error('Error updating share stats:', err);
          }
        }
      );
      
      res.json({ success: true, message: 'Registration with share code successful' });
    }
  );
});

module.exports = router;