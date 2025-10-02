const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

   
const dbPath = path.join(__dirname, '../database/xmusic.db');

   
router.post('/save', async (req, res) => {
    const { walletAddress, title, audioUrl, imageUrl, videoUrl, duration, style, createdAt } = req.body;
    
    if (!walletAddress || !title || !audioUrl) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: walletAddress, title, audioUrl'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    try {
           
        const getUserQuery = 'SELECT id FROM users WHERE wallet_address = ?';
        
        db.get(getUserQuery, [walletAddress], (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
               
            const insertQuery = `
                INSERT INTO songs (user_id, title, audio_url, image_url, video_url, duration, style, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertQuery, [
                user.id,
                title,
                audioUrl,
                imageUrl || null,
                videoUrl || null,
                duration || null,
                style || null,
                createdAt || new Date().toISOString()
            ], function(err) {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to save song'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Song saved successfully',
                    songId: this.lastID
                });
            });
        });
    } catch (error) {
        console.error('Save song error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        db.close();
    }
});

   
router.get('/user/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
        return res.status(400).json({
            success: false,
            message: 'Wallet address is required'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    try {
        const query = `
            SELECT s.*, u.wallet_address
            FROM songs s
            JOIN users u ON s.user_id = u.id
            WHERE u.wallet_address = ?
            ORDER BY s.created_at DESC
        `;
        
        db.all(query, [walletAddress], (err, songs) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            res.json({
                success: true,
                songs: songs || []
            });
        });
    } catch (error) {
        console.error('Get songs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        db.close();
    }
});

   
router.delete('/:songId', async (req, res) => {
    const { songId } = req.params;
    const { walletAddress } = req.body;
    
    if (!songId || !walletAddress) {
        return res.status(400).json({
            success: false,
            message: 'Song ID and wallet address are required'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    try {
           
        const verifyQuery = `
            SELECT s.id
            FROM songs s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ? AND u.wallet_address = ?
        `;
        
        db.get(verifyQuery, [songId, walletAddress], (err, song) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }
            
            if (!song) {
                return res.status(404).json({
                    success: false,
                    message: 'Song not found or access denied'
                });
            }
            
               
            const deleteQuery = 'DELETE FROM songs WHERE id = ?';
            
            db.run(deleteQuery, [songId], function(err) {
                if (err) {
                    console.error('Delete error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete song'
                    });
                }
                
                res.json({
                    success: true,
                    message: 'Song deleted successfully'
                });
            });
        });
    } catch (error) {
        console.error('Delete song error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    } finally {
        db.close();
    }
});

module.exports = router;