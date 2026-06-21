import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Wallet, ArrowRight, ShieldCheck, Lock, CheckCircle, Activity, History } from 'lucide-react';
import { connectWallet, kit } from './wallet';
import { getLimit } from './complianceContract';
import { deposit, releaseFunds, getTransferHistory } from './escrowContract';
import { getRecentEvents } from './activityFeed';
import './styles/main.css';

function App() {
  const [address, setAddress] = useState('');
  const [limit, setLimit] = useState(0);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Remittance Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    const fetchedLimit = await getLimit(address);
    setLimit(fetchedLimit);
    
    const fetchedHistory = await getTransferHistory(address);
    setHistory(fetchedHistory);

    const fetchedEvents = await getRecentEvents();
    setEvents(fetchedEvents);
  };

  useEffect(() => {
    let interval;
    if (address) {
      interval = setInterval(loadData, 10000); // Poll every 10s
    }
    return () => clearInterval(interval);
  }, [address]);

  const handleConnect = async () => {
    try {
      const pubKey = await connectWallet();
      setAddress(pubKey);
      toast.success('Wallet connected successfully!');
    } catch (e) {
      toast.error('Failed to connect wallet: ' + e.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect via kit or simply clear state
      setAddress('');
      toast.info('Wallet disconnected');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!address) return toast.error('Please connect your wallet first');
    if (!recipient || !amount) return toast.error('Please fill all fields');
    if (Number(amount) > limit) return toast.error(`Amount exceeds compliance limit of ${limit} XLM`);

    try {
      setLoading(true);
      const res = await deposit(address, recipient, amount);
      if (res.success) {
        toast.success(`Funds deposited! Hash: ${res.hash.slice(0,10)}...`);
        setAmount('');
        setRecipient('');
        loadData();
      }
    } catch (e) {
      toast.error(e.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (transferId) => {
    if (!address) return toast.error('Please connect your wallet first');
    try {
      const res = await releaseFunds(address, transferId);
      if (res.success) {
        toast.success(`Funds released! Hash: ${res.hash.slice(0,10)}...`);
        loadData();
      }
    } catch (e) {
      toast.error(e.message || 'Release failed');
    }
  };

  return (
    <div className="min-h-screen app-bg text-white font-sans">
      <ToastContainer theme="dark" />
      
      <nav className="glassmorphism flex justify-between items-center p-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl">
            <Activity size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">RemitFlow</h1>
        </div>
        
        <div className="flex gap-4 items-center">
          {address ? (
            <div className="flex items-center gap-4">
              <span className="text-sm bg-white/10 px-4 py-2 rounded-full font-mono shadow-inner border border-white/5">
                {address.slice(0,6)}...{address.slice(-4)}
              </span>
              <button onClick={handleDisconnect} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-4 py-2 rounded-full transition-all text-sm font-medium">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleConnect} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2 font-medium">
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column - Send Form & Limit */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -z-10 group-hover:bg-blue-500/20 transition-all duration-500"></div>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <ShieldCheck className="text-blue-400" /> Compliance Check
            </h2>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Maximum Transfer Limit</p>
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">
                {limit} <span className="text-2xl text-blue-400">XLM</span>
              </p>
            </div>
          </div>

          <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-full -z-10"></div>
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              Send Remittance
            </h2>
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                <input 
                  type="text" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="G..." 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (XLM)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">XLM</span>
                </div>
              </div>
              <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-pulse">Processing...</span> : <>Send Funds <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Status Tracker & History */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-card p-8 rounded-3xl border border-white/10 relative overflow-hidden">
             <h2 className="text-xl font-semibold mb-8 flex items-center gap-2">
              <History className="text-indigo-400" /> Transfer History
            </h2>
            
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400 border border-dashed border-white/10 rounded-2xl">
                No transfers found for this account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                      <th className="pb-4 font-medium">ID</th>
                      <th className="pb-4 font-medium">Recipient</th>
                      <th className="pb-4 font-medium">Amount</th>
                      <th className="pb-4 font-medium">Status</th>
                      <th className="pb-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 text-sm">#{t.id}</td>
                        <td className="py-4 font-mono text-sm text-gray-300" title={t.recipient}>
                          {t.recipient.slice(0,5)}...{t.recipient.slice(-4)}
                        </td>
                        <td className="py-4 font-medium">{t.amount} XLM</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            t.status === 'Pending' 
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                              : 'bg-green-500/10 text-green-400 border-green-500/20'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {t.status === 'Pending' && t.recipient === address ? (
                            <button 
                              onClick={() => handleRelease(t.id)}
                              className="text-sm bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg transition-colors border border-indigo-500/20"
                            >
                              Confirm Payout
                            </button>
                          ) : t.status === 'Pending' ? (
                             <span className="text-xs text-gray-500">Waiting for Recipient</span>
                          ) : (
                            <span className="text-green-400 flex justify-end"><CheckCircle size={18} /></span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Transfer Status Tracker visualizer (using the latest active transfer if any) */}
          {history.length > 0 && (
            <div className="glass-card p-8 rounded-3xl border border-white/10">
              <h2 className="text-xl font-semibold mb-8">Latest Transfer Status</h2>
              {(() => {
                const latest = history[history.length - 1];
                const steps = ['Sent', 'Compliance Check', 'Funds Locked (Escrow)', 'Released to Recipient'];
                const currentStep = latest.status === 'Pending' ? 2 : 3; // 0-indexed, 2 is locked, 3 is released

                return (
                  <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 rounded-full transition-all duration-1000"
                      style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>
                    
                    <div className="relative flex justify-between">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentStep;
                        const isActive = idx === currentStep;
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/40 text-white' 
                                : 'bg-gray-800 border-2 border-white/10 text-gray-500'
                            } ${isActive ? 'scale-110 ring-4 ring-blue-500/20' : ''}`}>
                              {isCompleted ? <CheckCircle size={20} /> : <Lock size={16} />}
                            </div>
                            <span className={`mt-4 text-xs font-medium text-center w-24 ${
                              isCompleted ? 'text-gray-200' : 'text-gray-500'
                            }`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Live Activity Feed */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 mt-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="text-blue-400" /> Live Activity Feed
            </h2>
            {events.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                No recent events found.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                      <Activity size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Event emitted</p>
                      <p className="text-xs text-gray-400 font-mono">Ledger: {ev.ledger}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
