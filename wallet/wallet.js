   
   
class WalletManager {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isConnected = false;
        this.apiBaseUrl = 'https://api.ariamusic.buzz/api';
        this.connectButton = null;
        this.statusElement = null;
        this.addressElement = null;
        this.pointsElement = null;
    }

       
    async detectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask wallet detected');
            return 'MetaMask';
        } else if (typeof window.web3 !== 'undefined') {
            console.log('Other Web3 wallet detected');
            return 'Other';
        } else {
            console.log('No Web3 wallet detected');
            return null;
        }
    }

       
    async loginToBackend(walletAddress) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/wallet-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress: walletAddress
                })
            });
    
            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                
                try {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    console.log('✅ Backend login successful:', data.message);
                    console.log('👤 User info:', data.user);
                    console.log('💾 User data saved to localStorage');
                    
                       
                    const savedData = localStorage.getItem('userData');
                    if (savedData) {
                        console.log('✅ localStorage verification successful:', JSON.parse(savedData));
                    } else {
                        console.error('❌ localStorage save failed');
                    }
                } catch (error) {
                    console.error('❌ localStorage operation failed:', error);
                       
                    window.currentUser = data.user;
                    console.log('🔄 Saved to global variable window.currentUser');
                }
                
                return true;
            } else {
                const errorData = await response.json();
                console.error('❌ Backend login failed:', errorData.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            return false;
        }
    }

       
       
       
    async connectWallet() {
        try {
            const walletType = await this.detectWallet();
            
            if (!walletType) {
                alert('Please install MetaMask or other Web3 wallet extension first!');
                window.open('https://metamask.io/download/', '_blank');
                return false;
            }
    
               
            if (window.ethereum) {
                   
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    this.isConnected = true;
                    
                       
                    const loginSuccess = await this.loginToBackend(this.currentAccount);
                    if (!loginSuccess) {
                        console.error('Backend login failed');
                        return false;
                    }
                    
                       
                    await this.updateUI();
                    
                       
                    if (window.ethereum.isMetaMask) {
                           
                        setTimeout(() => {
                            this.notifyWalletConnected();
                            console.log('🔥 MetaMask delayed event triggered');
                        }, 300);
                    } else {
                           
                        this.notifyWalletConnected();
                    }
                    
                    return true;
                }
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
            if (error.code === 4001) {
                alert('User rejected the connection request');
            } else {
                alert('Error occurred while connecting wallet, please try again');
            }
            return false;
        }
    }

       
    disconnect() {
        this.currentAccount = null;
        this.isConnected = false;
        this.authToken = null;
        
           
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');    
        
           
        if (window.ethereum) {
            window.ethereum.removeAllListeners('accountsChanged');
            window.ethereum.removeAllListeners('chainChanged');
        }
        
           
        const connectButton = document.querySelector('.connect-wallet');
        if (connectButton) {
            connectButton.textContent = 'Connect Wallet';
            connectButton.style.background = '#56cc28';
            connectButton.style.color = 'white';
        }
        
           
        this.hideWalletInfo();
        
           
        this.notifyWalletDisconnected();
        
        console.log('Wallet disconnected successfully');
    }
    
       
    notifyWalletDisconnected() {
        // 清理当前钱包的任务完成状态
        if (this.currentAccount) {
            const storageKey = `completedTasks_${this.currentAccount}`;
            // 注意：这里不删除任务状态，保留用户的任务记录
            // localStorage.removeItem(storageKey);
        }
        
        // 发送钱包断开连接事件
        const event = new CustomEvent('walletDisconnected', {
            detail: { message: 'Wallet disconnected' }
        });
        window.dispatchEvent(event);
        
        // 通知其他组件
        if (window.profileManager) {
            window.profileManager.handleWalletDisconnected();
        }
    }
    
       
       
    async updateUI() {
        const connectButton = document.querySelector('.connect-wallet');
        
        if (!connectButton) {
            console.error('Connect button not found');
            return;
        }
        
           
        connectButton.style.display = 'none';
        connectButton.offsetHeight;    
        connectButton.style.display = 'block';
        
        if (this.isConnected && this.currentAccount) {
               
            const shortAddress = `${this.currentAccount.slice(0, 6)}...${this.currentAccount.slice(-4)}`;
            connectButton.textContent = `Connected: ${shortAddress}`;
            connectButton.style.background = '#4bb023';
            connectButton.style.color = 'white';
            
               
            const balance = await this.getBalance();
            const networkInfo = await this.getNetworkInfo();
            
            console.log(`Wallet Address: ${this.currentAccount}`);
            console.log(`Balance: ${balance} ETH`);
            console.log(`Network: ${networkInfo?.networkName || 'Unknown'}`);
            
               
            this.hideWalletInfo();
            
               
               
               
        } else {
               
            connectButton.textContent = 'Connect Wallet';
            connectButton.style.background = '#56cc28';
            connectButton.style.color = 'white';
            
               
            this.hideWalletInfo();
            
            console.log('UI updated to disconnected state');
        }
    }

       
    async getNetworkInfo() {
        if (window.ethereum) {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const networkNames = {
                    '0x1': 'Ethereum Mainnet',
                    '0x3': 'Ropsten Testnet',
                    '0x4': 'Rinkeby Testnet',
                    '0x5': 'Goerli Testnet',
                    '0x89': 'Polygon Mainnet',
                    '0x13881': 'Polygon Mumbai Testnet'
                };
                return {
                    chainId: chainId,
                    networkName: networkNames[chainId] || 'Unknown Network'
                };
            } catch (error) {
                console.error('Failed to get network information:', error);
                return null;
            }
        }
    }

       
    async getBalance() {
        if (this.currentAccount && window.ethereum) {
            try {
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.currentAccount, 'latest']
                });
                   
                const ethBalance = parseInt(balance, 16) / Math.pow(10, 18);
                return ethBalance.toFixed(4);
            } catch (error) {
                console.error('Failed to get balance:', error);
                return '0.0000';
            }
        }
        return '0.0000';
    }

       
    showWalletInfo(address, balance, networkInfo) {
           
        let walletInfo = document.querySelector('.wallet-info');
        if (!walletInfo) {
            walletInfo = document.createElement('div');
            walletInfo.className = 'wallet-info';
            walletInfo.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(42, 42, 42, 0.95);
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
                color: white;
                font-size: 12px;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;
            document.body.appendChild(walletInfo);
        }
        
        walletInfo.innerHTML = `
            <div><strong>Wallet Address:</strong> ${address}</div>
            <div><strong>Balance:</strong> ${balance} ETH</div>
            <div><strong>Network:</strong> ${networkInfo?.networkName || 'Unknown'}</div>
            <button onclick="walletManager.disconnect()" style="
                margin-top: 10px;
                padding: 5px 10px;
                background: #ff4444;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            ">Disconnect</button>
        `;
    }

       
    hideWalletInfo() {
        const walletInfo = document.querySelector('.wallet-info');
        if (walletInfo) {
            walletInfo.remove();
        }
    }
    
       
    notifyWalletConnected() {
           
        const event = new CustomEvent('walletConnected', {
            detail: {
                address: this.currentAccount,
                userData: this.userData,
                message: 'Wallet connected successfully'
            }
        });
        window.dispatchEvent(event);
        console.log('🔥 Wallet connection success event sent');
        
           
        const refreshProfileData = () => {
            if (window.profileManager && typeof window.profileManager.refreshUserData === 'function') {
                console.log('🔥 Immediately refresh Profile data');
                window.profileManager.refreshUserData();
            } else {
                   
                console.log('🔥 ProfileManager not ready, retrying after wait');
                setTimeout(refreshProfileData, 100);
            }
        };
        
           
        const currentTab = document.querySelector('.tab-item.active');
        if (currentTab && currentTab.textContent.includes('Profile')) {
            refreshProfileData();
        }
    }
}

   
const walletManager = new WalletManager();
// 将实例设置为全局变量，供其他模块使用
window.walletManager = walletManager;

   
document.addEventListener('DOMContentLoaded', function() {
       
    if (window.ethereum && window.ethereum.selectedAddress) {
        walletManager.currentAccount = window.ethereum.selectedAddress;
        walletManager.isConnected = true;
        walletManager.updateUI();
    }
    
       
    const connectButton = document.querySelector('.connect-wallet');
    if (connectButton) {
        connectButton.addEventListener('click', async function() {
            if (walletManager.isConnected) {
                   
                walletManager.disconnect();
            } else {
                   
                await walletManager.connectWallet();
            }
        });
    }
});

   
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}