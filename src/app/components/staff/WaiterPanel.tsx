import { useState } from "react";
import { Package, Check, Search, CheckCircle, Plus, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../../store";
import { ItemPicker } from "./ItemPicker";

export function WaiterPanel() {
  const { orders, updateOrderStatus, tables, freeTable } = useStore();
  const [searchQuery, setSearchQuery]   = useState("");
  const [addItemOrderId, setAddItemOrderId] = useState<string | null>(null);

  const markAsDelivered = (orderId: string) => updateOrderStatus(orderId, "delivered");

  const makeTableAvailable = (tableNumber: string) => {
    if (confirm(`Make Table ${tableNumber} available? This will free up the table.`)) {
      freeTable(tableNumber);
    }
  };

  // Only table orders (not parcels) for waiter
  const tableOrders = orders.filter((o) => o.orderType !== "parcel");
  const filtered    = tableOrders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableNumber.includes(searchQuery)
  );

  const readyOrders     = filtered.filter((o) => o.status === "ready");
  const activeOrders    = filtered.filter((o) => o.status === "pending" || o.status === "preparing");
  const deliveredOrders = filtered.filter((o) => o.status === "delivered");

  const tableStatus = tables.map((t) => {
    const hasReady = orders.some((o) => o.tableNumber === t.number && o.status === "ready");
    return { number: t.number, status: hasReady ? "ready" : t.status };
  });

  const addItemOrder = addItemOrderId ? orders.find((o) => o.id === addItemOrderId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-beige via-background to-secondary p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="size-9 text-coffee-brown" />
          <h1 className="text-2xl md:text-4xl font-bold text-coffee-brown">Waiter Panel</h1>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by order ID or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 glass-strong rounded-full focus:outline-none focus:ring-2 focus:ring-coffee-brown text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Ready for Delivery */}
          <section>
            <h2 className="text-xl font-semibold text-coffee-brown mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              Ready for Delivery ({readyOrders.length})
            </h2>
            <div className="space-y-3">
              {readyOrders.map((order) => (
                <motion.div key={order.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="glass-strong rounded-2xl p-4 border-2 border-green-500">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <p className="text-2xl font-bold text-coffee-brown">Table {order.tableNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                      <p className="text-xl font-bold text-coffee-brown">₹{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white/30 rounded-lg px-2.5 py-1.5">
                        <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                        {item.addedBy && item.addedBy !== "customer" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            item.addedBy === "waiter" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {item.addedBy === "waiter" ? "Waiter" : "Cashier"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAddItemOrderId(order.id)}
                      className="py-2.5 glass border-2 border-coffee-brown text-coffee-brown rounded-xl font-semibold flex items-center justify-center gap-2 text-sm hover:bg-coffee-brown/10 transition-colors"
                    >
                      <Plus className="size-4" /> Add Item
                    </button>
                    <button
                      onClick={() => markAsDelivered(order.id)}
                      className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <Check className="size-4" /> Delivered
                    </button>
                  </div>
                </motion.div>
              ))}
              {readyOrders.length === 0 && (
                <div className="glass-strong rounded-2xl p-10 text-center">
                  <Package className="size-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No orders ready for delivery</p>
                </div>
              )}
            </div>
          </section>

          {/* Active Orders (pending / preparing) */}
          <section>
            <h2 className="text-xl font-semibold text-coffee-brown mb-3 flex items-center gap-2">
              <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
              Active Orders ({activeOrders.length})
            </h2>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <motion.div key={order.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  className="glass-strong rounded-2xl p-4 border border-orange-300">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <p className="text-xl font-bold text-coffee-brown">Table {order.tableNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {order.status === "pending" ? "Waiting" : "Preparing"}
                      </span>
                      <p className="text-lg font-bold text-coffee-brown mt-1">₹{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-white/30 rounded-lg px-2.5 py-1.5">
                        <span>{item.name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                        {item.addedBy && item.addedBy !== "customer" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            item.addedBy === "waiter" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {item.addedBy === "waiter" ? "Waiter" : "Cashier"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setAddItemOrderId(order.id)}
                    className="w-full py-2.5 glass border-2 border-coffee-brown text-coffee-brown rounded-xl font-semibold flex items-center justify-center gap-2 text-sm hover:bg-coffee-brown/10 transition-colors"
                  >
                    <Plus className="size-4" /> Add Item to This Order
                  </button>
                </motion.div>
              ))}
              {activeOrders.length === 0 && (
                <div className="glass-strong rounded-2xl p-6 text-center">
                  <p className="text-muted-foreground text-sm">No active orders</p>
                </div>
              )}
            </div>
          </section>

          {/* Recently Delivered */}
          {deliveredOrders.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-coffee-brown mb-3 opacity-70">
                Recently Delivered ({deliveredOrders.length})
              </h2>
              <div className="space-y-2">
                {deliveredOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="glass rounded-xl p-3 flex items-center justify-between opacity-60">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <p className="font-semibold text-sm text-coffee-brown">Table {order.tableNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-coffee-brown">₹{order.total.toFixed(2)}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Table Status Panel */}
        <div>
          <h2 className="text-xl font-semibold text-coffee-brown mb-3">Tables</h2>
          <div className="glass-strong rounded-2xl p-4 mb-4">
            <div className="grid grid-cols-5 gap-2">
              {tableStatus.map((table) => (
                <div key={table.number}
                  className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm ${
                    table.status === "ready"     ? "bg-green-500 text-white ring-2 ring-green-300 animate-pulse" :
                    table.status === "occupied"  ? "bg-orange-500 text-white" :
                                                   "bg-gray-200 text-gray-600"
                  }`}
                >
                  {table.number}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2"><div className="size-3 bg-green-500 rounded" /><span>Ready</span></div>
              <div className="flex items-center gap-2"><div className="size-3 bg-orange-500 rounded" /><span>Occupied</span></div>
              <div className="flex items-center gap-2"><div className="size-3 bg-gray-200 rounded" /><span>Available</span></div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-4">
            <h3 className="font-semibold text-coffee-brown mb-3 flex items-center gap-2">
              <UtensilsCrossed className="size-4" /> Occupied Tables
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tables.filter((t) => t.status === "occupied").map((table) => (
                <div key={table.id} className="flex items-center justify-between p-2.5 bg-white/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-sm text-coffee-brown">Table {table.number}</p>
                    <p className="text-xs text-muted-foreground">{table.customerName}</p>
                  </div>
                  <button
                    onClick={() => makeTableAvailable(table.number)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle className="size-3" /> Free
                  </button>
                </div>
              ))}
              {tables.filter((t) => t.status === "occupied").length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">No occupied tables</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Picker Modal */}
      <AnimatePresence>
        {addItemOrderId && addItemOrder && (
          <ItemPicker
            title={`Add Item — Table ${addItemOrder.tableNumber}`}
            addedBy="waiter"
            orderId={addItemOrderId}
            onClose={() => setAddItemOrderId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
