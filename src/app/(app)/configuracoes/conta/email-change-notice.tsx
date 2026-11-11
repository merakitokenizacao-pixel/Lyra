"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** Aviso da volta dos links de troca de e-mail: ?email=confirmado | parcial | erro. */
export function EmailChangeNotice({ email }: { email: string }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const status = params.get("email");

  useEffect(() => {
    if (!status) return;
    const id = "email-change";
    if (status === "confirmado") {
      toast.success(`E-mail alterado. Agora você entra com ${email}.`, { id });
    } else if (status === "parcial") {
      toast.info("Primeiro link confirmado. Agora abra o link que mandamos para o outro e-mail.", { id, duration: 10_000 });
    } else if (status === "erro") {
      toast.error("Não deu para confirmar a troca de e-mail: o link expirou ou já foi usado. Peça de novo.", {
        id,
        duration: 10_000,
      });
    }
    // Tira o aviso do endereço para ele não voltar quando a página for recarregada
    window.history.replaceState(null, "", `${pathname}${window.location.hash}`);
  }, [status, email, pathname]);

  return null;
}
