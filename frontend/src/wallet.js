import { StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';

export const kit = new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    selectedWalletId: 'freighter',
    modules: allowAllModules(),
});

export const connectWallet = async () => {
    try {
        await kit.openModal({
            onWalletSelected: async (option) => {
                kit.setWallet(option.id);
            }
        });
        const publicKey = await kit.getPublicKey();
        return publicKey;
    } catch (e) {
        throw new Error('Failed to connect wallet');
    }
};

export const signTx = async (xdr, publicKey) => {
    try {
        const result = await kit.signTx({ xdr, publicKeys: [publicKey], network: WalletNetwork.TESTNET });
        return result.signedTxXdr;
    } catch (e) {
        throw new Error('Failed to sign transaction: ' + e.message);
    }
};
