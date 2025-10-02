const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { database } = require('../database/init');

const router = express.Router();

   
router.post('/', verifyToken, (req, res) => {
  const { title, content, theme, style, isPublic } = req.body;
  const db = database.getDb();
  
     
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.run(
        'INSERT INTO lyrics (user_id, title, content, theme, style, is_public) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, title, content, theme, style, isPublic ? 1 : 0],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({
            success: true,
            id: this.lastID,
            message: 'Lyrics created successfully'
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
        'SELECT * FROM lyrics WHERE user_id = ? ORDER BY created_at DESC',
        [user.id],
        (err, lyrics) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          res.json({ lyrics });
        }
      );
    }
  );
});

   
router.get('/public', (req, res) => {
  const db = database.getDb();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  db.all(
    `SELECT l.*, u.username, u.wallet_address 
     FROM lyrics l 
     JOIN users u ON l.user_id = u.id 
     WHERE l.is_public = 1 
     ORDER BY l.created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, lyrics) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ lyrics, page, limit });
    }
  );
});

   
router.delete('/:id', verifyToken, (req, res) => {
  const lyricsId = req.params.id;
  const db = database.getDb();
  
  db.get(
    'SELECT id FROM users WHERE wallet_address = ?',
    [req.user.walletAddress],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      db.run(
        'DELETE FROM lyrics WHERE id = ? AND user_id = ?',
        [lyricsId, user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Lyrics not found or unauthorized' });
          }
          
          res.json({ success: true, message: 'Lyrics deleted successfully' });
        }
      );
    }
  );
});

const axios = require('axios');

   
router.post('/generate', verifyToken, async (req, res) => {
  const { theme, style, customInput } = req.body;
  
  try {
       
    const prompt = buildPrompt(theme, style, customInput);
    
       
    const response = await axios.post('https://api.gpt.ge/suno/submit/lyrics', {
      prompt: prompt
    }, {
      headers: {
        'Authorization': 'Bearer sk-7AEO0HTiDPPWAib50b372b1b598746308b12D2D3CeE9F72e',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.code === 'success') {
      res.json({
        success: true,
        taskId: response.data.data,
        message: 'Lyrics generation task submitted successfully'
      });
    } else {
      throw new Error(response.data.message || 'Failed to submit generation task');
    }
  } catch (error) {
    console.error('AI lyrics generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate lyrics'
    });
  }
});

   
router.get('/status/:taskId', verifyToken, async (req, res) => {
  const { taskId } = req.params;
  
  try {
    console.log('Querying task status:', taskId);
    
    const response = await axios.get(`https://api.gpt.ge/suno/fetch/${taskId}`, {
      headers: {
        'Authorization': 'Bearer sk-7AEO0HTiDPPWAib50b372b1b598746308b12D2D3CeE9F72e'
      },
      timeout: 30000    
    });
    
    console.log('API response:', response.data);
    
    if (response.data.code === 'success') {
      const taskData = response.data.data;
      
      if (taskData.status === 'SUCCESS') {
        const lyrics = extractLyrics(taskData.data);
        res.json({
          success: true,
          status: 'SUCCESS',
          lyrics: lyrics
        });
      } else if (taskData.status === 'FAILED') {
        res.json({
          success: true,
          status: 'FAILED',
          failReason: taskData.fail_reason
        });
      } else {
        res.json({
          success: true,
          status: 'PROCESSING',
          progress: taskData.progress
        });
      }
    } else {
      throw new Error(response.data.message || 'Failed to query task status');
    }
  } catch (error) {
    console.error('API call error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to query status: ' + error.message
    });
  }
});

   
function buildPrompt(theme, style, customInput) {
  const themeMap = {
    'love': 'love',
    'friendship': 'friendship',
    'dream': 'dreams',
    'life': 'life',
    'nature': 'nature',
    'freedom': 'freedom',
    'web3': 'Web3 technology'
  };
  
  const styleMap = {
    'pop': 'pop',
    'rock': 'rock',
    'folk': 'folk',
    'rap': 'rap',
    'ballad': 'ballad',
    'electronic': 'electronic'
  };
  
  let prompt = `Create ${styleMap[style] || 'pop'} style English lyrics with the theme of ${themeMap[theme] || 'love'}`;
  
  if (customInput) {
    prompt += `, requirements: ${customInput}`;
  }
  
  prompt += '. Please create complete lyrics including verses, chorus, and other parts.';
  
  return prompt;
}

   
function extractLyrics(data) {
  console.log('Raw data returned by API:', JSON.stringify(data, null, 2));
  
  if (!data) {
    console.warn('Data is empty');
    return 'Unable to get lyrics data: API returned empty data';
  }
  
     
  if (Array.isArray(data) && data.length > 0) {
    const firstResult = data[0];
    console.log('First element of array:', JSON.stringify(firstResult, null, 2));
    
       
    const possibleFields = ['lyrics', 'lyric', 'text', 'content', 'prompt', 'description', 'audio_prompt', 'gpt_description_prompt'];
    
    for (const field of possibleFields) {
      if (firstResult[field] && typeof firstResult[field] === 'string' && firstResult[field].trim() !== '') {
        console.log(`Found lyrics field: ${field}`);
        return firstResult[field];
      }
    }
    
       
    if (firstResult.metadata) {
      console.log('Checking metadata:', JSON.stringify(firstResult.metadata, null, 2));
      for (const field of possibleFields) {
        if (firstResult.metadata[field]) {
          return firstResult.metadata[field];
        }
      }
    }
    
    console.warn('Lyrics field not found, available fields:', Object.keys(firstResult));
    return `Debug info - Available fields: ${Object.keys(firstResult).join(', ')}\n\nComplete data: ${JSON.stringify(firstResult, null, 2)}`;
  }
  
     
  if (typeof data === 'object') {
    console.log('Data is object:', JSON.stringify(data, null, 2));
    
    const possibleFields = ['lyrics', 'lyric', 'text', 'content', 'prompt', 'description'];
    
    for (const field of possibleFields) {
      if (data[field] && typeof data[field] === 'string' && data[field].trim() !== '') {
        console.log(`Found lyrics field: ${field}`);
        return data[field];
      }
    }
    
    console.warn('Lyrics field not found in object, available fields:', Object.keys(data));
    return `Debug info - Object fields: ${Object.keys(data).join(', ')}\n\nComplete data: ${JSON.stringify(data, null, 2)}`;
  }
  
  console.warn('Incorrect data format:', typeof data, data);
  return `Unparseable data format: ${typeof data}`;
}

module.exports = router;