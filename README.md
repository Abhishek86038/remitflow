# RemitFlow

RemitFlow is a fully functional Stellar testnet remittance dApp built with React, Vite, and Soroban smart contracts. It provides a seamless cross-border remittance experience with real-time on-chain tracking and built-in compliance checks.

## Problem Statement

Cross-border remittances are often slow, expensive, and opaque. Senders and recipients lack real-time visibility into the status of their funds, and compliance checks (such as transfer limits) are typically handled by centralized, opaque systems. RemitFlow solves this by leveraging the Stellar network and Soroban smart contracts to provide:
- **Instant Settlement**: Funds are moved at the speed of the Stellar network.
- **Transparency**: Every step of the transfer is recorded on-chain and visible in real-time.
- **Automated Compliance**: Transfer limits and rules are enforced transparently via a dedicated Compliance smart contract.

## Architecture Diagram

**Sender &rarr; Compliance Check &rarr; Escrow &rarr; Release &rarr; Recipient**

1. **Sender** initiates a deposit through the React frontend, signing the transaction with a Stellar wallet.
2. **Escrow Contract** receives the deposit request and makes an inter-contract call to the **Compliance Check** contract to verify the transfer amount is within the allowed limits.
3. If compliant, the **Escrow Contract** locks the funds and marks the transfer as "Pending".
4. An Anchor (simulated by a "Confirm Payout" button) or the recipient calls the `release_funds` function.
5. **Recipient** receives the unlocked funds, and the transfer status is updated to "Released" on-chain.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Rust & Cargo
- Stellar CLI (`stellar`)
- Freighter Wallet browser extension (connected to Testnet)

### Smart Contracts
1. Navigate to the `contract` directory:
   ```bash
   cd contract
   ```
2. Build the contracts:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment Commands

1. **Build both contracts**:
   ```bash
   cd contract
   cargo build --target wasm32-unknown-unknown --release
   ```

2. **Deploy ComplianceCheck**:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/compliance_check.wasm \
     --source <YOUR_ADMIN_ACCOUNT> \
     --network testnet
   ```
   *Copy the resulting contract ID (e.g. `C...`).*

3. **Deploy RemittanceEscrow**:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/remittance_escrow.wasm \
     --source <YOUR_ADMIN_ACCOUNT> \
     --network testnet
   ```
   *Copy the resulting contract ID.*

4. **Initialize Contracts**:
   - Set the limit on the Compliance contract:
     ```bash
     stellar contract invoke \
       --id <COMPLIANCE_CONTRACT_ID> \
       --source <YOUR_ADMIN_ACCOUNT> \
       --network testnet \
       -- \
       set_limit --admin <YOUR_ADMIN_ADDRESS> --max_amount 5000
     ```
   - Initialize the Escrow contract with the Compliance contract ID:
     ```bash
     stellar contract invoke \
       --id <ESCROW_CONTRACT_ID> \
       --source <YOUR_ADMIN_ACCOUNT> \
       --network testnet \
       -- \
       init --compliance_contract <COMPLIANCE_CONTRACT_ID>
     ```

**Note**: After deploying, update the `COMPLIANCE_CONTRACT_ID` in `frontend/src/complianceContract.js` and `ESCROW_CONTRACT_ID` in `frontend/src/escrowContract.js` with your deployed addresses.

## Deployed Addresses (Testnet)

- **ComplianceCheck Contract**: `CALNW7TNPWLDZKMWZDTVTDG4XEOOPFNCRVCNG5X64SVKZSGH462C3JIR`
- **RemittanceEscrow Contract**: `CDJI52VFGP3EH7UKE6FMO76VHFRRGAPZ23HVLUNFSZX6DUJJB7R2CK4U`
- **Example Initialization Tx**: `https://stellar.expert/explorer/testnet/tx/1d15015d574609cc0d28540d8aad924e1b8166f96a2e8b9c392ca8fc84870e22`

## Testing Instructions

### Smart Contracts (Rust)
The project includes unit tests using `soroban_sdk::testutils` for both contracts. Due to the inter-contract calls, these tests are designed to be run from the root of the contract workspace.

```bash
cd contract
cargo test
```
*Tests include:* `test_compliance_pass`, `test_compliance_fail`, `test_deposit_locks_funds`, `test_release_funds`, `test_inter_contract_compliance_call_fail`.

## Screenshots

*(Placeholder for UI screenshots)*
- **Wallet Connection**: [Add Screenshot Here]
- **Send Remittance Form**: [Add Screenshot Here]
- **Transfer Status Tracker**: [Add Screenshot Here]
- **Transfer History**: [Add Screenshot Here]
