import type { Trade, TradingAccount, Tag } from "@/generated/prisma/client";
import type { Direction, TradeStatus } from "@/generated/prisma/enums";

export type { Trade, TradingAccount, Tag, Direction, TradeStatus };

export type TradeWithTags = Trade & {
  tags: { tag: Tag }[];
  account: Pick<TradingAccount, "id" | "name" | "currency">;
};

export type AccountWithStats = TradingAccount & {
  _count: { trades: number };
  totalProfit: number;
};
