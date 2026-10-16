import Morphir.Example.Lean.Pricing

/-!
# Verifying the pricing model

The definitions referenced here are generated from `../model/src/Morphir/Example/Lean/Pricing.elm` by the Morphir
Lean backend. The theorems state business rules that the model must satisfy. If the model changes in a way that breaks
a rule, regenerating the Lean code makes this file fail to compile.
-/

namespace PricingProofs

open Morphir.Example.Lean.Pricing

/-! ## Discount policy -/

/-- The combined discount never exceeds the cap set by policy. -/
theorem discount_le_max (tier : Tier) (quantity : Int) :
    discountPercent tier quantity ≤ maxDiscountPercent := by
  unfold discountPercent
  omega

/-- Discounts are never negative, so a discount can never increase the price. -/
theorem discount_nonneg (tier : Tier) (quantity : Int) : 0 ≤ discountPercent tier quantity := by
  unfold discountPercent maxDiscountPercent volumeDiscount
  cases tier <;> simp only [tierDiscount] <;> split <;> (try split) <;> omega

/-- A higher tier never gets a smaller discount than a lower one for the same quantity. -/
theorem gold_discount_ge_silver (quantity : Int) :
    discountPercent .silver quantity ≤ discountPercent .gold quantity := by
  unfold discountPercent
  simp only [tierDiscount]
  omega

theorem silver_discount_ge_standard (quantity : Int) :
    discountPercent .standard quantity ≤ discountPercent .silver quantity := by
  unfold discountPercent
  simp only [tierDiscount]
  omega

/-- Ordering more never reduces the discount. -/
theorem volume_discount_monotone (q₁ q₂ : Int) (h : q₁ ≤ q₂) : volumeDiscount q₁ ≤ volumeDiscount q₂ := by
  unfold volumeDiscount
  split <;> split <;> (try split) <;> (try split) <;> omega

/-! ## Prices -/

/-- Valid line items (positive quantity, non-negative price) never have a negative total. -/
theorem lineTotal_nonneg (tier : Tier) (item : LineItem)
    (hq : 0 ≤ item.quantity) (hp : 0 ≤ item.unitPrice) : 0 ≤ lineTotal tier item := by
  have hd := discount_le_max tier item.quantity
  have hd0 := discount_nonneg tier item.quantity
  unfold maxDiscountPercent at hd
  have hg : 0 ≤ lineGross item := by unfold lineGross; exact Int.mul_nonneg hq hp
  unfold lineTotal Morphir.SDK.Basics.integerDivide
  simp only []
  generalize lineGross item = g at *
  generalize discountPercent tier item.quantity = d at *
  rw [Int.tdiv_eq_ediv_of_nonneg (Int.mul_nonneg hg hd0)]
  have : g * d / 100 ≤ g := by
    apply Int.ediv_le_of_le_mul (by decide)
    have := Int.mul_le_mul_of_nonneg_left (show d ≤ 100 by omega) hg
    omega
  omega

/-- A discount never makes a line more expensive than its gross price. -/
theorem lineTotal_le_gross (tier : Tier) (item : LineItem)
    (hq : 0 ≤ item.quantity) (hp : 0 ≤ item.unitPrice) : lineTotal tier item ≤ lineGross item := by
  have hd0 := discount_nonneg tier item.quantity
  have hg : 0 ≤ lineGross item := by unfold lineGross; exact Int.mul_nonneg hq hp
  unfold lineTotal Morphir.SDK.Basics.integerDivide
  simp only []
  generalize lineGross item = g at *
  generalize discountPercent tier item.quantity = d at *
  rw [Int.tdiv_eq_ediv_of_nonneg (Int.mul_nonneg hg hd0)]
  have : 0 ≤ g * d / 100 := Int.ediv_nonneg (Int.mul_nonneg hg hd0) (by decide)
  omega

/-! ## Validation -/

/-- An order that passes validation is never empty. -/
theorem validateOrder_nonempty (order validated : Order)
    (h : validateOrder order = .ok validated) : order.items ≠ [] := by
  intro hEmpty
  unfold validateOrder at h
  rw [hEmpty] at h
  contradiction

/-- Validation rejects line items with a non-positive quantity. -/
theorem validateItem_rejects_zero_quantity (item : LineItem) (h : item.quantity ≤ 0) :
    validateItem item = .error (.invalidQuantity item.quantity) := by
  unfold validateItem
  simp [h]

/-! ## Concrete examples (checked by evaluation) -/

def sampleOrder : Order :=
  { tier := .gold, items := [{ quantity := 120, unitPrice := 250 }, { quantity := 3, unitPrice := 1000 }] }

/-- 120 × 2.50 with 25% (capped) off, plus 3 × 10.00 with 10% off. -/
example : orderTotal sampleOrder = 22500 + 2700 := by decide

example : validateOrder { tier := .standard, items := [] } = .error .emptyOrder := rfl

end PricingProofs
