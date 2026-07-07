const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { buildPoseidon } = require("circomlibjs");

async function runBenchmark(N) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;
    const circuitName = `test_multi_${N}`;
    console.log(`\n--- Benchmarking ${circuitName} (N=${N}) ---`);

    const wasmPath = path.join(__dirname, `../circuits/${circuitName}_js/${circuitName}.wasm`);
    const zkeyPath = path.join(__dirname, `../circuits/${circuitName}_0001.zkey`);
    const vkeyPath = path.join(__dirname, `../circuits/${circuitName}_vkey.json`);

    const depth = 10;
    const numLeaves = 2 ** depth;
    const myLeafIndex = 123;

    let allLeaves = [];
    let allRoots = [];
    let allPathElements = [];
    let allPathIndices = [];

    // Construct N separate Merkle trees (simulating N different issuers)
    console.time(`Tree Construction (N=${N})`);
    for (let i = 0; i < N; i++) {
        // Dummy credential leaf
        const leaf = F.toObject(poseidon([BigInt(i), 999n]));
        allLeaves.push(leaf);

        let currentLevel = Array(numLeaves).fill(0n);
        currentLevel[myLeafIndex] = leaf;

        let currentIndex = myLeafIndex;
        let pathElements = [];
        let pathIndices = [];

        for (let d = 0; d < depth; d++) {
            let nextLevel = [];
            for (let j = 0; j < currentLevel.length; j += 2) {
                const left = currentLevel[j];
                const right = currentLevel[j + 1];
                const hash = F.toObject(poseidon([left, right]));
                nextLevel.push(hash);

                if (j === currentIndex || (j + 1) === currentIndex) {
                    if (currentIndex % 2 === 0) {
                        pathElements.push(right);
                        pathIndices.push(0);
                    } else {
                        pathElements.push(left);
                        pathIndices.push(1);
                    }
                }
            }
            currentLevel = nextLevel;
            currentIndex = Math.floor(currentIndex / 2);
        }
        allRoots.push(currentLevel[0]);
        allPathElements.push(pathElements);
        allPathIndices.push(pathIndices);
    }
    console.timeEnd(`Tree Construction (N=${N})`);

    const inputs = {
        leaves: allLeaves,
        pathElements: allPathElements,
        pathIndices: allPathIndices,
        roots: allRoots
    };

    console.time(`Proof Generation Time (N=${N})`);
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath);
    console.timeEnd(`Proof Generation Time (N=${N})`);

    const vKey = JSON.parse(fs.readFileSync(vkeyPath));
    console.time(`Verification Time (N=${N})`);
    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.timeEnd(`Verification Time (N=${N})`);

    if (res === true) {
        console.log(`Verification OK for N=${N}`);
    } else {
        console.log(`Invalid proof for N=${N}`);
    }
}

async function main() {
    await runBenchmark(2);
    await runBenchmark(3);
    await runBenchmark(5);
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
