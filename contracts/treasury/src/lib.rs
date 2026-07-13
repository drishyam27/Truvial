#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, BytesN, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Distribution,
    Token,
    DonorBalance(Address),
    TotalDonated,
}

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(env: Env, admin: Address, distribution_contract: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Distribution, &distribution_contract);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TotalDonated, &0i128);
    }

    pub fn donate(env: Env, donor: Address, amount: i128) {
        donor.require_auth();
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);
        
        // Transfer funds from donor to treasury
        token_client.transfer(&donor, &env.current_contract_address(), &amount);

        // Update donor balance
        let key = DataKey::DonorBalance(donor.clone());
        let current_balance: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let new_balance = current_balance + amount;
        env.storage().persistent().set(&key, &new_balance);

        // Extend TTL for donor balance storage (10000 ledgers)
        env.storage().persistent().extend_ttl(&key, 10000, 100000);

        // Update total donated
        let total: i128 = env.storage().instance().get(&DataKey::TotalDonated).unwrap();
        env.storage().instance().set(&DataKey::TotalDonated, &(total + amount));
    }

    pub fn release_funds(env: Env, beneficiary: Address, amount: i128) {
        let distribution: Address = env.storage().instance().get(&DataKey::Distribution).unwrap();
        distribution.require_auth(); // Only the distribution contract can call this

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer funds from treasury to beneficiary
        token_client.transfer(&env.current_contract_address(), &beneficiary, &amount);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_distribution_contract(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Distribution).unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn get_donor_balance(env: Env, donor: Address) -> i128 {
        let key = DataKey::DonorBalance(donor);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    pub fn get_total_donated(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalDonated).unwrap_or(0)
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}

mod test;
