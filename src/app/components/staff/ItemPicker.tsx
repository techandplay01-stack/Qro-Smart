import { useState } from "react";
import { Search, Plus, Minus, X, ShoppingBag, PackagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore, MenuItem, OrderItem, AddedBy } from "../../store";

interface Props {
  title: string;
  addedBy: AddedBy;
  /** If set, confirms and adds items to that order; otherwise returns items via onConfirm */
  orderId?: string;
  /** Called with selected items; used when orderId is not set (parcel creation) */
  onConfirm?: (items: OrderItem[]) => void;
  onClose: () => void;
  /** Allow custom items (name + price) — for parcel orders */
  allowCustom?: boolean;
}

export function ItemPicker({ title, addedBy, orderId, onConfirm, onClose, allowCustom = false }: Props) {
  const { menuItems, addItemToOrder } = useStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [qty, setQty] = useState<Record<string, number>>({});

  // Custom item state
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customItems, setCustomItems] = useState<OrderItem[]>([]);
  const [packagingCharge, setPackagingCharge] = useState(0);

  const categories = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))];

  const filtered = menuItems.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const adjust = (id: string, delta: number) =>
    setQty((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice) return;
    const price = parseFloat(customPrice);
    if (isNaN(price) || price <= 0) return;
    const customId = `CUSTOM_${Date.now()}`;
    const item: OrderItem = {
      id: customId,
      name: customName.trim(),
      description: "Custom item",
      price,
      category: "Custom",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=400&fit=crop",
      isVeg: true,
      quantity: 1,
      addedBy,
    };
    setCustomItems((prev) => [...prev, item]);
    setCustomName("");
    setCustomPrice("");
  };

  const removeCustom = (id: string) => setCustomItems((prev) => prev.filter((i) => i.id !== id));

  const selectedMenuItems: OrderItem[] = Object.entries(qty).map(([id, quantity]) => {
    const m = menuItems.find((i) => i.id === id)!;
    return { ...m, quantity, addedBy };
  });

  // Packaging charge as a virtual item
  const packagingItem: OrderItem | null =
    packagingCharge > 0
      ? {
          id: "PACKAGING",
          name: "Packaging Charge",
          description: "Packaging & handling",
          price: packagingCharge,
          category: "Charge",
          image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
          isVeg: true,
          quantity: 1,
          addedBy,
        }
      : null;

  const allSelected = [
    ...selectedMenuItems,
    ...customItems,
    ...(packagingItem ? [packagingItem] : []),
  ];

  const totalQty = allSelected.reduce((s, i) => s + i.quantity, 0);
  const subtotal  = allSelected.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleConfirm = () => {
    if (allSelected.length === 0) return;
    if (orderId) {
      allSelected.forEach((item) => addItemToOrder(orderId, item, addedBy as any));
      onClose();
    } else if (onConfirm) {
      onConfirm(allSelected);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-white/95 backdrop-blur-lg rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-coffee-brown">{title}</h2>
          <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-black/10">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Search + Categories */}
          <div className="px-4 pt-3 pb-2 sticky top-0 bg-white/95 backdrop-blur z-10">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search menu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-brown"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all font-medium ${
                    selectedCategory === c ? "bg-coffee-brown text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {filtered.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-24 object-cover" />
                <div className="p-2">
                  <p className="font-semibold text-xs text-coffee-brown line-clamp-1">{item.name}</p>
                  <p className="font-bold text-sm text-coffee-brown">₹{item.price}</p>
                  <div className="mt-1.5">
                    {qty[item.id] ? (
                      <div className="flex items-center justify-between bg-coffee-brown rounded-full px-2 py-0.5">
                        <button onClick={() => adjust(item.id, -1)} className="text-white">
                          <Minus className="size-3" />
                        </button>
                        <span className="text-white text-xs font-bold">{qty[item.id]}</span>
                        <button onClick={() => adjust(item.id, 1)} className="text-white">
                          <Plus className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => adjust(item.id, 1)}
                        className="w-full py-1 bg-coffee-brown text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Plus className="size-3" /> Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Items (parcel only) */}
          {allowCustom && (
            <div className="px-4 pb-3">
              <div className="border-t border-gray-200 pt-3 mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custom Item / Charge</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Item name"
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-brown"
                  />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="₹ Price"
                    className="w-24 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-brown"
                  />
                  <button
                    onClick={addCustomItem}
                    className="px-3 py-2 bg-coffee-brown text-white rounded-xl text-sm font-semibold"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                {customItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {customItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                        <span className="text-sm font-medium text-coffee-brown">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">₹{item.price}</span>
                          <button onClick={() => removeCustom(item.id)} className="text-red-400 hover:text-red-600">
                            <X className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Packaging charge */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <PackagePlus className="size-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-800 flex-1">Packaging Charge</span>
                <input
                  type="number"
                  value={packagingCharge || ""}
                  onChange={(e) => setPackagingCharge(parseFloat(e.target.value) || 0)}
                  placeholder="₹0"
                  className="w-20 px-2 py-1 bg-white border border-blue-200 rounded-lg text-sm text-right focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - selection summary + confirm */}
        <div className="border-t border-border px-4 py-3 bg-white/95">
          {totalQty > 0 ? (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-coffee-brown" />
                <span className="text-sm font-semibold text-coffee-brown">{totalQty} item{totalQty > 1 ? "s" : ""}</span>
              </div>
              <span className="font-bold text-coffee-brown">₹{subtotal.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">(+5% tax)</span></span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center mb-2">Select items to add</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={totalQty === 0}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
              totalQty > 0 ? "bg-coffee-brown hover:bg-coffee-brown/90" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {orderId ? "Add to Order" : "Create Parcel Order"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
