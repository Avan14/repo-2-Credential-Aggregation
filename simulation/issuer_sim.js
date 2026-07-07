const fs = require('fs');
const path = require('path');
const { buildPoseidon } = require('circomlibjs');

const N = 5; // 5 different issuers
const depth = 10;
const numLeaves = 2 ** depth;
const myLeafIndex = 123;

async function main() {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    let publicRoots = [];
    let proverLeaves = [];
    let proverPathElements = [];
    let proverPathIndices = [];

    console.log(`Simulating ${N} Issuers issuing credentials and building their Merkle Trees...`);

    for (let i = 0; i < N; i++) {
        console.time(`Issuer ${i} Tree Construction`);
        
        // Issuer creates a credential leaf for the user
        const leaf = F.toObject(poseidon([BigInt(i), 999n]));
        proverLeaves.push(leaf);

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

                // Save path for our prover
                if (j === currentIndex || (j + 1) === currentIndex) {
                    if (currentIndex % 2 === 0) {
                        pathElements.push(right.toString());
                        pathIndices.push(0);
                    } else {
                        pathElements.push(left.toString());
                        pathIndices.push(1);
                    }
                }
            }
            currentLevel = nextLevel;
            currentIndex = Math.floor(currentIndex / 2);
        }
        
        publicRoots.push(currentLevel[0].toString());
        proverPathElements.push(pathElements);
        proverPathIndices.push(pathIndices);
        
        console.timeEnd(`Issuer ${i} Tree Construction`);
    }

    // "Publish" the roots to the blockchain (simulated as a file)
    fs.writeFileSync(path.join(__dirname, 'state.json'), JSON.stringify({ roots: publicRoots }, null, 2));
    console.log(`\n[Blockchain] Roots published to state.json`);

    // Give the user their private opening paths
    fs.writeFileSync(path.join(__dirname, 'prover_data.json'), JSON.stringify({
        leaves: proverLeaves.map(l => l.toString()),
        pathElements: proverPathElements,
        pathIndices: proverPathIndices
    }, null, 2));
    console.log(`[User Wallet] Private paths saved to prover_data.json`);
}

main().catch(console.error);
