pragma circom 2.1.6;
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/switcher.circom";

template MerkleTreeRoot(nLevels) {
    signal input leaf;
    signal input pathElements[nLevels];
    signal input pathIndices[nLevels]; // 0 or 1
    signal output root;

    component switchers[nLevels];
    component hashers[nLevels];

    signal levelHashes[nLevels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < nLevels; i++) {
        switchers[i] = Switcher();
        switchers[i].sel <== pathIndices[i];
        switchers[i].L <== levelHashes[i];
        switchers[i].R <== pathElements[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== switchers[i].outL;
        hashers[i].inputs[1] <== switchers[i].outR;

        levelHashes[i + 1] <== hashers[i].out;
    }

    root <== levelHashes[nLevels];
}

// Proves membership in N different Merkle trees simultaneously
template MultiCredentialAggregation(nCredentials, nLevels) {
    signal input leaves[nCredentials];
    signal input pathElements[nCredentials][nLevels];
    signal input pathIndices[nCredentials][nLevels];
    signal input roots[nCredentials];

    component treeRoots[nCredentials];

    for (var i = 0; i < nCredentials; i++) {
        treeRoots[i] = MerkleTreeRoot(nLevels);
        treeRoots[i].leaf <== leaves[i];
        
        for (var j = 0; j < nLevels; j++) {
            treeRoots[i].pathElements[j] <== pathElements[i][j];
            treeRoots[i].pathIndices[j] <== pathIndices[i][j];
        }
        
        // Constrain the computed root to match the provided public root
        roots[i] === treeRoots[i].root;
    }
}
