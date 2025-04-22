// deploy.js
const { ethers } = require("ethers");
const fs = require("fs");
const readline = require("readline");

// Setup provider (use your own RPC URL here)
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Replace with your deployer's private key
const wallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);

// Hardcoded utility providers
const electricityProvider = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const waterProvider = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
const internetProvider = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

// Read input from terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function ask(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    const tenant = await ask("Enter tenant address: ");
    const owner = await ask("Enter owner address: ");
    const depositEth = await ask("Enter monthly deposit amount in ETH: ");
    rl.close();

    // Read and compile contract
    const contractSource = fs.readFileSync("./contracts/UtilityBillSettlement.sol", "utf8");
    const solc = require("solc");

    const input = {
        language: "Solidity",
        sources: {
            "UtilityBillSettlement.sol": {
                content: contractSource
            }
        },
        settings: {
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"]
                }
            }
        }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contractFile = output.contracts["UtilityBillSettlement.sol"]["UtilityBillSettlement"];
    const abi = contractFile.abi;
    const bytecode = contractFile.evm.bytecode.object;

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(
        tenant,
        owner,
        electricityProvider,
        waterProvider,
        internetProvider,
        ethers.parseEther(depositEth)
    );

    await contract.waitForDeployment();
    console.log(`\nContract deployed at: ${await contract.getAddress()}`);
}

main().catch(console.error);
