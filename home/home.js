   

   
   
class BannerCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.banner-slide');
        this.dots = document.querySelectorAll('.dot');
        this.currentSlide = 0;
        this.init();
    }

    init() {
           
        this.dots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });

           
        this.startAutoPlay();
    }

    goToSlide(index) {
           
        this.slides[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].classList.remove('active');

           
        this.currentSlide = index;
        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(next);
    }

    startAutoPlay() {
        setInterval(() => {
            this.nextSlide();
        }, 5000);    
    }
}

   
class CategoryFilter {
    constructor() {
        this.categoryItems = document.querySelectorAll('.category-item');
        this.songCards = document.querySelectorAll('.song-card');
        this.init();
    }

    init() {
        this.categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.filterSongs(category);
                this.updateActiveCategory(e.target);
            });
        });
    }

    filterSongs(category) {
        this.songCards.forEach(card => {
            if (category === 'all') {
                card.style.display = 'block';
            } else {
                   
                const hasRecommendedTag = card.querySelector('.recommended-tag');
                const hasPopularTag = card.querySelector('.popular-tag');
                const hasHiphopTag = card.querySelector('.hiphop-tag');
                const hasOtherTag = card.querySelector('.other-tag');
                
                let shouldShow = false;
                
                switch(category) {
                    case 'recommend':
                        shouldShow = hasRecommendedTag !== null;
                        break;
                    case 'popular':
                        shouldShow = hasPopularTag !== null;
                        break;
                    case 'hiphop':
                        shouldShow = hasHiphopTag !== null;
                        break;
                    case 'other':
                        shouldShow = hasOtherTag !== null;
                        break;
                }
                
                card.style.display = shouldShow ? 'block' : 'none';
            }
        });
        
           
        if (window.paginationSystem) {
            window.paginationSystem.updateVisibleCards();
        }
    }

    updateActiveCategory(activeItem) {
        this.categoryItems.forEach(item => item.classList.remove('active'));
        activeItem.classList.add('active');
    }
}

   
class SearchFunction {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.searchButton = document.querySelector('.search-button');
        this.songCards = document.querySelectorAll('.song-card');
        this.init();
    }

    init() {
        this.searchButton.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
           
        this.searchInput.addEventListener('input', () => {
            this.performSearch();
        });
    }

    performSearch() {
        const searchTerm = this.searchInput.value.toLowerCase().trim();
        
        this.songCards.forEach(card => {
            const songTitle = card.querySelector('.song-title').textContent.toLowerCase();
            if (searchTerm === '' || songTitle.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
           
        if (window.paginationSystem) {
            window.paginationSystem.updateVisibleCards();
        }
    }
    
       
    clearSearch() {
        this.searchInput.value = '';
        this.performSearch();
    }
}

   
class PaginationSystem {
    constructor() {
        this.songsPerPage = 8;    
        this.currentPage = 1;
        this.totalPages = 1;
        this.allSongCards = document.querySelectorAll('.song-card');
        this.visibleSongCards = [...this.allSongCards];    
        
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPagesSpan = document.getElementById('totalPages');
        
        this.init();
    }

    init() {
        this.updateVisibleCards();
        
        this.prevBtn.addEventListener('click', () => {
            this.goToPrevPage();
        });
        
        this.nextBtn.addEventListener('click', () => {
            this.goToNextPage();
        });
    }
    
       
    updateVisibleCards() {
        this.visibleSongCards = [...this.allSongCards].filter(card => {
            return card.style.display !== 'none';
        });
        
        this.totalPages = Math.ceil(this.visibleSongCards.length / this.songsPerPage) || 1;
        this.currentPage = 1;    
        this.showPage(1);
    }

    showPage(page) {
           
        this.allSongCards.forEach(card => {
            card.classList.remove('pagination-visible');
        });
        
           
        const startIndex = (page - 1) * this.songsPerPage;
        const endIndex = startIndex + this.songsPerPage;
        
           
        this.visibleSongCards.slice(startIndex, endIndex).forEach(card => {
            card.classList.add('pagination-visible');
        });
        
        this.updatePagination();
    }

    updatePagination() {
        this.currentPageSpan.textContent = this.currentPage;
        this.totalPagesSpan.textContent = this.totalPages;
        
        this.prevBtn.disabled = this.currentPage === 1;
        this.nextBtn.disabled = this.currentPage === this.totalPages;
    }

    goToPrevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.showPage(this.currentPage);
        }
    }

    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.showPage(this.currentPage);
        }
    }
}

   
function showChatRoomComingSoon() {
       
    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-icon">🚀</div>
            <h3>Coming Soon!</h3>
            <p>Chat Room feature is under development</p>
            <button class="modal-close-btn" onclick="this.parentElement.parentElement.remove()">OK</button>
        </div>
    `;
    document.body.appendChild(modal);
    
       
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

 
function checkWalletConnection() {
     
    if (window.walletManager && window.walletManager.isConnected) {
        return true;
    }
    return false;
}

 
function isTaskCompleted(taskId) {
     
    const walletAddress = window.walletManager?.currentAccount;
    if (!walletAddress) return false;
    
     
    const storageKey = `completedTasks_${walletAddress}`;
    const completedTasks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return completedTasks[taskId] === true;
}

 
function markTaskAsCompleted(taskId) {
     
    const walletAddress = window.walletManager?.currentAccount;
    if (!walletAddress) return;
    
     
    const storageKey = `completedTasks_${walletAddress}`;
    const completedTasks = JSON.parse(localStorage.getItem(storageKey) || '{}');
    completedTasks[taskId] = true;
    localStorage.setItem(storageKey, JSON.stringify(completedTasks));
}

 
async function addUserPoints(taskId, points) {
    if (!checkWalletConnection()) {
        return { success: false, message: 'Wallet not connected' };
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        return { success: false, message: 'Authentication failed' };
    }

    try {
         
        const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) 
            || (['localhost', '127.0.0.1'].includes(window.location.hostname) 
                ? 'http://localhost:3001/api' 
                : 'https://api.ariamusic.buzz/api');
        const response = await fetch(`${baseUrl}/users/add-points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ taskId, points })
        });

        if (!response.ok) {
            throw new Error('Failed to add points');
        }

        const result = await response.json();
        return { success: true, ...result };
    } catch (error) {
        console.error('Error adding points:', error);
        return { success: false, message: error.message };
    }
}

 
function showWalletConnectPrompt() {
    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Connect Wallet Required</h3>
                <button class="modal-close-btn-x" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Please connect your wallet to earn points from tasks.</p>
                <button class="connect-wallet-btn" onclick="this.parentElement.parentElement.parentElement.remove()">I understand</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
     
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

 
function connectWalletFromPrompt() {
     
    const modal = document.querySelector('.coming-soon-modal');
    if (modal) modal.remove();
}

 
async function copyWebsiteLink() {
     
    if (!checkWalletConnection()) {
        showWalletConnectPrompt();
        return;
    }
    
     
    const taskId = 'copy_link';
    if (isTaskCompleted(taskId)) {
        return;  
    }
    
     
    const websiteUrl = "https://ariamusic.buzz/";
    try {
        await navigator.clipboard.writeText(websiteUrl);
        
         
        const result = await addUserPoints(taskId, 5);
        if (result.success) {
             
            markTaskAsCompleted(taskId);
            
             
            updateTaskButtonState('copy-link-btn', true);
            
             
            showNotification('Link copied to clipboard! +5 points added');
        } else {
            showNotification('Failed to add points: ' + result.message);
        }
    } catch (err) {
        console.error('复制失败:', err);
        showNotification('Failed to copy link');
    }
}

 
async function goToTwitter() {
     
    if (!checkWalletConnection()) {
        showWalletConnectPrompt();
        return;
    }
    
     
    const taskId = 'twitter_post';
    if (isTaskCompleted(taskId)) {
        return;  
    }
    
     
    const result = await addUserPoints(taskId, 5);
    if (result.success) {
         
        markTaskAsCompleted(taskId);
        
         
        updateTaskButtonState('twitter-btn', true);
        
         
        const tweetText = "I'm using #Aria, the innovative music platform! ";
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, '_blank');
        
         
        showNotification('+5 points added');
    } else {
        showNotification('Failed to add points: ' + result.message);
    }
}

 
function updateTaskButtonState(buttonId, completed) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (completed) {
            button.textContent = 'Task Completed';
            button.classList.add('task-completed');
            button.disabled = true;
        } else {
            button.classList.remove('task-completed');
            button.disabled = false;
        }
    }
}

 
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="#56cc28" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
     
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showTasksComingSoon() {
     
    const modal = document.createElement('div');
    modal.className = 'coming-soon-modal';
    
     
    const copyLinkCompleted = isTaskCompleted('copy_link');
    const twitterPostCompleted = isTaskCompleted('twitter_post');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Complete Tasks for Points</h3>
                <button class="modal-close-btn-x" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="task-list">
                <div class="task-item">
                    <div class="task-info">
                        <h4>Task 1: Share Website Link</h4>
                        <p>Share with your friends to earn 5 points for free!</p>
                    </div>
                    <button id="copy-link-btn" class="task-action-btn ${copyLinkCompleted ? 'task-completed' : ''}" 
                            onclick="copyWebsiteLink()" ${copyLinkCompleted ? 'disabled' : ''}>
                        ${copyLinkCompleted ? 'Task Completed' : 'Copy Link'}
                    </button>
                </div>
                <div class="task-item">
                    <div class="task-info">
                        <h4>Task 2: Post a Tweet</h4>
                        <p>Tag @ARIA_Web3music and copy the contract to earn 5 points for free!</p>
                    </div>
                    <button id="twitter-btn" class="task-action-btn ${twitterPostCompleted ? 'task-completed' : ''}" 
                            onclick="goToTwitter()" ${twitterPostCompleted ? 'disabled' : ''}>
                        ${twitterPostCompleted ? 'Task Completed' : 'Complete Now'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
     
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

   
 
function initializeHomePage() {
    console.log('Starting home page initialization');
    
     
    showTasksComingSoon();
    
    setTimeout(() => {
        new BannerCarousel();
        new CategoryFilter();
        new SearchFunction();
        window.paginationSystem = new PaginationSystem();    
        
         
        if (window.globalMusicPlayer) {
            window.globalMusicPlayer.bindSongCardEvents();
        }
        
        console.log('Home page initialization completed');
    }, 50);
}

 
 
 
 
 
initializeHomePage();
