const hre = require("hardhat");
const prompt = require("prompt-sync")({ sigint: true });

async function main() {
    const tenantAddress = prompt("Enter tenant address: ");
    const ownerAddress = prompt("Enter owner address: ");

    const rent = hre.ethers.parseEther("1"); // 1 ETH/month
    const deposit = hre.ethers.parseEther("2");
    const total = rent * BigInt(12) + deposit;

    const tenantSigner = await hre.ethers.getSigner(tenantAddress);
    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow", tenantSigner);

    const contract = await RentalEscrow.deploy(ownerAddress, rent, deposit, { value: total });
    await contract.waitForDeployment();

    console.log("\n✅ Contract deployed successfully!");
    console.log("Contract Address:", contract.target);
    console.log("Tenant Address:", tenantAddress);
    console.log("Owner Address:", ownerAddress);
}

main().catch((err) => {
    console.error("❌ Deployment failed:", err);
});
