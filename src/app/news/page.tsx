/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save, 
  Image as ImageIcon,
  X,
  FileText,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import Image from "next/image";

interface NewsItem {
  id?: string;
  fallback: string;
  title: string;
  file?: File | null;
  image?: string;
  link: string;
}

interface FormDataType {
  id: string;
  type: string;
  values: NewsItem[];
}

export default function NewsPage({ type = "newsletter" }: { type: string }) {
  const [newsList, setNewsList] = useState<NewsItem[]>([
    { fallback: "", title: "", file: null, link: "" },
  ]);
  const [exists, setExists] = useState<FormDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/form/${type}`);
        if (!res.ok) return;

        const data: FormDataType[] = await res.json();

        if (data.length) {
          const item = data[0];
          const safeList = item.values.map((n) => ({
            id: n.id,
            fallback: n.fallback || "",
            title: n.title || "",
            file: null,
            image: n.image || "", // CORREÇÃO: mudado de imageUrl para image
            link: n.link || ""
          }));

          setExists(item);
          setNewsList(safeList);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadData();
  }, [type]);

  const addNews = () =>
    setNewsList([...newsList, { 
      fallback: "", 
      title: "", 
      file: null,
      link: ""
    }]);

  const handleChange = (index: number, field: keyof NewsItem, value: any) => {
    const newList = [...newsList];
    newList[index][field] = value;
    setNewsList(newList);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newList = [...newsList];
    newList[index].file = file;
    // Limpa a imagem do servidor quando um novo arquivo é selecionado
    if (file) {
      newList[index].image = "";
    }
    setNewsList(newList);
  };

  const getImageUrl = (news: NewsItem): string => {
    if (news.file) {
      return URL.createObjectURL(news.file);
    }
    if (news.image) {
      return news.image;
    }
    return "";
  };

  const updateNews = async (list: NewsItem[]) => {
    if (!exists) return;

    const filteredList = list.filter(
      n => n.fallback.trim() || n.title.trim() || n.file || n.link.trim() || n.image
    );

    const fd = new FormData();
    filteredList.forEach((n, i) => {
      fd.append(`values[${i}][fallback]`, n.fallback);
      fd.append(`values[${i}][title]`, n.title);
      fd.append(`values[${i}][link]`, n.link);
      if (n.file) {
        fd.append(`files`, n.file); // CORREÇÃO: enviar como 'files'
      }
    });
    fd.append("id", exists.id);

    const res = await fetch(`/api/form/${type}`, {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Falha ao atualizar dados");
    }

    const updated: FormDataType = await res.json();
    setExists(updated);
    // CORREÇÃO: usar 'image' em vez de 'imageUrl'
    setNewsList(updated.values.map(v => ({ ...v, file: null })));
  };

  const handleRemoveNews = async (index: number) => {
    if (newsList.length === 1) return;

    const newList = newsList.filter((_, i) => i !== index);
    setNewsList(newList);

    if (!exists) return;

    try {
      await updateNews(newList);
    } catch (err: any) {
      console.error("Erro ao remover notícia:", err);
      setErrorMsg(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const filteredList = newsList.filter(
        n => n.fallback.trim() || n.title.trim() || n.file || n.link.trim() || n.image
      );

      if (!filteredList.length) {
        setErrorMsg("Nenhuma notícia válida para enviar.");
        setLoading(false);
        return;
      }

      if (exists) {
        await updateNews(filteredList);
      } else {
        const fd = new FormData();
        filteredList.forEach((n, i) => {
          fd.append(`values[${i}][fallback]`, n.fallback);
          fd.append(`values[${i}][title]`, n.title);
          fd.append(`values[${i}][link]`, n.link);
          if (n.file) {
            fd.append(`files`, n.file); // CORREÇÃO: enviar como 'files'
          }
        });

        const res = await fetch(`/api/form/${type}`, {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Falha ao salvar dados");
        }

        const created: FormDataType = await res.json();
        setExists(created);
        // CORREÇÃO: usar 'image' em vez de 'imageUrl'
        setNewsList(created.values.map(v => ({ ...v, file: null })));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-[#0C8BD2] rounded-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#0C8BD2] bg-clip-text">
            {exists ? "Editar Newsletter" : "Criar Newsletter"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Gerencie a newsletter da sua empresa
          </p>
        </motion.div>

        <Card className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AnimatePresence>
              {newsList.map((news, index) => {
                const imageUrl = getImageUrl(news);
                const hasImage = !!news.image || !!news.file;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0C8BD2] rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          Newsletter #{index + 1}
                        </h3>
                      </div>
                      
                      {newsList.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => handleRemoveNews(index)}
                          className="!p-2 !rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Texto Alternativo para a imagem
                          </label>
                          <Input
                            type="text"
                            placeholder="Texto alternativo para acessibilidade..."
                            value={news.fallback}
                            onChange={(e: any) => handleChange(index, "fallback", e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Título
                          </label>
                          <Input
                            type="text"
                            placeholder="Título para a newsletter"
                            value={news.title}
                            onChange={(e: any) => handleChange(index, "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Imagem
                          </label>
                          
                          {imageUrl && (
                            <div className="mb-4">
                              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                Preview:
                              </p>
                              <div
                                className="relative inline-block cursor-pointer group"
                                onClick={() => setExpandedImage(imageUrl)}
                              >
                                <Image
                                  width={100}
                                  height={100}
                                  src={imageUrl}
                                  alt="Preview"
                                  className="h-32 w-32 object-cover rounded-lg border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-green-500 transition-all duration-200"
                                />
                                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm bg-black bg-opacity-50 px-3 py-1 rounded-lg">
                                    Ampliar
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(index, e.target.files?.[0] ?? null)}
                                className="hidden"
                              />
                              <div className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all duration-200 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
                                <ImageIcon className="w-5 h-5" />
                                {hasImage && !news.file ? "Alterar Imagem" : "Selecionar Imagem"}
                              </div>
                            </label>
                          </div>
                          
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {hasImage && !news.file
                              ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                              : "Formatos suportados: JPG, PNG, WEBP."}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Link da Newsletter
                          </label>
                          <Input
                            type="text"
                            placeholder="https://exemplo.com/newsletter"
                            value={news.link}
                            onChange={(e: any) => handleChange(index, "link", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={addNews}
                className="flex-1"
              >
                <Plus className="w-5 h-5" />
                Adicionar Nova Newsletter
              </Button>

              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                <Save className="w-5 h-5" />
                {exists ? "Atualizar Newsletters" : "Criar Newsletters"}
              </Button>
            </div>
          </form>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
              >
                <p className="text-green-700 dark:text-green-400 font-semibold text-center">
                  ✅ Dados salvos com sucesso!
                </p>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
              >
                <p className="text-red-700 dark:text-red-400 font-semibold text-center">
                  {errorMsg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Modal de Imagem Expandida */}
      <AnimatePresence>
        {expandedImage && (
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
              <Image
                src={expandedImage}
                width={500}
                height={500}
                alt="Preview expandido"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}