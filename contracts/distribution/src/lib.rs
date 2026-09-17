#![no_main]
#![no_std]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    call::Call,
    msg,
    prelude::*,
};

// Interface for cross-contract call to Treasury
sol_interface! {
    interface ITreasury {
        function releaseFunds(address beneficiary, uint256 amount) external;
    }
}

sol_storage! {
    pub struct Project {
        uint256 id;
        string title;
        address beneficiary;
        uint256 total_budget;
        uint256 allocated;
        uint256 milestones_count;
    }

    pub struct Milestone {
        uint256 id;
        string title;
        uint256 amount;
        uint256 status; // 0 = Pending, 1 = Approved, 2 = Paid
    }

    #[entrypoint]
    pub struct Distribution {
        address admin;
        address treasury;
        uint256 project_count;
        mapping(address => bool) beneficiary_whitelist;
        mapping(uint256 => Project) projects;
        mapping(uint256 => Milestone) milestones;
    }
}

impl Distribution {
    /// Computes composite mapping key for project milestones
    fn milestone_key(project_id: U256, milestone_id: U256) -> U256 {
        (project_id << 128) | milestone_id
    }
}

#[public]
impl Distribution {
    /// Initializes the Distribution contract with an admin and Treasury address.
    pub fn initialize(&mut self, admin: Address, treasury: Address) -> Result<(), Vec<u8>> {
        if self.admin.get() != Address::ZERO {
            return Err("already initialized".into());
        }
        self.admin.set(admin);
        self.treasury.set(treasury);
        self.project_count.set(U256::ZERO);
        Ok(())
    }

    /// Updates the linked Treasury contract address (Admin only).
    pub fn set_treasury(&mut self, treasury: Address) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }
        self.treasury.set(treasury);
        Ok(())
    }

    /// Adds a verified beneficiary to the whitelist (Admin only).
    pub fn add_beneficiary(&mut self, beneficiary: Address) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }
        self.beneficiary_whitelist.setter(beneficiary).set(true);
        Ok(())
    }

    /// Removes a beneficiary from the whitelist (Admin only).
    pub fn remove_beneficiary(&mut self, beneficiary: Address) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }
        self.beneficiary_whitelist.setter(beneficiary).set(false);
        Ok(())
    }

    /// Checks if an address is a whitelisted beneficiary.
    pub fn is_beneficiary(&self, beneficiary: Address) -> Result<bool, Vec<u8>> {
        Ok(self.beneficiary_whitelist.get(beneficiary))
    }

    /// Creates a new charitable project (Admin only).
    pub fn create_project(&mut self, title: String, beneficiary: Address, total_budget: U256) -> Result<U256, Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }

        if total_budget == U256::ZERO {
            return Err("budget must be positive".into());
        }

        if !self.beneficiary_whitelist.get(beneficiary) {
            return Err("beneficiary not whitelisted".into());
        }

        let new_id = self.project_count.get() + U256::from(1);
        self.project_count.set(new_id);

        let mut project = self.projects.setter(new_id);
        project.id.set(new_id);
        project.title.set_str(title);
        project.beneficiary.set(beneficiary);
        project.total_budget.set(total_budget);
        project.allocated.set(U256::ZERO);
        project.milestones_count.set(U256::ZERO);

        Ok(new_id)
    }

    /// Adds a milestone to an existing project (Admin only).
    pub fn add_milestone(&mut self, project_id: U256, title: String, amount: U256) -> Result<U256, Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }

        if amount == U256::ZERO {
            return Err("amount must be positive".into());
        }

        let mut project = self.projects.setter(project_id);
        let budget = project.total_budget.get();
        if budget == U256::ZERO {
            return Err("project not found".into());
        }

        let allocated = project.allocated.get();
        if allocated + amount > budget {
            return Err("sum of milestone amounts exceeds project budget".into());
        }

        let m_count = project.milestones_count.get() + U256::from(1);
        project.milestones_count.set(m_count);
        project.allocated.set(allocated + amount);

        let composite_key = Self::milestone_key(project_id, m_count);
        let mut milestone = self.milestones.setter(composite_key);
        milestone.id.set(m_count);
        milestone.title.set_str(title);
        milestone.amount.set(amount);
        milestone.status.set(U256::ZERO); // 0 = Pending

        Ok(m_count)
    }

    /// Approves a milestone after verifying completion of work (Admin only).
    pub fn approve_milestone(&mut self, project_id: U256, milestone_id: U256) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }

        let composite_key = Self::milestone_key(project_id, milestone_id);
        let mut milestone = self.milestones.setter(composite_key);
        if milestone.status.get() != U256::ZERO {
            return Err("milestone is not pending".into());
        }

        milestone.status.set(U256::from(1)); // 1 = Approved
        Ok(())
    }

    /// Releases escrowed funds for an approved milestone to the beneficiary (Admin only).
    pub fn release_milestone_funds(&mut self, project_id: U256, milestone_id: U256) -> Result<(), Vec<u8>> {
        if msg::sender() != self.admin.get() {
            return Err("unauthorized: caller is not admin".into());
        }

        let composite_key = Self::milestone_key(project_id, milestone_id);
        let mut milestone = self.milestones.setter(composite_key);
        if milestone.status.get() != U256::from(1) {
            return Err("milestone is not approved".into());
        }

        let beneficiary = self.projects.get(project_id).beneficiary.get();
        let amount = milestone.amount.get();

        // Mark milestone as Paid (status = 2)
        milestone.status.set(U256::from(2));

        // Cross-contract call to Treasury contract on Arbitrum
        let treasury_addr = self.treasury.get();
        let treasury = ITreasury::new(treasury_addr);
        let config = Call::new();
        treasury.release_funds(config, beneficiary, amount)?;

        Ok(())
    }

    /// Returns the project count.
    pub fn get_project_count(&self) -> Result<U256, Vec<u8>> {
        Ok(self.project_count.get())
    }

    /// Returns project details.
    pub fn get_project(&self, project_id: U256) -> Result<(U256, String, Address, U256, U256, U256), Vec<u8>> {
        let p = self.projects.get(project_id);
        Ok((
            p.id.get(),
            p.title.get_string(),
            p.beneficiary.get(),
            p.total_budget.get(),
            p.allocated.get(),
            p.milestones_count.get(),
        ))
    }

    /// Returns milestone details.
    pub fn get_milestone(&self, project_id: U256, milestone_id: U256) -> Result<(U256, String, U256, U256), Vec<u8>> {
        let composite_key = Self::milestone_key(project_id, milestone_id);
        let m = self.milestones.get(composite_key);
        Ok((
            m.id.get(),
            m.title.get_string(),
            m.amount.get(),
            m.status.get(),
        ))
    }

    /// Returns admin address.
    pub fn get_admin(&self) -> Result<Address, Vec<u8>> {
        Ok(self.admin.get())
    }

    /// Returns treasury contract address.
    pub fn get_treasury(&self) -> Result<Address, Vec<u8>> {
        Ok(self.treasury.get())
    }
}
