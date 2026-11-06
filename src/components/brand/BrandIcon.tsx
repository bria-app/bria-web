import { ShopIcon, type ShopIconName } from "./ShopIcons";
import { StepIcon, type StepIconName } from "./StepIcons";

/** Either of bria.'s own icon sets, by reference: `{ shop: "bolsa" }` or `{ step: "reloj" }`. */
export type BrandIconRef = { shop: ShopIconName } | { step: StepIconName };

export function BrandIcon({ icon, className, accentClassName }: { icon: BrandIconRef; className?: string; accentClassName?: string }) {
  return "shop" in icon ? (
    <ShopIcon name={icon.shop} className={className} accentClassName={accentClassName} />
  ) : (
    <StepIcon name={icon.step} className={className} accentClassName={accentClassName} />
  );
}
