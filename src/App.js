import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard, Package, PackagePlus, ShoppingCart, BarChart3, History,
  Menu, X, Plus, Trash2, Pencil, Search, Bell, ChevronDown, Download,
  AlertTriangle, TrendingUp, Boxes, ClipboardList, Save, ScanBarcode, Camera, Printer, RefreshCw, Sheet, Link2, CheckCircle2, CloudOff
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";

/* ---------------------------------------------------------
   COLOR TOKENS — "คลังหวาน" (Sweet Stock) — bright pastel, high-contrast
--------------------------------------------------------- */
const C = {
  navy: "#7C5CBF",
  navy2: "#9B6FD9",
  blue: "#3DAEE9",
  blueDeep: "#0E6E9C",
  blueSoft: "#E4F6FC",
  sky: "#FF6FA5",
  ink: "#332C48",
  slate: "#635A7A",
  slateLight: "#A79BC4",
  line: "#E9DEF6",
  bg: "#FAF6FF",
  card: "#FFFFFF",
  green: "#1FAE81",
  greenBg: "#DEFAF0",
  amber: "#E8940A",
  amberBg: "#FEF1D9",
  red: "#F04C6E",
  redBg: "#FFE6EC",
  navyMuted: "#E3D6F7",
};

const fmt = (n) => new Intl.NumberFormat("th-TH").format(Math.round(n));
const money = (n) => `฿${fmt(n)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = (p) => `${p}${Math.random().toString(36).slice(2, 8)}`;

/* ---------------------------------------------------------
   EAN-13 BARCODE — encoded by hand in pure JS/SVG (standard
   GS1 tables) so there's no dependency on an external barcode
   library that this preview environment can't load.
--------------------------------------------------------- */
const EAN_L = { 0:"0001101",1:"0011001",2:"0010011",3:"0111101",4:"0100011",5:"0110001",6:"0101111",7:"0111011",8:"0110111",9:"0001011" };
const EAN_G = { 0:"0100111",1:"0110011",2:"0011011",3:"0100001",4:"0011101",5:"0111001",6:"0000101",7:"0010001",8:"0001001",9:"0010111" };
const EAN_R = { 0:"1110010",1:"1100110",2:"1101100",3:"1000010",4:"1011100",5:"1001110",6:"1010000",7:"1000100",8:"1001000",9:"1110100" };
const EAN_PARITY = { 0:"LLLLLL",1:"LLGLGG",2:"LLGGLG",3:"LLGGGL",4:"LGLLGG",5:"LGGLLG",6:"LGGGLL",7:"LGLGLG",8:"LGLGGL",9:"LGGLGL" };

function ean13CheckDigit(d12) {
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d12[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10;
}
// Coerces any input to a valid, scannable 13-digit EAN-13 (digits only, correct check digit)
function normalizeEAN13(code) {
  let digits = String(code || "").replace(/\D/g, "");
  if (digits.length === 0) digits = "0";
  digits = digits.length >= 12 ? digits.slice(0, 12) : digits.padStart(12, "0");
  return digits + ean13CheckDigit(digits);
}
function encodeEAN13Bits(code13) {
  const d = code13.split("");
  const pattern = EAN_PARITY[d[0]];
  let bits = "101";
  for (let i = 0; i < 6; i++) bits += pattern[i] === "L" ? EAN_L[d[i + 1]] : EAN_G[d[i + 1]];
  bits += "01010";
  for (let i = 0; i < 6; i++) bits += EAN_R[d[i + 7]];
  bits += "101";
  return bits; // 95-module string of 0/1
}
const genBarcode = () => normalizeEAN13("885" + Math.floor(Math.random() * 1000000000).toString().padStart(9, "0"));

/* ---------------------------------------------------------
   SEED DATA
--------------------------------------------------------- */
const INITIAL_CATEGORIES = ["เครื่องดื่ม", "ขนม", "ของใช้ในบ้าน", "เครื่องสำอาง", "อุปกรณ์สำนักงาน"];
const CHANNELS = ["หน้าร้าน", "Line OA", "Facebook", "Shopee", "Lazada", "TikTok Shop", "โทรศัพท์", "อื่นๆ"];

const seedProducts = [
  { id: "SK001", name: "น้ำดื่มตราคริสตัล 600มล.", category: "เครื่องดื่ม", emoji: "💧", barcode: "8850001000019", retail: 8, cost: 4.5, stock: 18, reorder: 50,
    wholesale: [{ tier: "เกรด A", price: 6 }, { tier: "เกรด B", price: 6.5 }],
    lots: [{ id: "LOT0001", qty: 18, cost: 4.5, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK002", name: "กาแฟกระป๋องเย็น 240มล.", category: "เครื่องดื่ม", emoji: "☕", barcode: "8850001000026", retail: 20, cost: 12.18, stock: 340, reorder: 60,
    wholesale: [{ tier: "เกรด A", price: 15 }, { tier: "เกรด B", price: 16.5 }],
    lots: [
      { id: "LOT0002", qty: 140, cost: 11, date: "2026-08-01", supplier: "บจก. เครื่องดื่มไทย" },
      { id: "LOT0003", qty: 200, cost: 13, date: "2026-08-15", supplier: "บจก. เครื่องดื่มไทย" },
    ] },
  { id: "SK003", name: "ขนมปังกรอบรสสาหร่าย", category: "ขนม", emoji: "🍘", barcode: "8850001000033", retail: 15, cost: 8, stock: 12, reorder: 30,
    wholesale: [{ tier: "เกรด A", price: 11 }, { tier: "ดีลเลอร์-สมชาย", price: 10.5 }],
    lots: [{ id: "LOT0004", qty: 12, cost: 8, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK004", name: "ช็อกโกแลตแท่งนม 45g", category: "ขนม", emoji: "🍫", barcode: "8850001000040", retail: 25, cost: 14, stock: 210, reorder: 40,
    wholesale: [{ tier: "เกรด A", price: 19 }, { tier: "เกรด B", price: 20.5 }],
    lots: [{ id: "LOT0005", qty: 210, cost: 14, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK005", name: "น้ำยาล้างจาน สูตรมะนาว 700มล.", category: "ของใช้ในบ้าน", emoji: "🧴", barcode: "8850001000057", retail: 45, cost: 28, stock: 5, reorder: 15,
    wholesale: [{ tier: "เกรด A", price: 36 }],
    lots: [{ id: "LOT0006", qty: 5, cost: 28, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK006", name: "กระดาษทิชชู่ 6 ม้วน", category: "ของใช้ในบ้าน", emoji: "🧻", barcode: "8850001000064", retail: 65, cost: 42, stock: 88, reorder: 20,
    wholesale: [{ tier: "เกรด A", price: 52 }, { tier: "เกรด B", price: 56 }],
    lots: [{ id: "LOT0007", qty: 88, cost: 42, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK007", name: "ครีมกันแดด SPF50 30มล.", category: "เครื่องสำอาง", emoji: "🧴", barcode: "8850001000071", retail: 189, cost: 110, stock: 3, reorder: 10,
    wholesale: [{ tier: "เกรด A", price: 145 }],
    lots: [{ id: "LOT0008", qty: 3, cost: 110, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
  { id: "SK008", name: "ปากกาลูกลื่นสีน้ำเงิน (แพ็ค 12)", category: "อุปกรณ์สำนักงาน", emoji: "🖊️", barcode: "8850001000088", retail: 60, cost: 35, stock: 150, reorder: 25,
    wholesale: [{ tier: "เกรด A", price: 46 }, { tier: "ดีลเลอร์-วารุณี", price: 44 }],
    lots: [{ id: "LOT0009", qty: 150, cost: 35, date: "2026-08-01", supplier: "สต็อคเริ่มต้น" }] },
];

/* Consume stock FIFO across a product's cost lots. Returns the
   weighted-average unit cost actually consumed and the remaining lots,
   so profit can be based on real lot cost instead of a single guess. */
function consumeLotsFIFO(lots, qtyNeeded, fallbackCost) {
  let remaining = qtyNeeded;
  let totalCost = 0;
  const newLots = [];
  (lots || []).forEach((lot) => {
    if (remaining <= 0) { newLots.push(lot); return; }
    const take = Math.min(lot.qty, remaining);
    totalCost += take * lot.cost;
    remaining -= take;
    const left = lot.qty - take;
    if (left > 0) newLots.push({ ...lot, qty: left });
  });
  if (remaining > 0) { totalCost += remaining * fallbackCost; remaining = 0; }
  const avgCost = qtyNeeded > 0 ? totalCost / qtyNeeded : fallbackCost;
  return { avgCost, newLots };
}

function averageLotCost(lots, fallback) {
  const qty = (lots || []).reduce((s, l) => s + l.qty, 0);
  if (qty <= 0) return fallback;
  return (lots || []).reduce((s, l) => s + l.qty * l.cost, 0) / qty;
}

// Sales history for current month, up to today (26)
function buildSeedTransactions(products) {
  const tx = [];
  const users = ["น้องแนน", "พี่โต้ง", "คุณกิ๊ฟ"];
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth();
  const dayCount = today.getDate();
  let counter = 1;
  for (let d = 1; d <= dayCount; d++) {
    const nOrders = 1 + Math.floor(Math.random() * 4);
    for (let o = 0; o < nOrders; o++) {
      const isWholesale = Math.random() < 0.35;
      const nItems = 1 + Math.floor(Math.random() * 3);
      const items = [];
      for (let i = 0; i < nItems; i++) {
        const p = products[Math.floor(Math.random() * products.length)];
        const qty = isWholesale ? 5 + Math.floor(Math.random() * 40) : 1 + Math.floor(Math.random() * 5);
        const tierObj = p.wholesale[Math.floor(Math.random() * p.wholesale.length)];
        const unitPrice = isWholesale ? tierObj.price : p.retail;
        items.push({ productId: p.id, name: p.name, qty, unitPrice, tier: isWholesale ? tierObj.tier : null });
      }
      const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const dateStr = new Date(y, m, d, 9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60)).toISOString();
      tx.push({
        id: `BILL${String(counter).padStart(4, "0")}`,
        date: dateStr,
        type: isWholesale ? "wholesale" : "retail",
        items,
        total,
        user: users[Math.floor(Math.random() * users.length)],
        status: "สำเร็จ",
      });
      counter++;
    }
  }
  // a couple of stock-in logs
  tx.push({
    id: "STK0001",
    date: new Date(y, m, Math.max(1, dayCount - 4)).toISOString(),
    type: "stockin",
    items: [{ productId: "SK002", name: "กาแฟกระป๋องเย็น 240มล.", qty: 200, unitPrice: 12 }],
    total: 200 * 12,
    user: "พี่โต้ง",
    status: "สำเร็จ",
    supplier: "บจก. เครื่องดื่มไทย",
  });
  tx.push({
    id: "STK0002",
    date: new Date(y, m, Math.max(1, dayCount - 2)).toISOString(),
    type: "stockin",
    items: [{ productId: "SK008", name: "ปากกาลูกลื่นสีน้ำเงิน (แพ็ค 12)", qty: 100, unitPrice: 35 }],
    total: 100 * 35,
    user: "คุณกิ๊ฟ",
    status: "สำเร็จ",
    supplier: "หจก. ออฟฟิศซัพพลาย",
  });
  return tx.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function Card({ children, style, className = "" }) {
  return (
    <div
      className={className}
      style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, boxShadow: "0 4px 14px rgba(155,138,209,0.08)", ...style }}
    >
      {children}
    </div>
  );
}

function Pill({ tone = "slate", children }) {
  const map = {
    green: { bg: C.greenBg, fg: C.green },
    amber: { bg: C.amberBg, fg: C.amber },
    red: { bg: C.redBg, fg: C.red },
    blue: { bg: C.blueSoft, fg: C.blueDeep },
    slate: { bg: "#F1F4F9", fg: C.slate },
  }[tone];
  return (
    <span style={{ background: map.bg, color: map.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", style, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
    fontWeight: 700, borderRadius: 14, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "all .15s", opacity: disabled ? 0.5 : 1,
    fontSize: size === "sm" ? 13 : 14, padding: size === "sm" ? "6px 12px" : "9px 16px",
  };
  const variants = {
    primary: { background: C.blue, color: "#fff" },
    ghost: { background: "transparent", color: C.slate, border: `1px solid ${C.line}` },
    danger: { background: C.redBg, color: C.red },
    subtle: { background: C.blueSoft, color: C.blueDeep },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: C.slate, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle = {
  border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "9px 12px", fontSize: 14,
  color: C.ink, outline: "none", background: "#fff", width: "100%",
};

function Input(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function Select(props) {
  return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}

function Modal({ open, onClose, title, children, width = 560 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(11,30,61,0.45)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", width: "100%", maxWidth: width, maxHeight: "92vh", overflowY: "auto",
          borderRadius: "20px 20px 0 0", padding: 20, animation: "slideUp .2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.ink }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: C.bg, borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <X size={18} color={C.slate} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   BARCODE — generate (hand-rolled EAN-13 SVG, no dependency)
   + scan (native BarcodeDetector, with a manual/keyboard-wedge
   fallback that also suits USB/Bluetooth scanner guns)
--------------------------------------------------------- */
function BarcodeSVG({ value, height = 60, width = 2, fontSize = 14 }) {
  if (!value) return <div style={{ fontSize: 12.5, color: C.slateLight }}>ไม่มีรหัสบาร์โค้ด</div>;
  const code13 = normalizeEAN13(value);
  const bits = encodeEAN13Bits(code13);
  const quiet = 10;
  const barsWidth = bits.length * width;
  const totalWidth = barsWidth + quiet * 2;
  const totalHeight = height + fontSize + 10;
  let bars = [];
  let x = quiet;
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === "1") bars.push(<rect key={i} x={x} y={0} width={width} height={height} fill={C.ink} />);
    x += width;
  }
  return (
    <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} width={totalWidth} height={totalHeight} style={{ background: "#fff" }}>
      <g transform="translate(0,0)">{bars}</g>
      <text x={totalWidth / 2} y={height + fontSize + 2} textAnchor="middle" fontSize={fontSize} fontFamily="monospace" letterSpacing="2" fill={C.ink}>
        {code13}
      </text>
    </svg>
  );
}

function BarcodeLabelModal({ product, onClose }) {
  const printAreaRef = useRef(null);
  if (!product) return null;
  return (
    <Modal open={!!product} onClose={onClose} title="ป้ายบาร์โค้ดสินค้า" width={380}>
      <div ref={printAreaRef} className="barcode-print-area" style={{ border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: 16, textAlign: "center", background: "#fff" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: C.blueDeep, fontWeight: 800, marginBottom: 8 }}>{money(product.retail)}</div>
        <div style={{ display: "flex", justifyContent: "center" }}><BarcodeSVG value={product.barcode} /></div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .barcode-print-area, .barcode-print-area * { visibility: visible; }
          .barcode-print-area { position: fixed; top: 40px; left: 50%; transform: translateX(-50%); border: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>ปิด</Btn>
        <Btn onClick={() => window.print()} style={{ flex: 1 }}><Printer size={15} /> พิมพ์ป้าย</Btn>
      </div>
    </Modal>
  );
}

/* Camera scan (Chrome/Android via the native BarcodeDetector API) with a
   manual-entry field underneath — that field also happens to be exactly
   what a USB/Bluetooth barcode-gun needs, since those just "type" the code. */
function ScannerModal({ open, onClose, onDetect, title = "สแกนบาร์โค้ด" }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [supported, setSupported] = useState(typeof window !== "undefined" && "BarcodeDetector" in window);
  const [camError, setCamError] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    setCamError("");
    if (!supported) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        const detector = new window.BarcodeDetector({ formats: ["code_128", "ean_13", "ean_8", "upc_a", "upc_e", "code_39", "qr_code"] });
        timerRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length > 0) {
              onDetect(codes[0].rawValue);
            }
          } catch (e) { /* transient decode miss — try again next tick */ }
        }, 350);
      } catch (e) {
        setCamError("เปิดกล้องไม่ได้ (อาจไม่ได้รับอนุญาต) — ใช้ช่องกรอกด้านล่างแทนได้");
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [open, supported]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={title} width={420}>
      {supported ? (
        <div style={{ borderRadius: 14, overflow: "hidden", background: C.ink, position: "relative", aspectRatio: "4/3" }}>
          <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 18, border: `2px solid ${C.sky}`, borderRadius: 12, pointerEvents: "none" }} />
        </div>
      ) : (
        <div style={{ background: C.amberBg, color: C.amber, borderRadius: 12, padding: "12px 14px", fontSize: 13, display: "flex", gap: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          เบราว์เซอร์นี้ไม่รองรับการสแกนด้วยกล้อง (รองรับดีบน Chrome/Android) — พิมพ์หรือยิงบาร์โค้ดด้วยเครื่องสแกนที่ช่องด้านล่างแทนได้เลย
        </div>
      )}
      {camError && <div style={{ marginTop: 10, fontSize: 12.5, color: C.red }}>{camError}</div>}

      <div style={{ marginTop: 14 }}>
        <Field label="หรือพิมพ์ / ยิงบาร์โค้ดด้วยเครื่องสแกน (USB · Bluetooth)">
          <Input autoFocus value={manual} onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { onDetect(manual.trim()); setManual(""); } }}
            placeholder="เคอร์เซอร์อยู่ที่นี่แล้ว ยิงบาร์โค้ดได้เลย แล้วกด Enter" />
        </Field>
      </div>
      <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 14 }}>ปิด</Btn>
    </Modal>
  );
}

/* ---------------------------------------------------------
   GOOGLE SHEETS SYNC — talks to a Google Apps Script Web App
   (see the accompanying Code.gs) that reads/writes a Sheet.
--------------------------------------------------------- */
function SheetsSyncModal({ open, onClose, sheetUrl, setSheetUrl, onLoad, onPushNow, syncState, lastSynced, lastError }) {
  const [draftUrl, setDraftUrl] = useState(sheetUrl);
  React.useEffect(() => { setDraftUrl(sheetUrl); }, [open]);

  const connect = () => {
    const url = draftUrl.trim();
    if (!url) return;
    setSheetUrl(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="เชื่อมต่อ Google Sheets" width={480}>
      <div style={{ fontSize: 13, color: C.slate, marginBottom: 14, lineHeight: 1.6 }}>
        วางลิงก์ "Web app URL" ที่ได้จากการ Deploy Google Apps Script (ดูขั้นตอนในไฟล์ <b>Code.gs</b> ที่แนบให้) แล้วข้อมูลสินค้า/ธุรกรรม/หมวดหมู่ของแอปนี้จะซิงค์เข้า-ออกกับ Google Sheet ของคุณอัตโนมัติ — ไปทำต่อใน Apps Script ได้เต็มที่
      </div>
      <Field label="Web app URL">
        <Input value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)} placeholder="https://script.google.com/macros/s/XXXXXXXX/exec" />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <Btn onClick={connect} style={{ flex: 1 }}><Link2 size={15} /> {sheetUrl ? "อัปเดตลิงก์" : "เชื่อมต่อ"}</Btn>
        {draftUrl.trim() && (
          <Btn variant="ghost" onClick={() => window.open(draftUrl.trim(), "_blank")}>เปิดลิงก์เพื่อทดสอบ</Btn>
        )}
      </div>

      {sheetUrl && (
        <div style={{ marginTop: 18, borderTop: `1px dashed ${C.line}`, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
            {syncState === "error" ? <CloudOff size={16} color={C.red} /> : <CheckCircle2 size={16} color={C.green} />}
            สถานะ: {syncState === "loading" ? "กำลังโหลดจาก Sheets..." : syncState === "saving" ? "กำลังบันทึกไปยัง Sheets..." : syncState === "error" ? "เกิดข้อผิดพลาด" : "พร้อมใช้งาน"}
            {lastSynced && <span style={{ fontWeight: 500, color: C.slate }}>· ซิงค์ล่าสุด {lastSynced.toLocaleTimeString("th-TH")}</span>}
          </div>

          {syncState === "error" && (
            <div style={{ background: C.redBg, color: C.red, borderRadius: 12, padding: "10px 12px", fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
              {lastError || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="subtle" onClick={onLoad} style={{ flex: 1 }}><RefreshCw size={14} /> โหลดจาก Sheets</Btn>
            <Btn variant="ghost" onClick={onPushNow} style={{ flex: 1 }}>บันทึกไปยัง Sheets ตอนนี้</Btn>
          </div>
          <div style={{ fontSize: 11.5, color: C.slateLight, marginTop: 10 }}>ระบบจะบันทึกไปยัง Sheets ให้อัตโนมัติทุกครั้งที่มีการแก้ไขข้อมูลอยู่แล้ว (หน่วงเวลาไว้ประมาณ 1 วินาที)</div>

          {syncState === "error" && (
            <div style={{ marginTop: 14, background: C.bg, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>เช็คตามนี้ทีละข้อ:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: C.slate, lineHeight: 1.8 }}>
                <li>กด "เปิดลิงก์เพื่อทดสอบ" ด้านบน — ถ้าเจอหน้า JSON แปลว่าลิงก์ใช้ได้ ถ้าเจอหน้า Google ให้ล็อกอิน/ขออนุญาต แปลว่าตั้งค่า Deploy ผิด</li>
                <li>ใน Apps Script: Deploy ต้องเลือก <b>Execute as: Me</b> และ <b>Who has access: Anyone</b> (ไม่ใช่ "Anyone with Google account")</li>
                <li>ถ้าเพิ่งแก้โค้ดใน Code.gs ต้องกด Deploy &gt; Manage deployments &gt; แก้ไข (ไอคอนดินสอ) &gt; เลือก New version &gt; Deploy ใหม่ ลิงก์เดิมถึงจะอัปเดตโค้ด</li>
                <li>รันฟังก์ชัน <code>setup</code> ใน Apps Script อย่างน้อย 1 ครั้งแล้วหรือยัง (สร้างแท็บ Products/Transactions/Categories)</li>
                <li>เข้า Apps Script &gt; เมนู Executions (ซ้ายมือ) ดู error ล่าสุดว่าโค้ดพังตรงไหน</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 16 }}>ปิด</Btn>
    </Modal>
  );
}

function statusOf(p) {
  if (p.stock <= 0) return { label: "สินค้าหมด", tone: "red" };
  if (p.stock <= p.reorder) return { label: "ใกล้หมด", tone: "amber" };
  return { label: "พร้อมขาย", tone: "green" };
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
export default function App() {
  const [products, setProducts] = useState(seedProducts);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState(() => buildSeedTransactions(seedProducts));
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [lineLog, setLineLog] = useState([]);
  const [toast, setToast] = useState(null);

  // --- Google Sheets sync (via a Google Apps Script Web App) ---
  const [sheetUrl, setSheetUrl] = useState(() => {
    try { return (typeof window !== "undefined" && window.localStorage.getItem("stockapp_sheet_url")) || ""; }
    catch (e) { return ""; }
  });
  const [sheetsOpen, setSheetsOpen] = useState(false);
  const [syncState, setSyncState] = useState("idle"); // idle | loading | saving | ok | error
  const [lastSynced, setLastSynced] = useState(null);
  const skipNextPush = useRef(false);
  const pushTimer = useRef(null);
  const hasAutoLoaded = useRef(false);

  useEffect(() => {
    try {
      if (sheetUrl) window.localStorage.setItem("stockapp_sheet_url", sheetUrl);
      else window.localStorage.removeItem("stockapp_sheet_url");
    } catch (e) { /* localStorage unavailable — sync still works, just won't be remembered */ }
  }, [sheetUrl]);

  // On first load, if a URL was saved from a previous visit, pull the latest data automatically
  useEffect(() => {
    if (sheetUrl && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      loadFromSheet();
    }
    
  }, [sheetUrl]);

  const showToast = (msg, tone = "blue") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const normalizeLoadedProduct = (p) => ({
    ...p,
    retail: Number(p.retail) || 0,
    cost: Number(p.cost) || 0,
    stock: Number(p.stock) || 0,
    reorder: Number(p.reorder) || 0,
    wholesale: Array.isArray(p.wholesale) ? p.wholesale : [],
    lots: Array.isArray(p.lots) ? p.lots : [],
  });
  const normalizeLoadedTx = (t) => ({
    ...t,
    total: Number(t.total) || 0,
    items: Array.isArray(t.items) ? t.items.map((it) => ({ ...it, qty: Number(it.qty) || 0, unitPrice: Number(it.unitPrice) || 0 })) : [],
  });

  const [lastError, setLastError] = useState("");

  const loadFromSheet = async () => {
    if (!sheetUrl) return;
    setSyncState("loading");
    setLastError("");
    let res;
    try {
      res = await fetch(sheetUrl);
    } catch (networkErr) {
      setSyncState("error");
      setLastError("เชื่อมต่อลิงก์จากในตัวอย่างนี้ไม่ได้ ทั้งที่เปิดลิงก์ตรงๆ แล้วเจอ JSON ปกติ — ปกติแปลว่าพื้นที่พรีวิวนี้ปิดกั้นการเรียก fetch ไปยังโดเมนภายนอก (เป็นข้อจำกัดของหน้าต่างพรีวิว ไม่ใช่โค้ดหรือ Apps Script ผิด) ลองนำโค้ดนี้ไปรันนอกพรีวิว เช่น โฮสต์เป็นเว็บของคุณเอง หรือเปิดผ่าน CodeSandbox/StackBlitz ก็จะซิงค์ได้ปกติ");
      showToast("เชื่อมต่อ Google Sheets ไม่ได้ ตรวจสอบลิงก์อีกครั้ง", "red");
      return;
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      setSyncState("error");
      const looksHtml = /<html|<!doctype/i.test(text);
      setLastError(looksHtml
        ? "ลิงก์นี้คืนหน้าเว็บกลับมาแทนที่จะเป็น JSON — เกิดจากตอน Deploy เลือก \"Who has access\" ไม่ใช่ Anyone หรือ Google ยังไม่ได้ authorize สคริปต์ครบ ให้กลับไปที่ Apps Script > Deploy > Manage deployments ตรวจสอบอีกครั้ง"
        : `ได้ข้อมูลกลับมาแต่ไม่ใช่ JSON ที่ถูกต้อง (ตัวอย่าง: ${text.slice(0, 100)}) — ลองดู Executions log ใน Apps Script ว่ามี error อะไรไหม`);
      showToast("รูปแบบข้อมูลที่ได้จาก Sheets ไม่ถูกต้อง ดูคำแนะนำในกล่องเชื่อมต่อ", "red");
      return;
    }
    skipNextPush.current = true;
    setProducts((data.products || []).map(normalizeLoadedProduct));
    setCategories((data.categories || []).filter(Boolean));
    setTransactions((data.transactions || []).map(normalizeLoadedTx));
    setSyncState("ok");
    setLastSynced(new Date());
    showToast("โหลดข้อมูลจาก Google Sheets สำเร็จ 📥");
  };

  const pushToSheet = async () => {
    if (!sheetUrl) return;
    setSyncState("saving");
    setLastError("");
    try {
      // plain-text body on purpose: keeps this a CORS "simple request" so
      // the Apps Script web app doesn't need to handle an OPTIONS preflight
      const res = await fetch(sheetUrl, { method: "POST", body: JSON.stringify({ products, transactions, categories }) });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.ok === false) throw new Error(data.error || "unknown");
      } catch (parseErr) {
        setSyncState("error");
        setLastError(/<html|<!doctype/i.test(text)
          ? "การบันทึกถูกปฏิเสธ (ได้หน้าเว็บกลับมาแทน JSON) — ตรวจสอบการตั้งค่า Deploy อีกครั้ง"
          : `บันทึกไม่สำเร็จ: ${text.slice(0, 150)}`);
        return;
      }
      setSyncState("ok");
      setLastSynced(new Date());
    } catch (e) {
      setSyncState("error");
      setLastError("ส่งข้อมูลจากในตัวอย่างนี้ไม่สำเร็จ — เหตุผลเดียวกับตอนโหลดข้อมูล คือพื้นที่พรีวิวนี้มักปิดกั้นการเรียก fetch ออกไปยังโดเมนภายนอก ลองนำโค้ดไปรันนอกพรีวิวแทน (เว็บของคุณเอง / CodeSandbox / StackBlitz) จะบันทึกได้ปกติ");
    }
  };

  // Debounced auto-push: whenever data changes (and it wasn't a load we just applied), sync out
  useEffect(() => {
    if (!sheetUrl) return;
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => { pushToSheet(); }, 1200);
    return () => clearTimeout(pushTimer.current);
    
  }, [products, transactions, categories, sheetUrl]);

  const nav = [
    { key: "dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
    { key: "inventory", label: "สต็อคสินค้า", icon: Package },
    { key: "stockin", label: "รับเข้าสินค้า", icon: PackagePlus },
    { key: "sales", label: "บันทึกการขาย", icon: ShoppingCart },
    { key: "report", label: "สรุปรายเดือน", icon: BarChart3 },
    { key: "history", label: "ประวัติทำรายการ", icon: History },
  ];

  const goto = (key) => { setPage(key); setSidebarOpen(false); };

  return (
    <div style={{ fontFamily: "'Quicksand','Baloo 2','Segoe UI',system-ui,sans-serif", background: C.bg, minHeight: "100vh", color: C.ink, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Quicksand:wght@500;600;700&display=swap');
        @keyframes slideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        * { box-sizing: border-box; }
        h1,h2,h3, .font-display { font-family:'Baloo 2','Quicksand',sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align:left; font-size:12px; color:${C.slate}; text-transform:uppercase; letter-spacing:.03em; font-weight:700; padding:10px 12px; border-bottom:1px solid ${C.line}; white-space:nowrap; }
        td { padding:12px; font-size:14px; border-bottom:1px solid ${C.line}; vertical-align:middle; }
        tr:last-child td { border-bottom:none; }
        ::-webkit-scrollbar{height:8px;width:8px} ::-webkit-scrollbar-thumb{background:${C.line};border-radius:8px}
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(51,44,72,0.55)", backdropFilter: "blur(2px)", zIndex: 39 }} />
      )}

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 76 : 236, background: `linear-gradient(180deg, ${C.navy}, ${C.navy2})`,
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40,
        transform: sidebarOpen ? "translateX(0)" : undefined,
        transition: "width .18s ease, transform .2s ease",
        display: "flex", flexDirection: "column", padding: "18px 12px",
        boxShadow: sidebarOpen ? "4px 0 24px rgba(51,44,72,0.25)" : "none",
      }}
        className="app-sidebar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 20px", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Boxes size={18} color="#fff" />
          </div>
          {!collapsed && <div className="font-display" style={{ color: "#fff", fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>คลังหวาน 🍬<br /><span style={{ fontFamily: "'Quicksand',sans-serif", fontWeight: 600, fontSize: 11, color: "#F3EBFA" }}>Stock Manager</span></div>}
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {nav.map(({ key, label, icon: Icon }) => {
            const active = page === key;
            return (
              <button key={key} onClick={() => goto(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10,
                  border: "none", cursor: "pointer", textAlign: "left",
                  background: active ? "rgba(255,255,255,0.22)" : "transparent",
                  color: active ? "#fff" : C.navyMuted, fontWeight: active ? 700 : 600, fontSize: 14,
                  justifyContent: collapsed ? "center" : "flex-start",
                }}>
                <Icon size={18} style={{ flexShrink: 0 }} color={active ? "#fff" : C.navyMuted} />
                {!collapsed && label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-collapse-toggle" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={() => setCollapsed((c) => !c)}
            style={{ border: `1px solid rgba(255,255,255,0.25)`, background: "rgba(255,255,255,0.08)", color: "#fff", borderRadius: 10, padding: "8px", cursor: "pointer", display: "flex", justifyContent: "center" }}>
            <Menu size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 0, minWidth: 0 }} className="app-main">
        {/* TOPBAR */}
        <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(245,247,251,0.9)", backdropFilter: "blur(6px)", borderBottom: `1px solid ${C.line}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn"
            style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 10, padding: 8, cursor: "pointer" }}>
            <Menu size={18} color={C.ink} />
          </button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{nav.find((n) => n.key === page)?.label}</div>
            <div style={{ fontSize: 12, color: C.slate }}>{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSheetsOpen(true)} title="เชื่อมต่อ Google Sheets"
              style={{
                display: "flex", alignItems: "center", gap: 6, border: `1px solid ${C.line}`, background: "#fff",
                borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700,
                color: sheetUrl ? (syncState === "error" ? C.red : C.green) : C.slate,
              }}>
              <Sheet size={15} />
              {!sheetUrl ? "เชื่อมต่อ Sheets" : syncState === "loading" || syncState === "saving" ? "กำลังซิงค์..." : syncState === "error" ? "ซิงค์ล้มเหลว" : "ซิงค์แล้ว"}
            </button>
            <div style={{ position: "relative" }}>
              <Bell size={19} color={C.slate} />
              {lineLog.length > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 8, height: 8, borderRadius: 99, background: C.red }} />}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: C.blueSoft, color: C.blueDeep, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>พต</div>
          </div>
        </header>

        <main style={{ padding: 20, maxWidth: 1280, margin: "0 auto" }}>
          {page === "dashboard" && <Dashboard products={products} transactions={transactions} />}
          {page === "inventory" && <Inventory products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} showToast={showToast} />}
          {page === "stockin" && <StockIn products={products} setProducts={setProducts} setTransactions={setTransactions} showToast={showToast} />}
          {page === "sales" && <SalesOrder products={products} setProducts={setProducts} setTransactions={setTransactions} showToast={showToast} lineLog={lineLog} setLineLog={setLineLog} />}
          {page === "report" && <MonthlyReport products={products} transactions={transactions} />}
          {page === "history" && <TransactionHistory transactions={transactions} />}
        </main>
      </div>

      <SheetsSyncModal
        open={sheetsOpen}
        onClose={() => setSheetsOpen(false)}
        sheetUrl={sheetUrl}
        setSheetUrl={setSheetUrl}
        onLoad={loadFromSheet}
        onPushNow={pushToSheet}
        syncState={syncState}
        lastSynced={lastSynced}
        lastError={lastError}
      />

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 60,
          background: toast.tone === "red" ? C.red : C.ink, color: "#fff", padding: "12px 18px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: "90vw", animation: "fadeIn .2s",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Bell size={15} /> {toast.msg}
        </div>
      )}

      <style>{`
        .mobile-menu-btn { display:flex; }
        .app-sidebar { transform: translateX(-100%); }
        .sidebar-collapse-toggle { display: none; }
        @media (max-width: 899px) {
          .app-sidebar { width: min(272px, 78vw) !important; }
        }
        @media (min-width: 900px) {
          .app-sidebar { transform: translateX(0) !important; position: sticky !important; }
          .mobile-menu-btn { display:none; }
          .app-main { margin-left: 0; }
          .sidebar-collapse-toggle { display: flex; }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */
function Dashboard({ products, transactions }) {
  const now = new Date();
  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type !== "stockin";
  });
  const totalSales = thisMonthTx.reduce((s, t) => s + t.total, 0);
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter((p) => p.stock <= p.reorder && p.stock > 0).length;
  const outStock = products.filter((p) => p.stock <= 0).length;
  const todayOrders = transactions.filter((t) => t.type !== "stockin" && new Date(t.date).toDateString() === now.toDateString()).length;

  const dailyMap = {};
  thisMonthTx.forEach((t) => {
    const d = new Date(t.date).getDate();
    dailyMap[d] = (dailyMap[d] || 0) + t.total;
  });
  const chartData = Array.from({ length: now.getDate() }, (_, i) => ({ day: `${i + 1}`, ยอดขาย: Math.round(dailyMap[i + 1] || 0) }));

  const soldQtyByProduct = {};
  thisMonthTx.forEach((t) => t.items.forEach((it) => { soldQtyByProduct[it.productId] = (soldQtyByProduct[it.productId] || 0) + it.qty; }));
  const topProducts = Object.entries(soldQtyByProduct)
    .map(([pid, qty]) => ({ name: products.find((p) => p.id === pid)?.name || pid, qty }))
    .sort((a, b) => b.qty - a.qty).slice(0, 5);

  const kpis = [
    { label: "ยอดขายรวมเดือนนี้", value: money(totalSales), icon: TrendingUp, tone: "blue" },
    { label: "จำนวนสินค้าในสต็อค", value: `${fmt(totalStock)} ชิ้น`, icon: Boxes, tone: "green" },
    { label: "สินค้าใกล้หมด/หมดสต็อค", value: `${lowStock + outStock} รายการ`, icon: AlertTriangle, tone: "amber" },
    { label: "ออเดอร์ขายวันนี้", value: `${todayOrders} บิล`, icon: ClipboardList, tone: "blue" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>{k.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: k.tone === "amber" ? C.amberBg : k.tone === "green" ? C.greenBg : C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={16} color={k.tone === "amber" ? C.amber : k.tone === "green" ? C.green : C.blueDeep} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{k.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }} className="dash-grid">
        <Card style={{ padding: "18px 12px 8px" }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, padding: "0 6px 8px" }}>ยอดขายรายวัน — เดือนนี้</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ left: 4, right: 12, top: 6 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={54} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
              <Line type="monotone" dataKey="ยอดขาย" stroke={C.blue} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>สินค้าขายดี 5 อันดับ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {topProducts.length === 0 && <div style={{ fontSize: 13, color: C.slate }}>ยังไม่มีข้อมูลการขายเดือนนี้</div>}
            {topProducts.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: C.blueSoft, color: C.blueDeep, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 4, marginTop: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (p.qty / (topProducts[0]?.qty || 1)) * 100)}%`, background: C.blue, borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.slate, flexShrink: 0 }}>{fmt(p.qty)} ชิ้น</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <style>{`@media (max-width: 860px) { .dash-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ---------------------------------------------------------
   INVENTORY
--------------------------------------------------------- */
function Inventory({ products, setProducts, categories, setCategories, showToast }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [editing, setEditing] = useState(null); // product or "new"
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [manageCats, setManageCats] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [labelProduct, setLabelProduct] = useState(null);

  const filtered = products.filter((p) => {
    const st = statusOf(p).label;
    return (
      (cat === "ทั้งหมด" || p.category === cat) &&
      (statusFilter === "ทั้งหมด" || st === statusFilter) &&
      (q.trim() === "" || p.name.toLowerCase().includes(q.toLowerCase()) || p.id.toLowerCase().includes(q.toLowerCase()) || (p.barcode || "").includes(q.trim()))
    );
  });

  const saveProduct = (prod) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      return exists ? prev.map((p) => (p.id === prod.id ? prod : p)) : [prod, ...prev];
    });
    showToast(`บันทึกสินค้า "${prod.name}" เรียบร้อยแล้ว 🧁`);
    setEditing(null);
  };

  const doDelete = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
    showToast("ลบสินค้าออกจากระบบแล้ว", "red");
  };

  const handleScan = (code) => {
    setScanning(false);
    const match = products.find((p) => p.barcode && normalizeEAN13(p.barcode) === normalizeEAN13(code));
    if (match) { setQ(match.name); showToast(`พบสินค้า "${match.name}" 🎯`); }
    else { setQ(code); showToast("ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้ ลองแก้ไข/เพิ่มบาร์โค้ดในสินค้าได้", "red"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={16} color={C.slate} style={{ position: "absolute", left: 12, top: 11 }} />
          <Input placeholder="ค้นหารหัส/ชื่อ/บาร์โค้ดสินค้า..." value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 34, paddingRight: 40 }} />
          <button onClick={() => setScanning(true)} title="สแกนบาร์โค้ด"
            style={{ position: "absolute", right: 6, top: 6, border: "none", background: C.blueSoft, borderRadius: 8, padding: 6, cursor: "pointer" }}>
            <ScanBarcode size={16} color={C.blueDeep} />
          </button>
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 170 }}>
          <option>ทั้งหมด</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 150 }}>
          <option>ทั้งหมด</option>
          <option>พร้อมขาย</option>
          <option>ใกล้หมด</option>
          <option>สินค้าหมด</option>
        </Select>
        <Btn variant="subtle" onClick={() => setManageCats(true)}>🏷️ จัดการหมวดหมู่</Btn>
        <Btn onClick={() => setEditing("new")}><Plus size={16} /> เพิ่มสินค้า</Btn>
      </div>

      <Card style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>รหัส</th><th>รูป</th><th>ชื่อสินค้า</th><th>หมวดหมู่</th><th>ราคาปลีก</th><th>ราคาส่ง</th><th>คงเหลือ</th><th>สถานะ</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const st = statusOf(p);
              return (
                <tr key={p.id}>
                  <td style={{ color: C.slate, fontSize: 12.5 }}>{p.id}</td>
                  <td>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: 34, height: 34, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.line}` }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: C.blueSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{p.emoji}</div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td><Pill tone="slate">{p.category}</Pill></td>
                  <td>{money(p.retail)}</td>
                  <td style={{ fontSize: 12.5, color: C.slate }}>
                    {p.wholesale.length === 0 && "-"}
                    {p.wholesale.map((w, i) => (
                      <div key={i} style={{ padding: "2px 0", lineHeight: 1.6 }}>
                        {w.tier || "(ไม่มีชื่อระดับ)"} · <span style={{ fontWeight: 700, color: C.ink }}>{money(w.price)}</span>
                      </div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(p.stock)}</td>
                  <td><Pill tone={st.tone}>{st.label}</Pill></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setLabelProduct(p)} title="ดู/พิมพ์บาร์โค้ด" style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 10, padding: 6, cursor: "pointer" }}><ScanBarcode size={14} color={C.blueDeep} /></button>
                      <button onClick={() => setEditing(p)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 10, padding: 6, cursor: "pointer" }}><Pencil size={14} color={C.slate} /></button>
                      <button onClick={() => setConfirmDelete(p)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 10, padding: 6, cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", color: C.slate, padding: 30 }}>ไม่พบสินค้าที่ค้นหา</td></tr>}
          </tbody>
        </table>
      </Card>

      <ScannerModal open={scanning} onClose={() => setScanning(false)} onDetect={handleScan} title="สแกนเพื่อค้นหาสินค้า" />
      <BarcodeLabelModal product={labelProduct} onClose={() => setLabelProduct(null)} />

      <ProductModal editing={editing} onClose={() => setEditing(null)} onSave={saveProduct} categories={categories} setCategories={setCategories} products={products} showToast={showToast} />

      <CategoryManagerModal
        open={manageCats}
        onClose={() => setManageCats(false)}
        categories={categories}
        setCategories={setCategories}
        products={products}
        setProducts={setProducts}
        showToast={showToast}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="ยืนยันการลบสินค้า" width={380}>
        <p style={{ fontSize: 14, color: C.slate }}>ต้องการลบ "{confirmDelete?.name}" ออกจากระบบใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <Btn variant="ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>ยกเลิก</Btn>
          <Btn variant="danger" onClick={() => doDelete(confirmDelete.id)} style={{ flex: 1 }}>ลบสินค้า</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* --- Category manager: add / rename / delete categories --- */
function CategoryManagerModal({ open, onClose, categories, setCategories, products, setProducts, showToast }) {
  const [newCat, setNewCat] = useState("");
  const [renaming, setRenaming] = useState(null); // index being renamed
  const [renameVal, setRenameVal] = useState("");

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (categories.includes(name)) { showToast("มีหมวดหมู่นี้อยู่แล้ว", "red"); return; }
    setCategories((prev) => [...prev, name]);
    setNewCat("");
    showToast(`เพิ่มหมวดหมู่ "${name}" แล้ว 🌸`);
  };

  const startRename = (i) => { setRenaming(i); setRenameVal(categories[i]); };
  const confirmRename = (i) => {
    const oldName = categories[i];
    const name = renameVal.trim();
    if (!name) return;
    setCategories((prev) => prev.map((c, idx) => (idx === i ? name : c)));
    setProducts((prev) => prev.map((p) => (p.category === oldName ? { ...p, category: name } : p)));
    setRenaming(null);
    showToast("แก้ไขชื่อหมวดหมู่แล้ว");
  };

  const deleteCategory = (i) => {
    const name = categories[i];
    const inUse = products.some((p) => p.category === name);
    if (inUse) { showToast("ยังมีสินค้าใช้หมวดหมู่นี้อยู่ ลบไม่ได้นะ", "red"); return; }
    setCategories((prev) => prev.filter((_, idx) => idx !== i));
    showToast("ลบหมวดหมู่แล้ว");
  };

  return (
    <Modal open={open} onClose={onClose} title="จัดการหมวดหมู่สินค้า 🏷️" width={440}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Input placeholder="ชื่อหมวดหมู่ใหม่ เช่น ของเล่นเด็ก" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()} />
        <Btn onClick={addCategory}><Plus size={15} /> เพิ่ม</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {categories.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 12, padding: "8px 10px" }}>
            {renaming === i ? (
              <Input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmRename(i)} />
            ) : (
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c}</div>
            )}
            {renaming === i ? (
              <Btn size="sm" onClick={() => confirmRename(i)}>บันทึก</Btn>
            ) : (
              <button onClick={() => startRename(i)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: 6, cursor: "pointer" }}><Pencil size={13} color={C.slate} /></button>
            )}
            <button onClick={() => deleteCategory(i)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: 6, cursor: "pointer" }}><Trash2 size={13} color={C.red} /></button>
          </div>
        ))}
        {categories.length === 0 && <div style={{ fontSize: 12.5, color: C.slateLight }}>ยังไม่มีหมวดหมู่ — เพิ่มหมวดหมู่แรกได้เลย</div>}
      </div>
      <Btn variant="ghost" onClick={onClose} style={{ width: "100%", marginTop: 16 }}>เสร็จสิ้น</Btn>
    </Modal>
  );
}

function ProductModal({ editing, onClose, onSave, categories, setCategories, products = [], showToast }) {
  const isNew = editing === "new";
  const blank = { id: "", name: "", category: categories[0] || "", emoji: "📦", image: null, barcode: "", retail: 0, cost: 0, stock: 0, reorder: 10, wholesale: [] };
  const [form, setForm] = useState(blank);
  const [quickCat, setQuickCat] = useState("");
  const [addingCat, setAddingCat] = useState(false);
  const fileRef = useRef(null);

  React.useEffect(() => {
    if (editing && editing !== "new") setForm(editing);
    else if (editing === "new") {
      const newId = uid("SK").toUpperCase();
      setForm({ ...blank, id: newId, category: categories[0] || "", barcode: genBarcode() });
    }
  }, [editing]);

  if (!editing) return null;

  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addTier = () => setF("wholesale", [...form.wholesale, { tier: "", price: 0 }]);
  const updateTier = (i, key, val) => {
    const w = [...form.wholesale];
    w[i] = { ...w[i], [key]: val };
    setF("wholesale", w);
  };
  const removeTier = (i) => setF("wholesale", form.wholesale.filter((_, idx) => idx !== i));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF("image", reader.result);
    reader.readAsDataURL(file);
  };

  const confirmQuickCat = () => {
    const name = quickCat.trim();
    if (!name) return;
    if (!categories.includes(name)) setCategories((prev) => [...prev, name]);
    setF("category", name);
    setQuickCat("");
    setAddingCat(false);
  };

  const dupBarcode = form.barcode && products.some((p) => p.id !== form.id && p.barcode && normalizeEAN13(p.barcode) === normalizeEAN13(form.barcode));

  return (
    <Modal open={!!editing} onClose={onClose} title={isNew ? "เพิ่มสินค้าใหม่ 🍡" : `แก้ไขสินค้า · ${form.id}`}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div onClick={() => fileRef.current?.click()} style={{
          width: 68, height: 68, borderRadius: 16, background: C.blueSoft, border: `1.5px dashed ${C.slateLight}`,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, overflow: "hidden",
        }}>
          {form.image ? <img src={form.image} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 30 }}>{form.emoji}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>รูปสินค้า</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="sm" variant="subtle" onClick={() => fileRef.current?.click()}>อัปโหลดรูป</Btn>
            {form.image && <Btn size="sm" variant="ghost" onClick={() => setF("image", null)}>ลบรูป</Btn>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          {!form.image && (
            <div style={{ fontSize: 12, color: C.slateLight }}>หรือใส่อิโมจิแทนรูป:
              <Input value={form.emoji} onChange={(e) => setF("emoji", e.target.value)} style={{ width: 60, display: "inline-block", marginLeft: 6, textAlign: "center" }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Field label="บาร์โค้ดสินค้า (EAN-13 — ตัวเลขเท่านั้น)">
          <div style={{ display: "flex", gap: 6 }}>
            <Input value={form.barcode} onChange={(e) => setF("barcode", e.target.value)} placeholder="ยิงด้วยเครื่องสแกน หรือพิมพ์ตัวเลขเอง" />
            <Btn size="sm" variant="subtle" onClick={() => setF("barcode", genBarcode())} title="สุ่มรหัสใหม่"><RefreshCw size={14} /></Btn>
            <Btn size="sm" variant="ghost" onClick={() => setF("barcode", form.id.replace(/\D/g, ""))} title="ใช้ตัวเลขจากรหัสสินค้า">ใช้เลขจากรหัส</Btn>
          </div>
        </Field>
        <div style={{ fontSize: 11.5, color: C.slateLight, marginTop: 4 }}>ระบบจะรับเฉพาะตัวเลข เติม 0 ข้างหน้าให้ครบ 12 หลัก และคำนวณเลขตรวจสอบ (หลักที่ 13) ให้อัตโนมัติเมื่อบันทึก</div>
        {dupBarcode && <div style={{ fontSize: 12, color: C.red, marginTop: 6 }}>⚠ บาร์โค้ดนี้ถูกใช้กับสินค้าอื่นแล้ว</div>}
        {form.barcode && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: 10 }}>
            <BarcodeSVG value={form.barcode} height={44} width={1.6} fontSize={12} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="ชื่อสินค้า">
          <Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="เช่น น้ำดื่มขวด 600มล." />
        </Field>
        <Field label="หมวดหมู่">
          {addingCat ? (
            <div style={{ display: "flex", gap: 6 }}>
              <Input autoFocus value={quickCat} onChange={(e) => setQuickCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmQuickCat()} placeholder="ชื่อหมวดหมู่ใหม่" />
              <Btn size="sm" onClick={confirmQuickCat}>ตกลง</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <Select value={form.category} onChange={(e) => setF("category", e.target.value)} style={{ flex: 1 }}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <button type="button" onClick={() => setAddingCat(true)} title="เพิ่มหมวดหมู่ใหม่"
                style={{ border: `1px solid ${C.line}`, background: C.blueSoft, borderRadius: 10, padding: "0 10px", cursor: "pointer" }}>
                <Plus size={15} color={C.blueDeep} />
              </button>
            </div>
          )}
        </Field>
        <Field label="ราคาขายปลีก (บาท)">
          <Input type="number" value={form.retail} onChange={(e) => setF("retail", +e.target.value)} />
        </Field>
        <Field label={isNew ? "ต้นทุนต่อหน่วยเริ่มต้น (บาท)" : "ต้นทุนเฉลี่ยถ่วงน้ำหนัก (บาท)"}>
          <Input type="number" value={form.cost} onChange={(e) => setF("cost", +e.target.value)} disabled={!isNew} style={!isNew ? { background: C.bg, color: C.slate } : undefined} />
        </Field>
        <Field label="จำนวนคงเหลือ">
          <Input type="number" value={form.stock} onChange={(e) => setF("stock", +e.target.value)} disabled={!isNew} style={!isNew ? { background: C.bg, color: C.slate } : undefined} />
        </Field>
        <Field label="จุดสั่งซื้อ (Reorder Point)">
          <Input type="number" value={form.reorder} onChange={(e) => setF("reorder", +e.target.value)} />
        </Field>
      </div>
      {!isNew && (
        <div style={{ fontSize: 12, color: C.slateLight, marginTop: -6 }}>
          * ต้นทุนและจำนวนคงเหลือคำนวณจากล็อตสินค้าโดยอัตโนมัติ ไปปรับที่หน้า "รับเข้าสินค้า" แทน เพื่อให้กำไรสุทธิถูกต้องตามต้นทุนจริง
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.slate }}>ระดับราคาขายส่ง (ไม่จำกัดจำนวนระดับ)</div>
          <Btn size="sm" variant="subtle" onClick={addTier}><Plus size={14} /> เพิ่มระดับราคา</Btn>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {form.wholesale.map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <Input placeholder="ชื่อระดับ เช่น เกรด A / ดีลเลอร์-สมชาย" value={w.tier} onChange={(e) => updateTier(i, "tier", e.target.value)} />
              <Input type="number" placeholder="ราคา" value={w.price} onChange={(e) => updateTier(i, "price", +e.target.value)} style={{ width: 120 }} />
              <button onClick={() => removeTier(i)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: "0 10px", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>
            </div>
          ))}
          {form.wholesale.length === 0 && <div style={{ fontSize: 12.5, color: C.slateLight }}>ยังไม่มีระดับราคาขายส่ง — กด "เพิ่มระดับราคา"</div>}
        </div>
      </div>

      {!isNew && (form.lots || []).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.slate, marginBottom: 8 }}>ล็อตต้นทุนคงเหลือ (จากการรับเข้าสินค้า)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {form.lots.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.bg, borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ color: C.slate }}>{l.date} · {l.supplier}</span>
                <span style={{ fontWeight: 700 }}>{fmt(l.qty)} ชิ้น @ {money(l.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>ยกเลิก</Btn>
        <Btn onClick={() => {
          const finalForm = {
            ...form,
            barcode: normalizeEAN13(form.barcode || genBarcode()),
            ...(isNew ? { lots: form.stock > 0 ? [{ id: uid("LOT").toUpperCase(), qty: Number(form.stock), cost: Number(form.cost) || 0, date: todayISO(), supplier: "สต็อคเริ่มต้น" }] : [] } : {}),
          };
          onSave(finalForm);
        }} style={{ flex: 1 }} disabled={!form.name}><Save size={15} /> บันทึกสินค้า</Btn>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------
   STOCK IN
--------------------------------------------------------- */
function StockIn({ products, setProducts, setTransactions, showToast }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(products[0]?.cost || 0);
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(todayISO());
  const [scanning, setScanning] = useState(false);

  const product = products.find((p) => p.id === productId);

  const handleScan = (code) => {
    setScanning(false);
    const match = products.find((p) => p.barcode && normalizeEAN13(p.barcode) === normalizeEAN13(code));
    if (match) { setProductId(match.id); setCost(match.cost); showToast(`เลือกสินค้า "${match.name}" จากบาร์โค้ดแล้ว 🎯`); }
    else showToast("ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้", "red");
  };

  const submit = () => {
    if (!product || qty <= 0) return;
    const newLot = { id: uid("LOT").toUpperCase(), qty: Number(qty), cost: Number(cost) || 0, date, supplier: supplier || "-" };
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p;
      const lots = [...(p.lots || []), newLot];
      return { ...p, stock: p.stock + Number(qty), lots, cost: averageLotCost(lots, Number(cost) || p.cost) };
    }));
    setTransactions((prev) => [{
      id: uid("STK").toUpperCase(),
      date: new Date(date).toISOString(),
      type: "stockin",
      items: [{ productId, name: product.name, qty: Number(qty), unitPrice: Number(cost) }],
      total: Number(qty) * Number(cost),
      user: "ผู้ใช้งานปัจจุบัน",
      status: "สำเร็จ",
      supplier,
    }, ...prev]);
    showToast(`รับเข้าสินค้า "${product.name}" จำนวน ${fmt(qty)} ชิ้น สำเร็จ · บันทึกต้นทุนล็อตนี้แล้ว`);
    setQty(1); setSupplier("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ padding: 22, maxWidth: 560 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>บันทึกรับเข้าสินค้า</div>
        <div style={{ fontSize: 13, color: C.slate, marginBottom: 18 }}>ระบบจะเพิ่มจำนวนสต็อคและบันทึกต้นทุนของล็อตนี้แยกไว้ต่างหาก เพื่อคำนวณกำไรสุทธิตามต้นทุนจริงของแต่ละล็อต (FIFO)</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="เลือกสินค้า">
            <div style={{ display: "flex", gap: 6 }}>
              <Select value={productId} onChange={(e) => { setProductId(e.target.value); setCost(products.find(p=>p.id===e.target.value)?.cost || 0); }} style={{ flex: 1 }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name} (คงเหลือ {p.stock})</option>)}
              </Select>
              <Btn variant="subtle" onClick={() => setScanning(true)} title="สแกนบาร์โค้ด"><ScanBarcode size={16} /></Btn>
            </div>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="จำนวนที่รับเข้า">
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="ต้นทุนต่อหน่วยของล็อตนี้ (บาท)">
              <Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} />
            </Field>
          </div>
          <Field label="ชื่อผู้ซัพพลายเออร์">
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="เช่น บจก. เครื่องดื่มไทย" />
          </Field>
          <Field label="วันที่รับเข้า">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <div style={{ background: C.blueSoft, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.blueDeep, fontWeight: 600 }}>
            มูลค่าการรับเข้าครั้งนี้: {money((Number(qty) || 0) * (Number(cost) || 0))}
          </div>
          <Btn onClick={submit} disabled={!product || qty <= 0}><Save size={15} /> บันทึกและเพิ่มสต็อค</Btn>
        </div>
      </Card>

      {product && (
        <Card style={{ padding: 18, maxWidth: 560 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>ล็อตต้นทุนปัจจุบันของ "{product.name}"</div>
          <div style={{ fontSize: 12.5, color: C.slate, marginBottom: 10 }}>ต้นทุนเฉลี่ยถ่วงน้ำหนักตอนนี้: <b style={{ color: C.ink }}>{money(product.cost)}</b> / หน่วย</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(product.lots || []).length === 0 && <div style={{ fontSize: 12.5, color: C.slateLight }}>ยังไม่มีข้อมูลล็อต</div>}
            {(product.lots || []).map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: C.bg, borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ color: C.slate }}>{l.date} · {l.supplier}</span>
                <span style={{ fontWeight: 700 }}>{fmt(l.qty)} ชิ้น @ {money(l.cost)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      <ScannerModal open={scanning} onClose={() => setScanning(false)} onDetect={handleScan} title="สแกนเพื่อเลือกสินค้า" />
    </div>
  );
}

/* ---------------------------------------------------------
   SALES ORDER (multi-item POS)
--------------------------------------------------------- */
function SalesOrder({ products, setProducts, setTransactions, showToast, lineLog, setLineLog }) {
  const blankRow = () => ({
    rid: uid("row"), productId: products[0]?.id || "", saleType: "retail", tier: products[0]?.wholesale?.[0]?.tier || "custom", customPrice: 0, qty: 1,
  });
  const [rows, setRows] = useState([blankRow()]);
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [channelCustom, setChannelCustom] = useState("");
  const [scanning, setScanning] = useState(false);

  const unitPriceFor = (row) => {
    const p = products.find((x) => x.id === row.productId);
    if (!p) return 0;
    if (row.saleType === "retail") return p.retail;
    if (row.tier === "__custom__") return Number(row.customPrice) || 0;
    return p.wholesale.find((w) => w.tier === row.tier)?.price ?? p.retail;
  };

  const updateRow = (rid, patch) => setRows((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r)));
  const addRow = () => setRows((prev) => [...prev, blankRow()]);
  const removeRow = (rid) => setRows((prev) => prev.filter((r) => r.rid !== rid));

  const handleScan = (code) => {
    setScanning(false);
    const match = products.find((p) => p.barcode && normalizeEAN13(p.barcode) === normalizeEAN13(code));
    if (!match) { showToast("ไม่พบสินค้าที่ตรงกับบาร์โค้ดนี้", "red"); return; }
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.productId === match.id && r.saleType === "retail");
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: Number(copy[idx].qty || 0) + 1 };
        return copy;
      }
      return [...prev, { rid: uid("row"), productId: match.id, saleType: "retail", tier: match.wholesale?.[0]?.tier || "custom", customPrice: 0, qty: 1 }];
    });
    showToast(`เพิ่ม "${match.name}" ลงบิลแล้ว 🛒`);
  };

  const grandTotal = rows.reduce((s, r) => s + unitPriceFor(r) * (Number(r.qty) || 0), 0);

  const insufficientRows = rows.filter((r) => {
    const p = products.find((x) => x.id === r.productId);
    return p && Number(r.qty) > p.stock;
  });

  const submit = () => {
    if (insufficientRows.length > 0) {
      showToast("สต็อคไม่เพียงพอสำหรับบางรายการ กรุณาตรวจสอบ", "red");
      return;
    }
    // aggregate qty per product to decrement stock
    const qtyByProduct = {};
    rows.forEach((r) => { qtyByProduct[r.productId] = (qtyByProduct[r.productId] || 0) + Number(r.qty); });

    // consume cost lots FIFO per product so profit reflects the real cost of the units sold
    const costByProduct = {};
    const updatedById = {};
    products.forEach((p) => {
      if (!qtyByProduct[p.id]) return;
      const { avgCost, newLots } = consumeLotsFIFO(p.lots || [], qtyByProduct[p.id], p.cost);
      costByProduct[p.id] = avgCost;
      updatedById[p.id] = { ...p, stock: p.stock - qtyByProduct[p.id], lots: newLots, cost: averageLotCost(newLots, p.cost) };
    });

    const items = rows.map((r) => {
      const p = products.find((x) => x.id === r.productId);
      return {
        productId: r.productId, name: p?.name, qty: Number(r.qty), unitPrice: unitPriceFor(r),
        tier: r.saleType === "wholesale" ? (r.tier === "__custom__" ? "กำหนดเอง" : r.tier) : null,
        costBasis: costByProduct[r.productId] ?? p?.cost ?? 0,
      };
    });
    const isMixed = new Set(rows.map((r) => r.saleType)).size > 1;
    const type = isMixed ? "wholesale" : rows[0]?.saleType || "retail"; // classify mixed bills as wholesale for reporting nuance
    const channelLabel = channel === "อื่นๆ" ? (channelCustom.trim() || "อื่นๆ") : channel;

    setProducts((prev) => prev.map((p) => updatedById[p.id] || p));

    setTransactions((prev) => [{
      id: uid("BILL").toUpperCase(),
      date: new Date().toISOString(),
      type,
      items,
      total: grandTotal,
      user: "ผู้ใช้งานปัจจุบัน",
      status: "สำเร็จ",
      channel: channelLabel,
    }, ...prev]);

    // reorder point / LINE Notify check
    const alerts = [];
    products.forEach((p) => {
      if (!qtyByProduct[p.id]) return;
      const newStock = p.stock - qtyByProduct[p.id];
      if (newStock <= p.reorder) alerts.push({ name: p.name, stock: newStock });
    });
    if (alerts.length > 0) {
      const msgs = alerts.map((a) => `📦 LINE Notify: "${a.name}" เหลือ ${fmt(a.stock)} ชิ้น — ต่ำกว่าจุดสั่งซื้อ`);
      setLineLog((prev) => [...msgs.map((m) => ({ msg: m, time: new Date().toISOString() })), ...prev]);
      showToast(msgs[0], "red");
    } else {
      showToast(`บันทึกบิลขายสำเร็จ ยอดรวม ${money(grandTotal)}`);
    }
    setRows([blankRow()]);
    setChannelCustom("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>เปิดบิลขาย</div>
          <Btn variant="subtle" size="sm" onClick={() => setScanning(true)}><ScanBarcode size={15} /> สแกนเพิ่มสินค้า</Btn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: channel === "อื่นๆ" ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 14 }} className="row-grid1">
          <Field label="ช่องทางการสั่งซื้อ">
            <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
              {CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          {channel === "อื่นๆ" && (
            <Field label="ระบุช่องทาง">
              <Input value={channelCustom} onChange={(e) => setChannelCustom(e.target.value)} placeholder="เช่น งานออกร้าน" />
            </Field>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((r) => {
            const p = products.find((x) => x.id === r.productId);
            const over = p && Number(r.qty) > p.stock;
            return (
              <div key={r.rid} style={{ border: `1px solid ${over ? C.red : C.line}`, borderRadius: 12, padding: 14, background: over ? C.redBg : C.bg }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }} className="row-grid1">
                  <Field label="สินค้า">
                    <Select value={r.productId} onChange={(e) => updateRow(r.rid, { productId: e.target.value, tier: products.find(x=>x.id===e.target.value)?.wholesale?.[0]?.tier || "__custom__" })}>
                      {products.map((pp) => <option key={pp.id} value={pp.id}>{pp.emoji} {pp.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="จำนวน">
                    <Input type="number" min={1} value={r.qty} onChange={(e) => updateRow(r.rid, { qty: e.target.value })} />
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {["retail", "wholesale"].map((t) => (
                    <button key={t} onClick={() => updateRow(r.rid, { saleType: t })}
                      style={{
                        flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                        border: `1px solid ${r.saleType === t ? C.blue : C.line}`,
                        background: r.saleType === t ? C.blueSoft : "#fff", color: r.saleType === t ? C.blueDeep : C.slate,
                      }}>
                      {t === "retail" ? "ขายปลีก" : "ขายส่ง"}
                    </button>
                  ))}
                </div>


                {r.saleType === "wholesale" && (
                  <div style={{ display: "grid", gridTemplateColumns: r.tier === "__custom__" ? "1fr 1fr" : "1fr", gap: 10, marginTop: 10 }}>
                    <Field label="ระดับราคาขายส่ง">
                      <Select value={r.tier} onChange={(e) => updateRow(r.rid, { tier: e.target.value })}>
                        {p?.wholesale.map((w) => <option key={w.tier} value={w.tier}>{w.tier} — {money(w.price)}</option>)}
                        <option value="__custom__">กำหนดราคาเอง (Custom)</option>
                      </Select>
                    </Field>
                    {r.tier === "__custom__" && (
                      <Field label="ราคากำหนดเอง (บาท/หน่วย)">
                        <Input type="number" value={r.customPrice} onChange={(e) => updateRow(r.rid, { customPrice: e.target.value })} />
                      </Field>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: over ? C.red : C.slate, fontWeight: 700 }}>
                    {over ? `⚠ สต็อคเหลือเพียง ${p.stock} ชิ้น` : `คงเหลือในสต็อค: ${p?.stock ?? "-"}`}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 800 }}>{money(unitPriceFor(r) * (Number(r.qty) || 0))}</div>
                    {rows.length > 1 && (
                      <button onClick={() => removeRow(r.rid)} style={{ border: `1px solid ${C.line}`, background: "#fff", borderRadius: 8, padding: 6, cursor: "pointer" }}>
                        <Trash2 size={14} color={C.red} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Btn variant="subtle" onClick={addRow} style={{ marginTop: 12 }}><Plus size={15} /> เพิ่มรายการ</Btn>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, paddingTop: 14, borderTop: `1px dashed ${C.line}` }}>
          <div>
            <div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>ยอดรวมสุทธิทั้งบิล</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.blueDeep }}>{money(grandTotal)}</div>
          </div>
          <Btn onClick={submit} disabled={insufficientRows.length > 0}><Save size={16} /> บันทึกและตัดสต็อค</Btn>
        </div>
      </Card>

      {lineLog.length > 0 && (
        <Card style={{ padding: 16, borderColor: C.amber }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: C.amber, marginBottom: 8 }}>
            <Bell size={16} /> ประวัติแจ้งเตือน LINE Notify (จำลอง)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lineLog.slice(0, 5).map((l, i) => (
              <div key={i} style={{ fontSize: 12.5, color: C.slate }}>{new Date(l.time).toLocaleTimeString("th-TH")} · {l.msg}</div>
            ))}
          </div>
        </Card>
      )}
      <ScannerModal open={scanning} onClose={() => setScanning(false)} onDetect={handleScan} title="สแกนเพิ่มสินค้าลงบิล" />
      <style>{`@media (max-width:560px){ .row-grid1 { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ---------------------------------------------------------
   MONTHLY REPORT
--------------------------------------------------------- */
function MonthlyReport({ products, transactions }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year && t.type !== "stockin";
  });

  const retailTotal = monthTx.filter((t) => t.type === "retail").reduce((s, t) => s + t.total, 0);
  const wholesaleTotal = monthTx.filter((t) => t.type === "wholesale").reduce((s, t) => s + t.total, 0);

  const grossProfit = monthTx.reduce((s, t) => {
    return s + t.items.reduce((s2, it) => {
      const p = products.find((x) => x.id === it.productId);
      const costBasis = it.costBasis != null ? it.costBasis : (p ? p.cost : 0);
      return s2 + (it.unitPrice - costBasis) * it.qty;
    }, 0);
  }, 0);

  const byDay = {};
  monthTx.forEach((t) => {
    const d = new Date(t.date).getDate();
    byDay[d] = byDay[d] || { day: `${d}`, ขายปลีก: 0, ขายส่ง: 0 };
    byDay[d][t.type === "retail" ? "ขายปลีก" : "ขายส่ง"] += t.total;
  });
  const chartData = Object.values(byDay).sort((a, b) => +a.day - +b.day);

  const exportCSV = () => {
    const rows = [["เลขที่บิล", "วันที่", "ประเภท", "ยอดรวม", "ผู้ทำรายการ"]];
    monthTx.forEach((t) => rows.push([t.id, new Date(t.date).toLocaleString("th-TH"), t.type, t.total, t.user]));
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `รายงาน-${year}-${month + 1}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const monthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <Select value={month} onChange={(e) => setMonth(+e.target.value)} style={{ width: 160 }}>
          {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </Select>
        <Select value={year} onChange={(e) => setYear(+e.target.value)} style={{ width: 110 }}>
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
        <Btn variant="ghost" onClick={exportCSV} style={{ marginLeft: "auto" }}><Download size={15} /> Export CSV</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>ยอดขายปลีก</div><div style={{ fontSize: 21, fontWeight: 800, marginTop: 6 }}>{money(retailTotal)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>ยอดขายส่ง</div><div style={{ fontSize: 21, fontWeight: 800, marginTop: 6 }}>{money(wholesaleTotal)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>ยอดขายรวม</div><div style={{ fontSize: 21, fontWeight: 800, marginTop: 6, color: C.blueDeep }}>{money(retailTotal + wholesaleTotal)}</div></Card>
        <Card style={{ padding: 16 }}><div style={{ fontSize: 12.5, color: C.slate, fontWeight: 600 }}>กำไรขั้นต้นโดยประมาณ</div><div style={{ fontSize: 21, fontWeight: 800, marginTop: 6, color: C.green }}>{money(grossProfit)}</div></Card>
      </div>

      <Card style={{ padding: "18px 12px 8px" }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, padding: "0 6px 8px" }}>เปรียบเทียบยอดขายปลีก vs ขายส่ง รายวัน</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ left: 4, right: 12, top: 6 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: C.slate }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={54} />
            <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ขายปลีก" fill={C.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="ขายส่ง" fill={C.sky} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {chartData.length === 0 && <div style={{ textAlign: "center", color: C.slate, padding: 20, fontSize: 13 }}>ไม่มีข้อมูลการขายในเดือนที่เลือก</div>}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------
   TRANSACTION HISTORY
--------------------------------------------------------- */
function TransactionHistory({ transactions }) {
  const [type, setType] = useState("ทั้งหมด");
  const [channelFilter, setChannelFilter] = useState("ทั้งหมด");
  const [q, setQ] = useState("");

  const typeLabel = (t) => t === "retail" ? "ขายปลีก" : t === "wholesale" ? "ขายส่ง" : "รับเข้าสินค้า";
  const typeTone = (t) => t === "retail" ? "blue" : t === "wholesale" ? "green" : "amber";

  const channelOptions = ["ทั้งหมด", ...Array.from(new Set(transactions.filter((t) => t.channel).map((t) => t.channel)))];

  const filtered = transactions.filter((t) => {
    const matchesType = type === "ทั้งหมด" || typeLabel(t.type) === type;
    const matchesChannel = channelFilter === "ทั้งหมด" || t.channel === channelFilter;
    const matchesQ = q.trim() === "" || t.id.toLowerCase().includes(q.toLowerCase()) || t.items.some((it) => it.name?.toLowerCase().includes(q.toLowerCase()));
    return matchesType && matchesChannel && matchesQ;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={16} color={C.slate} style={{ position: "absolute", left: 12, top: 11 }} />
          <Input placeholder="ค้นหาเลขที่บิล/ชื่อสินค้า..." value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <Select value={type} onChange={(e) => setType(e.target.value)} style={{ width: 170 }}>
          <option>ทั้งหมด</option>
          <option>ขายปลีก</option>
          <option>ขายส่ง</option>
          <option>รับเข้าสินค้า</option>
        </Select>
        <Select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} style={{ width: 170 }}>
          {channelOptions.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <Card style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr><th>วันที่</th><th>เลขที่บิล</th><th>ประเภท</th><th>ช่องทาง</th><th>รายการสินค้า</th><th>ยอดรวม</th><th>ผู้ทำรายการ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td style={{ fontSize: 12.5, color: C.slate, whiteSpace: "nowrap" }}>{new Date(t.date).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                <td style={{ fontWeight: 700, fontSize: 12.5 }}>{t.id}</td>
                <td><Pill tone={typeTone(t.type)}>{typeLabel(t.type)}{t.items[0]?.tier ? ` · ${t.items[0].tier}` : ""}</Pill></td>
                <td style={{ fontSize: 12.5, color: C.slate }}>{t.channel || (t.type === "stockin" ? t.supplier || "-" : "-")}</td>
                <td style={{ fontSize: 12.5, maxWidth: 260 }}>
                  {t.items.map((it) => `${it.name} ×${fmt(it.qty)}`).join(", ")}
                </td>
                <td style={{ fontWeight: 700 }}>{money(t.total)}</td>
                <td style={{ fontSize: 12.5 }}>{t.user}</td>
                <td><Pill tone="green">{t.status}</Pill></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: "center", color: C.slate, padding: 30 }}>ไม่พบรายการ</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}