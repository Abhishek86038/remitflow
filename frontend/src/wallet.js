import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule, FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';

// Initialize the static class
StellarWalletsKit.init({
    network: Networks.TESTNET,
    selectedWalletId: FREIGHTER_ID,
    modules: [new FreighterModule()],
});

export const connectWallet = async () => {
    try {
        const { address } = await StellarWalletsKit.authModal();
        return address;
    } catch (e) {
        console.error('Wallet connection error details:', e);
        throw new Error('Failed to connect wallet: ' + (e.message || e));
    }
};

export const signTx = async (xdr, publicKey) => {
    try {
        const result = await StellarWalletsKit.signTransaction(xdr, { 
            address: publicKey, 
            networkPassphrase: Networks.TESTNET 
        });
        return result.signedTxXdr;
    } catch (e) {
        throw new Error('Failed to sign transaction: ' + (e.message || e));
    }
};
