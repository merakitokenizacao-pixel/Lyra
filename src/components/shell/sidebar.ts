/* Menu lateral do desktop: aberto ou recolhido (só os ícones).
   A escolha fica no localStorage. O script abaixo roda no <head>, antes da primeira
   pintura, e marca o <html> com data-sidebar="collapsed"; a variante `collapsed:`
   (globals.css) lê esse atributo. Assim o menu já abre do jeito certo, sem piscar. */

export const SIDEBAR_STORAGE_KEY = "lyro:sidebar";
export const SIDEBAR_COLLAPSED = "collapsed";

export const sidebarInitScript = `try{if(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="${SIDEBAR_COLLAPSED}")document.documentElement.dataset.sidebar="${SIDEBAR_COLLAPSED}"}catch(e){}`;

/**
 * Texto que some no menu recolhido: sai rápido e só volta quando a largura já quase abriu.
 * (Visibilidade também transiciona: com `collapsed:invisible`, o elemento sai do Tab só no fim.)
 */
export const SIDEBAR_FADE =
  "transition-[opacity,visibility] duration-150 delay-100 collapsed:opacity-0 collapsed:delay-0 collapsed:duration-100 motion-reduce:transition-none";
