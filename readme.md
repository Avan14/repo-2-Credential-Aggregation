# Information Extraction: Efficient Verifiable Credential Aggregation With Blockchain Anchoring and zk-SNARKS

## Document Metadata

* **Title**: Efficient Verifiable Credential Aggregation With Blockchain Anchoring and zk-SNARKS


* **Authors**: Istiaque Ahmed, Kentaroh Toyoda, Tadashi Nakano, and Thi Hong Tran


* **Affiliations**: Graduate School of Informatics, Osaka Metropolitan University (OMU); Vulcan Research, AIFT (Singapore); Keio University


* **Journal & Publication Date**: *IEEE Access* (Received: August 29, 2025; Accepted: October 26, 2025; Published: October 31, 2025)


* **Digital Object Identifier (DOI)**: 10.1109/ACCESS.2025.3627625


* **Funding**: Supported by JST SPRING under Grant JPMJSP2139



---

## The Problem Statement

Traditional digital identity systems struggle with centralization, lack of transparency, and vulnerability to data manipulation. In decentralized identity (DIDs/SSI), different issuers use heterogeneous cryptographic signature schemes (e.g., EdDSA, ECDSA, BBS+). This creates a significant **interoperability barrier**, forcing verifiers to either maintain numerous cryptographic libraries or trust a centralized translation gateway, preventing the seamless aggregation of credentials into a single presentation.

---

## Proposed Framework & Core Concept

The paper introduces a **signature-agnostic verification framework** that decouples presentation verification from issuer-specific cryptography.

### 1. Mathematical Commitments & Anchoring

Instead of verifying the issuer's signature directly during presentation, issuers hash individual claims into a tree structure, combine it with a unique salt, and commit the final root hash to a blockchain ledger.

* **Leaf Generation**:

$$leaf_{i} = Hash(C_{i})$$



computed for each individual claim $C_i$.


* **Preliminary Root**:

$$pre\_root = Hash(leaf_{1} \mathbin{\Vert} \dots \mathbin{\Vert} leaf_{n})$$


.


* **Final VC Root**:

$$vc\_root = Hash(pre\_root \mathbin{\Vert} salt)$$


.


* **Unique Credential Identifier**:

$$vcID = SHA256(issuer\_DID \mathbin{\Vert} holder\_DID \mathbin{\Vert} salt)$$


.



The tuple $(vcID, vc\_root)$ is anchored on-chain, transforming the blockchain into an immutable trust anchor.

### 2. Reusable Verifiable Presentations (VPs)

To prevent expensive re-computations, the framework enables the same VP to be reused across different verifiers and sessions. Trust is derived directly from the on-chain anchor rather than transient, session-specific signatures. Selective disclosure is enforced via smart contracts so that verifiers only see the specific claim subsets authorized for that session.

---

## Technical Implementation Details

* **Blockchain Environment**: Implemented on the Ethereum Virtual Machine (EVM) via Remix VM (Prague).


* **Smart Contracts**: Core logic is split across `reusableVP.sol` (handling `registerVCRoot`, `verifyRoot`, and `shareVPClaims`) and `verify.sol` for proof validation.


* **ZKP Toolchain**: Developed using ZoKrates v0.8.4 implementing the **Groth16** zk-SNARK algorithm.


* **Data Structure**: Incorporates **B-Trees** rather than traditional Merkle Trees to achieve consistent lookup depths (level 2 or 3) and streamline credential updates.


* **Revocation Status Handling**: Tracks validity using a W3C Bitstring (0 for valid, 1 for revoked). The off-chain string is compressed using **GZIP** to reduce a 16 KB list down to 135 bytes before its hash is anchored on-chain.



---

## Performance Evaluation

The system was benchmarked using three credential types: $VC_1$ (Residence Card), $VC_2$ (Passport), and $VC_3$ (Driving License), each containing 12 claims.

### On-Chain and System Benchmarks

| Metric | $VC_1$ (Residence Card) | $VC_2$ (Passport) | $VC_3$ (Driving License) |
| --- | --- | --- | --- |
| **Registration Time** | 55 ms

 | 50 ms

 | 71 ms

 |
| **Verification Time** | 87 ms

 | 80 ms

 | 97 ms

 |
| **Registration Gas Units** | 158,372 units

 | 141,260 units

 | 141,272 units

 |
| **Verification Gas Units** | 449,753 units

 | 437,394 units

 | 442,184 units

 |

### zk-SNARK Circuit Performance

* **Proof Generation Time**: Completes in under 100 ms off-chain.


* **Proof Size**: Maintains a constant size of 256 bytes across all test sets.


* **Verification Gas Costs**: Ranges between approximately 363,127 and 499,928 gas units depending on the size of the public input disclosed.



---

## Security & Privacy Analysis

> **Security Guardrail**: High-entropy (128-bit) random salts prevent brute-force attacks against the hash space ($2^{128}$), making claim guessing mathematically unfeasible.
> 
> 

The paper validates resistance against several distinct attack vectors:

* **Claim Forgery**: Prevented because any unauthorized modification of credential fields results in a hash mismatch against the unalterable on-chain $vc\_root$.


* **Replay Attacks**: Defeated via integration of time-related public inputs ($t_s$ start, $t_e$ end, $t_c$ current time). The zk circuit enforces the condition $t_c \in [t_s, t_e]$, rejecting expired or intercepted session tokens.


* **Correlation & Linkability**: Prevented because the holder applies a fresh salt for every presentation session. This produces non-deterministic, distinct $vpID$ values, ensuring that a user's activities cannot be tracked or linked across multiple verifiers.


* **Regulatory Compliance**: The architecture naturally fulfills zero-knowledge and data minimization guidelines under major international frameworks including GDPR (EU), CCPA (US), LGPD (Brazil), and PDPA (Singapore).

---

## VII. Reproduction Results (Phase 2)

As part of Phase 2, we re-implemented the multi-credential aggregation mechanism in Circom 2.1.6 and snarkjs (Groth16). This effectively decouples presentation verification from issuer-specific cryptographic signatures by validating multiple Merkle roots simultaneously.

### Constraint Scaling ($N$ Credentials)

| $N$ (Credentials) | Non-linear Constraints | Public Inputs (Roots) |
| :--- | :--- | :--- |
| **$N=2$** | 4,880 | 2 |
| **$N=3$** | 7,320 | 3 |
| **$N=5$** | 12,200 | 5 |

### Performance Benchmarks (Node.js WASM)

| $N$ (Credentials) | Proof Gen Time | Verification Time |
| :--- | :--- | :--- |
| **$N=2$** | ~920 ms | 14 ms |
| **$N=3$** | ~710 ms | 11 ms |
| **$N=5$** | ~1,160 ms | 13 ms |

### Architecture Simulation

A full simulated environment (`simulation/`) proves the decoupled nature of the system:
1. `issuer_sim.js`: 5 distinct issuers build independent Merkle trees and push their roots to a simulated shared blockchain state.
2. `prover_sim.js`: The user client pulls the 5 public roots and computes a single $N=5$ aggregate SNARK proof.
3. `verifier_sim.js`: The verifier reads the single proof and the on-chain roots, mathematically validating the possession of all 5 credentials in under 15ms.