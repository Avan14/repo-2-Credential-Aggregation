const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const circuitName = process.argv[2];
const ptauFile = process.argv[3] || 'pot14_final.ptau';

if (!circuitName) {
    console.error("Please provide a circuit name. Example: node compile.js test_multi_2");
    process.exit(1);
}

const circuitsDir = path.join(__dirname, '../circuits');
const ptauPath = path.join(circuitsDir, ptauFile);

try {
    console.log(`\n================================`);
    console.log(`Compiling and setting up ${circuitName}...`);

    if (!fs.existsSync(ptauPath)) {
        console.log(`Generating Powers of Tau (${ptauFile}) as it does not exist...`);
        const power = ptauFile.match(/pot(\d+)_final/)[1];
        execSync(`npx snarkjs powersoftau new bn128 ${power} pot${power}_0000.ptau -v`, { cwd: circuitsDir, stdio: 'inherit' });
        execSync(`echo "randomness" | npx snarkjs powersoftau contribute pot${power}_0000.ptau pot${power}_0001.ptau --name="First contribution" -v`, { cwd: circuitsDir, stdio: 'inherit' });
        execSync(`npx snarkjs powersoftau prepare phase2 pot${power}_0001.ptau ${ptauFile} -v`, { cwd: circuitsDir, stdio: 'inherit' });
    }

    console.log(`Compiling ${circuitName}...`);
    execSync(`circom ${circuitName}.circom --r1cs --wasm --sym`, { cwd: circuitsDir, stdio: 'inherit' });

    console.log("Running setup...");
    execSync(`npx snarkjs groth16 setup ${circuitName}.r1cs ${ptauFile} ${circuitName}_0000.zkey`, { cwd: circuitsDir, stdio: 'inherit' });

    console.log("Contributing to phase 2...");
    execSync(`echo "randomness" | npx snarkjs zkey contribute ${circuitName}_0000.zkey ${circuitName}_0001.zkey --name="Second contribution" -v`, { cwd: circuitsDir, stdio: 'inherit' });

    console.log("Exporting verification key...");
    execSync(`npx snarkjs zkey export verificationkey ${circuitName}_0001.zkey ${circuitName}_vkey.json`, { cwd: circuitsDir, stdio: 'inherit' });

    console.log("Compilation and setup completed successfully.");
} catch (error) {
    console.error(`Error during compilation/setup:`, error.message);
    process.exit(1);
}
