// scripts/simulateRent.js
const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const { address } = JSON.parse(fs.readFileSync("contractAddress.json"));
    const [tenant] = await hre.ethers.getSigners();
    const RentalEscrow = await hre.ethers.getContractFactory("RentalEscrow");
    const contract = await RentalEscrow.attach(address);

    let monthsPaid = Number(await contract.monthsPaid());

    console.log(`Starting rent payment from month ${monthsPaid + 1}...`);

    for (let i = monthsPaid + 1; i <= 12; i++) {
        let paid = false;
        while (!paid) {
            try {
                const tx = await contract.connect(tenant).payRent({ value: await contract.rent() });
                await tx.wait();
                console.log(`Month ${i} rent paid.`);
                paid = true;
            } catch (err) {
                if (err.message.includes("Too early")) {
                    console.log(`Too early for month ${i}, waiting 60 seconds...`);
                    await new Promise(r => setTimeout(r, 60000));
                } else {
                    console.error(`Rent payment error for month ${i}:`, err);
                    return;
                }
            }
        }
    }

    console.log("✅ All rent payments done.");
}

main().catch(console.error);
