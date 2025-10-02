class ContentLoader {
    constructor() {
        this.currentPage = 'home';
        this.contentContainer = document.querySelector('.main-content');
           
           
    }
    
    async loadPage(pageName) {
          try {
           
        this.showLoading();
        
           
        this.loadPageStyles(pageName);
        
           
        const timestamp = new Date().getTime();
        
           
        const response = await fetch(`${pageName}/${pageName}.html?t=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
            if (!response.ok) {
                throw new Error(`Failed to load ${pageName}`);
            }
            
            const content = await response.text();
            
               
            this.renderContent(content, pageName);
            
               
            this.initializePage(pageName);
            
        } catch (error) {
            console.error('Error loading page:', error);
            this.showError(pageName);
        }
    }
    
    renderContent(content, pageName) {
           
        const tabNav = document.querySelector('.tab-nav');
        
        const homeSection = ['.carousel-section', '.category-section', '.songs-section'];
        
        if (pageName !== 'home') {
               
            homeSection.forEach(selector => {
                const section = document.querySelector(selector);
                if (section) {
                    section.style.display = 'none';
                }
            });
        } else {
               
            homeSection.forEach(selector => {
                const section = document.querySelector(selector);
                if (section) {
                    section.style.display = 'block';
                }
            });
        }
        
           
        const dynamicContent = this.contentContainer.querySelectorAll(
            '.page-content, .songs-container, .lyrics-container, .profile-container, .loading-container, .error-container'
        );
        dynamicContent.forEach(content => content.remove());
        
           
        this.contentContainer.insertAdjacentHTML('beforeend', content);
        
           
        this.loadPageStyles(pageName);
        
           
        this.currentPage = pageName;
        
           
        this.updateTabState(pageName);
    }
    
       
    renderHomeContent() {
           
        const homeSection = ['.carousel-section', '.category-section', '.songs-section'];
        homeSection.forEach(selector => {
            const section = document.querySelector(selector);
            if (section) {
                section.style.display = 'block';     
            }
        });
        
           
        const dynamicContent = this.contentContainer.querySelectorAll(
            '.page-content, .songs-container, .lyrics-container, .profile-container, .loading-container, .error-container'
        );
        dynamicContent.forEach(content => content.remove());
    }

    async initializePage(pageName) {
        if (pageName === 'profile') {
            await this.initializeProfilePage();
        } else if (pageName === 'home') {
               
            await this.loadScript('home/home.js');
            
               
            setTimeout(() => {
                if (typeof initializeHomePage === 'function') {
                    initializeHomePage();
                    console.log('Home page functionality reinitialized via contentLoader');
                }
            }, 100);
        } else if (pageName === 'lyrics') {
               
            await this.loadScript('lyrics/lyrics.js');
            
               
            setTimeout(() => {
                if (typeof LyricsGenerator !== 'undefined') {
                       
                    if (window.lyricsGenerator) {
                        window.lyricsGenerator = null;
                    }
                       
                    window.lyricsGenerator = new LyricsGenerator();
                    window.lyricsGenerator.init();    
                    console.log('Lyrics generator reinitialization completed');
                } else {
                    console.error('LyricsGenerator class not found');
                }
            }, 100);
        } else if (pageName === 'songs') {
               
            await this.loadScript('songs/songs.js');
            
               
            setTimeout(() => {
                if (typeof SongsGenerator !== 'undefined') {
                       
                    if (window.songsGenerator) {
                        window.songsGenerator = null;
                    }
                       
                    window.songsGenerator = new SongsGenerator();
                    console.log('Songs generator initialization completed');
                } else {
                    console.error('SongsGenerator class not found');
                }
            }, 100);
        }
           
    }
    
       
    async initializeProfilePage() {
        try {
               
            if (window.profileManager) {
                window.profileManager = null;
            }
            
               
            await this.loadScript('profile/profile.js');
            
               
            const initializeWithRetry = () => {
                if (typeof ProfileManager !== 'undefined') {
                    window.profileManager = new ProfileManager();
                    console.log('ProfileManager initialization successful');
                    
                       
                    setTimeout(() => {
                        if (window.profileManager) {
                               
                            const authToken = localStorage.getItem('authToken');
                            const userData = localStorage.getItem('userData');
                            
                            if (authToken && userData) {
                                console.log('🔥 Connected wallet detected, refreshing data immediately');
                                window.profileManager.refreshUserData();
                            }
                            
                               
                            if (window.ethereum && window.walletManager) {
                                window.ethereum.request({ method: 'eth_accounts' })
                                    .then(accounts => {
                                        if (accounts.length > 0 && authToken) {
                                            console.log('🔥 MetaMask connection detected, refreshing data');
                                            window.profileManager.refreshUserData();
                                        }
                                    })
                                    .catch(console.error);
                            }
                        }
                    }, 50);
                } else {
                    console.error('ProfileManager class not found, retrying...');
                       
                    setTimeout(initializeWithRetry, 50);
                }
            };
            
               
            setTimeout(initializeWithRetry, 100);
            
        } catch (error) {
            console.error('Failed to initialize Profile page:', error);
        }
    }
    
       
    loadScript(src) {
        return new Promise((resolve, reject) => {
               
            const existingScript = document.querySelector(`script[src*="${src}"]`);
            if (existingScript) {
                existingScript.remove();
            }
            
            const script = document.createElement('script');
            script.src = src + '?t=' + new Date().getTime();    
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    updateTabState(pageName) {
           
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        
           
        const currentTab = document.querySelector(`[data-tab="${pageName}"]`);
        if (currentTab) {
            currentTab.classList.add('active');
        }
    }
    
    loadPageStyles(pageName) {
           
        const pageStylesheets = document.querySelectorAll('link[href*="/"][href$=".css"]');
        pageStylesheets.forEach(link => {
            const href = link.getAttribute('href');
               
            if (href.includes('/') && !href.includes('style.css') && !href.includes('fonts')) {
                link.remove();
            }
        });
        
           
        const timestamp = new Date().getTime();
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${pageName}/${pageName}.css?t=${timestamp}`;
        document.head.appendChild(link);
    }
    
    showLoading() {
        const sections = this.contentContainer.querySelectorAll('section:not(.tab-nav)');
        sections.forEach(section => section.remove());
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-container';
        loadingDiv.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        this.contentContainer.appendChild(loadingDiv);
    }
    
    showError(pageName) {
        const sections = this.contentContainer.querySelectorAll('section:not(.tab-nav)');
        sections.forEach(section => section.remove());
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-container';
        errorDiv.innerHTML = `
            <div class="error-message">
                <h3>Loading Failed</h3>
                <p>Unable to load ${pageName} page content</p>
                <button onclick="contentLoader.loadPage('${pageName}')">Retry</button>
            </div>
        `;
        this.contentContainer.appendChild(errorDiv);
    }
}

   
const contentLoader = new ContentLoader();

   
function syncTabStates(activeTab) {
       
    document.querySelectorAll('.desktop-tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === activeTab) {
            item.classList.add('active');
        }
    });
    
       
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === activeTab) {
            item.classList.add('active');
        }
    });
}

   
document.querySelectorAll('.desktop-tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        syncTabStates(tab);
        contentLoader.loadPage(tab);     
    });
});

   
document.querySelectorAll('.tab-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        syncTabStates(tab);
        contentLoader.loadPage(tab);     
    });
});

   
document.addEventListener('DOMContentLoaded', () => {
       
    contentLoader.loadPage('home');
});
