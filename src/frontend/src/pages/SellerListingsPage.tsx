import { Link } from "@tanstack/react-router";
import {
  BarChart2,
  Check,
  Edit,
  Eye,
  Home,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import SellerLayout from "../components/SellerLayout";
import { useAuth } from "../context/AuthContext";
import {
  deleteListing,
  getSellerListings,
  updateListingStatus,
} from "../services/listingService";

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400",
  Draft: "bg-amber-500/20 text-amber-400",
  Sold: "bg-blue-500/20 text-blue-400",
};

function loadUserListings(user: any) {
  try {
    return getSellerListings(user).map((ul: any) => ({
      id: String(ul.id),
      title: ul.title,
      locality: ul.locality || ul.city || "Unknown",
      price: ul.price || "₹0",
      area: ul.area || "",
      type: ul.type || "Property",
      status: ul.status || "Active",
      views: ul.views || 0,
      saves: ul.saves || 0,
      amenities: ul.amenities || [],
    }));
  } catch {
    return [];
  }
}

export default function SellerListingsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"All" | "Active" | "Draft" | "Sold">(
    "All",
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [listings, setListings] = useState(() => loadUserListings(user));
  const [soldSuccess, setSoldSuccess] = useState<string | null>(null);

  // Refresh on mount, on user change, on focus, and on listing updates
  useEffect(() => {
    const refresh = () => setListings(loadUserListings(user));
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("valubrix:listings-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("valubrix:listings-updated", refresh);
    };
  }, [user]);

  const filtered =
    filter === "All" ? listings : listings.filter((l) => l.status === filter);

  const handleDelete = (id: string) => {
    setListings((prev) => prev.filter((l) => String(l.id) !== String(id)));
    deleteListing(id);
    setDeleteId(null);
  };

  const handleMarkSold = (id: string) => {
    setListings((prev) =>
      prev.map((l) =>
        String(l.id) === String(id) ? { ...l, status: "Sold" } : l,
      ),
    );
    updateListingStatus(id, "Sold");
    setSoldSuccess(id);
    setTimeout(() => setSoldSuccess(null), 2000);
  };

  return (
    <SellerLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              My <span className="text-[#D4AF37]">Listings</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {listings.length} total properties
            </p>
          </div>
          <Link
            to="/seller/list-property"
            data-ocid="seller.listings.create.primary_button"
            className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8960C] text-black font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus size={16} /> New Listing
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(["All", "Active", "Draft", "Sold"] as const).map((f) => (
            <button
              key={f}
              type="button"
              data-ocid="seller.listings.filter.tab"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-[#D4AF37] text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{
                  y: -2,
                  boxShadow: "0 4px 20px rgba(212,175,55,0.1)",
                }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
                data-ocid={`seller.listings.item.${i + 1}`}
              >
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                  <Home size={24} className="text-[#D4AF37]/60" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-semibold truncate">
                      {listing.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_COLORS[listing.status] ||
                        "bg-white/10 text-white/50"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      {listing.type}
                    </span>
                  </div>
                  <p className="text-white/40 text-sm mt-0.5">
                    {listing.locality} · {listing.area}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[#D4AF37] font-bold text-sm">
                      {listing.price}
                    </span>
                    <span className="text-white/30 text-xs">
                      <Eye size={12} className="inline mr-1" />
                      {listing.views} views
                    </span>
                    <span className="text-white/30 text-xs">
                      <Star size={12} className="inline mr-1" />
                      {listing.saves} saves
                    </span>
                  </div>
                  {listing.amenities && listing.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(listing.amenities as string[])
                        .slice(0, 4)
                        .map((a: string) => (
                          <span
                            key={a}
                            className="text-xs bg-white/5 text-white/60 px-2 py-0.5 rounded border border-white/10"
                          >
                            {a}
                          </span>
                        ))}
                      {listing.amenities.length > 4 && (
                        <span className="text-xs text-white/40">
                          +{listing.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <Link
                    to="/seller/performance"
                    data-ocid="seller.listings.view.button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-all"
                  >
                    <BarChart2 size={12} /> Performance
                  </Link>
                  <Link
                    to="/seller/list-property"
                    data-ocid="seller.listings.edit.button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-medium transition-all"
                  >
                    <Edit size={12} /> Edit
                  </Link>
                  {listing.status !== "Sold" && (
                    <button
                      type="button"
                      data-ocid="seller.listings.sold.button"
                      onClick={() => handleMarkSold(listing.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        soldSuccess === listing.id
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      <Check size={12} />
                      {soldSuccess === listing.id
                        ? "Marked Sold!"
                        : "Mark Sold"}
                    </button>
                  )}
                  <button
                    type="button"
                    data-ocid="seller.listings.delete.button"
                    onClick={() => setDeleteId(listing.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div
              className="text-center py-16 text-white/30"
              data-ocid="seller.listings.empty_state"
            >
              <Home size={40} className="mx-auto mb-3 opacity-30" />
              <p>
                {listings.length === 0
                  ? "You have no listings yet. Create your first listing!"
                  : "No listings in this category"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            data-ocid="seller.listings.delete.dialog"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0A0F1F] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4"
            >
              <h3 className="text-white font-bold text-lg mb-2">
                Delete Listing?
              </h3>
              <p className="text-white/50 text-sm mb-6">
                This action cannot be undone. The listing will be permanently
                removed.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  data-ocid="seller.listings.delete.confirm_button"
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-all"
                >
                  Delete
                </button>
                <button
                  type="button"
                  data-ocid="seller.listings.delete.cancel_button"
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-medium text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SellerLayout>
  );
}
