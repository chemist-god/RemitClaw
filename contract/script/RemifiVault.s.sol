// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RemifiVault} from "src/RemifiVault.sol";

/// @notice Deploy RemifiVault to Celo mainnet or Sepolia.
/// @dev Example:
///   forge script script/RemifiVault.s.sol:RemifiVaultScript --rpc-url $CELO_RPC_URL --broadcast
contract RemifiVaultScript is Script {
    function run() public {
        uint64 claimPeriod = uint64(30 days);

        vm.startBroadcast();

        RemifiVault vault = new RemifiVault(claimPeriod);

        vm.stopBroadcast();

        console2.log("RemifiVault deployed at:", address(vault));
        console2.log("Default claim period (seconds):", vault.defaultClaimPeriod());
    }
}
