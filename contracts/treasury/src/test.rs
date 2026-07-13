#![cfg(test)]
use super::*;
use soroban_sdk::{token, Address, Env};

#[test]
fn test_treasury_donation_and_release() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    
    // Register stellar asset contract (mock token)
    let token_id = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    // Register Treasury contract
    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    let distribution_contract = Address::generate(&env);

    // Initialize Treasury
    treasury_client.initialize(&admin, &distribution_contract, &token_id);

    // Check states
    assert_eq!(treasury_client.get_admin(), admin);
    assert_eq!(treasury_client.get_distribution_contract(), distribution_contract);
    assert_eq!(treasury_client.get_token(), token_id);

    // Setup Donor
    let donor = Address::generate(&env);
    token_admin_client.mint(&donor, &1000);
    assert_eq!(token_client.balance(&donor), 1000);

    // Donate
    treasury_client.donate(&donor, &300);

    // Assert balances post-donation
    assert_eq!(token_client.balance(&donor), 700);
    assert_eq!(token_client.balance(&treasury_id), 300);
    assert_eq!(treasury_client.get_donor_balance(&donor), 300);
    assert_eq!(treasury_client.get_total_donated(), 300);

    // Release funds (mocking call from distribution contract)
    let beneficiary = Address::generate(&env);
    
    env.as_contract(&distribution_contract, || {
        treasury_client.release_funds(&beneficiary, &200);
    });

    // Assert balances post-release
    assert_eq!(token_client.balance(&treasury_id), 100);
    assert_eq!(token_client.balance(&beneficiary), 200);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_already_initialized() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let distribution = Address::generate(&env);
    let token = Address::generate(&env);

    let treasury_id = env.register_contract(None, TreasuryContract);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_id);

    treasury_client.initialize(&admin, &distribution, &token);
    treasury_client.initialize(&admin, &distribution, &token);
}
