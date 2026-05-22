export type RealtimeMarketPatch = {
  tokenId: string;
  price: number | null;
  receivedAt: string;
};

export function createRealtimeUnavailableState(reason = "realtime_not_connected") {
  return {
    connected: false,
    patches: [] as RealtimeMarketPatch[],
    reason
  };
}
