class SongsGenerator {
    constructor() {
           
        this.apiKey = 'sk-B1L6SH253fz5G8xXAc93118f33084828B68bBf9aD0A4313e';
        this.baseUrl = 'https://api.gpt.ge';
        this.pollingInterval = null;
        this.pollingInterval = null;
        this.currentTaskId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeState();
    }

    bindEvents() {
           
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.addEventListener('click', () => this.generateSong());

           
        const lyricsInput = document.getElementById('lyricsInput');
        const styleSelect = document.getElementById('styleSelect');
        const singerSelect = document.getElementById('singerSelect');

        [lyricsInput, styleSelect, singerSelect].forEach(element => {
            element.addEventListener('change', () => this.validateForm());
            element.addEventListener('input', () => this.validateForm());
        });
    }

    initializeState() {
           
        const generateBtn = document.getElementById('generateBtn');
        generateBtn.disabled = true;    
        generateBtn.innerHTML = `
            <span class="btn-icon">🎵</span>
            <span class="btn-text">Generate Song</span>
        `;
        
           
        const loadingContainer = document.getElementById('loadingContainer');
        loadingContainer.style.display = 'none';
        
        this.validateForm();
        this.updateResultStatus('Ready to generate songs...');
    }

    validateForm() {
        const lyrics = document.getElementById('lyricsInput').value.trim();
        const style = document.getElementById('styleSelect').value;
        const singer = document.getElementById('singerSelect').value;
        const generateBtn = document.getElementById('generateBtn');

        const isValid = lyrics && style && singer;
        generateBtn.disabled = !isValid;

        if (isValid) {
            generateBtn.classList.remove('disabled');
        } else {
            generateBtn.classList.add('disabled');
        }
    }

    async generateSong() {
        try {
               
            const walletCheck = await this.checkWalletAndPoints();
            if (!walletCheck.success) {
                if (walletCheck.needsWallet) {
                    this.showWalletConnectModal();
                } else {
                    this.showError(walletCheck.message);
                }
                return;
            }

               
            const confirmed = await this.showPointsConfirmation();
            if (!confirmed) {
                return;
            }

               
            const formData = this.getFormData();
            if (!this.validateFormData(formData)) {
                return;
            }

               
            this.showLoading();
            this.updateResultStatus('Submitting song generation task...');

               
            const taskResult = await this.submitGenerationTask(formData);
            if (!taskResult.success) {
                throw new Error(taskResult.message || 'Failed to submit generation task');
            }

            this.currentTaskId = taskResult.task_id;
            this.updateResultStatus('Task submitted, waiting for generation...');

               
            this.startTaskPolling();

        } catch (error) {
            console.error('Generation failed:', error);
            this.handleGenerationError(error);
        }
    }

    async checkWalletAndPoints() {
        console.log('🔍 [DEBUG] Starting wallet and points status check');
        try {
               
            const authToken = localStorage.getItem('authToken');
            console.log('🔑 [DEBUG] AuthToken:', authToken ? 'Retrieved' : 'Not found');
            
            if (!authToken) {
                console.log('❌ [DEBUG] Wallet verification failed: authToken not found');
                return { success: false, needsWallet: true, message: 'Please connect your wallet first' };
            }
        
               
            console.log('🌐 [DEBUG] Sending wallet verification request to:', `${baseUrl}/auth/verify-wallet`);
            const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                    ? 'http://localhost:3001/api' 
                    : 'https://api.ariamusic.buzz/api');
            const verifyResponse = await fetch(`${baseUrl}/auth/verify-wallet`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        
            console.log('📡 [DEBUG] Wallet verification response status:', verifyResponse.status, verifyResponse.ok);
            
            if (!verifyResponse.ok || verifyResponse.status === 401) {
                console.log('❌ [DEBUG] Wallet verification failed: abnormal response status');
                return { success: false, needsWallet: true, message: 'Wallet verification failed' };
            }
        
            const verifyResult = await verifyResponse.json();
            console.log('📋 [DEBUG] Wallet verification result:', verifyResult);
            
            if (!verifyResult.success || !verifyResult.walletConnected) {
                console.log('❌ [DEBUG] Wallet verification failed: wallet not connected');
                return { success: false, needsWallet: true, message: 'Wallet not connected' };
            }
        
               
            console.log('🌐 [DEBUG] Sending points query request to:', `${baseUrl}/auth/check-points`);
            const pointsResponse = await fetch(`${baseUrl}/auth/check-points`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        
            console.log('📡 [DEBUG] Points query response status:', pointsResponse.status, pointsResponse.ok);
            
            if (!pointsResponse.ok) {
                console.log('❌ [DEBUG] Points query failed: abnormal response status');
                return { success: false, needsWallet: false, message: 'Unable to get points information' };
            }
        
            const pointsResult = await pointsResponse.json();
            console.log('📋 [DEBUG] Points query result:', pointsResult);
            
            if (!pointsResult.success) {
                console.log('❌ [DEBUG] Points query failed:', pointsResult.message);
                return { success: false, needsWallet: false, message: 'Failed to get points information: ' + pointsResult.message };
            }
        
            if (pointsResult.points < 1) {
                console.log('❌ [DEBUG] Insufficient points:', pointsResult.points);
                return { success: false, needsWallet: false, message: `Insufficient points! Current points: ${pointsResult.points}, generating songs requires 1 point.` };
            }
        
            console.log('✅ [DEBUG] Wallet and points verification successful, current points:', pointsResult.points);
            return { success: true, points: pointsResult.points };
        } catch (error) {
            console.error('💥 [DEBUG] Wallet/points check exception:', error);
            return { success: false, needsWallet: true, message: 'Failed to verify wallet and points' };
        }
    }

    showWalletConnectModal() {
           
        if (window.lyricsGenerator && window.lyricsGenerator.showWalletConnectModal) {
            window.lyricsGenerator.showWalletConnectModal();
        } else {
               
            this.showError('Please connect your wallet first. Go to Lyrics page to connect your wallet.');
        }
    }

    async showPointsConfirmation() {
        return new Promise((resolve) => {
               
            const existingModal = document.querySelector('.points-confirmation-overlay');
            if (existingModal) {
                existingModal.remove();
            }

               
            const modalHTML = `
                <div class="points-confirmation-overlay">
                    <div class="points-confirmation-modal">
                        <div class="confirmation-header">
                            <h3>Confirm Points Usage</h3>
                        </div>
                        <div class="confirmation-content">
                            <p>Generating a song will consume <strong>1 point</strong> from your account.</p>
                            <p>Do you want to continue?</p>
                        </div>
                        <div class="confirmation-actions">
                            <button class="confirm-btn" id="confirmPoints">Confirm (1 Point)</button>
                            <button class="cancel-btn" id="cancelPoints">Cancel</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

               
            document.getElementById('confirmPoints').addEventListener('click', () => {
                document.querySelector('.points-confirmation-overlay').remove();
                resolve(true);
            });

            document.getElementById('cancelPoints').addEventListener('click', () => {
                document.querySelector('.points-confirmation-overlay').remove();
                resolve(false);
            });

               
            document.querySelector('.points-confirmation-overlay').addEventListener('click', (e) => {
                if (e.target.classList.contains('points-confirmation-overlay')) {
                    document.querySelector('.points-confirmation-overlay').remove();
                    resolve(false);
                }
            });
        });
    }

    getFormData() {
        return {
            lyrics: document.getElementById('lyricsInput').value.trim(),
            style: document.getElementById('styleSelect').value,
            singer: document.getElementById('singerSelect').value,
            timestamp: Date.now()
        };
    }

    validateFormData(formData) {
        if (!formData.lyrics) {
            this.showError('Please enter lyrics content');
            return false;
        }
        if (!formData.style) {
            this.showError('Please select music style');
            return false;
        }
        if (!formData.singer) {
            this.showError('Please select singer type');
            return false;
        }
        return true;
    }

    async submitGenerationTask(formData) {
        try {
               
            const requestData = {
                prompt: formData.lyrics,
                tags: `${formData.style}, ${formData.singer}`,
                title: `Generated Song - ${new Date().toLocaleString()}`,
                make_instrumental: false,
                wait_audio: false
            };

            const response = await fetch(`${this.baseUrl}/suno/submit/music`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            console.log('🎵 [DEBUG] API response result:', result);
            
            if (result.code === 'success') {
                   
                const taskId = result.data;
                console.log('✅ [DEBUG] Got task ID:', taskId);
                
                   
                await this.deductPoints();
                return { success: true, task_id: taskId };
            } else {
                return { success: false, message: result.message || 'Failed to submit task' };
            }
        } catch (error) {
            console.error('API submission error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    }

    async deductPoints() {
        try {
            const authToken = localStorage.getItem('authToken');
            console.log('🔑 [DEBUG] Using AuthToken:', authToken ? 'Retrieved' : 'Not found');
            
            console.log('🌐 [DEBUG] Sending points deduction request to:', `${baseUrl}/auth/deduct-points`);
            const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                    ? 'http://localhost:3001/api' 
                    : 'https://api.ariamusic.buzz/api');
            const response = await fetch(`${baseUrl}/auth/deduct-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ amount: 1 })
            });
    
            if (!response.ok) {
                console.log('❌ [DEBUG] Points deduction failed: abnormal response status');
                throw new Error('Points deduction failed');
            }
    
            const result = await response.json();
            console.log('📋 [DEBUG] Points deduction result:', result);
            
            if (!result.success) {
                console.log('❌ [DEBUG] Points deduction failed:', result.message);
                throw new Error(result.message || 'Points deduction failed');
            }
    
            console.log(`✅ [DEBUG] Points deduction successful - remaining points: ${result.remainingPoints}`);
            return result;
        } catch (error) {
            console.error('💥 [DEBUG] Points deduction exception:', error);
            throw error;
        }
    }

    async refundPoints() {
        console.log('🔄 [DEBUG] Starting points refund');
        try {
            const authToken = localStorage.getItem('authToken');
            console.log('🔑 [DEBUG] Using AuthToken:', authToken ? 'Retrieved' : 'Not found');
            
            console.log('🌐 [DEBUG] Sending points refund request to:', `${baseUrl}/auth/refund-points`);
            const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                    ? 'http://localhost:3001/api' 
                    : 'https://api.ariamusic.buzz/api');
            const response = await fetch(`${baseUrl}/auth/refund-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ amount: 1 })
            });
    
            if (!response.ok) {
                console.log('❌ [DEBUG] Points refund failed: abnormal response status');
                throw new Error('Points refund failed');
            }
    
            const result = await response.json();
            console.log('📋 [DEBUG] Points refund result:', result);
            
            if (!result.success) {
                console.log('❌ [DEBUG] Points refund failed:', result.message);
                throw new Error(result.message || 'Points refund failed');
            }
    
            console.log(`✅ [DEBUG] Points refund successful - current points: ${result.currentPoints}`);
            return result;
        } catch (error) {
            console.error('💥 [DEBUG] Points refund exception:', error);
            throw error;
        }
    }
       
    
    startTaskPolling() {
        console.log('🔄 [DEBUG] Starting task status polling');
        
        if (this.pollingInterval) {
            console.log('⚠️ [DEBUG] Clearing existing polling interval');
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(async () => {
            try {
                console.log('🔍 [DEBUG] Polling task status check, task ID:', this.currentTaskId);
                
                if (!this.currentTaskId) {
                    console.log('❌ [DEBUG] Task ID does not exist, stopping polling');
                    this.stopTaskPolling();
                    return;
                }
                
                const status = await this.checkTaskStatus(this.currentTaskId);
                this.handleTaskStatusUpdate(status);
            } catch (error) {
                console.error('💥 [DEBUG] Error occurred during polling:', error);
                this.stopTaskPolling();
                this.handleGenerationError(error);
            }
        }, 3000);    
        
        console.log('✅ [DEBUG] Task polling started, interval 3 seconds');
    }

    stopTaskPolling() {
        console.log('🛑 [DEBUG] Stopping task status polling');
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('✅ [DEBUG] Polling interval cleared');
        } else {
            console.log('ℹ️ [DEBUG] No active polling interval to clear');
        }
    }
    async checkTaskStatus(taskId) {
        console.log('🔍 [DEBUG] Checking task status, task ID:', taskId);
        
           
        const url = `${this.baseUrl}/suno/fetch/${taskId}`;
        console.log('🌐 [DEBUG] Sending status query request to:', url);
        
        const response = await fetch(url, {
            method: 'GET',     
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
               
        });
        
        console.log('📡 [DEBUG] Status query response status:', response.status, response.ok);
        
           
        const contentType = response.headers.get('content-type');
        console.log('📋 [DEBUG] Response content type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ [DEBUG] API returned non-JSON format:', textResponse.substring(0, 200));
            throw new Error('API returned invalid response format');
        }
        
        const result = await response.json();
        console.log('📋 [DEBUG] Task status result:', result);
        
        return result;
    }

    handleTaskStatusUpdate(status) {
        console.log('🔄 [DEBUG] Handling task status update:', status);
        
        if (status.code === 'success') {
            const taskData = status.data;
            console.log('📊 [DEBUG] Task data:', taskData);
            
            if (taskData.status === 'SUCCESS') {
                console.log('🎉 [DEBUG] Task completed successfully!');
                this.stopTaskPolling();
                this.handleGenerationSuccess(taskData.data);
            } else if (taskData.status === 'FAILED') {
                console.log('❌ [DEBUG] Task execution failed:', taskData.fail_reason);
                this.stopTaskPolling();
                   
                this.refundPoints().catch(error => {
                    console.error('💥 [DEBUG] Points refund failed:', error);
                });
                this.handleGenerationError(new Error(taskData.fail_reason || 'Generation failed'));
            } else {
                   
                console.log('⏳ [DEBUG] Task in progress, progress:', taskData.progress || '0%');
                this.updateResultStatus(`Generating... Progress: ${taskData.progress || '0%'}`);
            }
        } else {
            console.log('❌ [DEBUG] Status check failed:', status.message);
            this.stopTaskPolling();
            this.handleGenerationError(new Error(status.message || 'Status check failed'));
        }
    }

    async handleGenerationSuccess(songs) {
        try {
            this.hideLoading();
            this.updateResultStatus(`Generated ${songs.length} songs successfully!`);
            this.displaySongs(songs);
            
               
            await this.saveSongsToDatabase(songs);
            
            this.showSuccess('Songs generated successfully!');
        } catch (error) {
            console.error('Error handling success:', error);
        }
    }

    async saveSongsToDatabase(songs) {
        try {
            const walletAddress = localStorage.getItem('walletAddress');
            
            for (const song of songs) {
                const songData = {
                    walletAddress,
                    title: song.title,
                    audioUrl: song.audio_url,
                    imageUrl: song.image_url,
                    videoUrl: song.video_url,
                    duration: song.metadata.duration,
                    style: song.metadata.tags,
                    createdAt: song.created_at
                };

                await fetch(`${window.API_CONFIG.BASE_URL}/songs/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(songData)
                });
            }
        } catch (error) {
            console.error('Failed to save songs:', error);
        }
    }

    displaySongs(songs) {
        const songsList = document.getElementById('songsList');
        songsList.innerHTML = '';

        songs.forEach(song => {
            const songElement = this.createSongElement(song);
            songsList.appendChild(songElement);
        });
    }

    createSongElement(song) {
        const songDiv = document.createElement('div');
        songDiv.className = 'song-item';
        
        const duration = song.metadata.duration ? `${Math.floor(song.metadata.duration / 60)}:${String(Math.floor(song.metadata.duration % 60)).padStart(2, '0')}` : 'Unknown';
        
        songDiv.innerHTML = `
            <div class="song-title">${song.title}</div>
            <div class="song-meta">
                <span>Style: ${song.metadata.tags}</span>
                <span>Duration: ${duration}</span>
                <span>Created: ${new Date(song.created_at).toLocaleDateString()}</span>
            </div>
            <div class="song-actions">
                <button class="action-btn primary" onclick="songsGenerator.playSong('${song.audio_url}')">
                    ▶️ Play
                </button>
                <button class="action-btn" onclick="songsGenerator.downloadSong('${song.audio_url}', '${song.title}')">
                    ⬇️ Download
                </button>
            </div>
        `;
        return songDiv;
    }

    playSong(audioUrl) {
        if (audioUrl && audioUrl !== '#') {
               
            let audio = document.getElementById('songAudioPlayer');
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = 'songAudioPlayer';
                audio.controls = true;
                audio.style.width = '100%';
                audio.style.marginTop = '10px';
                document.querySelector('.result-section').appendChild(audio);
            }
            
            audio.src = audioUrl;
            audio.play().catch(error => {
                console.error('Playback failed:', error);
                this.showError('Failed to play audio');
            });
        } else {
            this.showError('Audio URL not available');
        }
    }

    downloadSong(audioUrl, title) {
        if (audioUrl && audioUrl !== '#') {
            // Add user confirmation dialog
            const userConfirmed = confirm(`Do you want to download "${title}"?\n\nThis is an AI-generated music file that is completely legal and safe.`);
            if (!userConfirmed) {
                return; // User cancelled download
            }
            
            // Create download link but don't auto-trigger
            const link = document.createElement('a');
            link.href = audioUrl;
            link.download = `${title}.mp3`;
            link.target = '_blank';
            // Add security attributes
            link.rel = 'noopener noreferrer';
            
            // Show download modal instead of auto-download
            this.showDownloadModal(link, title);
        } else {
            this.showError('Download URL not available');
        }
    }

    // New: Show download confirmation modal
    showDownloadModal(downloadLink, title) {
        // Create modal HTML
        const modalHtml = `
            <div id="downloadModal" class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                ">
                    <h3 style="margin-bottom: 15px; color: #333;">🎵 Download Music File</h3>
                    <p style="margin-bottom: 20px; color: #666; line-height: 1.5;">
                        You are about to download: <strong>${title}</strong><br>
                        <small>This is AI-generated original music, completely legal and safe</small>
                    </p>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="confirmDownload" style="
                            background: #007bff;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Confirm Download</button>
                        <button id="cancelDownload" style="
                            background: #6c757d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Bind events
        const modal = document.getElementById('downloadModal');
        const confirmBtn = document.getElementById('confirmDownload');
        const cancelBtn = document.getElementById('cancelDownload');
        
        confirmBtn.onclick = () => {
            // Execute download only after user confirmation
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            document.body.removeChild(modal);
            this.showSuccess(`"${title}" download started`);
        };
        
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
        };
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }

    showLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        const generateBtn = document.getElementById('generateBtn');
        
        loadingContainer.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="btn-text">Generating...</span>';
    }

    hideLoading() {
        const loadingContainer = document.getElementById('loadingContainer');
        const generateBtn = document.getElementById('generateBtn');
        
        loadingContainer.style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
            <span class="btn-icon">🎵</span>
            <span class="btn-text">Generate Song</span>
        `;
        
        this.validateForm();
    }

    updateResultStatus(status) {
        const resultStatus = document.getElementById('resultStatus');
        resultStatus.textContent = status;
    }

    async handleGenerationError(error) {
        console.log('💥 [DEBUG] Handling generation error:', error);
        
        this.hideLoading();
        this.stopTaskPolling();    
        
               
        try {
            await this.refundPoints();
            console.log('🔄 [DEBUG] Generation failed, points refunded');
        } catch (refundError) {
            console.error('💥 [DEBUG] Points refund failed:', refundError);
        }
        
        this.updateResultStatus('Generation failed, please try again');
        this.showError(error.message || 'Song generation failed, please try again');
        this.isGenerating = false;
    }

    showError(message) {
           
        const existingModal = document.querySelector('.error-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="error-modal-overlay">
                <div class="error-modal">
                    <div class="error-header">
                        <h3>Error</h3>
                    </div>
                    <div class="error-content">
                        <p>${message}</p>
                    </div>
                    <div class="error-actions">
                        <button class="error-btn" id="closeError">OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('closeError').addEventListener('click', () => {
            document.querySelector('.error-modal-overlay').remove();
        });

        document.querySelector('.error-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('error-modal-overlay')) {
                document.querySelector('.error-modal-overlay').remove();
            }
        });
    }

    showSuccess(message) {
           
        const existingModal = document.querySelector('.success-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        const modalHTML = `
            <div class="success-modal-overlay">
                <div class="success-modal">
                    <div class="success-header">
                        <h3>Success</h3>
                    </div>
                    <div class="success-content">
                        <p>${message}</p>
                    </div>
                    <div class="success-actions">
                        <button class="success-btn" id="closeSuccess">OK</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('closeSuccess').addEventListener('click', () => {
            document.querySelector('.success-modal-overlay').remove();
        });

        document.querySelector('.success-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('success-modal-overlay')) {
                document.querySelector('.success-modal-overlay').remove();
            }
        });
    }
}

   
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.songsGenerator = new SongsGenerator();
    });
} else {
    window.songsGenerator = new SongsGenerator();
}
