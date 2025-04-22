const { ethers } = require("ethers");
const readline = require("readline");
const fs = require("fs");

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Wallets
const tenantWallet = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
const ownerWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

// Contract
const contractAddress = "0xa85b028984bC54A2a3D844B070544F59dDDf89DE";
const abi = JSON.parse(fs.readFileSync("./artifacts/contracts/UtilityBillSettlement.sol/UtilityBillSettlement.json")).abi;
const tenantContract = new ethers.Contract(contractAddress, abi, tenantWallet);
const ownerContract = new ethers.Contract(contractAddress, abi, ownerWallet);

// CLI setup
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function simulate() {
    console.log("Simulating Utility Bill Flow...");

    const depositAmount = await ask("Enter deposit amount in ETH: ");
    await tenantContract.depositFunds({ value: ethers.parseEther(depositAmount) });
    console.log("Tenant deposited estimated funds.");

    const water = await ask("Enter water bill in ETH: ");
    const electricity = await ask("Enter electricity bill in ETH: ");
    const internet = await ask("Enter internet bill in ETH: ");

    await ownerContract.inputBills(
        ethers.parseEther(electricity),
        ethers.parseEther(water),
        ethers.parseEther(internet)
    );
    console.log("Owner submitted actual bills.\n");

    const excess = await tenantContract.getExcessAmount();
    const expectedExcess = await tenantContract.getExcessAmount();
    console.log(`Expected Excess from Contract: ${ethers.formatEther(expectedExcess)} ETH`);
    console.log(`Local Excess Value: ${ethers.formatEther(excess)} ETH`);
    console.log(`Current Contract Balance: ${ethers.formatEther(await provider.getBalance(contractAddress))} ETH`);

    if (excess > 0n) {
        console.log(`Bill exceeds deposit by ${ethers.formatEther(excess)} ETH`);
        console.log("Simulating 7 day grace period... (7 seconds)");
        await new Promise(res => setTimeout(res, 7000));

        const choice = await ask("Do you want to pay the excess? (yes/no): ");
        if (choice.toLowerCase() === "yes") {
            await tenantContract.balanceBill({ value: excess });
            console.log("Excess balanced. Services resumed.");
        } else {
            console.log("No excess paid. You must pay a penalty to resume service.");
            const penalty = await tenantContract.getPenaltyAmount();
            const pay = await ask(`Pay penalty of ${ethers.formatEther(penalty)} ETH? (yes/no): `);
            if (pay.toLowerCase() === "yes") {
                await tenantContract.payPenaltyAndResume({ value: penalty });
                console.log("Penalty paid. Services resumed.");
            } else {
                console.log("Services remain paused.");
            }
        }
    } else {
        console.log("Funds were sufficient. Bills paid to providers.");
    }

    rl.close();
}

simulate().catch(console.error);
