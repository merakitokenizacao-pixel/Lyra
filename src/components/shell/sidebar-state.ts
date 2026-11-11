import { useLayoutEffect, useSyncExternalStore } from "react";
import { SIDEBAR_COLLAPSED, SIDEBAR_STORAGE_KEY } from "./sidebar";

let collapsed: boolean | undefined;
const listeners = new Set<() => void>();

function readStored() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === SIDEBAR_COLLAPSED;
  } catch {
    return false;
  }
}

function getSnapshot() {
  collapsed ??= readStored();
  return collapsed;
}

// No servidor (e na hidratação) o menu está aberto; o CSS já mostra o estado certo antes disso.
function getServerSnapshot() {
  return false;
}

function apply(value: boolean) {
  collapsed = value;
  if (value) document.documentElement.dataset.sidebar = SIDEBAR_COLLAPSED;
  else delete document.documentElement.dataset.sidebar;
  listeners.forEach((listener) => listener());
}

/** Recolheu ou abriu em outra aba: acompanha. */
function onStorage(event: StorageEvent) {
  if (event.key === SIDEBAR_STORAGE_KEY) apply(event.newValue === SIDEBAR_COLLAPSED);
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setSidebarCollapsed(value: boolean) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? SIDEBAR_COLLAPSED : "expanded");
  } catch {
    // Sem localStorage (navegação privada restrita): vale até recarregar a página.
  }
  apply(value);
}

/**
 * Garante o atributo no <html>. Em produção o script do <head> já cuidou disso; em dev, o
 * remount do Strict Mode apaga os atributos do <html> que o React não controla.
 */
export function useSidebarAttribute() {
  useLayoutEffect(() => {
    apply(getSnapshot());
  }, []);
}
