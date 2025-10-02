const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { database } = require('../database/init');

const router = express.Router();

   
router.post('/', verifyToken, (req, res) => {
  const { tokenId, contractAddress, name, description, imageUrl, metadataUrl, price, currency } = req.body;
  const db = database.getDb();
  
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.run(
        'INSERT INTO nfts (user_id, token_id, contract_address, name, description, image_url, metadata_url, price, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, tokenId, contractAddress, name, description, imageUrl, metadataUrl, price, currency || 'ETH'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            success: true,
            id: this.lastID,
            message: 'NFT created successfully'
          });
        }
      );
    }
  );
});

   
router.get('/my', verifyToken, (req, res) => {
  const db = database.getDb();
  
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.all(
        'SELECT * FROM nfts WHERE user_id = ? ORDER BY created_at DESC',
        [user.id],
        (err, nfts) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({ nfts });
        }
      );
    }
  );
});

   
router.get('/marketplace', (req, res) => {
  const db = database.getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT n.*, u.username, u.wallet_address 
     FROM nfts n 
     JOIN users u ON n.user_id = u.id 
     WHERE n.is_listed = 1 
     ORDER BY n.created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, nfts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ nfts, page, limit });
    }
  );
});

module.exports = router;