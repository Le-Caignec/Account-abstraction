import { ethers, deployments } from "hardhat";

async function main() {
  const provider = ethers.provider;
  const from = await provider.getSigner().getAddress();

  const ret = await deployments.deploy("EntryPoint", {
    from,
    args: [],
    gasLimit: 6e6,
    deterministicDeployment: true,
  });
  console.log("==entrypoint addr=", ret.address);

  const entryPointAddress = ret.address;
  const w = await deployments.deploy("SimpleAccount", {
    from,
    args: [entryPointAddress],
    gasLimit: 2e6,
    deterministicDeployment: true,
  });

  console.log("==account abstraction=", w.address);

  const t = await deployments.deploy("TestCounter", {
    from,
    deterministicDeployment: true,
  });
  console.log("==testCounter=", t.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
