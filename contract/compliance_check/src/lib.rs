#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Limit,
}

#[contract]
pub struct ComplianceCheck;

#[contractimpl]
impl ComplianceCheck {
    pub fn set_limit(env: Env, admin: Address, max_amount: i128) {
        admin.require_auth();
        
        // If an admin is already set, only they can update the limit
        if env.storage().instance().has(&DataKey::Admin) {
            let existing_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            if existing_admin != admin {
                panic!("Only existing admin can update the limit");
            }
        } else {
            env.storage().instance().set(&DataKey::Admin, &admin);
        }
        
        env.storage().instance().set(&DataKey::Limit, &max_amount);
    }

    pub fn check_compliance(env: Env, sender: Address, amount: i128) -> bool {
        let limit: i128 = env.storage().instance().get(&DataKey::Limit).unwrap_or(0);
        let is_compliant = amount <= limit;
        
        // Emit event: "ComplianceChecked" with sender, amount, and result
        env.events().publish((symbol_short!("ComplChk"), sender.clone()), (amount, is_compliant));
        
        is_compliant
    }

    pub fn get_limit(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Limit).unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_compliance_pass() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ComplianceCheck);
        let client = ComplianceCheckClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        
        // Setup mock auth for admin
        env.mock_all_auths();
        
        client.set_limit(&admin, &1000);
        assert_eq!(client.get_limit(), 1000);
        
        let result = client.check_compliance(&sender, &500);
        assert_eq!(result, true);
    }

    #[test]
    fn test_compliance_fail() {
        let env = Env::default();
        let contract_id = env.register_contract(None, ComplianceCheck);
        let client = ComplianceCheckClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        
        env.mock_all_auths();
        
        client.set_limit(&admin, &1000);
        
        let result = client.check_compliance(&sender, &1500);
        assert_eq!(result, false);
    }
}
