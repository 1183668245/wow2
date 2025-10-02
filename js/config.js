 
const API_CONFIG = {
    BASE_URL: (['localhost', '127.0.0.1'].includes(window.location.hostname))
        ? 'http://localhost:3001/api'  // 本地开发环境
        : 'https://api.ariamusic.buzz/api',  // 生产环境
    ENDPOINTS: {
        AUTH: '/auth',
        USERS: '/users', 
        LYRICS: '/lyrics',
        SONGS: '/songs',
        NFT: '/nft'
    }
};

 
window.API_CONFIG = API_CONFIG;
