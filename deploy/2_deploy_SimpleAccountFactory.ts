import { ethers, deployments } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const from = await provider.getSigner().getAddress();

  const entrypoint = await deployments.get("EntryPoint");
  const ret = await deployments.deploy("SimpleAccountFactory", {
    from,
    args: [entrypoint.address],
    gasLimit: 6e6,
    deterministicDeployment: true,
  });
  console.log("==SimpleAccountFactory addr=", ret.address);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
