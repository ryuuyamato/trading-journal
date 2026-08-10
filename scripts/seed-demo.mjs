// Membangun satu akun demo berisi jurnal trading lengkap — untuk simulasi
// "akun yang tercatat penuh" dan bahan marketing.
//
// Prinsip yang dipegang skrip ini: SETIAP ANGKA HARUS KONSISTEN. netProfit
// diturunkan dari harga entry/exit, contract size, dan lot yang benar-benar
// tersimpan; rMultiple dihitung dari jarak stop loss yang benar-benar dipasang.
// Kalau tidak begitu, siapa pun yang membuka satu trade di screenshot marketing
// akan melihat angka yang saling bertentangan.
//
// Pakai:
//   node scripts/seed-demo.mjs                  # dry run, tidak menulis apa pun
//   node scripts/seed-demo.mjs --apply          # tulis (gagal kalau demo sudah ada)
//   node scripts/seed-demo.mjs --apply --reset  # hapus demo lama, bangun ulang
//
// Hanya menyentuh satu user (DEMO_EMAIL). Data pengguna lain tidak pernah dibaca
// maupun ditulis.

import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import bcrypt from "bcryptjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(path.join(ROOT, ".env"));

const APPLY = process.argv.includes("--apply");
const RESET = process.argv.includes("--reset");

const DEMO_EMAIL = "demo@kandel.app";
const DEMO_NAME = "Kandel Demo";
// Repo ini publik. Password demo dibaca dari .env (yang tidak dilacak git) supaya
// tidak ada orang luar yang bisa masuk ke akun demo produksi dan merusak datanya.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

// Hari terakhir yang punya trade. Semua tanggal dihitung mundur dari sini.
const END = new Date(Date.UTC(2026, 7, 10, 0, 0, 0)); // 10 Agustus 2026

// ─── Acak deterministik ──────────────────────────────────────────────────────
// Seed tetap supaya menjalankan ulang menghasilkan jurnal yang sama persis —
// screenshot marketing lama tidak jadi basi setelah re-seed.
let _seed = 0x9e3779b9;
function rnd() {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rangeF = (lo, hi) => lo + rnd() * (hi - lo);
const rangeI = (lo, hi) => Math.floor(rangeF(lo, hi + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;

const ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
function cuid() {
  let s = "c";
  for (let i = 0; i < 24; i++) s += ID_CHARS[Math.floor(rnd() * ID_CHARS.length)];
  return s;
}

// ─── Instrumen ───────────────────────────────────────────────────────────────
// [contractSize, pipSize, digits, quote, refPrice] — sesuai src/lib/instruments.ts
const INSTRUMENTS = {
  EURUSD: [100000, 0.0001, 5, "USD", 1.085],
  GBPUSD: [100000, 0.0001, 5, "USD", 1.27],
  AUDUSD: [100000, 0.0001, 5, "USD", 0.66],
  NZDUSD: [100000, 0.0001, 5, "USD", 0.6],
  USDJPY: [100000, 0.01, 3, "JPY", 155.0],
  USDCAD: [100000, 0.0001, 5, "CAD", 1.37],
  GBPJPY: [100000, 0.01, 3, "JPY", 196.0],
  EURJPY: [100000, 0.01, 3, "JPY", 168.0],
  XAUUSD: [100, 0.1, 2, "USD", 3350],
  XAGUSD: [5000, 0.01, 3, "USD", 38.0],
  BTCUSD: [1, 1, 2, "USD", 95000],
  ETHUSD: [1, 0.1, 2, "USD", 3400],
  SOLUSD: [1, 0.01, 3, "USD", 180],
};

const QUOTE_TO_USD = { USD: 1, EUR: 1.09, GBP: 1.27, JPY: 0.00645, CHF: 1.12, CAD: 0.73, AUD: 0.66, NZD: 0.6 };

function inst(symbol) {
  const [contractSize, pipSize, digits, quote, refPrice] = INSTRUMENTS[symbol];
  return { symbol, contractSize, pipSize, digits, quote, refPrice };
}

// Aturan yang sama dengan kalkulator: pasangan USDXXX menghargai satu USD dalam
// mata uang quote, jadi nilai quote-nya cukup 1/harga — tidak perlu kurs luar.
function quoteRate(i, price) {
  if (i.quote === "USD") return 1;
  if (/^USD[A-Z]{3}$/.test(i.symbol)) return 1 / price;
  return QUOTE_TO_USD[i.quote] ?? 1;
}

const round = (v, d) => Number(v.toFixed(d));

// ─── Jalan harga ─────────────────────────────────────────────────────────────
// Harga tiap simbol berjalan acak sepanjang periode, jadi entry tersebar wajar
// alih-alih menumpuk di satu angka referensi.
const priceState = {};
for (const s of Object.keys(INSTRUMENTS)) priceState[s] = INSTRUMENTS[s][4];

function walk(symbol, days) {
  const vol = symbol.startsWith("BTC") || symbol.startsWith("ETH") || symbol.startsWith("SOL") ? 0.028 : 0.005;
  const drift = rangeF(-0.4, 0.55) * vol * days;
  const shock = rangeF(-1, 1) * vol * Math.sqrt(Math.max(days, 1));
  priceState[symbol] *= 1 + drift * 0.15 + shock;
  return priceState[symbol];
}

// ─── Waktu ───────────────────────────────────────────────────────────────────
const WIB = 7 * 60 * 60 * 1000;

/** Jam dinding WIB -> Date UTC, supaya tampil benar di aplikasi (Asia/Jakarta). */
function wib(dayOffset, hour, minute) {
  const base = END.getTime() - dayOffset * 86400000;
  const d = new Date(base);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hour, minute, 0) - WIB);
}

const isWeekend = (dayOffset) => {
  const d = new Date(END.getTime() - dayOffset * 86400000).getUTCDay();
  return d === 0 || d === 6;
};

/**
 * Pasar forex & emas tutup dari Sabtu 04:00 WIB sampai Senin 04:00 WIB.
 * Trade yang ditutup di jendela itu mustahil, dan pembaca yang paham trading
 * akan langsung menangkapnya. Kripto jalan terus, jadi dikecualikan.
 */
function marketClosed(date) {
  const w = new Date(date.getTime() + WIB);
  const day = w.getUTCDay();
  const hour = w.getUTCHours();
  if (day === 0) return true;
  if (day === 6) return hour >= 4;
  if (day === 1) return hour < 4;
  return false;
}

// Tidak ada trade yang boleh ditutup setelah hari terakhir — jurnal dengan
// tanggal di masa depan langsung terbaca palsu.
const LAST_MOMENT = wibAt(END, 22, 45);

function wibAt(base, hour, minute) {
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hour, minute, 0) - WIB,
  );
}

// Win rate digeser per bulan supaya kurva ekuitas punya periode drawdown.
// Jurnal yang naik lurus terlihat palsu — dan menyembunyikan justru fitur yang
// paling berguna: melihat bulan buruk apa adanya.
function winRateFor(dayOffset) {
  const month = new Date(END.getTime() - dayOffset * 86400000).getUTCMonth();
  return { 1: 0.48, 2: 0.5, 3: 0.52, 4: 0.36, 5: 0.47, 6: 0.53, 7: 0.49 }[month] ?? 0.47;
}

// ─── Teks ────────────────────────────────────────────────────────────────────
const SETUPS = [
  "Break & Retest", "Supply Demand", "Order Block", "Trendline Bounce",
  "Liquidity Sweep", "News Reaction", "Range Reversal", "Fair Value Gap",
  "MA Pullback",
];

const NOTES_WIN = [
  "Setup sesuai rencana, entry di retest, TP kena tanpa drama.",
  "Sabar tunggu konfirmasi candle close. Hasilnya bersih.",
  "Partial di 1R, sisanya trailing sampai target kedua.",
  "Momentum kuat setelah rilis data, ikut arah tren harian.",
  "Sesuai playbook. Tidak ada yang perlu diubah.",
  "Entry agak telat tapi struktur masih valid, tetap profit.",
  "Sweep likuiditas persis di area yang ditandai semalam.",
];

const NOTES_LOSS = [
  "Masuk sebelum konfirmasi. Salah sendiri.",
  "SL kena tipis lalu harga balik arah — SL terlalu rapat.",
  "Melawan tren H4, seharusnya skip.",
  "Ukuran lot kebesaran, jadi panik saat floating merah.",
  "Kena spread melebar saat news. Harusnya tidak entry di jam ini.",
  "Revenge trade setelah loss sebelumnya. Tidak ada di playbook.",
  "Cut lebih awal karena struktur rusak. Keputusan benar.",
  "Overtrade, ini entry keempat hari ini.",
];

const TAGS = [
  ["Disiplin", "#22c55e"],
  ["Setup A+", "#0ea5e9"],
  ["FOMO", "#f97316"],
  ["Overtrade", "#ef4444"],
  ["Revenge", "#dc2626"],
  ["News", "#a855f7"],
  ["Cut Loss Cepat", "#eab308"],
];

// ─── Pembuat trade ───────────────────────────────────────────────────────────
function buildTrade(cfg) {
  const { accountId, symbols, equity, riskLo, riskHi, slPipsLo, slPipsHi, dayOffset, marketType, crypto } = cfg;

  const symbol = pick(symbols);
  const i = inst(symbol);
  const direction = chance(0.52) ? "LONG" : "SHORT";
  const dir = direction === "LONG" ? 1 : -1;

  const openPrice = round(walk(symbol, 1), i.digits);
  const rate = quoteRate(i, openPrice);

  // 1) anggaran risiko -> 2) jarak stop -> 3) lot. Urutan ini yang membuat lot
  //    masuk akal terhadap modal, bukan angka karangan.
  const riskPercent = round(rangeF(riskLo, riskHi), 2);
  const riskBudget = equity * (riskPercent / 100);
  const slPips = rangeI(slPipsLo, slPipsHi);
  const slDistance = slPips * i.pipSize;

  const perLot = slDistance * i.contractSize * rate;
  const step = crypto ? 0.001 : 0.01;
  let lot = Math.max(step, Math.floor(riskBudget / perLot / step) * step);
  lot = round(lot, crypto ? 3 : 2);

  // Risiko sesungguhnya setelah lot dibulatkan — ini penyebut rMultiple.
  const riskAmount = lot * perLot;

  const stopLoss = round(openPrice - dir * slDistance, i.digits);
  const targetR = round(rangeF(1.3, 2.4), 2);
  const takeProfit = round(openPrice + dir * slDistance * targetR, i.digits);

  // Ekspektansi sengaja ditahan di sekitar +0.1R per trade. Sistem nyata yang
  // menguntungkan hidup di rentang itu; angka yang lebih tinggi menghasilkan
  // kurva ekuitas yang tidak akan dipercaya siapa pun yang paham trading.
  const won = chance(winRateFor(dayOffset) + (cfg.winBias ?? 0));
  let outcomeR;
  if (won) {
    outcomeR = chance(0.25)
      ? rangeF(0.2, 0.65) // ditutup manual sebelum TP
      : rangeF(0.72, 1) * targetR;
  } else if (chance(0.14)) {
    outcomeR = -rangeF(0.2, 0.6); // cut lebih awal sebelum SL
  } else {
    outcomeR = -rangeF(0.92, 1.12); // kena SL, kadang sedikit slippage
  }

  const priceMove = outcomeR * slDistance;
  const closePrice = round(openPrice + dir * priceMove, i.digits);

  // Diturunkan dari harga yang tersimpan, bukan dari outcomeR — supaya kalau ada
  // yang menghitung ulang dari kolom lain, angkanya cocok.
  const grossProfit = dir * (closePrice - openPrice) * i.contractSize * lot * rate;

  // Mundur ke hari bursa terdekat kalau tanggalnya jatuh saat pasar tutup.
  // Berlaku untuk semua jalur, termasuk posisi yang masih terbuka.
  const hour = rangeI(7, 21);
  const minute = rangeI(0, 59);
  let off = dayOffset;
  let openTime = wib(off, hour, minute);
  if (!crypto) {
    let g = 0;
    while (marketClosed(openTime) && g++ < 5) {
      off += 1;
      openTime = wib(off, hour, minute);
    }
  }
  let closeTime = new Date(openTime.getTime() + (crypto ? rangeI(25, 2600) : rangeI(20, 1900)) * 60000);

  if (!crypto) {
    let guard = 0;
    let moved = false;
    while (marketClosed(closeTime) && guard++ < 96) {
      closeTime = new Date(closeTime.getTime() - 3600000);
      moved = true;
    }
    // Tanpa sebaran ini semua trade yang digeser menumpuk tepat sebelum jam
    // tutup — pola yang langsung terlihat janggal di daftar jurnal.
    if (moved) closeTime = new Date(closeTime.getTime() - rangeI(5, 620) * 60000);
    // Kalau mundurnya sampai melewati waktu buka, tutup saja di hari yang sama.
    if (closeTime <= openTime) {
      closeTime = new Date(openTime.getTime() + rangeI(30, 180) * 60000);
    }
  }
  if (closeTime > LAST_MOMENT) closeTime = LAST_MOMENT;

  const holdingMinutes = Math.max(15, Math.round((closeTime - openTime) / 60000));
  const nights = Math.floor(holdingMinutes / 1440);
  const swap = nights > 0 ? round(nights * lot * rangeF(-3.2, 0.6), 2) : 0;
  const commission = crypto
    ? round(lot * openPrice * 0.001, 2)
    : round(lot * 7, 2);

  const netProfit = round(grossProfit - commission + swap, 2);
  const pips = round((dir * (closePrice - openPrice)) / i.pipSize, 1);
  const rMultiple = round(netProfit / riskAmount, 2);

  const notes = chance(0.62) ? (netProfit > 0 ? pick(NOTES_WIN) : pick(NOTES_LOSS)) : null;
  const emotionBefore = rangeI(2, 5);
  const emotionAfter = netProfit > 0 ? rangeI(3, 5) : rangeI(1, 3);

  // Entry berlapis hanya untuk emas — supaya fitur MULTI_LAYER ikut terlihat.
  const multi = !crypto && symbol === "XAUUSD" && chance(0.16);
  const spread = slDistance * rangeF(0.25, 0.5);

  return {
    id: cuid(),
    accountId,
    symbol,
    direction,
    status: "CLOSED",
    entryMode: multi ? "MULTI_LAYER" : "SINGLE",
    openTime,
    closeTime,
    openPrice,
    closePrice,
    lotSize: lot,
    swap,
    priceRangeHigh: multi ? round(openPrice + spread, i.digits) : null,
    priceRangeLow: multi ? round(openPrice - spread, i.digits) : null,
    layerCount: multi ? rangeI(3, 5) : null,
    quantity: null,
    buyFee: 0,
    sellFee: 0,
    taxAmount: 0,
    dividend: 0,
    leverage: crypto ? pick([5, 10, 10, 20]) : null,
    marginMode: crypto ? (chance(0.7) ? "ISOLATED" : "CROSS") : null,
    fundingRate: crypto ? round(rangeF(-0.02, 0.03), 4) : null,
    grossProfit: round(grossProfit, 2),
    commission,
    netProfit,
    rMultiple,
    pips,
    stopLoss,
    takeProfit,
    riskPercent,
    tradeMarketType: marketType === "MULTI_ASSET" ? "FOREX" : null,
    setup: chance(0.88) ? pick(SETUPS) : null,
    notes,
    emotionBefore,
    emotionAfter,
    holdingMinutes,
    createdAt: closeTime,
    updatedAt: closeTime,
  };
}

function buildOpenTrade(cfg) {
  const t = buildTrade({ ...cfg, dayOffset: cfg.dayOffset });
  return {
    ...t,
    id: cuid(),
    status: "OPEN",
    closeTime: null,
    closePrice: null,
    grossProfit: null,
    netProfit: null,
    rMultiple: null,
    pips: null,
    swap: 0,
    emotionAfter: null,
    holdingMinutes: null,
    notes: chance(0.5) ? "Masih berjalan, TP belum kena." : null,
    createdAt: t.openTime,
    updatedAt: t.openTime,
  };
}

// ─── Rencana akun ────────────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    name: "Forex Main",
    broker: "IC Markets",
    marketType: "FOREX",
    currency: "USD",
    deposit: 10000,
    description: "Akun utama forex. Fokus pair major, maksimal 2 posisi terbuka.",
    symbols: ["EURUSD", "GBPUSD", "AUDUSD", "NZDUSD", "USDJPY", "USDCAD", "GBPJPY", "EURJPY"],
    closed: 155,
    open: 2,
    spanDays: 172,
    riskLo: 0.5, riskHi: 1.2,
    slPipsLo: 14, slPipsHi: 45,
    winBias: 0.0,
  },
  {
    name: "Gold Sniper",
    broker: "Exness",
    marketType: "COMMODITY",
    currency: "USD",
    deposit: 5000,
    description: "Khusus XAUUSD sesi London & New York. Entry berlapis saat range lebar.",
    symbols: ["XAUUSD", "XAUUSD", "XAUUSD", "XAGUSD"],
    closed: 108,
    open: 2,
    spanDays: 163,
    riskLo: 0.6, riskHi: 1.5,
    slPipsLo: 25, slPipsHi: 110,
  },
  {
    name: "Crypto Futures",
    broker: "Binance",
    marketType: "CRYPTO_FUTURES",
    currency: "USDT",
    deposit: 3000,
    description: "Futures BTC/ETH/SOL, leverage rendah, isolated margin.",
    symbols: ["BTCUSD", "ETHUSD", "SOLUSD"],
    closed: 62,
    open: 2,
    spanDays: 128,
    riskLo: 0.8, riskHi: 2.0,
    slPipsLo: 120, slPipsHi: 900,
    // Sengaja dibuat merugi. Justru akun yang bocor inilah yang menunjukkan
    // gunanya jurnal — tanpa pencatatan, kerugian ini tidak akan ketahuan
    // tertutup profit dua akun lain.
    winBias: -0.03,
    crypto: true,
  },
];

// ─── Perakitan ───────────────────────────────────────────────────────────────
function build() {
  const userId = cuid();
  const tags = TAGS.map(([name, color]) => ({ id: cuid(), userId, name, color }));

  const accounts = [];
  const transactions = [];
  const trades = [];

  for (const plan of ACCOUNTS) {
    const accountId = cuid();
    const openedAt = wib(plan.spanDays + 3, 9, 0);

    // Sebagian trade dimampatkan ke bulan berjalan supaya dashboard bulan ini
    // dan Analisis AI punya bahan yang cukup.
    const offsets = [];
    for (let n = 0; n < plan.closed; n++) {
      let off = chance(0.22)
        ? rangeI(0, 10)
        : Math.floor(Math.pow(rnd(), 0.85) * plan.spanDays);
      let guard = 0;
      while (!plan.crypto && isWeekend(off) && guard++ < 8) off = Math.max(0, off - 1);
      offsets.push(off);
    }
    offsets.sort((a, b) => b - a); // kronologis: paling lama dulu

    let equity = plan.deposit;
    for (const dayOffset of offsets) {
      const t = buildTrade({
        accountId,
        symbols: plan.symbols,
        equity,
        riskLo: plan.riskLo,
        riskHi: plan.riskHi,
        slPipsLo: plan.slPipsLo,
        slPipsHi: plan.slPipsHi,
        winBias: plan.winBias ?? 0,
        dayOffset,
        marketType: plan.marketType,
        crypto: plan.crypto,
      });
      // Risiko mengikuti ekuitas berjalan — persis cara trader menaikkan ukuran
      // saat akun tumbuh dan mengecil saat drawdown.
      equity = Math.max(plan.deposit * 0.35, equity + t.netProfit);
      trades.push(t);
    }

    for (let n = 0; n < plan.open; n++) {
      trades.push(
        buildOpenTrade({
          accountId,
          symbols: plan.symbols,
          equity,
          riskLo: plan.riskLo,
          riskHi: plan.riskHi,
          slPipsLo: plan.slPipsLo,
          slPipsHi: plan.slPipsHi,
        winBias: plan.winBias ?? 0,
          dayOffset: rangeI(0, 4),
          marketType: plan.marketType,
          crypto: plan.crypto,
        }),
      );
    }

    transactions.push({
      id: cuid(),
      accountId,
      type: "DEPOSIT",
      amount: plan.deposit,
      note: "Deposit awal",
      occurredAt: openedAt,
      createdAt: openedAt,
    });

    accounts.push({
      id: accountId,
      userId,
      name: plan.name,
      broker: plan.broker,
      marketType: plan.marketType,
      currency: plan.currency,
      balance: plan.deposit,
      description: plan.description,
      isActive: true,
      createdAt: openedAt,
      updatedAt: openedAt,
    });
  }

  // Tag menempel pada perilaku yang terlihat di catatan, bukan ditabur acak.
  const tradeTags = [];
  const tagId = (name) => tags.find((t) => t.name === name).id;
  for (const t of trades) {
    const attach = new Set();
    if (t.notes?.includes("Revenge")) attach.add(tagId("Revenge"));
    if (t.notes?.includes("Overtrade")) attach.add(tagId("Overtrade"));
    if (t.notes?.includes("news") || t.notes?.includes("data")) attach.add(tagId("News"));
    if (t.notes?.includes("Cut lebih awal")) attach.add(tagId("Cut Loss Cepat"));
    if (t.notes?.includes("sesuai rencana") || t.notes?.includes("playbook")) attach.add(tagId("Disiplin"));
    if (t.notes?.includes("sebelum konfirmasi")) attach.add(tagId("FOMO"));
    if (t.rMultiple !== null && t.rMultiple >= 2) attach.add(tagId("Setup A+"));
    for (const id of attach) tradeTags.push({ tradeId: t.id, tagId: id });
  }

  return { userId, tags, accounts, transactions, trades, tradeTags };
}

// ─── Tulis ───────────────────────────────────────────────────────────────────
// Kolom waktu bertipe `timestamp without time zone` dan aplikasi membacanya
// sebagai UTC. Driver pg menyerialkan objek Date memakai zona waktu mesin yang
// menjalankan skrip — di mesin WIB itu menggeser seluruh jurnal tujuh jam.
// Karena itu setiap Date dikirim sebagai string UTC eksplisit.
const utcStr = (d) => d.toISOString().replace("T", " ").slice(0, 23);

async function insertRows(client, table, columns, rows, casts = {}, chunk = 50) {
  for (let start = 0; start < rows.length; start += chunk) {
    const slice = rows.slice(start, start + chunk);
    const params = [];
    const tuples = slice.map((row) => {
      const cells = columns.map((col) => {
        const v = row[col];
        params.push(v instanceof Date ? utcStr(v) : v);
        return casts[col] ? `$${params.length}::"${casts[col]}"` : `$${params.length}`;
      });
      return `(${cells.join(",")})`;
    });
    const cols = columns.map((c) => `"${c}"`).join(",");
    await client.query(`insert into "${table}" (${cols}) values ${tuples.join(",")}`, params);
  }
}

const TRADE_COLUMNS = [
  "id", "accountId", "symbol", "direction", "status", "entryMode",
  "openTime", "closeTime", "openPrice", "closePrice", "lotSize", "swap",
  "priceRangeHigh", "priceRangeLow", "layerCount", "quantity",
  "buyFee", "sellFee", "taxAmount", "dividend",
  "leverage", "marginMode", "fundingRate",
  "grossProfit", "commission", "netProfit", "rMultiple", "pips",
  "stopLoss", "takeProfit", "riskPercent", "tradeMarketType",
  "setup", "notes", "emotionBefore", "emotionAfter", "holdingMinutes",
  "createdAt", "updatedAt",
];

const TRADE_CASTS = {
  direction: "Direction",
  status: "TradeStatus",
  entryMode: "EntryMode",
  marginMode: "MarginMode",
  tradeMarketType: "MarketType",
};

// Memeriksa ulang setiap baris dari kolom yang benar-benar tersimpan. Kalau ada
// satu saja yang tidak cocok, seluruh gunanya data ini hilang — pembaca yang
// membuka satu trade akan menemukan angka yang bertentangan.
function validate(data) {
  const problems = [];
  const accById = new Map(data.accounts.map((a) => [a.id, a]));

  for (const t of data.trades) {
    const i = inst(t.symbol);
    const dir = t.direction === "LONG" ? 1 : -1;
    const label = `${t.symbol} ${t.direction} ${t.openTime.toISOString().slice(0, 10)}`;

    if (t.closeTime && t.closeTime <= t.openTime) problems.push(`${label}: closeTime <= openTime`);
    const isCrypto = accById.get(t.accountId).marketType === "CRYPTO_FUTURES";
    if (!isCrypto && t.closeTime && marketClosed(t.closeTime)) {
      problems.push(`${label}: ditutup saat pasar tutup (akhir pekan)`);
    }
    if (!isCrypto && marketClosed(t.openTime)) problems.push(`${label}: dibuka saat pasar tutup`);
    if (t.closeTime && t.closeTime > LAST_MOMENT) problems.push(`${label}: ditutup setelah hari terakhir`);
    if (t.openTime > LAST_MOMENT) problems.push(`${label}: dibuka setelah hari terakhir`);

    // Stop loss harus di sisi rugi, take profit di sisi untung.
    if (dir * (t.openPrice - t.stopLoss) <= 0) problems.push(`${label}: stopLoss di sisi yang salah`);
    if (dir * (t.takeProfit - t.openPrice) <= 0) problems.push(`${label}: takeProfit di sisi yang salah`);

    if (t.status === "OPEN") {
      if (t.netProfit !== null || t.closeTime !== null) problems.push(`${label}: trade OPEN masih punya hasil`);
      continue;
    }

    const rate = quoteRate(i, t.openPrice);
    const gross = dir * (t.closePrice - t.openPrice) * i.contractSize * t.lotSize * rate;
    if (Math.abs(gross - t.grossProfit) > 0.05) {
      problems.push(`${label}: grossProfit ${t.grossProfit} != hitungan harga ${gross.toFixed(2)}`);
    }
    const net = t.grossProfit - t.commission + t.swap;
    if (Math.abs(net - t.netProfit) > 0.02) {
      problems.push(`${label}: netProfit ${t.netProfit} != gross-komisi+swap ${net.toFixed(2)}`);
    }
    const pips = (dir * (t.closePrice - t.openPrice)) / i.pipSize;
    if (Math.abs(pips - t.pips) > 0.15) problems.push(`${label}: pips ${t.pips} != ${pips.toFixed(1)}`);

    const riskAmount = Math.abs(t.openPrice - t.stopLoss) * i.contractSize * t.lotSize * rate;
    const r = t.netProfit / riskAmount;
    if (Math.abs(r - t.rMultiple) > 0.02) {
      problems.push(`${label}: rMultiple ${t.rMultiple} != netProfit/risiko ${r.toFixed(2)}`);
    }
    // Risiko yang ditanggung tidak boleh jauh melampaui riskPercent yang dicatat.
    const acc = accById.get(t.accountId);
    if (riskAmount > acc.balance * (t.riskPercent / 100) * 3.5) {
      problems.push(`${label}: risiko ${riskAmount.toFixed(2)} jauh di atas ${t.riskPercent}% modal`);
    }
  }

  return problems;
}

function summarise(data) {
  const closed = data.trades.filter((t) => t.status === "CLOSED");
  console.log(`user   : ${DEMO_NAME} <${DEMO_EMAIL}>`);
  console.log(`tag    : ${data.tags.length}`);
  console.log(`trade  : ${data.trades.length} (${closed.length} closed, ${data.trades.length - closed.length} open)`);
  console.log(`relasi tag-trade: ${data.tradeTags.length}\n`);

  let grandModal = 0;
  let grandPnl = 0;
  for (const acc of data.accounts) {
    const mine = closed.filter((t) => t.accountId === acc.id);
    const pnl = mine.reduce((s, t) => s + t.netProfit, 0);
    const wins = mine.filter((t) => t.netProfit > 0);
    const losses = mine.filter((t) => t.netProfit < 0);
    const gw = wins.reduce((s, t) => s + t.netProfit, 0);
    const gl = Math.abs(losses.reduce((s, t) => s + t.netProfit, 0));
    grandModal += acc.balance;
    grandPnl += pnl;
    console.log(`${acc.name} (${acc.marketType}, ${acc.currency})`);
    console.log(`  trade closed : ${mine.length}`);
    console.log(`  win rate     : ${((wins.length / mine.length) * 100).toFixed(1)}%`);
    console.log(`  profit factor: ${(gw / gl).toFixed(2)}`);
    console.log(`  net P&L      : ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`);
    console.log(`  modal ${acc.balance} -> saldo ${(acc.balance + pnl).toFixed(2)}`);
  }
  console.log(`\ntotal modal ${grandModal} -> saldo ${(grandModal + grandPnl).toFixed(2)} (P&L ${grandPnl >= 0 ? "+" : ""}${grandPnl.toFixed(2)})`);

  const dates = closed.map((t) => t.closeTime.getTime());
  const fmt = (ms) => new Date(ms + WIB).toISOString().slice(0, 10);
  console.log(`rentang: ${fmt(Math.min(...dates))} s/d ${fmt(Math.max(...dates))} (WIB)`);
}

(async () => {
  const data = build();
  summarise(data);

  const problems = validate(data);
  if (problems.length > 0) {
    console.log(`\n${problems.length} MASALAH KONSISTENSI — tidak ada yang ditulis:`);
    for (const p of problems.slice(0, 15)) console.log(`  ${p}`);
    if (problems.length > 15) console.log(`  … dan ${problems.length - 15} lagi`);
    process.exitCode = 1;
    return;
  }
  console.log("\nvalidasi: semua baris konsisten (P&L, pips, R, sisi SL/TP, urutan waktu)");

  if (!APPLY) {
    console.log("\n[DRY RUN] tidak ada yang ditulis. Tambahkan --apply untuk menjalankan.");
    return;
  }

  if (!DEMO_PASSWORD) {
    console.log('\nDEMO_PASSWORD belum diset. Tambahkan ke .env, mis: DEMO_PASSWORD="..."');
    process.exitCode = 1;
    return;
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query('select id from "User" where email = $1', [DEMO_EMAIL]);
  if (existing.rows.length > 0) {
    if (!RESET) {
      console.log(`\nUser ${DEMO_EMAIL} sudah ada. Jalankan dengan --reset untuk membangun ulang.`);
      await client.end();
      process.exitCode = 1;
      return;
    }
    // Cascade menghapus akun, trade, tag, dan transaksi milik user ini saja.
    await client.query('delete from "User" where email = $1', [DEMO_EMAIL]);
    console.log(`\ndemo lama dihapus (${existing.rows[0].id})`);
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await client.query(
    `insert into "User" (id,name,email,password,role,status,"createdAt","updatedAt")
     values ($1,$2,$3,$4,'USER'::"UserRole",'APPROVED'::"UserStatus",$5,$6)`,
    [data.userId, DEMO_NAME, DEMO_EMAIL, passwordHash, utcStr(data.accounts[0].createdAt), utcStr(now)],
  );

  await insertRows(client, "Tag", ["id", "userId", "name", "color"], data.tags);

  await insertRows(
    client,
    "TradingAccount",
    ["id", "userId", "name", "broker", "marketType", "currency", "balance", "description", "isActive", "createdAt", "updatedAt"],
    data.accounts,
    { marketType: "MarketType" },
  );

  await insertRows(
    client,
    "AccountTransaction",
    ["id", "accountId", "type", "amount", "note", "occurredAt", "createdAt"],
    data.transactions,
    { type: "TransactionType" },
  );

  await insertRows(client, "Trade", TRADE_COLUMNS, data.trades, TRADE_CASTS, 40);
  await insertRows(client, "TradeTag", ["tradeId", "tagId"], data.tradeTags, {}, 200);

  const check = await client.query(
    `select (select count(*) from "TradingAccount" where "userId" = $1)::int as akun,
            (select count(*) from "Trade" t join "TradingAccount" a on a.id = t."accountId" where a."userId" = $1)::int as trade,
            (select count(*) from "Tag" where "userId" = $1)::int as tag`,
    [data.userId],
  );
  const r = check.rows[0];
  console.log(`\ntersimpan di database: ${r.akun} akun, ${r.trade} trade, ${r.tag} tag`);
  console.log(`login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  await client.end();
})();
