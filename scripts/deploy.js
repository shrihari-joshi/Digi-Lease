const hre = require("hardhat");
const fs = require("fs");
const prompt = require("prompt-sync")();

async function main() {
    const tenantAddress = prompt("Enter tenant address: ");
    const ownerAddress = prompt("Enter owner address: ");

    const tenantConsent = prompt("Tenant: Do you want to deploy the contract? (yes/no): ");
    const ownerConsent = prompt("Owner: Do you want to deploy the contract? (yes/no): ");

    if (tenantConsent.toLowerCase() !== "yes" || ownerConsent.toLowerCase() !== "yes") {
        console.log("Deployment cancelled.");
        return;
    }

    const rent = hre.ethers.parseEther("1");
    const deposit = hre.ethers.parseEther("2");
    const initialPayment = rent + deposit;

    const [deployer] = await hre.ethers.getSigners();
    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow");

    const contract = await RentalEscrow.connect(deployer).deploy(
        tenantAddress,
        ownerAddress,
        rent,
        deposit,
        { value: initialPayment }
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("Contract deployed at:", contractAddress);
    fs.writeFileSync("contractAddress.json", JSON.stringify({
        address: contractAddress,
        tenant: tenantAddress,
        owner: ownerAddress
    }, null, 2));
}

main().catch((error) => {
    console.error("Deployment failed:", error);
});
