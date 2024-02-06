import { ethers, toBeHex } from "ethers";

export const AddressZero = ethers.ZeroAddress;
export const HashZero = ethers.ZeroHash;

export function packAccountGasLimits(validationGasLimit, callGasLimit) {
  return ethers.concat([
    toBeHex(validationGasLimit, 16),
    toBeHex(callGasLimit, 16),
  ]);
}

export function packPaymasterData(
  paymaster,
  paymasterVerificationGasLimit,
  postOpGasLimit,
  paymasterData
) {
  // TODO : not sure, should check the SC
  return ethers.concat([
    paymaster,
    toBeHex(paymasterVerificationGasLimit, 16),
    toBeHex(postOpGasLimit, 16),
    paymasterData,
  ]);
}
