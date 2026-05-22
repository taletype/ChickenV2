import { buildOfficialPolymarketFundingUrl } from "./funding-url";
import { POLYMARKET_CHAIN, POLYMARKET_COLLATERAL_ASSET } from "./token-model";

export type AddFundsMethod = {
  id: "official_polymarket_portfolio";
  label: string;
  href: string;
  asset: typeof POLYMARKET_COLLATERAL_ASSET;
  chain: typeof POLYMARKET_CHAIN;
};

export function listAddFundsMethods(): AddFundsMethod[] {
  return [
    {
      id: "official_polymarket_portfolio",
      label: "Open Polymarket portfolio",
      href: buildOfficialPolymarketFundingUrl(),
      asset: POLYMARKET_COLLATERAL_ASSET,
      chain: POLYMARKET_CHAIN
    }
  ];
}
