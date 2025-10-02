 
const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
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
