   
function checkInviteCode() {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('ref');
    
    if (inviteCode) {
           
        localStorage.setItem('inviteCode', inviteCode);
        
           
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
           
        showInviteNotification(inviteCode);
    }
}

function showInviteNotification(inviteCode) {
    const notification = document.createElement('div');
    notification.className = 'invite-notification';
    notification.innerHTML = `
        <div class="invite-content">
            <h3>🎉 You've received an invitation!</h3>
            <p>Invite Code: ${inviteCode}</p>
            <p>Connect your wallet to register and get extra rewards</p>
            <button onclick="this.parentElement.parentElement.remove()">Got it</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
       
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

   
document.addEventListener('DOMContentLoaded', function() {
       
    checkInviteCode();
       
    const tabItems = document.querySelectorAll('.tab-item');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
               
            tabItems.forEach(tab => tab.classList.remove('active'));
            
               
            this.classList.add('active');
            
               
            const tabType = this.getAttribute('data-tab');
            console.log('Switching to tab:', tabType);
            
               
            if (tabType === 'lyrics') {
                contentLoader.loadPage('lyrics');
            } else if (tabType === 'songs') {
                contentLoader.loadPage('songs');
            } else if (tabType === 'profile') {
                contentLoader.loadPage('profile');
            } else if (tabType === 'home') {
                   
                contentLoader.loadPage('home');
            } else {
                   
                console.log(`${tabType} page under development...`);
            }
        });
    });
    
       
    const bannerSlides = document.querySelectorAll('.banner-slide');
    const bannerDots = document.querySelectorAll('.banner-dots .dot');
    let currentBanner = 0;
    
       
    function goToBanner(bannerIndex) {
           
        bannerSlides.forEach(slide => slide.classList.remove('active'));
        bannerDots.forEach(dot => dot.classList.remove('active'));
        
           
        bannerSlides[bannerIndex].classList.add('active');
        bannerDots[bannerIndex].classList.add('active');
        
        currentBanner = bannerIndex;
    }
    
       
    function nextBanner() {
        const nextIndex = (currentBanner + 1) % bannerSlides.length;
        goToBanner(nextIndex);
    }
    
       
    bannerDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToBanner(index);
        });
    });
    
       
    setInterval(nextBanner, 5000);
    
       
    const songCards = document.querySelectorAll('.song-card');
    
    songCards.forEach((card, index) => {
        card.addEventListener('click', function() {
            const songTitle = this.querySelector('.song-title').textContent;
            console.log('Clicked song:', songTitle);
               
        });
    });
 
    
       
    const ctaButton = document.querySelector('.cta-button');
    
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            console.log('Start exploring');
               
        });
    }
    
       
    const socialIcons = document.querySelectorAll('.social-icons a');
    
    socialIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            const platform = this.classList.contains('twitter-icon') ? 'Twitter' : 'Telegram';
            console.log('Clicked', platform, 'icon');
               
        });
    });
});

   
window.addEventListener('resize', function() {
       
    console.log('Window size has changed');
});

   
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('profile-tab')) {
           
        document.querySelectorAll('.profile-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
           
        e.target.classList.add('active');
        const targetTab = e.target.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
    }
});