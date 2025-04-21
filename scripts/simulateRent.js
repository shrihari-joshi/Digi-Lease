const hre = require("hardhat");
const prompt = require("prompt-sync")();

const tenantAddress = prompt("Enter Tenant Address: ").trim();
const ownerAddress = prompt("Enter Owner Address: ").trim();
const start = prompt("Start Contract? (yes/no): ").toLowerCase();

if (start !== "yes") {
    console.log("Contract simulation cancelled.");
    process.exit(0);
}

async function main() {
    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow");
    const contract = await RentalEscrow.attach(contractAddress);

    // Get all available signers
    const signers = await hre.ethers.getSigners();

    // Match tenant and owner from input
    const tenant = signers.find(s => s.address.toLowerCase() === tenantAddress.toLowerCase());
    const owner = signers.find(s => s.address.toLowerCase() === ownerAddress.toLowerCase());

    if (!tenant || !owner) {
        console.log("One or both addresses not found among local signers.");
        process.exit(1);
    }


    const interval = setInterval(() => {
        (async () => {
            try {
                const monthsPaid = await contract.monthsPaid();

                if (monthsPaid < 12) {
                    await hre.network.provider.send("evm_increaseTime", [60]); // simulate 1 month
                    await hre.network.provider.send("evm_mine");

                    const tx = await contract.connect(owner).releaseRent();
                    await tx.wait();
                    console.log(`Month ${monthsPaid.toNumber() + 1} rent paid.`);
                } else {
                    clearInterval(interval);
                    console.log("All rent paid. Now refunding deposit...");

                    const refundTx = await contract.connect(tenant).refundDeposit();
                    await refundTx.wait();
                    console.log("Deposit refunded.");
                }
            } catch (err) {
                console.log("Waiting for next month or already paid!");
            }
        })();
    }, 6000); // 6 seconds = 1 simulated month

}

main().catch(console.error);
