"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'single' | 'all' | null;
  itemTitle: string;
  totalItems: number;
  itemName: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  itemTitle,
  totalItems,
  itemName
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 border-red-200 dark:border-red-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {type === 'all' ? `Limpar todos os ${itemName}s` : `Excluir ${itemName}`}
            </h3>
          </div>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {type === 'all' 
              ? `Tem certeza que deseja limpar todos os ${totalItems} ${itemName}s? Esta ação não pode ser desfeita.`
              : `Tem certeza que deseja excluir o ${itemName} "${itemTitle.substring(0, 50)}${itemTitle.length > 50 ? '...' : ''}"? Esta ação não pode ser desfeita.`
            }
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
              className="bg-[#0C8BD2] hover:bg-blue-600 text-white border-blue-500"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
            >
              {type === 'all' ? 'Limpar Tudo' : 'Excluir'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}