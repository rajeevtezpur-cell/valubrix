import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { addSaleFeedbackAndRetrain } from "../engines/linearRegressionEngine";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SubmitSoldPriceModal({ open, onClose }: Props) {
  const [locality, setLocality] = useState("");
  const [propertyType, setPropertyType] = useState<
    "flat" | "villa" | "plot" | ""
  >("");
  const [sqft, setSqft] = useState("");
  const [actualSoldPrice, setActualSoldPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locality || !propertyType || !sqft || !actualSoldPrice) {
      toast.error("Please fill in all fields.");
      return;
    }
    const sqftNum = Number.parseFloat(sqft);
    const soldNum = Number.parseFloat(actualSoldPrice);
    if (sqftNum <= 0 || soldNum <= 0) {
      toast.error("Please enter valid numbers.");
      return;
    }
    setSubmitting(true);
    // pricePerSqft computed inside addSaleFeedbackAndRetrain
    addSaleFeedbackAndRetrain(locality, sqftNum, propertyType, soldNum);
    toast.success("Thank you! Your sale data improves AI accuracy.");
    setLocality("");
    setPropertyType("");
    setSqft("");
    setActualSoldPrice("");
    setSubmitting(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0f0f1a] border border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            Submit Sold Price
          </DialogTitle>
          <DialogDescription className="text-amber-400 font-medium">
            Help improve AI accuracy
          </DialogDescription>
        </DialogHeader>
        <p className="text-white/50 text-sm -mt-2">
          Share real transaction data to help ValuBrix AI learn from actual
          market prices.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Locality</Label>
            <Input
              data-ocid="submit_sold.locality.input"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder="e.g. Koramangala, Bangalore"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Property Type</Label>
            <Select
              value={propertyType}
              onValueChange={(v) =>
                setPropertyType(v as "flat" | "villa" | "plot")
              }
            >
              <SelectTrigger
                data-ocid="submit_sold.property_type.select"
                className="bg-white/5 border-white/10 text-white"
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                <SelectItem value="flat">Flat / Apartment</SelectItem>
                <SelectItem value="villa">Villa / Independent House</SelectItem>
                <SelectItem value="plot">Plot / Land</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">Area (sqft)</Label>
            <Input
              data-ocid="submit_sold.sqft.input"
              type="number"
              min="100"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              placeholder="e.g. 1200"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70 text-sm">
              Actual Sold Price (₹)
            </Label>
            <Input
              data-ocid="submit_sold.sold_price.input"
              type="number"
              min="100000"
              value={actualSoldPrice}
              onChange={(e) => setActualSoldPrice(e.target.value)}
              placeholder="e.g. 8500000"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              data-ocid="submit_sold.cancel_button"
              className="text-white/50 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-ocid="submit_sold.submit_button"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              Submit Sale Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
