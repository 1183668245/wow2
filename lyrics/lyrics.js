class LyricsGenerator {
    constructor() {
        const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
            || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                ? 'http://localhost:3001/api' 
                : 'https://api.ariamusic.buzz/api');
        this.apiBaseUrl = `${baseUrl}/lyrics`;
        this.currentTheme = 'love';
        this.isGenerating = false;
    }

    init() {
        console.log('Initializing lyrics generator');
        this.bindEvents();
        this.loadSavedSelections();
    }

    bindEvents() {
        console.log('Binding event listeners');
        
           
        const themeButtons = document.querySelectorAll('.theme-btn');
        console.log('Found theme buttons count:', themeButtons.length);
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Theme button clicked:', e.target.dataset.theme);
                this.selectTheme(e.target);
            });
        });

           
        const styleButtons = document.querySelectorAll('.style-btn');
        console.log('Found style buttons count:', styleButtons.length);
        styleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Style button clicked:', e.target.dataset.style);
                this.selectStyle(e.target);
            });
        });

           
        const generateBtn = document.querySelector('.generate-btn');
        console.log('Found generate button:', generateBtn ? 'Yes' : 'No');
        if (generateBtn) {
               
            if (this.generateLyricsHandler) {
                generateBtn.removeEventListener('click', this.generateLyricsHandler);
            }
               
            this.generateLyricsHandler = (e) => {
                e.preventDefault();
                console.log('Generate button clicked');
                this.generateLyrics();
            };
            generateBtn.addEventListener('click', this.generateLyricsHandler);
        }

           
        const copyBtn = document.querySelector('.copy-btn');
        const saveBtn = document.querySelector('.save-btn');
        const regenerateBtn = document.querySelector('.regenerate-btn');
        const viewLyricsBtn = document.querySelector('.view-lyrics-btn');    
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyLyrics());
        }
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveLyrics());
        }
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateLyrics());
        }
        if (viewLyricsBtn) {    
            viewLyricsBtn.addEventListener('click', () => this.viewMyLyrics());
        }
    }

    selectTheme(button) {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.saveSelections();
        console.log('Selected theme:', button.dataset.theme);
    }

    selectStyle(button) {
        document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.saveSelections();
        console.log('Selected style:', button.dataset.style);
    }

    getSelectedTheme() {
        const activeBtn = document.querySelector('.theme-btn.active');
        return activeBtn ? activeBtn.dataset.theme : 'love';
    }

    getSelectedStyle() {
        const activeBtn = document.querySelector('.style-btn.active');
        return activeBtn ? activeBtn.dataset.style : 'pop';
    }

    getCustomInput() {
        const input = document.querySelector('.custom-input');
        return input ? input.value.trim() : '';
    }

    async generateLyrics() {
           
        if (this.isGenerating) {
            console.log('Lyrics are being generated, please do not submit repeatedly');
            return;
        }
    
           
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                this.showWalletConnectModal();
                return;
            }
    
               
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
    
            if (!verifyResponse.ok || verifyResponse.status === 401) {
                this.showWalletConnectModal();
                return;
            }
    
            const verifyResult = await verifyResponse.json();
            if (!verifyResult.success || !verifyResult.walletConnected) {
                this.showWalletConnectModal();
                return;
            }
    
               
            const pointsResponse = await fetch(`${baseUrl}/auth/check-points`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
    
            if (!pointsResponse.ok) {
                this.showError('Unable to get points information, please try again');
                return;
            }
    
            const pointsResult = await pointsResponse.json();
            if (!pointsResult.success) {
                this.showError('Failed to get points information: ' + pointsResult.message);
                return;
            }
    
               
            if (pointsResult.points < 1) {
                this.showError(`Insufficient points! Current points: ${pointsResult.points}, generating lyrics requires 1 point. Please go to profile page to recharge.`);
                return;
            }
    
            console.log(`✅ Points verification passed - Current points: ${pointsResult.points}`);
    
               
            const confirmGenerate = await this.showPointsConfirmDialog(pointsResult.points);
            if (!confirmGenerate) {
                console.log('User cancelled lyrics generation');
                return;
            }
    
        } catch (error) {
            console.error('Wallet or points verification failed:', error);
            this.showWalletConnectModal();
            return;
        }
    
        const theme = this.getSelectedTheme();
        const style = this.getSelectedStyle();
        const customInput = this.getCustomInput();
    
        console.log('Starting lyrics generation:', { theme, style, customInput });
    
           
        this.isGenerating = true;
        
           
        this.showLoading();
    
        try {
               
            const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                    ? 'http://localhost:3001/api' 
                    : 'https://api.ariamusic.buzz/api');
            const deductResponse = await fetch(`${baseUrl}/auth/deduct-points`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ amount: 1 })
            });
    
            if (!deductResponse.ok) {
                throw new Error('Points deduction failed');
            }
    
            const deductResult = await deductResponse.json();
            if (!deductResult.success) {
                throw new Error(deductResult.message || 'Points deduction failed');
            }
    
            console.log(`✅ Points deduction successful - Deducted: 1 point, Remaining: ${deductResult.remainingPoints} points`);
    
               
            const response = await fetch(`${this.apiBaseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    theme,
                    style,
                    customInput
                })
            });
    
            const result = await response.json();
    
            if (result.success) {
                this.currentTaskId = result.taskId;
                console.log('Generation task submitted, task ID:', result.taskId);
                this.startPolling();
            } else {
                   
                try {
                    const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                        || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                            ? 'http://localhost:3001/api' 
                            : 'https://api.ariamusic.buzz/api');
                    await fetch(`${baseUrl}/auth/refund-points`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        },
                        body: JSON.stringify({ amount: 1 })
                    });
                    console.log('Generation failed, points refunded');
                } catch (refundError) {
                    console.error('Points refund failed:', refundError);
                }
                throw new Error(result.message || 'Generation request failed');
            }
        } catch (error) {
            console.error('Lyrics generation failed:', error);
            this.showError('Lyrics generation failed: ' + error.message);
            this.hideLoading();
            this.isGenerating = false;
        }
    }

       
    showPointsConfirmDialog(currentPoints) {
        return new Promise((resolve) => {
               
            const existingModal = document.getElementById('pointsConfirmModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            const modalHTML = `
                <div id="pointsConfirmModal" class="points-confirm-overlay">
                    <div class="points-confirm-content">
                        <div class="points-confirm-header">
                            <h3>Confirm Points Consumption</h3>
                            <button class="points-confirm-close" onclick="this.closest('.points-confirm-overlay').remove(); arguments[0].stopPropagation();">&times;</button>
                        </div>
                        <div class="points-confirm-body">
                            <div class="points-info">
                                <p><strong>Current Points:</strong> ${currentPoints}</p>
                                <p><strong>Points to Consume:</strong> 1</p>
                                <p><strong>Remaining Points:</strong> ${currentPoints - 1}</p>
                            </div>
                            <p class="confirm-text">Are you sure you want to consume <strong>1 point</strong> to generate lyrics?</p>
                        </div>
                        <div class="points-confirm-footer">
                            <button class="points-confirm-btn points-confirm-btn-cancel" id="pointsCancelBtn">Cancel</button>
                            <button class="points-confirm-btn points-confirm-btn-confirm" id="pointsConfirmBtn">Confirm</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
               
            setTimeout(() => {
                const modal = document.getElementById('pointsConfirmModal');
                const cancelBtn = document.getElementById('pointsCancelBtn');
                const confirmBtn = document.getElementById('pointsConfirmBtn');
                
                   
                console.log('Modal elements found:', { modal: !!modal, cancelBtn: !!cancelBtn, confirmBtn: !!confirmBtn });
                
                const cleanup = () => {
                    if (modal && modal.parentNode) {
                        modal.remove();
                    }
                };
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', (e) => {
                        console.log('Cancel button clicked');
                        e.preventDefault();
                        e.stopPropagation();
                        cleanup();
                        resolve(false);
                    });
                }
                
                if (confirmBtn) {
                    confirmBtn.addEventListener('click', (e) => {
                        console.log('Confirm button clicked');
                        e.preventDefault();
                        e.stopPropagation();
                        cleanup();
                        resolve(true);
                    });
                }
                
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            console.log('Modal background clicked');
                            cleanup();
                            resolve(false);
                        }
                    });
                }
            }, 50);    
        });
    }

    startPolling() {
        if (!this.currentTaskId) return;
        
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/status/${this.currentTaskId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (result.status === 'SUCCESS') {
                        console.log('Lyrics data returned by API:', result.lyrics);
                        this.displayLyrics(result.lyrics);
                        this.hideLoading();
                        this.stopPolling();
                    } else if (result.status === 'FAILED') {
                           
                        try {
                            const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
                                || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                                    ? 'http://localhost:3001/api' 
                                    : 'https://api.ariamusic.buzz/api');
                            await fetch(`${baseUrl}/auth/refund-points`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                },
                                body: JSON.stringify({ amount: 1 })
                            });
                            console.log('Generation failed, points refunded');
                        } catch (refundError) {
                            console.error('Points refund failed:', refundError);
                        }
                        this.showError('Generation failed: ' + (result.failReason || 'Unknown error'));
                        this.hideLoading();
                        this.stopPolling();
                    } else if (result.status === 'PROCESSING') {
                        console.log('Generating...', result.progress || '');
                    }
                } else {
                    throw new Error(result.message || 'Status query failed');
                }
            } catch (error) {
                console.error('Polling error:', error);
                this.showError('Failed to query generation status: ' + error.message);
                this.hideLoading();
                this.stopPolling();
            }
        }, 3000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    displayLyrics(lyrics) {
        const lyricsContent = document.querySelector('.lyrics-content');
        const lyricsActions = document.querySelector('.lyrics-actions');
    
        if (lyricsContent) {
            lyricsContent.innerHTML = `
                <div class="generated-lyrics">
                    <pre>${lyrics}</pre>
                </div>
            `;
        }
    
        if (lyricsActions) {
            lyricsActions.style.display = 'flex';
        }
        
        this.currentLyrics = lyrics;
        console.log('Lyrics display completed');
    }

    async copyLyrics() {
        if (!this.currentLyrics) {
            this.showError('No lyrics to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentLyrics);
            this.showSuccess('Lyrics copied to clipboard');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = this.currentLyrics;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccess('Lyrics copied to clipboard');
        }
    }

    async saveLyrics() {
        if (!this.currentLyrics) {
            this.showError('No lyrics to save');
            return;
        }
    
     const title = prompt('Please enter lyrics title:');
        if (!title) return;
    
        console.log('=== Starting to save lyrics ===');
        console.log('Current lyrics content:', this.currentLyrics);
        console.log('Lyrics title:', title);
        console.log('Theme:', this.getSelectedTheme());
        console.log('Style:', this.getSelectedStyle());
        console.log('API URL:', this.apiBaseUrl);
        console.log('Auth Token:', localStorage.getItem('authToken') ? 'Exists' : 'Does not exist');
    
        const requestData = {
            title,
            content: this.currentLyrics,
            theme: this.getSelectedTheme(),
            style: this.getSelectedStyle(),
            isPublic: false
        };
        
        console.log('Request data:', JSON.stringify(requestData, null, 2));
    
        try {
            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(requestData)
            });
    
            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
    
            const result = await response.json();
            console.log('Server response:', JSON.stringify(result, null, 2));
    
            if (result.success) {
                console.log('✅ Lyrics saved successfully!');
                this.showSuccess('Lyrics saved successfully');
            } else {
                console.error('❌ Server returned failure:', result);
                throw new Error(result.error || result.message || 'Save failed');
            }
        } catch (error) {
            console.error('❌ Error occurred while saving lyrics:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.showError('Failed to save lyrics: ' + error.message);
        }
    }

    regenerateLyrics() {
        console.log('Regenerating lyrics');
        this.generateLyrics();
    }

    showLoading() {
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = `
                <span class="btn-text">Generating...</span>
                <span class="btn-icon">⏳</span>
            `;
        }

        const lyricsActions = document.querySelector('.lyrics-actions');
        if (lyricsActions) {
            lyricsActions.style.display = 'none';
        }

        const lyricsContent = document.querySelector('.lyrics-content');
        if (lyricsContent) {
            lyricsContent.innerHTML = `
                <div class="loading-state">
                    <div class="loading-icon">🎵</div>
                    <p>AI is creating lyrics for you, please wait...</p>
                    <div class="loading-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `;
        }
    }

    hideLoading() {
        const generateBtn = document.querySelector('.generate-btn');
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `
                <span class="btn-text">Generate Lyrics</span>
                <span class="btn-icon">✨</span>
            `;
        }
        
        this.isGenerating = false;
    }

    showError(message) {
        const lyricsContent = document.querySelector('.lyrics-content');
        if (lyricsContent) {
            lyricsContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <p>${message}</p>
                    <button class="retry-btn" onclick="lyricsGenerator.generateLyrics()">Retry</button>
                </div>
            `;
        }
        console.error(message);
    }

    showSuccess(message) {
           
        const existingModal = document.getElementById('successModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div id="successModal" class="success-modal-overlay">
                <div class="success-modal-content">
                    <div class="success-modal-header">
                        <div class="success-modal-header">
                            <div class="success-icon">✅</div>
                            <h3>Operation Successful</h3>
                        </div>
                        <div class="success-modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="success-modal-footer">
                            <button class="success-modal-btn" id="successOkBtn">OK</button>
                        </div>
                    </div>
                </div>
            `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
           
        const okBtn = document.getElementById('successOkBtn');
        const modal = document.getElementById('successModal');
        
        if (okBtn && modal) {
            okBtn.addEventListener('click', () => {
                modal.remove();
            });
            
               
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
               
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    modal.remove();
                }
            }, 3000);
        }
        
        console.log(message);
    }

    showWalletConnectModal() {
           
        const existingModal = document.getElementById('walletConnectModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div id="walletConnectModal" class="wallet-modal-overlay">
                <div class="wallet-modal-content">
                    <div class="wallet-modal-header">
                        <h3>Wallet Connection Required</h3>
                        <button class="wallet-modal-close" onclick="this.closest('.wallet-modal-overlay').remove();">&times;</button>
                    </div>
                    <div class="wallet-modal-body">
                        <p>Please connect your wallet first to generate lyrics.</p>
                    </div>
                    <div class="wallet-modal-footer">
                        <button class="wallet-modal-btn wallet-modal-btn-primary">OK</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
           
        const okBtn = document.querySelector('.wallet-modal-btn-primary');
        if (okBtn) {
            okBtn.onclick = () => {
                   
                const modal = document.getElementById('walletConnectModal');
                if (modal) modal.remove();
            };
        }
    }

    saveSelections() {
        const theme = this.getSelectedTheme();
        const style = this.getSelectedStyle();
        const customInput = this.getCustomInput();
        
        localStorage.setItem('lyricsSelections', JSON.stringify({
            theme,
            style,
            customInput
        }));
        
        console.log('Selections saved:', { theme, style, customInput });
    }

    loadSavedSelections() {
        try {
            const saved = localStorage.getItem('lyricsSelections');
            if (saved) {
                const selections = JSON.parse(saved);
                
                   
                if (selections.theme) {
                    const themeBtn = document.querySelector(`[data-theme="${selections.theme}"]`);
                    if (themeBtn) {
                        this.selectTheme(themeBtn);
                    }
                }
                
                   
                if (selections.style) {
                    const styleBtn = document.querySelector(`[data-style="${selections.style}"]`);
                    if (styleBtn) {
                        this.selectStyle(styleBtn);
                    }
                }
                
                   
                if (selections.customInput) {
                    const customInput = document.querySelector('.custom-input');
                    if (customInput) {
                        customInput.value = selections.customInput;
                    }
                }
                
                console.log('Loaded saved selections:', selections);
            }
        } catch (error) {
            console.error('Failed to load saved selections:', error);
        }
    }

       
    clearForm() {
           
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.theme-btn[data-theme="love"]').classList.add('active');
        
           
        document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.style-btn[data-style="pop"]').classList.add('active');
        
           
        const customInput = document.querySelector('.custom-input');
        if (customInput) {
            customInput.value = '';
        }
        
           
        const lyricsContent = document.querySelector('.lyrics-content');
        if (lyricsContent) {
            lyricsContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <p>Click "Generate Lyrics" button to start creating</p>
                </div>
            `;
        }
        
           
        const actionsDiv = document.querySelector('.lyrics-actions');
        if (actionsDiv) {
            actionsDiv.style.display = 'none';
        }
        
           
        localStorage.removeItem('lyricsSelections');
        
        console.log('Form cleared');
        this.showSuccess('Form cleared successfully');
    }

       
    async viewMyLyrics() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showWalletConnectModal();    
                return;
            }
    
            const response = await fetch(`${this.apiBaseUrl}/my`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
    
            const data = await response.json();
            
            if (response.ok) {
                this.showLyricsListModal(data.lyrics);
            } else {
                this.showError(data.error || 'Failed to fetch lyrics');
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            this.showError('Failed to fetch lyrics: ' + error.message);
        }
    }

       
    showLyricsListModal(lyrics) {
           
        const existingModal = document.querySelector('.lyrics-list-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

           
        const modalHtml = `
            <div class="lyrics-list-modal-overlay">
                <div class="lyrics-list-modal-content">
                    <div class="lyrics-list-modal-header">
                        <h3>My Saved Lyrics</h3>
                        <button class="lyrics-list-modal-close">×</button>
                    </div>
                    <div class="lyrics-list-modal-body">
                        ${lyrics.length === 0 ? 
                            '<p class="no-lyrics">No saved lyrics found.</p>' :
                            lyrics.map(lyric => `
                                <div class="lyric-item" data-id="${lyric.id}">
                                    <div class="lyric-header">
                                        <h4>${lyric.title || 'Untitled'}</h4>
                                        <span class="lyric-meta">${lyric.theme} • ${lyric.style}</span>
                                    </div>
                                    <div class="lyric-preview">${lyric.content.substring(0, 100)}${lyric.content.length > 100 ? '...' : ''}</div>
                                    <div class="lyric-date">Created: ${new Date(lyric.created_at).toLocaleDateString()}</div>
                                </div>
                            `).join('')
                        }
                    </div>
                    <div class="lyrics-list-modal-footer">
                        <button class="lyrics-list-modal-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

           
        document.body.insertAdjacentHTML('beforeend', modalHtml);

           
        const modal = document.querySelector('.lyrics-list-modal-overlay');
        const closeBtn = modal.querySelector('.lyrics-list-modal-close');
        const footerBtn = modal.querySelector('.lyrics-list-modal-btn');

        const closeModal = () => modal.remove();
        
        closeBtn.addEventListener('click', closeModal);
        footerBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

           
        const lyricItems = modal.querySelectorAll('.lyric-item');
        lyricItems.forEach(item => {
            item.addEventListener('click', () => {
                const lyricId = item.dataset.id;
                const lyric = lyrics.find(l => l.id == lyricId);
                if (lyric) {
                    this.showLyricsDetailModal(lyric);    
                       
                }
            });
        });
    }

       
    showLyricsDetailModal(lyric) {
       
    const existingModal = document.querySelector('.lyrics-detail-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

       
    const modalHtml = `
        <div class="lyrics-detail-modal-overlay">
            <div class="lyrics-detail-modal-content">
                <div class="lyrics-detail-modal-header">
                    <div class="lyrics-detail-title">
                        <h3>${lyric.title || 'Untitled'}</h3>
                        <div class="lyrics-detail-meta">
                            <span class="theme-tag">${lyric.theme}</span>
                            <span class="style-tag">${lyric.style}</span>
                            <span class="date-tag">Created: ${new Date(lyric.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <button class="lyrics-detail-modal-close">×</button>
                </div>
                <div class="lyrics-detail-modal-body">
                    <div class="lyrics-content">
                        ${lyric.content.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <div class="lyrics-detail-modal-footer">
                    <button class="lyrics-detail-btn lyrics-detail-btn-copy">Copy Lyrics</button>
                    <button class="lyrics-detail-btn lyrics-detail-btn-close">Close</button>
                </div>
            </div>
        </div>
    `;

       
    document.body.insertAdjacentHTML('beforeend', modalHtml);

       
    const modal = document.querySelector('.lyrics-detail-modal-overlay');
    const closeBtn = modal.querySelector('.lyrics-detail-modal-close');
    const closeFooterBtn = modal.querySelector('.lyrics-detail-btn-close');
    const copyBtn = modal.querySelector('.lyrics-detail-btn-copy');

    const closeModal = () => modal.remove();
    
    closeBtn.addEventListener('click', closeModal);
    closeFooterBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

       
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(lyric.content);
               
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#28a745';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy lyrics:', err);
               
            const lyricsContent = modal.querySelector('.lyrics-content');
            const range = document.createRange();
            range.selectNodeContents(lyricsContent);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            copyBtn.textContent = 'Selected!';
            setTimeout(() => {
                copyBtn.textContent = 'Copy Lyrics';
            }, 2000);
        }
    });
}
}

   
let lyricsGenerator;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lyricsGenerator = new LyricsGenerator();
        lyricsGenerator.init();    
    });
} else {
    lyricsGenerator = new LyricsGenerator();
    lyricsGenerator.init();    
}
