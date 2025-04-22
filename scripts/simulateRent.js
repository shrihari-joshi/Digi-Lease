// scripts/simulateRent.js
const hre = require("hardhat");
const fs = require("fs");
const prompt = require("prompt-sync")();

async function main() {
    const { address } = JSON.parse(fs.readFileSync("contractAddress.json"));
    const [tenant, owner] = await hre.ethers.getSigners();

    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow");
    const contract = await RentalEscrow.attach(address);

    let monthsPaid = await contract.monthsPaid();

    for (let i = Number(monthsPaid); i < 12; i++) {
        const tx = await contract.connect(owner).releaseRent();
        await tx.wait();
        console.log(`Month ${i + 1} rent paid.`);
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute = 1 month
    }

    console.log("All rents paid.");
    const damageScore = prompt("Enter damage score in % (0-100): ");
    const damagePercent = Number(damageScore);
    if (damagePercent < 0 || damagePercent > 100) {
        console.log("Invalid damage score.");
        return;
    }

    const tx = await contract.connect(tenant).refundDepositWithDamage(damagePercent);
    await tx.wait();
    console.log("Deposit refunded as per damage score.");
}

main().catch(console.error);
