import { redirect } from "next/navigation";

import { getPublicMerchProducts } from "@/lib/public-merch";

import { MerchShop } from "./MerchShop";

export default async function MerchPage() {
  const products = await getPublicMerchProducts();
  if (products.length === 0) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-cork-plum pt-28 pb-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <MerchShop products={products} />
      </div>
    </main>
  );
}
