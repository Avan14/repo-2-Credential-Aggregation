const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Prover is generating multi-credential proof...");

    // Read blockchain state
    const state = JSON.parse(fs.readFileSync(path.join(__dirname, 'state.json')));
    
    // Read user private wallet data
    const wallet = JSON.parse(fs.readFileSync(path.join(__dirname, 'prover_data.json')));

    const inputs = {
        leaves: wallet.leaves,
        pathElements: wallet.pathElements,
        pathIndices: wallet.pathIndices,
        roots: state.roots
    };

    const circuitName = 'test_multi_5';
    const wasmPath = path.join(__dirname, `../circuits/${circuitName}_js/${circuitName}.wasm`);
    const zkeyPath = path.join(__dirname, `../circuits/${circuitName}_0001.zkey`);

    console.time("Prover Generation Time");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);
    console.timeEnd("Prover Generation Time");

    // "Send" proof to verifier
    fs.writeFileSync(path.join(__dirname, 'proof.json'), JSON.stringify({ proof, publicSignals }, null, 2));
    console.log(`Proof successfully generated and sent to proof.json!`);
}

main().catch(console.error);
