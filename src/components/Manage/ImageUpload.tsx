// components/Manage/ImageUpload.tsx atualizado
"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/Button";

interface ImageUploadProps {
  imageUrl: string;
  hasImage: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onExpand?: (url: string) => void;
  label?: string;
  altText?: string;
  imageInfo?: string;
  customPreview?: ReactNode;
}

export function ImageUpload({
  imageUrl,
  hasImage,
  file,
  onFileChange,
  onExpand,
  label = "Imagem",
  altText = "Preview",
  imageInfo = "Formatos suportados: JPG, PNG, WEBP",
  customPreview
}: ImageUploadProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const handleExpand = (url: string) => {
    if (onExpand) {
      onExpand(url);
    } else {
      setExpandedImage(url);
    }
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          {label}
        </label>
        
        {imageUrl && (
          <div className="mb-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
              Preview:
            </p>
            <div
              className="relative inline-block cursor-pointer group"
              onClick={() => handleExpand(imageUrl)}
            >
              {customPreview ? (
                <div className="h-48 w-full object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200">
                  {customPreview}
                  <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-xl flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                      Ampliar
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Image
                    width={200}
                    height={150}
                    src={imageUrl}
                    alt={altText}
                    className="h-48 w-full object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
                  />
                  <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-xl flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                      Ampliar
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all duration-200 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
              <ImageIcon className="w-5 h-5" />
              {hasImage && !file ? "Alterar Imagem" : "Selecionar Imagem"}
            </div>
          </label>
        </div>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
          {hasImage && !file
            ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
            : imageInfo}
        </p>
      </div>

      {/* Modal de Imagem Expandida */}
      <AnimatePresence>
        {expandedImage && !onExpand && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                onClick={() => setExpandedImage(null)}
                className="absolute -top-4 -right-4 !p-3 !rounded-full bg-red-500 hover:bg-red-600 z-10"
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={expandedImage}
                alt="Preview expandido"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                onError={(e) => {
                  console.error('Erro ao carregar imagem expandida:', expandedImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}