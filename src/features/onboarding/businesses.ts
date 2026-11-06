import {
  BookOpen, Droplets, Footprints, PawPrint, Pill, Shirt, Smartphone, Store, Wrench, type LucideIcon,
} from "lucide-react";
import type { CustomFieldType } from "@/types/custom-fields";

/** A product column suggested for a kind of shop (created with `custom-fields/ensure`). */
export interface FieldPreset {
  label: string;
  field_type: CustomFieldType;
  options?: string[];
  /** Why it helps, shown under the chip. */
  hint: string;
}

export interface BusinessType {
  id: string;
  /** Saved as the company's `business_type`. */
  label: string;
  tagline: string;
  icon: LucideIcon;
  /** Product types most shops of this kind start with. */
  categories: string[];
  fields: FieldPreset[];
}

const EXPIRY: FieldPreset = { label: "Fecha de vencimiento", field_type: "date", hint: "Para vender primero lo que vence antes" };
const BRAND: FieldPreset = { label: "Marca", field_type: "text", hint: "Para buscar y filtrar por marca" };
const COLOR: FieldPreset = { label: "Color", field_type: "text", hint: "Rojo, negro, azul marino…" };

/** The kinds of shop you find in Lima, from Gamarra to la botica de la esquina. */
export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "bodega", label: "Bodega / Minimarket", tagline: "Abarrotes, bebidas y snacks", icon: Store,
    categories: ["Abarrotes", "Bebidas", "Snacks y golosinas", "Lácteos", "Limpieza", "Cuidado personal"],
    fields: [BRAND, { label: "Presentación", field_type: "text", hint: "1 L, 500 g, pack de 6…" }, EXPIRY],
  },
  {
    id: "ropa", label: "Ropa y moda", tagline: "Polos, jeans, moda de Gamarra", icon: Shirt,
    categories: ["Polos y blusas", "Pantalones y jeans", "Vestidos", "Casacas", "Accesorios"],
    fields: [
      { label: "Talla", field_type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"], hint: "Elige de una lista: XS a XXL" },
      COLOR,
      { label: "Material", field_type: "text", hint: "Algodón, denim, lino…" },
      { label: "Temporada", field_type: "select", options: ["Verano", "Invierno", "Todo el año"], hint: "Para saber qué rematar" },
    ],
  },
  {
    id: "calzado", label: "Zapatería", tagline: "Calzado para toda la familia", icon: Footprints,
    categories: ["Zapatillas", "Zapatos", "Sandalias", "Botas", "Escolares"],
    fields: [
      { label: "Talla", field_type: "select", options: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"], hint: "De la 34 a la 44" },
      COLOR,
      { label: "Público", field_type: "select", options: ["Hombre", "Mujer", "Niños", "Unisex"], hint: "Para quién es" },
    ],
  },
  {
    id: "farmacia", label: "Farmacia / Botica", tagline: "Medicinas y cuidado personal", icon: Pill,
    categories: ["Medicamentos", "Vitaminas", "Cuidado personal", "Bebés", "Primeros auxilios"],
    fields: [
      { label: "Laboratorio", field_type: "text", hint: "Quién lo fabrica" },
      { label: "Lote", field_type: "text", hint: "Para ubicarlo si hay un retiro" },
      EXPIRY,
      { label: "Requiere receta", field_type: "boolean", hint: "Sí o no, para avisar en la caja" },
    ],
  },
  {
    id: "cosmetica", label: "Perfumería y cosméticos", tagline: "Perfumes, cuidado de la piel y maquillaje", icon: Droplets,
    categories: ["Perfumes", "Maquillaje", "Cuidado de la piel", "Cabello", "Uñas"],
    fields: [BRAND, { label: "Tono", field_type: "text", hint: "Nude, 02 claro…" }, { label: "Contenido", field_type: "text", hint: "100 ml, 30 g…" }, EXPIRY],
  },
  {
    id: "tecnologia", label: "Celulares y tecnología", tagline: "Equipos, accesorios y repuestos", icon: Smartphone,
    categories: ["Celulares", "Accesorios", "Audio", "Cargadores y cables", "Repuestos"],
    fields: [
      BRAND,
      { label: "Modelo", field_type: "text", hint: "Galaxy A15, Redmi 13…" },
      { label: "Garantía (meses)", field_type: "number", hint: "Para responder rápido en la caja" },
      COLOR,
    ],
  },
  {
    id: "ferreteria", label: "Ferretería", tagline: "Herramientas, gasfitería, eléctricos", icon: Wrench,
    categories: ["Herramientas", "Gasfitería", "Electricidad", "Pinturas", "Construcción"],
    fields: [BRAND, { label: "Medida", field_type: "text", hint: "1/2\", 2.5 mm², 4 L…" }],
  },
  {
    id: "libreria", label: "Librería y bazar", tagline: "Útiles, regalos y papelería", icon: BookOpen,
    categories: ["Útiles escolares", "Oficina", "Papelería", "Regalos", "Juguetes"],
    fields: [BRAND, COLOR],
  },
  {
    id: "petshop", label: "Pet shop / Veterinaria", tagline: "Alimento y accesorios de mascotas", icon: PawPrint,
    categories: ["Alimento", "Accesorios", "Higiene", "Salud", "Juguetes"],
    fields: [
      { label: "Especie", field_type: "select", options: ["Perro", "Gato", "Ave", "Otro"], hint: "Para quién es" },
      { label: "Etapa", field_type: "select", options: ["Cachorro", "Adulto", "Senior"], hint: "Cachorro, adulto o senior" },
      EXPIRY,
    ],
  },
];

export const businessByLabel = (label: string | null | undefined): BusinessType | null =>
  BUSINESS_TYPES.find((b) => b.label === label) ?? null;

/** Columns that help almost any shop, offered when the rubro has no preset of its own. */
export const GENERIC_FIELDS: FieldPreset[] = [BRAND, COLOR, EXPIRY];
