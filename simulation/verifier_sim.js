const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Verifier is checking the multi-credential proof...");

    // Read blockchain state
    const state = JSON.parse(fs.readFileSync(path.join(__dirname, 'state.json')));
    
    // Read proof received from prover
    const { proof, publicSignals } = JSON.parse(fs.readFileSync(path.join(__dirname, 'proof.json')));

    // Ensure the public signals match the blockchain state exactly
    // In our circuit, the public signals are just the 5 roots
    for (let i = 0; i < 5; i++) {
        if (publicSignals[i] !== state.roots[i]) {
            console.error(`Root mismatch for Issuer ${i}! The proof is claiming a different state.`);
            process.exit(1);
        }
    }
    console.log("[Blockchain State Check] Public signals match on-chain roots perfectly.");

    const circuitName = 'test_multi_5';
    const vkeyPath = path.join(__dirname, `../circuits/${circuitName}_vkey.json`);
    const vKey = JSON.parse(fs.readFileSync(vkeyPath));

    console.time("Verifier Check Time");
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.timeEnd("Verifier Check Time");

    if (res === true) {
        console.log("✅ Verification SUCCESS! The user legally owns all 5 credentials.");
    } else {
        console.log("❌ Verification FAILED!");
    }
}

main().catch(console.error);
