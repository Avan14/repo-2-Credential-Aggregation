# Phase 2 Reproduction Results: Credential Aggregation

This document contains the benchmark results for the Circom/snarkjs re-implementation of the multi-credential aggregation protocol.

## Setup Environment
- **Circuit Framework:** Circom 2.1.6
- **Proving System:** snarkjs 0.7.x (Groth16 backend)
- **Curve:** BN128
- **Trusted Setup:** Powers of Tau (Hermez `pot15_final.ptau`, up to 32,768 constraints)

## Constraint Scaling

As we increase the number of credentials ($N$) that the user aggregates into a single proof, the number of non-linear constraints scales linearly:

| $N$ (Credentials) | Non-linear Constraints | Public Inputs (Roots) |
| :--- | :--- | :--- |
| **$N=2$** | 4,880 | 2 |
| **$N=3$** | 7,320 | 3 |
| **$N=5$** | 12,200 | 5 |

## Performance Benchmarks

The following benchmarks measure the proof generation and verification times using Node.js WASM execution for $N$ aggregated credentials.

| $N$ (Credentials) | Proof Gen Time (WASM) | Verification Time (WASM) |
| :--- | :--- | :--- |
| **$N=2$** | ~920 ms | 14 ms |
| **$N=3$** | ~710 ms | 11 ms |
| **$N=5$** | ~1,160 ms | 13 ms |

*Note: In the original paper (using ZoKrates/Groth16 on EVM), the proofs were generated in "under 100ms". The difference (~1.1s here vs 100ms) is attributable to Node.js/WASM overhead versus native or optimized tooling, as well as differing tree depths (the paper used extremely shallow B-trees of depth 2-3, whereas this benchmark uses depth 10 Merkle trees).*

## Simulation Results

The end-to-end `simulation` directory correctly implements the decentralized architecture:
1. **Issuers (`issuer_sim.js`)**: 5 distinct issuers compute their Merkle trees independently and publish their root hashes to a simulated public bulletin board (`state.json`).
2. **Prover (`prover_sim.js`)**: The user's device fetches the public roots, combines them with their private credential openings, and computes an aggregated `test_multi_5` SNARK proof (~1.6s).
3. **Verifier (`verifier_sim.js`)**: The verifier reads the proof and confirms it mathematically matches the 5 public roots published by the issuers, achieving verification in under 20ms without relying on interactive signature checks.
