import type { TradeFormValues } from "@/components/trades/trade-form-dialog";

export interface TradeListItem extends TradeFormValues {
  account: { name: string; marketType: string; currency: string };
  tags: { id: string; name: string; color: string }[];
  screenshots: { id: string; url: string; caption: string | null }[];
}

export interface AccountOption {
  id: string;
  name: string;
  marketType: string;
  currency: string;
}
