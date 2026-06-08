// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "src/interfaces/IERC20.sol";

/// @title RemifiVault
/// @notice Escrow vault for phone-first remittance claims on Celo.
/// @dev Funds are locked under a claimId derived from recipient phone hash + secret.
///      Recipient claims with the secret (from SMS link) to their new wallet.
///      Depositor can refund after expiry if unclaimed.
contract RemifiVault {
    bytes32 public constant DOMAIN_SEPARATOR = keccak256("REMIFI_VAULT_V1");

    uint64 public immutable defaultClaimPeriod;

    uint64 public constant MIN_CLAIM_PERIOD = 1 days;
    uint64 public constant MAX_CLAIM_PERIOD = 90 days;

    enum EscrowStatus {
        None,
        Active,
        Claimed,
        Refunded
    }

    struct Escrow {
        address depositor;
        address token;
        uint256 amount;
        bytes32 phoneHash;
        uint64 expiry;
        EscrowStatus status;
    }

    mapping(bytes32 claimId => Escrow escrow) public escrows;

    event Deposited(
        bytes32 indexed claimId,
        address indexed depositor,
        address indexed token,
        uint256 amount,
        bytes32 phoneHash,
        uint64 expiry
    );

    event Claimed(bytes32 indexed claimId, address indexed recipient, uint256 amount);

    event Refunded(bytes32 indexed claimId, address indexed depositor, uint256 amount);

    error InvalidClaimPeriod();
    error ZeroAddress();
    error ZeroAmount();
    error EscrowExists();
    error EscrowNotFound();
    error EscrowNotActive();
    error InvalidSecret();
    error ClaimExpired();
    error ClaimNotExpired();
    error TransferFailed();
    error UnauthorizedRecipient();
    error NotDepositor();

    /// @param claimPeriodSeconds Default time window for recipient to claim before refund is allowed.
    constructor(uint64 claimPeriodSeconds) {
        if (claimPeriodSeconds < MIN_CLAIM_PERIOD || claimPeriodSeconds > MAX_CLAIM_PERIOD) {
            revert InvalidClaimPeriod();
        }
        defaultClaimPeriod = claimPeriodSeconds;
    }

    /// @notice Derive claim id from normalized phone hash and one-time secret (generated off-chain).
    function computeClaimId(bytes32 phoneHash, bytes32 secret) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(DOMAIN_SEPARATOR, phoneHash, secret));
    }

    /// @notice Lock ERC-20 tokens for a pending claim.
    /// @param claimId Precomputed via `computeClaimId(phoneHash, secret)`.
    /// @param token Celo stablecoin address (e.g. USDm, PHPm).
    /// @param amount Token amount in smallest units.
    /// @param phoneHash `keccak256` of normalized E.164 phone (computed off-chain).
    function deposit(bytes32 claimId, address token, uint256 amount, bytes32 phoneHash) external {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (phoneHash == bytes32(0)) revert ZeroAmount();

        Escrow storage entry = escrows[claimId];
        if (entry.status != EscrowStatus.None) revert EscrowExists();

        if (!_transferFrom(token, msg.sender, address(this), amount)) {
            revert TransferFailed();
        }

        uint64 expiry = uint64(block.timestamp) + defaultClaimPeriod;

        escrows[claimId] = Escrow({
            depositor: msg.sender,
            token: token,
            amount: amount,
            phoneHash: phoneHash,
            expiry: expiry,
            status: EscrowStatus.Active
        });

        emit Deposited(claimId, msg.sender, token, amount, phoneHash, expiry);
    }

    /// @notice Recipient withdraws escrowed funds to their wallet (e.g. new Thirdweb account).
    /// @param claimId Escrow identifier from deposit event or off-chain generation.
    /// @param secret One-time secret delivered via SMS/WhatsApp claim link.
    /// @param recipient Recipient wallet address — must be `msg.sender`.
    function claim(bytes32 claimId, bytes32 secret, address recipient) external {
        if (recipient == address(0)) revert ZeroAddress();
        if (recipient != msg.sender) revert UnauthorizedRecipient();

        Escrow storage entry = escrows[claimId];
        if (entry.status != EscrowStatus.Active) revert EscrowNotActive();
        if (block.timestamp > entry.expiry) revert ClaimExpired();
        if (computeClaimId(entry.phoneHash, secret) != claimId) revert InvalidSecret();

        entry.status = EscrowStatus.Claimed;

        if (!_transfer(entry.token, recipient, entry.amount)) {
            revert TransferFailed();
        }

        emit Claimed(claimId, recipient, entry.amount);
    }

    /// @notice Depositor reclaims funds after claim window expires.
    function refund(bytes32 claimId) external {
        Escrow storage entry = escrows[claimId];
        if (entry.status != EscrowStatus.Active) revert EscrowNotActive();
        if (block.timestamp <= entry.expiry) revert ClaimNotExpired();
        if (msg.sender != entry.depositor) revert NotDepositor();

        entry.status = EscrowStatus.Refunded;

        if (!_transfer(entry.token, entry.depositor, entry.amount)) {
            revert TransferFailed();
        }

        emit Refunded(claimId, entry.depositor, entry.amount);
    }

    /// @notice Read escrow details for a claim id.
    function getEscrow(bytes32 claimId)
        external
        view
        returns (
            address depositor,
            address token,
            uint256 amount,
            bytes32 phoneHash,
            uint64 expiry,
            EscrowStatus status
        )
    {
        Escrow storage entry = escrows[claimId];
        if (entry.status == EscrowStatus.None) revert EscrowNotFound();
        return (entry.depositor, entry.token, entry.amount, entry.phoneHash, entry.expiry, entry.status);
    }

    function _transfer(address token, address to, uint256 amount) private returns (bool) {
        return IERC20(token).transfer(to, amount);
    }

    function _transferFrom(address token, address from, address to, uint256 amount) private returns (bool) {
        return IERC20(token).transferFrom(from, to, amount);
    }
}
