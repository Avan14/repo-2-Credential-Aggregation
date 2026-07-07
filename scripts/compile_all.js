const { execSync } = require('child_process');

const circuits = [
    'test_multi_2',
    'test_multi_3',
    'test_multi_5'
];

const ptauFile = 'pot15_final.ptau';

for (const circuit of circuits) {
    try {
        execSync(`node compile.js ${circuit} ${ptauFile}`, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Failed on ${circuit}`);
    }
}
