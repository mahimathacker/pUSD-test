// ethers.js will be loaded from CDN in HTML

// Check if ethers is loaded
if (typeof ethers === 'undefined') {
  console.error('ethers.js is not loaded. Please check the CDN link.');
}

let provider;   
const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];
   
  
   
  
  // ABI for our PYUSDReceiver contracts
  const receiverAbi = [
    "function donate(uint256 _amount)"
  ];
// Contract addresses - replace with your actual deployed addresses
const PYUSD_ADDRESS = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
const CONTRACT_ADDRESS = "0x174599400F6dcFAAbe17aCAE0c6b8992e3c88b0d";

// State variables
let account = null;
let balance = '0';
let contractBalance = '0';
let amount = '';
let status = 'Ready to connect wallet';
let isConnecting = false;
let isDepositing = false;

// DOM elements
let accountElement, balanceElement, contractBalanceElement, amountInput, statusElement, connectButton, donateButton;

function App() {
 

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatus('Please install MetaMask to use this app');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await fetchBalance(accounts[0]);
      await fetchContractBalance();
      setStatus('Wallet connected');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setStatus('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Fetch PYUSD balance
  const fetchBalance = async (userAccount) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, erc20Abi, provider);
      const balanceWei = await pyusdContract.balanceOf(userAccount);
      const balanceFormatted = ethers.utils.formatUnits(balanceWei, 6);
      setBalance(balanceFormatted);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance('0');
    }
  };

  // Fetch donation contract balance
  const fetchContractBalance = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, erc20Abi, provider);
      const contractBalanceWei = await pyusdContract.balanceOf(CONTRACT_ADDRESS);
      const contractBalanceFormatted = ethers.utils.formatUnits(contractBalanceWei, 6);
      setContractBalance(contractBalanceFormatted);
    } catch (error) {
      console.error('Error fetching contract balance:', error);
      setContractBalance('0');
    }
  };
 

  // Handle donation
   const handleDonate = async () => {
    if (!account || !amount || parseFloat(amount) <= 0) {
      setStatus('Please enter a valid amount');
      return;
    }
 

    setIsDepositing(true);
    setStatus('Processing donation...');
 

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      // Convert amount to wei (considering 6 decimals for PYUSD)
      const amountInSmallestUnit = ethers.utils.parseUnits(amount, 6);

      // First approve the contract to spend tokens
      const pyusdContract = new ethers.Contract(PYUSD_ADDRESS, erc20Abi, signer);
      const approveTx = await pyusdContract.approve(CONTRACT_ADDRESS, amountInSmallestUnit);
      await approveTx.wait();

      // Then make the deposit
      const receiverContract = new ethers.Contract(CONTRACT_ADDRESS, receiverAbi, signer);
      const depositTx = await receiverContract.donate(amountInSmallestUnit);
      await depositTx.wait();
 

      // Clear form and update balances
      setAmount('');
      await fetchBalance(account);
      await fetchContractBalance();
      setStatus('Donation complete!');
    } catch (error) {
      console.error('Error donating:', error);
      setStatus('Donation failed');
    } finally {
      setIsDepositing(false);
    }
  };

  // State management functions
  const setAccount = (newAccount) => {
    account = newAccount;
    if (accountElement) {
      accountElement.textContent = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected';
    }
    // Update donate button state
    if (donateButton) {
      donateButton.disabled = !account || isDepositing;
    }
  };

  const setBalance = (newBalance) => {
    balance = newBalance;
    if (balanceElement) {
      balanceElement.textContent = `${parseFloat(balance).toFixed(2)} PYUSD`;
    }
  };

  const setContractBalance = (newContractBalance) => {
    contractBalance = newContractBalance;
    if (contractBalanceElement) {
      contractBalanceElement.textContent = `${parseFloat(contractBalance).toFixed(2)} PYUSD`;
    }
  };

  const setAmount = (newAmount) => {
    amount = newAmount;
    if (amountInput) {
      amountInput.value = amount;
    }
  };

  const setStatus = (newStatus) => {
    status = newStatus;
    if (statusElement) {
      statusElement.textContent = status;
      // Update status styling based on content
      statusElement.className = 'status';
      if (status.includes('failed') || status.includes('error') || status.includes('Error')) {
        statusElement.className += ' error';
      } else if (status.includes('complete') || status.includes('success') || status.includes('connected')) {
        statusElement.className += ' success';
      }
    }
  };

  const setIsConnecting = (connecting) => {
    isConnecting = connecting;
    if (connectButton) {
      connectButton.disabled = connecting;
      connectButton.textContent = connecting ? 'Connecting...' : 'Connect Wallet';
    }
  };

  const setIsDepositing = (depositing) => {
    isDepositing = depositing;
    if (donateButton) {
      donateButton.disabled = depositing || !account;
      donateButton.textContent = depositing ? 'Processing...' : 'Donate';
    }
  };

  // Initialize the app
  const init = () => {
    // Get DOM elements
    accountElement = document.getElementById('account');
    balanceElement = document.getElementById('balance');
    contractBalanceElement = document.getElementById('contract-balance');
    amountInput = document.getElementById('amount');
    statusElement = document.getElementById('status');
    connectButton = document.getElementById('connect-wallet');
    donateButton = document.getElementById('donate');

    // Set up event listeners
    if (connectButton) {
      connectButton.addEventListener('click', connectWallet);
    }
    
    if (donateButton) {
      donateButton.addEventListener('click', handleDonate);
    }

    if (amountInput) {
      amountInput.addEventListener('input', (e) => {
        setAmount(e.target.value);
      });
    }

    // Initialize UI
    setAccount(null);
    setBalance('0');
    setContractBalance('0');
    setAmount('');
    setStatus('Ready to connect wallet');
    setIsConnecting(false);
    setIsDepositing(false);
  };

  // Expose functions globally
  window.connectWallet = connectWallet;
  window.handleDonate = handleDonate;
  window.init = init;

  return {
    connectWallet,
    handleDonate,
    fetchBalance,
    init
  };
}

// Initialize when DOM is loaded and ethers is available
function initializeApp() {
  if (typeof ethers === 'undefined') {
    console.log('Waiting for ethers.js to load...');
    setTimeout(initializeApp, 100);
    return;
  }
  
  console.log('Initializing app with ethers.js');
  const app = App();
  app.init();
}

document.addEventListener('DOMContentLoaded', initializeApp);