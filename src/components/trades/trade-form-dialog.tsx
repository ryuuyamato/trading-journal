// The trade form is now a right-hand order ticket (see trade-ticket.tsx).
// This module stays as the import path four call sites already use, so the
// change of presentation doesn't ripple through them.
export {
  TradeTicket as TradeFormDialog,
  NewTradeTicket as NewTradeDialog,
  type TradeFormValues,
} from "@/components/trades/trade-ticket";
