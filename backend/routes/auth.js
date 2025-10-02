const express = require('express');
const { isValidWalletAddress, generateToken, getOrCreateUser, verifyToken } = require('../middleware/auth');
const { database } = require('../database/init');

const router = express.Router();

   
router.post('/wallet-login', async (req, res) => {
  try {
    const { walletAddress, inviteCode } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address cannot be empty' });
    }
    
       
    const user = await getOrCreateUser(walletAddress, inviteCode);
    
       
    const token = generateToken(user.walletAddress);
    
       
    const currentTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    console.log('\n=== Wallet Connection Record ===');
    console.log(`Time: ${currentTime}`);
    console.log(`Wallet Address: ${user.walletAddress}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Points: ${user.points}`);
    console.log(`User Nickname: ${user.nickname || 'Not set'}`);
    console.log(`User Avatar: ${user.avatarFile || 'Not uploaded'}`);
    console.log(`Lyrics File: ${user.lyricsFile || 'Not created'}`);
    console.log(`Music File: ${user.musicFile || 'Not uploaded'}`);
    console.log('===============================\n');
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        nickname: user.nickname,
        avatarFile: user.avatarFile,
        lyricsFile: user.lyricsFile,
        musicFile: user.musicFile,
        points: user.points
      }
    });
  } catch (error) {
    console.error('Wallet login failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

   
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
         
      const user = await getOrCreateUser(decoded.walletAddress);
      
      res.json({
        success: true,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          nickname: user.nickname,
          avatarFile: user.avatarFile,
          lyricsFile: user.lyricsFile,
          musicFile: user.musicFile,
          points: user.points
        }
      });
    } catch (error) {
      res.status(400).json({ error: 'Invalid token.' });
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

   
router.get('/verify-wallet', verifyToken, async (req, res) => {
    try {
        const walletAddress = req.user.walletAddress;
        
           
        const user = await getOrCreateUser(walletAddress);

        if (!user || !user.walletAddress) {
            return res.json({
                success: false,
                walletConnected: false,
                message: 'Wallet not connected'
            });
        }

        res.json({
            success: true,
            walletConnected: true,
            walletAddress: user.walletAddress
        });

    } catch (error) {
        console.error('Wallet verification failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

   
router.get('/check-points', verifyToken, async (req, res) => {
    try {
        const walletAddress = req.user.walletAddress;
        
        const user = await getOrCreateUser(walletAddress);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            points: user.points,
            walletAddress: user.walletAddress
        });

    } catch (error) {
        console.error('Points query failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

   
router.post('/deduct-points', verifyToken, async (req, res) => {
    try {
        const walletAddress = req.user.walletAddress;
        const { amount = 1 } = req.body;    
        
        const user = await getOrCreateUser(walletAddress);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

           
        if (user.points < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient points',
                currentPoints: user.points,
                requiredPoints: amount
            });
        }

           
        const db = database.getDb();
        
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET points = points - ? WHERE wallet_address = ?',
                [amount, walletAddress],
                function(err) {
                    if (err) {
                        console.error('Points deduction failed:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to deduct points'
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'User not found'
                        });
                    }

                    const newPoints = user.points - amount;
                    console.log(`✅ Points deducted successfully - Wallet: ${walletAddress}, Deducted: ${amount}, Remaining: ${newPoints}`);
                    
                    res.json({
                        success: true,
                        message: 'Points deducted successfully',
                        pointsDeducted: amount,
                        remainingPoints: newPoints
                    });
                }
            );
        });

    } catch (error) {
        console.error('Points deduction failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

   
router.post('/refund-points', verifyToken, async (req, res) => {
    try {
        const walletAddress = req.user.walletAddress;
        const { amount = 1 } = req.body;    
        
        const user = await getOrCreateUser(walletAddress);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

           
        const db = database.getDb();
        
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET points = points + ? WHERE wallet_address = ?',
                [amount, walletAddress],
                function(err) {
                    if (err) {
                        console.error('Points refund failed:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to refund points'
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'User not found'
                        });
                    }

                    const newPoints = user.points + amount;
                    console.log(`✅ Points refunded successfully - Wallet: ${walletAddress}, Refunded: ${amount}, Current: ${newPoints}`);
                    
                    res.json({
                        success: true,
                        message: 'Points refunded successfully',
                        pointsRefunded: amount,
                        currentPoints: newPoints
                    });
                }
            );
        });

    } catch (error) {
        console.error('Points refund failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;