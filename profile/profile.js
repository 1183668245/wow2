class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'personal-info';
        this.apiBaseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
            || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                ? 'http://localhost:3001/api' 
                : 'https://api.ariamusic.buzz/api');
        
           
        this.checkInitialWalletState();
        
        this.init();
        
           
        this.bindWalletEvents();
        
    }
       
    showRechargePrompt() {
        alert('Coming Soon');
    }
       
    async checkInitialWalletState() {
           
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            console.log('🔍 Detected existing authentication info, loading user data immediately');
               
            setTimeout(() => {
                this.loadUserData().then(() => {
                    this.renderCurrentSection();
                });
            }, 100);
        }
        
           
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0 && token) {
                    console.log('🔍 Detected wallet connected with authentication info');
                       
                    setTimeout(() => {
                        this.refreshUserData();
                    }, 200);
                }
            } catch (error) {
                console.error('Failed to check wallet connection status:', error);
            }
        }
    }

       
    bindWalletEvents() {
           
        window.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnected();
        });
        
           
        window.addEventListener('walletConnected', (event) => {
            console.log('🔥 Received wallet connection success event', event.detail);
            this.handleWalletConnected(event.detail);
        });
        
           
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                       
                    this.handleWalletDisconnected();
                } else {
                       
                    this.refreshUserData();
                }
            });
        }
    }

       
    async handleWalletConnected(walletData) {
        console.log('Handling wallet connection success event', walletData);
        
           
        await this.refreshUserData();
    }

       
    handleWalletDisconnected() {
        console.log('Handling wallet disconnection event');
        
           
        this.currentUser = null;
        
           
        this.renderCurrentSection();
    }

       
    renderLoginPrompt() {
        return `
            <div class="login-prompt-section">
                <div class="login-prompt-card">
                    <div class="prompt-icon">
                        <img src="/icon/Profile.svg" alt="Profile" class="prompt-img">
                    </div>
                    <h2 class="prompt-title">Please Connect Wallet</h2>
                    <p class="prompt-message">You need to connect your Web3 wallet to view profile information</p>
                    <button class="connect-wallet-btn" onclick="window.location.href='/'">
                        Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    async init() {
        await this.loadUserData();
        this.bindEvents();
        this.renderCurrentSection();
    }

       
    async loadUserData() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
           
        if (!token || !userData) {
            console.log('No authentication info found, please connect wallet first');
            this.currentUser = null;
            this.showLoginPrompt();
            return;
        }
        
           
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length === 0) {
                    console.log('MetaMask not connected, clearing local data');
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    this.currentUser = null;
                    this.showLoginPrompt();
                    return;
                }
            } catch (error) {
                console.error('Failed to check wallet connection status:', error);
            }
        }

        try {
               
            const response = await fetch(`${this.apiBaseUrl}/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                console.log('✅ User data loaded successfully (from API):', this.currentUser);
            } else {
                   
                const errorText = await response.text();
                console.error(`API call failed: ${response.status} - ${errorText}`);
                throw new Error(`API call failed: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error loading user data:', error);
               
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            this.currentUser = null;
            this.showLoginPrompt();
        }
    }

       
    bindEvents() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
    }

       
    switchSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        this.currentSection = section;
        this.renderCurrentSection();
    }

       
       
    renderCurrentSection() {
        const contentArea = document.querySelector('.profile-content');
        
        switch(this.currentSection) {
            case 'personal-info':
                contentArea.innerHTML = this.renderPersonalInfo();
                break;
               
            case 'my-nft':
                contentArea.innerHTML = this.renderMyNFT();
                break;
            case 'my-share-code':
                contentArea.innerHTML = this.renderMyShareCode();
                break;
            default:
                contentArea.innerHTML = this.renderPersonalInfo();
        }
    }
       
       
    renderPersonalInfo() {
        if (!this.currentUser) {
            return this.renderLoginPrompt();
        }
    
        return `
            <div class="personal-info-section">
                <h2 class="section-title">Personal Information</h2>
                
                <div class="user-info-card">
                    <div class="user-avatar">
                        <img src="${this.currentUser.avatarFile || '/icon/Profile.svg'}" 
                             alt="User Avatar" class="avatar-img">
                        <button class="upload-avatar-btn" onclick="window.profileManager && window.profileManager.uploadAvatar()">Change Avatar</button>
                    </div>
                    
                    <div class="user-details">
                        <div class="info-row">
                            <label>Wallet Address:</label>
                            <span class="info-value wallet-address" title="${this.currentUser.walletAddress}">
                                ${this.formatWalletAddress(this.currentUser.walletAddress)}
                            </span>
                        </div>
                        
                        <div class="info-row">
                            <label>Nickname:</label>
                            <input type="text" class="info-input" id="nickname-input" 
                                   value="${this.currentUser.nickname || this.currentUser.walletAddress}">
                            <button class="save-btn" onclick="window.profileManager && window.profileManager.updateNickname()">Save</button>
                        </div>
                        
                        <div class="info-row">
                            <label>Points Balance:</label>
                            <div class="points-container">
                                <span class="info-value points">${this.currentUser.points} Points</span>
                                <button class="recharge-btn" onclick="window.profileManager && window.profileManager.showRechargePrompt()">Top Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

       
    renderMyCreations() {
        return `
            <div class="my-creations-section">
                <h2 class="section-title">My Creations</h2>
                <div class="creations-grid">
                    <div class="creation-card">
                        <h3>Lyrics Creation</h3>
                        <p>Status: ${this.currentUser?.lyricsFile ? 'Created' : 'No Creation'}</p>
                        <button class="create-btn" onclick="window.location.href='../lyrics/lyrics.html'">Start Creating</button>
                    </div>
                    <div class="creation-card">
                        <h3>Music Upload</h3>
                        <p>Status: ${this.currentUser?.musicFile ? 'Uploaded' : 'No Upload'}</p>
                        <button class="upload-btn">Upload Music</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMyNFT() {
        return `
            <div class="nft-display-container">
                <img src="/banner/NFT.png" alt="NFT Display" class="nft-full-display" onclick="handleNFTClick()" />
            </div>
        `;
    }

       
    showNFTComingSoon() {
        alert('Coming Soon!');
    }
    renderMyShareCode() {
        return `
            <div class="my-share-code-section">
                <h2 class="section-title">My Share Code</h2>
                <div class="share-code-card">
                    <p>Invite friends to register and earn points rewards</p>
                    <div class="share-code-input">
                        <input type="text" readonly value="" id="share-link-input" class="share-code" placeholder="Loading...">
                        <button class="copy-btn" onclick="profileManager.copyShareLink()" id="copy-share-btn">Copy</button>
                    </div>
                    <div class="share-rewards-info">
                        <p class="reward-text">💰 Copy link to get 5 points (one time only)</p>
                        <p class="reward-text">🎁 Get 10 points for each successful referral</p>
                    </div>
                </div>
            </div>
        `;
    }

       
    async loadShareLink() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await fetch('/api/share/link', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                const shareInput = document.getElementById('share-link-input');
                if (shareInput) {
                    shareInput.value = data.shareLink;
                }
            }
        } catch (error) {
            console.error('Failed to load share link:', error);
        }
    }

       
    async copyShareLink() {
        const shareInput = document.getElementById('share-link-input');
        const copyBtn = document.getElementById('copy-share-btn');
        
        if (!shareInput.value || shareInput.value === 'Loading...') {
            alert('Share link is still loading, please try again later');
            return;
        }
        
        try {
               
            await navigator.clipboard.writeText(shareInput.value);
            
               
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch('/api/share/copy-reward', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                if (data.success) {
                    alert(`🎉 ${data.message}`);
                    copyBtn.textContent = 'Reward Received';
                    copyBtn.disabled = true;
                       
                    this.refreshUserData();
                } else if (response.status === 400) {
                    alert('Link copied to clipboard!');
                }
            } else {
                alert('Share link copied to clipboard!');
            }
        } catch (error) {
               
            shareInput.select();
            document.execCommand('copy');
            alert('Share link copied to clipboard!');
        }
    }

       
    switchSection(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        this.currentSection = section;
        this.renderCurrentSection();
    }

       
    renderLoginPrompt() {
        return `
            <div class="login-prompt">
                <div class="login-prompt">
                    <div class="prompt-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            <path d="M9 12l2 2 4-4"/>
                        </svg>
                    </div>
                    <h2 class="prompt-title">Please Connect Wallet</h2>
                    <p class="prompt-message">You need to connect your Web3 wallet to view profile information</p>
                    <button class="connect-wallet-btn" onclick="document.querySelector('.connect-wallet').click()">
                        Connect Wallet
                    </button>
                </div>
            </div>
        `;
    }

    showLoginPrompt() {
        const contentArea = document.querySelector('.profile-content');
        if (contentArea) {
            contentArea.innerHTML = this.renderLoginPrompt();
        }
    }

       
    formatWalletAddress(address) {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }

       
    async updateNickname() {
        const newNickname = document.getElementById('nickname-input').value.trim();
        if (!newNickname) {
            alert('Nickname cannot be empty');
            return;
        }
    
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/users/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nickname: newNickname })
            });
    
            if (response.ok) {
                this.currentUser.nickname = newNickname;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                alert('Nickname updated successfully!');
                this.renderCurrentSection();    
            } else {
                const errorData = await response.json();
                alert(`Failed to update nickname: ${errorData.error || 'Please try again'}`);
            }
        } catch (error) {
            console.error('Update nickname error:', error);
            alert('Network error, please try again');
        }
    }

       
    async refreshUserData() {
        await this.loadUserData();
        this.renderCurrentSection();
        console.log('User data refreshed');
    }

       
    copyShareCode() {
        const shareCodeInput = document.querySelector('.share-code');
        shareCodeInput.select();
        document.execCommand('copy');
        alert('Share code copied to clipboard!');
    }

       
    uploadAvatar() {
        this.showAvatarModal();
    }

       
    showAvatarModal() {
           
        const modalHTML = `
            <div class="avatar-modal" id="avatarModal">
                <div class="avatar-modal-content">
                    <div class="avatar-modal-header">
                        <h3 class="avatar-modal-title">Select Avatar</h3>
                        <button class="avatar-modal-close" onclick="window.profileManager.closeAvatarModal()">&times;</button>
                    </div>
                    <div class="avatar-grid" id="avatarGrid">
                        <!-- Avatar options will be dynamically generated here -->
                    </div>
                    <div class="avatar-modal-actions">
                        <button class="avatar-cancel-btn" onclick="window.profileManager.closeAvatarModal()">Cancel</button>
                        <button class="avatar-confirm-btn" id="confirmAvatarBtn" onclick="window.profileManager.confirmAvatarSelection()" disabled>Confirm</button>
                    </div>
                </div>
            </div>
        `;

           
        document.body.insertAdjacentHTML('beforeend', modalHTML);

           
        this.generateAvatarOptions();

           
        const modal = document.getElementById('avatarModal');
        modal.classList.add('show');

           
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeAvatarModal();
            }
        });
    }

       
    generateAvatarOptions() {
        const avatarGrid = document.getElementById('avatarGrid');
        const avatarFiles = [
            'avatar03.svg', 'avatar04.svg', 'avatar08.svg', 'avatar11.svg',
            'avatar12.svg', 'avatar17.svg', 'avatar20.svg', 'avatar22.svg',
            'avatar35.svg', 'avatar39.svg', 'avatar40.svg'
        ];

        avatarFiles.forEach(filename => {
            const avatarOption = document.createElement('div');
            avatarOption.className = 'avatar-option';
            avatarOption.innerHTML = `
                <img src="/profile/Avatar/${filename}" alt="Avatar" class="avatar-preview">
            `;
            
               
            avatarOption.addEventListener('click', () => {
                   
                document.querySelectorAll('.avatar-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                   
                avatarOption.classList.add('selected');
                avatarOption.dataset.filename = filename;
                
                   
                document.getElementById('confirmAvatarBtn').disabled = false;
            });
            
            avatarGrid.appendChild(avatarOption);
        });
    }

       
    async confirmAvatarSelection() {
        const selectedOption = document.querySelector('.avatar-option.selected');
        if (!selectedOption) return;
        
        const filename = selectedOption.dataset.filename;
        const avatarPath = `/profile/Avatar/${filename}`;
        
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${this.apiBaseUrl}/users/update-avatar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ avatarFile: avatarPath })
            });
            
            if (response.ok) {
                   
                this.currentUser.avatarFile = avatarPath;
                localStorage.setItem('userData', JSON.stringify(this.currentUser));
                
                   
                this.closeAvatarModal();
                
                   
                this.renderCurrentSection();
                
                alert('Avatar updated successfully!');
            } else {
                const errorData = await response.json();
                alert(`Failed to update avatar: ${errorData.error || 'Please try again'}`);
            }
        } catch (error) {
            console.error('Update avatar error:', error);
            alert('Network error, please try again');
        }
    }

       
    closeAvatarModal() {
        const modal = document.getElementById('avatarModal');
        if (modal) {
            modal.remove();
        }
    }
}

   
function handleNFTClick() {
    if (window.profileManager) {
        window.profileManager.showNFTComingSoon();
    } else {
        alert('Coming Soon!');
    }
}

let profileManager;
document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
    window.profileManager = profileManager;    
    profileManager.init();
});
