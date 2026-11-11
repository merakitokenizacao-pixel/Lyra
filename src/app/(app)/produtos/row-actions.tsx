"use client";

import { Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useAction } from "@/components/ui/use-action";
import { deleteProduct, setProductActive } from "./actions";
import { ProductDialog, type ProductValues } from "./product-dialog";

export function ProductRowActions({ product }: { product: ProductValues }) {
  const toggle = useAction();
  return (
    <div className="flex justify-end gap-1">
      <ProductDialog
        product={product}
        trigger={
          <Button size="icon-sm" variant="ghost" title="Editar">
            <Pencil />
          </Button>
        }
      />
      <Button
        size="icon-sm"
        variant="ghost"
        title={product.active ? "Desativar" : "Ativar"}
        disabled={toggle.pending}
        onClick={() => toggle.run(() => setProductActive(product.id, !product.active))}
      >
        <Power />
      </Button>
      <ConfirmDialog
        title={`Excluir “${product.name}”?`}
        description="Propostas já criadas mantêm o item. Para apenas esconder do catálogo, desative o produto."
        action={() => deleteProduct(product.id)}
        trigger={
          <Button size="icon-sm" variant="ghost" title="Excluir">
            <Trash2 />
          </Button>
        }
      />
    </div>
  );
}
