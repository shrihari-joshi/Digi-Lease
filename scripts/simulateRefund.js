// scripts/simulateRefund.js
const hre = require("hardhat");
const fs = require("fs");
const prompt = require("prompt-sync")();

async function main() {
    const { address } = JSON.parse(fs.readFileSync("contractAddress.json"));
    const [tenant] = await hre.ethers.getSigners();
    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow");
    const contract = await RentalEscrow.attach(address);

    const damageScore = prompt("Enter damage score in % (0-100): ");
    const damagePercent = Number(damageScore);

    if (isNaN(damagePercent) || damagePercent < 0 || damagePercent > 100) {
        console.log("❌ Invalid damage score.");
        return;
    }

    try {
        const tx = await contract.connect(tenant).refundDepositWithDamage(damagePercent);
        await tx.wait();
        console.log("✅ Deposit refunded successfully.");
    } catch (err) {
        console.error("Refund error:", err.message);
    }
}

main().catch(console.error);
