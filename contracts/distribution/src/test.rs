#![cfg(test)]
use super::*;
use soroban_sdk::{token, Address, Env, String};
use soroban_sdk::testutils::Address as _;
use truvial_treasury::TreasuryContract;

#[test]
fn test_distribution_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    
    // Register mock token
    let token_id = env.register_stellar_asset_contract(token_admin);
    let token_client = token::Client::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    // Deploy contracts
    let treasury_id = env.register_contract(None, TreasuryContract);
    let distribution_id = env.register_contract(None, DistributionContract);

    let treasury_client = truvial_treasury::TreasuryContractClient::new(&env, &treasury_id);
    let distribution_client = DistributionContractClient::new(&env, &distribution_id);

    // Initialize
    treasury_client.initialize(&admin, &distribution_id, &token_id);
    distribution_client.initialize(&admin, &treasury_id);

    // 1. Whitelist beneficiary
    let beneficiary = Address::generate(&env);
    assert_eq!(distribution_client.is_beneficiary(&beneficiary), false);
    distribution_client.add_beneficiary(&beneficiary);
    assert_eq!(distribution_client.is_beneficiary(&beneficiary), true);

    // 2. Setup project
    let project_title = String::from_str(&env, "Clean Water Initiative");
    let project_id = distribution_client.create_project(&project_title, &beneficiary, &1000i128);
    assert_eq!(project_id, 1);

    let project = distribution_client.get_project(&1);
    assert_eq!(project.title, project_title);
    assert_eq!(project.beneficiary, beneficiary);
    assert_eq!(project.total_budget, 1000);
    assert_eq!(project.milestones_count, 0);

    // 3. Add milestones
    let m1_title = String::from_str(&env, "Purchase Pipes");
    let m1_id = distribution_client.add_milestone(&project_id, &m1_title, &400i128);
    assert_eq!(m1_id, 1);

    let m2_title = String::from_str(&env, "Install Pipes");
    let m2_id = distribution_client.add_milestone(&project_id, &m2_title, &600i128);
    assert_eq!(m2_id, 2);

    let p_updated = distribution_client.get_project(&1);
    assert_eq!(p_updated.milestones_count, 2);

    // 4. Donate to treasury
    let donor = Address::generate(&env);
    token_admin_client.mint(&donor, &1500i128);
    treasury_client.donate(&donor, &1000i128);
    assert_eq!(token_client.balance(&treasury_id), 1000);

    // 5. Approve & Release Milestone 1
    distribution_client.approve_milestone(&project_id, &m1_id);
    let m1 = distribution_client.get_milestone(&project_id, &m1_id);
    assert_eq!(m1.status, 1); // Approved

    distribution_client.release_milestone_funds(&project_id, &m1_id);
    let m1_after = distribution_client.get_milestone(&project_id, &m1_id);
    assert_eq!(m1_after.status, 2); // Paid

    // Check balances
    assert_eq!(token_client.balance(&treasury_id), 600);
    assert_eq!(token_client.balance(&beneficiary), 400);
}
