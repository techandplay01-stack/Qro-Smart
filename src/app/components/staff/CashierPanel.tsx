import { useState } from "react";
import { Wallet, Search, CheckCircle, Clock, TrendingUp, CreditCard, Banknote,
  SplitSquareVertical, X, Plus, Package, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore, OrderItem } from "../../store";
import { ItemPicker } from "./ItemPicker";

type PaymentMode = "cash" | "upi" | "split";
type ActiveTab   = "table" | "parcel";

interface SplitModal { orderId: string; tableNumber: string; total: number }

// ── badge ──────────────────────────────────────────────────────────────────────
function AddedByBadge({ addedBy }: { addedBy?: string }) {
  if (!addedBy || addedBy === "customer") return null;
  const cfg: Record<string, string> = {
    waiter:  "bg-purple-100 text-purple-700",
    cashier: "bg-blue-100 text-blue-700",
    custom:  "bg-orange-100 text-orange-700",
  };
  const lbl: Record<string, string> = {
    waiter:  "Waiter",
    cashier: "Cashier",
    custom:  "Custom",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg[addedBy] || "bg-gray-100 text-gray-600"}`}>
      {lbl[addedBy] || addedBy}
    </span>
  );
}

export function CashierPanel() {
  const { orders, completePayment, createParcelOrder } = useStore();

  const [tab,         setTab]         = useState<ActiveTab>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [splitModal,  setSplitModal]  = useState<SplitModal | null>(null);
  const [splitCash,   setSplitCash]   = useState("");
  const [splitUpi,    setSplitUpi]    = useState("");
  const [addItemId,   setAddItemId]   = useState<string | null>(null);
  const [showParcelPicker, setShowParcelPicker] = useState(false);

  // Separate table and parcel orders
  const tableOrders  = orders.filter((o) => o.orderType !== "parcel");
  const parcelOrders = orders.filter((o) => o.orderType === "parcel");

  // Table: pending payment (delivered but not paid)
  const tablePending = tableOrders.filter((o) => o.status === "delivered" && !o.paymentCompleted);
  // Parcel: pending payment
  const parcelPending = parcelOrders.filter((o) => !o.paymentCompleted);
  // All paid
  const paidOrders   = orders.filter((o) => o.paymentCompleted);

  const filteredTablePending = tablePending.filter(
    (o) => o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           o.tableNumber.includes(searchQuery) ||
           o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredParcelPending = parcelPending.filter(
    (o) => o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (o.parcelNumber || "").includes(searchQuery) ||
           o.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCollection = paidOrders.reduce((s, o) => s + o.total, 0);
  const pendingAmount   = (tab === "table" ? tablePending : parcelPending).reduce((s, o) => s + o.total, 0);

  const cashCollected  = paidOrders.filter((o) => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
  const upiCollected   = paidOrders.filter((o) => o.paymentMethod === "upi").reduce((s, o) => s + o.total, 0);
  const splitOrds      = paidOrders.filter((o) => o.paymentMethod === "split");
  const splitCashTotal = splitOrds.reduce((s, o) => s + (o.splitCash || 0), 0);
  const splitUpiTotal  = splitOrds.reduce((s, o) => s + (o.splitUpi || 0), 0);

  const handlePayment = (orderId: string, tableNumber: string, method: PaymentMode, total?: number) => {
    if (method === "split") {
      setSplitModal({ orderId, tableNumber, total: total || 0 });
      setSplitCash(""); setSplitUpi("");
    } else {
      completePayment(orderId, tableNumber, method);
    }
  };

  const confirmSplit = () => {
    if (!splitModal) return;
    const cash = parseFloat(splitCash) || 0;
    const upi  = parseFloat(splitUpi)  || 0;
    if (Math.abs(cash + upi - splitModal.total) > 0.5) {
      alert(`Amounts must add up to ₹${splitModal.total.toFixed(2)}`);
      return;
    }
    completePayment(splitModal.orderId, splitModal.tableNumber, "split", cash, upi);
    setSplitModal(null);
  };

  const handleParcelCreated = (items: OrderItem[]) => {
    createParcelOrder(items, "");
  };

  const pendingOrders = tab === "table" ? filteredTablePending : filteredParcelPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-beige via-background to-secondary p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wallet className="size-9 text-coffee-brown" />
            <h1 className="text-2xl md:text-4xl font-bold text-coffee-brown">Cashier Panel</h1>
          </div>
          <button
            onClick={() => setShowParcelPicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-coffee-brown text-white rounded-xl font-semibold text-sm hover:bg-coffee-brown/90 transition-colors shadow-lg"
          >
            <Plus className="size-4" />
            New Parcel Order
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="glass-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="size-4 text-green-600" /><span className="text-xs text-muted-foreground">Total Collected</span></div>
            <p className="text-xl font-bold text-coffee-brown">₹{totalCollection.toLocaleString()}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="size-4 text-orange-600" /><span className="text-xs text-muted-foreground">Pending ({tab})</span></div>
            <p className="text-xl font-bold text-orange-600">₹{pendingAmount.toLocaleString()}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><Banknote className="size-4 text-green-600" /><span className="text-xs text-muted-foreground">Cash in Hand</span></div>
            <p className="text-xl font-bold text-green-600">₹{(cashCollected + splitCashTotal).toLocaleString()}</p>
          </div>
          <div className="glass-strong rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1"><CreditCard className="size-4 text-blue-600" /><span className="text-xs text-muted-foreground">UPI Received</span></div>
            <p className="text-xl font-bold text-blue-600">₹{(upiCollected + splitUpiTotal).toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-white/40 rounded-xl p-1 gap-1">
            <button onClick={() => setTab("table")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "table" ? "bg-coffee-brown text-white shadow" : "text-coffee-brown hover:bg-white/50"}`}>
              <UtensilsCrossed className="size-4" /> Table ({tablePending.length})
            </button>
            <button onClick={() => setTab("parcel")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "parcel" ? "bg-coffee-brown text-white shadow" : "text-coffee-brown hover:bg-white/50"}`}>
              <Package className="size-4" /> Parcel ({parcelPending.length})
            </button>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 glass-strong rounded-full focus:outline-none focus:ring-2 focus:ring-coffee-brown text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Pending Payments ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-coffee-brown mb-3">
            Collect Payment ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <motion.div key={order.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className={`glass-strong rounded-2xl p-4 border-2 ${order.orderType === "parcel" ? "border-blue-400" : "border-orange-400"}`}>

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    {order.orderType === "parcel"
                      ? <p className="text-xl font-bold text-coffee-brown">Parcel #{order.parcelNumber}</p>
                      : <p className="text-xl font-bold text-coffee-brown">Table {order.tableNumber}</p>
                    }
                    <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    <p className="text-2xl font-bold text-coffee-brown">₹{order.total.toFixed(2)}</p>
                    {order.orderType === "parcel" && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Parcel</span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-3 space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-white/30 rounded-lg px-2.5 py-1.5 gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="truncate">{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                        <AddedByBadge addedBy={item.addedBy} />
                      </div>
                      <span className="font-semibold flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Add item (table orders only) */}
                {order.orderType === "table" && (
                  <button onClick={() => setAddItemId(order.id)}
                    className="w-full py-2 mb-3 glass border border-coffee-brown text-coffee-brown rounded-xl font-semibold flex items-center justify-center gap-2 text-xs hover:bg-coffee-brown/10 transition-colors">
                    <Plus className="size-3.5" /> Add Item (Cashier)
                  </button>
                )}

                {/* Payment buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handlePayment(order.id, order.tableNumber, "cash")}
                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex flex-col items-center gap-0.5 text-xs transition-colors">
                    <Banknote className="size-4" /> Cash
                  </button>
                  <button onClick={() => handlePayment(order.id, order.tableNumber, "upi")}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex flex-col items-center gap-0.5 text-xs transition-colors">
                    <CreditCard className="size-4" /> UPI
                  </button>
                  <button onClick={() => handlePayment(order.id, order.tableNumber, "split", order.total)}
                    className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex flex-col items-center gap-0.5 text-xs transition-colors">
                    <SplitSquareVertical className="size-4" /> Split
                  </button>
                </div>
              </motion.div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="glass-strong rounded-2xl p-10 text-center">
                <CheckCircle className="size-12 text-green-600 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">All {tab} payments cleared!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Completed Payments ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-coffee-brown mb-3">Completed ({paidOrders.length})</h2>
          <div className="space-y-2 max-h-[650px] overflow-y-auto">
            {paidOrders.map((order) => (
              <div key={order.id} className="glass rounded-xl p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    <p className="font-semibold text-sm text-coffee-brown">
                      {order.orderType === "parcel" ? `Parcel #${order.parcelNumber}` : `Table ${order.tableNumber}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  </div>
                  <p className="text-lg font-bold text-coffee-brown">₹{order.total.toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="size-3" /> Paid
                  </span>
                  {order.paymentMethod === "cash" && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">💵 Cash</span>}
                  {order.paymentMethod === "upi"  && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">📱 UPI</span>}
                  {order.paymentMethod === "split" && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      Split ₹{order.splitCash?.toFixed(0)} + ₹{order.splitUpi?.toFixed(0)}
                    </span>
                  )}
                  {order.orderType === "parcel" && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">Parcel</span>}
                </div>
              </div>
            ))}
            {paidOrders.length === 0 && (
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">No completed payments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Item to Table Order picker ── */}
      <AnimatePresence>
        {addItemId && (
          <ItemPicker
            title={`Add Item — Cashier`}
            addedBy="cashier"
            orderId={addItemId}
            onClose={() => setAddItemId(null)}
          />
        )}
      </AnimatePresence>

      {/* ── New Parcel Order picker ── */}
      <AnimatePresence>
        {showParcelPicker && (
          <ItemPicker
            title="New Parcel / Takeaway Order"
            addedBy="cashier"
            onConfirm={handleParcelCreated}
            onClose={() => setShowParcelPicker(false)}
            allowCustom={true}
          />
        )}
      </AnimatePresence>

      {/* ── Split Payment Modal ── */}
      <AnimatePresence>
        {splitModal && (() => {
          const cashVal = parseFloat(splitCash) || 0;
          const upiVal  = parseFloat(splitUpi)  || 0;
          const sum     = cashVal + upiVal;
          const isValid = Math.abs(sum - splitModal.total) <= 0.5;
          const cashPct = splitModal.total > 0 ? Math.min(100, (cashVal / splitModal.total) * 100) : 0;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setSplitModal(null)}>
              <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="glass-strong rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-coffee-brown">Split Payment</h3>
                    <p className="text-xs text-muted-foreground">Table {splitModal.tableNumber}</p>
                  </div>
                  <button onClick={() => setSplitModal(null)} className="size-8 flex items-center justify-center rounded-full hover:bg-black/10">
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="text-center mb-5 py-3 bg-coffee-brown/10 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-0.5">Order Total</p>
                  <p className="text-3xl font-bold text-coffee-brown">₹{splitModal.total.toFixed(2)}</p>
                </div>
                <div className="mb-5">
                  <div className="h-4 rounded-full overflow-hidden bg-gray-200 flex mb-1">
                    <motion.div animate={{ width: `${cashPct}%` }} transition={{ type: "spring", stiffness: 200 }}
                      className="h-full bg-green-500 rounded-l-full" />
                    <motion.div animate={{ width: `${100 - cashPct}%` }} transition={{ type: "spring", stiffness: 200 }}
                      className="h-full bg-blue-500 rounded-r-full" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-semibold">💵 Cash {cashPct.toFixed(0)}%</span>
                    <span className="text-blue-600 font-semibold">📱 UPI {(100 - cashPct).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-green-700 mb-1.5"><Banknote className="size-3.5" /> Cash (₹)</label>
                    <input type="number" value={splitCash}
                      onChange={(e) => { setSplitCash(e.target.value); setSplitUpi(Math.max(0, splitModal.total - (parseFloat(e.target.value) || 0)).toFixed(2)); }}
                      placeholder="0.00" className="w-full px-3 py-2.5 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-bold text-lg" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-blue-700 mb-1.5"><CreditCard className="size-3.5" /> UPI (₹)</label>
                    <input type="number" value={splitUpi}
                      onChange={(e) => { setSplitUpi(e.target.value); setSplitCash(Math.max(0, splitModal.total - (parseFloat(e.target.value) || 0)).toFixed(2)); }}
                      placeholder="0.00" className="w-full px-3 py-2.5 glass rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold text-lg" />
                  </div>
                </div>
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-5 text-sm font-medium ${isValid ? "bg-green-100 text-green-700" : sum > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                  <span>Entered: ₹{sum.toFixed(2)}</span>
                  {isValid ? <span className="flex items-center gap-1"><CheckCircle className="size-4" /> Balanced</span>
                           : <span>Need: ₹{splitModal.total.toFixed(2)}</span>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSplitModal(null)} className="py-2.5 glass rounded-xl font-semibold text-coffee-brown hover:bg-white/60">Cancel</button>
                  <button onClick={confirmSplit} disabled={!isValid}
                    className={`py-2.5 rounded-xl font-semibold text-white ${isValid ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-300 cursor-not-allowed"}`}>
                    Confirm Split
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
