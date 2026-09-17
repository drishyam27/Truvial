#![no_main]
#![no_std]
extern crate alloc;

use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    call::Call,
    contract,
    msg,
    prelude::*,
};

// Standard ERC20 interface using sol_interface!
sol_interface! {
    interface IERC20 {
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
        function transfer(address recipient, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }
}

sol_storage! {
    #[entrypoint]
    pub struct Treasury {
        address admin;
        address distribution;
        address token;
        uint256 total_donated;
        mapping(address => uint256) donor_balances;
    }
}

#[public]
impl Treasury {
    /// Initializes the Treasury with admin, distribution contract, and accepted ERC-20 token.
    pub fn initialize(&mut self, admin: Address, distribution: Address, token: Address) -> Result<(), Vec<u8>> {
        if self.admin.get() != Address::ZERO {
            return Err("already initialized".into());
        }
        self.admin.set(admin);
        self.distribution.set(distribution);
        self.token.set(token);
        self.total_donated.set(U256::ZERO);
        Ok(())
    }

    /// Allows a donor to contribute ERC-20 tokens to the treasury escrow.
    pub fn donate(&mut self, amount: U256) -> Result<(), Vec<u8>> {
        let sender = msg::sender();
        if amount == U256::ZERO {
            return Err("amount must be positive".into());
        }

        let token_addr = self.token.get();
        if token_addr == Address::ZERO {
            return Err("token not configured".into());
        }

        // Transfer funds from sender to this treasury contract
        let token_contract = IERC20::new(token_addr);
        let config = Call::new();
        token_contract.transfer_from(config, sender, contract::address(), amount)?;

        // Update donor balance
        let mut balance = self.donor_balances.setter(sender);
        let current_bal = balance.get();
        balance.set(current_bal + amount);

        // Update total donated
        let total = self.total_donated.get();
        self.total_donated.set(total + amount);

        Ok(())
    }

    /// Releases funds to a designated beneficiary. Callable strictly by the Distribution contract.
    pub fn release_funds(&mut self, beneficiary: Address, amount: U256) -> Result<(), Vec<u8>> {
        if msg::sender() != self.distribution.get() {
            return Err("unauthorized: caller must be distribution contract".into());
        }

        if amount == U256::ZERO {
            return Err("amount must be positive".into());
        }

        let token_addr = self.token.get();
        let token_contract = IERC20::new(token_addr);
        let config = Call::new();
        token_contract.transfer(config, beneficiary, amount)?;

        Ok(())
    }

    /// Returns the admin address.
    pub fn get_admin(&self) -> Result<Address, Vec<u8>> {
        Ok(self.admin.get())
    }

    /// Returns the linked distribution contract address.
    pub fn get_distribution(&self) -> Result<Address, Vec<u8>> {
        Ok(self.distribution.get())
    }

    /// Returns the escrow ERC-20 token address.
    pub fn get_token(&self) -> Result<Address, Vec<u8>> {
        Ok(self.token.get())
    }

    /// Returns the total amount donated by a specific donor address.
    pub fn get_donor_balance(&self, donor: Address) -> Result<U256, Vec<u8>> {
        Ok(self.donor_balances.get(donor))
    }

    /// Returns cumulative donations received by the treasury.
    pub fn get_total_donated(&self) -> Result<U256, Vec<u8>> {
        Ok(self.total_donated.get())
    }
}
