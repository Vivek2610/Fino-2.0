import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, headingLevel = 3 }: { products: Product[]; headingLevel?: 2 | 3 }) {
  return (
    <div className="product-grid" data-stagger>
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} index={i} headingLevel={headingLevel} />
      ))}
    </div>
  );
}
