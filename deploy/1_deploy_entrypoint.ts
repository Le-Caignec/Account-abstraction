import { ethers } from "hardhat";
import { Create2Factory } from "../src/Create2Factory";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(deployer);
  // const provider = ethers.provider;
  // const from = await provider.getSigner().getAddress();
  // await new Create2Factory(ethers.provider).deployFactory();

  // const ret = await ethers.deployContract("EntryPoint", {
  //   from,
  //   args: [],
  //   gasLimit: 6e6,
  //   deterministicDeployment: true,
  // });
  // console.log("==entrypoint addr=", ret.address);

  // const entryPointAddress = ret.address;
  // const w = await ethers.deployContract("SimpleAccount", {
  //   from,
  //   args: [entryPointAddress, from],
  //   gasLimit: 2e6,
  //   deterministicDeployment: true,
  // });

  // console.log("== wallet=", w.address);

  // const t = await ethers.deployContract("TestCounter", {
  //   from,
  //   deterministicDeployment: true,
  // });
  // console.log("==testCounter=", t.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
