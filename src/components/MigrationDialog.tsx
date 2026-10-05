"use client";

import { Modal } from "./Modal";

interface MigrationDialogProps {
  count: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function MigrationDialog({ count, onAccept, onDecline }: MigrationDialogProps) {
  return (
    <Modal open title="¿Importar tus datos locales?" onClose={onDecline}>
      <p className="mb-5 text-sm text-slate-600">
        Tienes {count} {count === 1 ? "concepto guardado" : "conceptos guardados"} en este navegador sin
        cuenta. ¿Quieres añadirlos a tu cuenta para no perderlos?
      </p>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onAccept}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Importar a mi cuenta
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          No, gracias
        </button>
      </div>
    </Modal>
  );
}
