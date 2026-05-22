export type EvmAddress = `0x${string}`;

const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export function isEvmAddress(value: string | null | undefined): value is EvmAddress {
  return typeof value === "string" && EVM_ADDRESS_PATTERN.test(value);
}

export function normalizeEvmAddress(value: string | null | undefined): EvmAddress | null {
  return isEvmAddress(value) ? (value.toLowerCase() as EvmAddress) : null;
}

export function shortAddress(address: string | null | undefined) {
  const normalized = normalizeEvmAddress(address);

  if (!normalized) {
    return null;
  }

  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
}
