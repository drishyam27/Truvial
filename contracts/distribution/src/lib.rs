#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, BytesN, Env, String
};

// Define the interface for the Treasury contract so we can call it.
#[soroban_sdk::contractclient(name = "TreasuryClient")]
pub trait TreasuryInterface {
    fn release_funds(env: Env, beneficiary: Address, amount: i128);
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Treasury,
    BeneficiaryWhitelist(Address),
    ProjectCount,
    Project(u32),
    Milestone(u32, u32), // (ProjectID, MilestoneID)
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct Project {
    pub id: u32,
    pub title: String,
    pub beneficiary: Address,
    pub total_budget: i128,
    pub milestones_count: u32,
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct Milestone {
    pub id: u32,
    pub title: String,
    pub amount: i128,
    pub status: u32, // 0 = Pending, 1 = Approved, 2 = Paid
}

#[contract]
pub struct DistributionContract;

#[contractimpl]
impl DistributionContract {
    pub fn initialize(env: Env, admin: Address, treasury: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::ProjectCount, &0u32);
    }

    pub fn set_treasury(env: Env, treasury: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Treasury, &treasury);
    }

    pub fn add_beneficiary(env: Env, beneficiary: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::BeneficiaryWhitelist(beneficiary.clone());
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(&key, 10000, 100000);

        env.events().publish(
            (symbol_short!("wh_add"), beneficiary),
            true
        );
    }

    pub fn remove_beneficiary(env: Env, beneficiary: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::BeneficiaryWhitelist(beneficiary.clone());
        env.storage().persistent().set(&key, &false);

        env.events().publish(
            (symbol_short!("wh_rem"), beneficiary),
            false
        );
    }

    pub fn is_beneficiary(env: Env, beneficiary: Address) -> bool {
        let key = DataKey::BeneficiaryWhitelist(beneficiary);
        env.storage().persistent().get(&key).unwrap_or(false)
    }

    pub fn create_project(env: Env, title: String, beneficiary: Address, total_budget: i128) -> u32 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if total_budget <= 0 {
            panic!("budget must be positive");
        }

        // Check whitelist
        if !Self::is_beneficiary(env.clone(), beneficiary.clone()) {
            panic!("beneficiary not whitelisted");
        }

        let mut project_count: u32 = env.storage().instance().get(&DataKey::ProjectCount).unwrap_or(0);
        project_count += 1;

        let project = Project {
            id: project_count,
            title: title.clone(),
            beneficiary: beneficiary.clone(),
            total_budget,
            milestones_count: 0,
        };

        env.storage().instance().set(&DataKey::ProjectCount, &project_count);
        
        let p_key = DataKey::Project(project_count);
        env.storage().persistent().set(&p_key, &project);
        env.storage().persistent().extend_ttl(&p_key, 10000, 100000);

        env.events().publish(
            (symbol_short!("p_create"), project_count),
            (beneficiary, total_budget)
        );

        project_count
    }

    pub fn add_milestone(env: Env, project_id: u32, title: String, amount: i128) -> u32 {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let p_key = DataKey::Project(project_id);
        let mut project: Project = env.storage().persistent().get(&p_key).unwrap_or_else(|| {
            panic!("project not found");
        });

        // Verify that sum of existing milestone amounts + new amount <= project.total_budget
        let mut sum_amounts = 0i128;
        for i in 1..=project.milestones_count {
            let m_key = DataKey::Milestone(project_id, i);
            let milestone: Milestone = env.storage().persistent().get(&m_key).unwrap();
            sum_amounts += milestone.amount;
        }

        if sum_amounts + amount > project.total_budget {
            panic!("sum of milestone amounts exceeds project budget");
        }

        project.milestones_count += 1;
        let milestone_id = project.milestones_count;

        let milestone = Milestone {
            id: milestone_id,
            title,
            amount,
            status: 0, // Pending
        };

        // Update project milestones count
        env.storage().persistent().set(&p_key, &project);

        let m_key = DataKey::Milestone(project_id, milestone_id);
        env.storage().persistent().set(&m_key, &milestone);
        env.storage().persistent().extend_ttl(&m_key, 10000, 100000);

        env.events().publish(
            (symbol_short!("m_add"), project_id, milestone_id),
            amount
        );

        milestone_id
    }

    pub fn approve_milestone(env: Env, project_id: u32, milestone_id: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let m_key = DataKey::Milestone(project_id, milestone_id);
        let mut milestone: Milestone = env.storage().persistent().get(&m_key).unwrap_or_else(|| {
            panic!("milestone not found");
        });

        if milestone.status != 0 {
            panic!("milestone is not pending");
        }

        milestone.status = 1; // Approved
        env.storage().persistent().set(&m_key, &milestone);

        env.events().publish(
            (symbol_short!("m_approve"), project_id, milestone_id),
            milestone.amount
        );
    }

    pub fn release_milestone_funds(env: Env, project_id: u32, milestone_id: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let p_key = DataKey::Project(project_id);
        let project: Project = env.storage().persistent().get(&p_key).unwrap_or_else(|| {
            panic!("project not found");
        });

        let m_key = DataKey::Milestone(project_id, milestone_id);
        let mut milestone: Milestone = env.storage().persistent().get(&m_key).unwrap_or_else(|| {
            panic!("milestone not found");
        });

        if milestone.status != 1 {
            panic!("milestone is not approved");
        }

        milestone.status = 2; // Paid
        env.storage().persistent().set(&m_key, &milestone);

        // Cross-contract call to Treasury contract to release funds to the project's beneficiary
        let treasury_addr: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let treasury_client = TreasuryClient::new(&env, &treasury_addr);
        treasury_client.release_funds(&project.beneficiary, &milestone.amount);

        env.events().publish(
            (symbol_short!("m_release"), project_id, milestone_id),
            (project.beneficiary, milestone.amount)
        );
    }

    pub fn get_project(env: Env, project_id: u32) -> Project {
        let p_key = DataKey::Project(project_id);
        env.storage().persistent().get(&p_key).unwrap_or_else(|| {
            panic!("project not found");
        })
    }

    pub fn get_milestone(env: Env, project_id: u32, milestone_id: u32) -> Milestone {
        let m_key = DataKey::Milestone(project_id, milestone_id);
        env.storage().persistent().get(&m_key).unwrap_or_else(|| {
            panic!("milestone not found");
        })
    }

    pub fn get_project_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ProjectCount).unwrap_or(0)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn get_treasury(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Treasury).unwrap()
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        env.deployer().update_current_contract_wasm(&new_wasm_hash);
    }
}

mod test;
