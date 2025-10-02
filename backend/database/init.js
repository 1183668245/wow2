const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'xmusic.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('📦 Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
           
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT UNIQUE NOT NULL,
          nickname TEXT,
          avatar_file TEXT,  -- 存储头像图片文件路径 (jpg, png, gif等)
          lyrics_file TEXT,  -- 存储歌词文件路径 (txt, lrc等)
          music_file TEXT,   -- 存储音乐文件路径 (mp3, wav, flac等)
          points INTEGER DEFAULT 5,
          share_code TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
           
        `CREATE TABLE IF NOT EXISTS point_rewards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action_type TEXT NOT NULL, -- 'copy_share_link', 'invite_register', etc.
          points INTEGER NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
           
        `CREATE TABLE IF NOT EXISTS lyrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          theme TEXT,
          style TEXT,
          is_public BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
           
        `CREATE TABLE IF NOT EXISTS nfts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          token_id TEXT UNIQUE,
          contract_address TEXT,
          name TEXT NOT NULL,
          description TEXT,
          image_url TEXT,
          metadata_url TEXT,
          price DECIMAL(18, 8),
          currency TEXT DEFAULT 'ETH',
          is_listed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
           
        `CREATE TABLE IF NOT EXISTS share_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          invited_users INTEGER DEFAULT 0,
          total_rewards DECIMAL(18, 8) DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`
      ];
      let completed = 0;
      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`Error creating table ${index}:`, err);
            reject(err);
          } else {
            completed++;
            if (completed === queries.length) {
              console.log('✅ All database tables created successfully');
              resolve();
            }
          }
        });
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('📦 Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getDb() {
    return this.db;
  }
}

const database = new Database();

const initDatabase = async () => {
  try {
    await database.connect();
    await database.createTables();
    return database;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  initDatabase,
  database
};