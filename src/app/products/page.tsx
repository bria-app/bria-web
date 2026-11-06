import { redirect } from "next/navigation";

/**
 * Products and inventory are one screen now: the catalog at /inventory shows stock, prices,
 * cost and margin as columns and manages categories. This URL stays for old links and for
 * the shell's «Crear → Producto» (/products?nuevo=1), which still opens the new-product form.
 */
export default async function ProductsRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { nuevo } = await searchParams;
  redirect(nuevo === "1" ? "/inventory?nuevo=1" : "/inventory");
}
