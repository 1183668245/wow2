const express = require('express');
const router = express.Router();
const { verifyToken, getOrCreateUser } = require('../middleware/auth');
const { database } = require('../database/init');

// 获取用户资料 - 修改为使用与钱包登录相同的逻辑
router.get('/profile', verifyToken, async (req, res) => {
    try {
        // 从JWT token中获取钱包地址
        const walletAddress = req.user.walletAddress;
        
        if (!walletAddress) {
            return res.status(400).json({ error: '无效的token：缺少钱包地址' });
        }
        
        // 使用与钱包登录相同的逻辑获取用户信息
        const user = await getOrCreateUser(walletAddress);
        
        // 详细的用户资料获取日志
        const currentTime = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        console.log('\n=== 用户资料获取记录 ===');
        console.log(`时间：${currentTime}`);
        console.log(`钱包地址：${user.walletAddress}`);
        console.log(`用户ID：${user.id}`);
        console.log(`积分：${user.points}`);
        console.log(`用户昵称：${user.nickname || '未设置'}`);
        console.log(`用户头像：${user.avatarFile || '未上传'}`);
        console.log(`歌词文件：${user.lyricsFile || '未创作'}`);
        console.log(`音乐文件：${user.musicFile || '未上传'}`);
        console.log('========================\n');
        
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
        console.error('获取用户资料错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 更新用户资料
router.post('/update-profile', verifyToken, async (req, res) => {
    try {
        const { nickname, avatarFile } = req.body;
        const walletAddress = req.user.walletAddress;
        
        if (!walletAddress) {
            return res.status(400).json({ error: '无效的token：缺少钱包地址' });
        }
        
        const db = database.getDb();
        
        let updateFields = [];
        let updateValues = [];
        
        if (nickname) {
            updateFields.push('nickname = ?');
            updateValues.push(nickname);
        }
        
        if (avatarFile) {
            updateFields.push('avatar_file = ?');
            updateValues.push(avatarFile);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: '没有要更新的字段' });
        }
        
        updateValues.push(walletAddress);
        
        db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE wallet_address = ?`,
            updateValues,
            function(err) {
                if (err) {
                    console.error('更新用户资料错误:', err);
                    return res.status(500).json({ error: '更新失败' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ error: '用户不存在' });
                }
                
                console.log(`✅ 用户资料更新成功 - 钱包地址: ${walletAddress}, 更新字段: ${updateFields.join(', ')}`);
                res.json({ success: true, message: '资料更新成功' });
            }
        );
    } catch (error) {
        console.error('更新用户资料错误:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

// 添加用户积分
router.post('/add-points', verifyToken, async (req, res) => {
    try {
        const walletAddress = req.user.walletAddress;
        const { taskId, points = 1 } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的token：缺少钱包地址' 
            });
        }
        
        // 获取用户信息
        const user = await getOrCreateUser(walletAddress);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const db = database.getDb();
        
        // 检查任务是否已经完成过（防止重复奖励）
        if (taskId) {
            const existingReward = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id FROM point_rewards WHERE user_id = ? AND action_type = ?',
                    [user.id, `task_${taskId}`],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });
            
            if (existingReward) {
                return res.status(400).json({
                    success: false,
                    message: 'Task reward already claimed',
                    taskId: taskId
                });
            }
        }
        
        // 更新用户积分
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET points = points + ? WHERE wallet_address = ?',
                [points, walletAddress],
                function(err) {
                    if (err) {
                        console.error('Points addition failed:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to add points'
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'User not found'
                        });
                    }

                    const newPoints = user.points + points;
                    
                    // 记录积分奖励
                    if (taskId) {
                        db.run(
                            'INSERT INTO point_rewards (user_id, action_type, points, description) VALUES (?, ?, ?, ?)',
                            [user.id, `task_${taskId}`, points, `完成任务 ${taskId} 奖励`],
                            (err) => {
                                if (err) {
                                    console.error('Failed to record task reward:', err);
                                }
                            }
                        );
                    }
                    
                    console.log(`✅ Points added successfully - Wallet: ${walletAddress}, Added: ${points}, Current: ${newPoints}, Task: ${taskId || 'N/A'}`);
                    
                    res.json({
                        success: true,
                        message: 'Points added successfully',
                        pointsAdded: points,
                        currentPoints: newPoints,
                        taskId: taskId
                    });
                }
            );
        });

    } catch (error) {
        console.error('Points addition failed:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;