// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RemifiVault} from "src/RemifiVault.sol";
import {MockERC20} from "test/mocks/MockERC20.sol";

contract RemifiVaultTest is Test {
    RemifiVault internal vault;
    MockERC20 internal token;

    address internal depositor = makeAddr("depositor");
    address internal recipient = makeAddr("recipient");
    address internal stranger = makeAddr("stranger");

    bytes32 internal phoneHash = keccak256("e164:+639171234567");
    bytes32 internal secret = keccak256("claim-secret-abc123");
    bytes32 internal claimId;

    uint256 internal constant AMOUNT = 50e18;
    uint64 internal constant CLAIM_PERIOD = 30 days;

    function setUp() public {
        vault = new RemifiVault(CLAIM_PERIOD);
        token = new MockERC20("USDm", "USDm", 18);
        claimId = vault.computeClaimId(phoneHash, secret);

        token.mint(depositor, 1_000e18);
        vm.prank(depositor);
        token.approve(address(vault), type(uint256).max);
    }

    function test_computeClaimId_isDeterministic() public view {
        assertEq(vault.computeClaimId(phoneHash, secret), claimId);
    }

    function test_deposit_createsActiveEscrow() public {
        vm.prank(depositor);
        vault.deposit(claimId, address(token), AMOUNT, phoneHash);

        (
            address storedDepositor,
            address storedToken,
            uint256 storedAmount,
            bytes32 storedPhoneHash,
            uint64 expiry,
            RemifiVault.EscrowStatus status
        ) = vault.getEscrow(claimId);

        assertEq(storedDepositor, depositor);
        assertEq(storedToken, address(token));
        assertEq(storedAmount, AMOUNT);
        assertEq(storedPhoneHash, phoneHash);
        assertEq(uint256(status), uint256(RemifiVault.EscrowStatus.Active));
        assertEq(expiry, uint64(block.timestamp + CLAIM_PERIOD));
        assertEq(token.balanceOf(address(vault)), AMOUNT);
    }

    function test_claim_transfersToRecipient() public {
        _deposit();

        vm.prank(recipient);
        vault.claim(claimId, secret, recipient);

        assertEq(token.balanceOf(recipient), AMOUNT);
        assertEq(token.balanceOf(address(vault)), 0);

        (,,,,, RemifiVault.EscrowStatus status) = vault.getEscrow(claimId);
        assertEq(uint256(status), uint256(RemifiVault.EscrowStatus.Claimed));
    }

    function test_claim_revertsWithWrongSecret() public {
        _deposit();

        vm.prank(recipient);
        vm.expectRevert(RemifiVault.InvalidSecret.selector);
        vault.claim(claimId, keccak256("wrong-secret"), recipient);
    }

    function test_claim_revertsWhenCallerIsNotRecipient() public {
        _deposit();

        vm.prank(stranger);
        vm.expectRevert(RemifiVault.UnauthorizedRecipient.selector);
        vault.claim(claimId, secret, recipient);
    }

    function test_claim_revertsAfterExpiry() public {
        _deposit();

        vm.warp(block.timestamp + CLAIM_PERIOD + 1);

        vm.prank(recipient);
        vm.expectRevert(RemifiVault.ClaimExpired.selector);
        vault.claim(claimId, secret, recipient);
    }

    function test_claim_revertsTwice() public {
        _deposit();

        vm.prank(recipient);
        vault.claim(claimId, secret, recipient);

        vm.prank(recipient);
        vm.expectRevert(RemifiVault.EscrowNotActive.selector);
        vault.claim(claimId, secret, recipient);
    }

    function test_refund_returnsFundsToDepositorAfterExpiry() public {
        _deposit();

        vm.warp(block.timestamp + CLAIM_PERIOD + 1);

        vm.prank(depositor);
        vault.refund(claimId);

        assertEq(token.balanceOf(depositor), 1_000e18);
        assertEq(token.balanceOf(address(vault)), 0);

        (,,,,, RemifiVault.EscrowStatus status) = vault.getEscrow(claimId);
        assertEq(uint256(status), uint256(RemifiVault.EscrowStatus.Refunded));
    }

    function test_refund_revertsBeforeExpiry() public {
        _deposit();

        vm.prank(depositor);
        vm.expectRevert(RemifiVault.ClaimNotExpired.selector);
        vault.refund(claimId);
    }

    function test_refund_revertsForNonDepositor() public {
        _deposit();
        vm.warp(block.timestamp + CLAIM_PERIOD + 1);

        vm.prank(stranger);
        vm.expectRevert(RemifiVault.NotDepositor.selector);
        vault.refund(claimId);
    }

    function test_deposit_revertsDuplicateClaimId() public {
        _deposit();

        vm.prank(depositor);
        vm.expectRevert(RemifiVault.EscrowExists.selector);
        vault.deposit(claimId, address(token), AMOUNT, phoneHash);
    }

    function test_deposit_revertsZeroAmount() public {
        vm.prank(depositor);
        vm.expectRevert(RemifiVault.ZeroAmount.selector);
        vault.deposit(claimId, address(token), 0, phoneHash);
    }

    function test_constructor_revertsInvalidClaimPeriod() public {
        vm.expectRevert(RemifiVault.InvalidClaimPeriod.selector);
        new RemifiVault(12 hours);
    }

    function _deposit() internal {
        vm.prank(depositor);
        vault.deposit(claimId, address(token), AMOUNT, phoneHash);
    }
}
