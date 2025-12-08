/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { FileText, X } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";
import { ImageUpload } from "@/components/Manage/ImageUpload";
import Image from "next/image";

interface NewsItem {
  id?: string;
  fallback: string;
  title: string;
  file?: File | null;
  image?: string;
  link: string;
}

export default function NewsPage({ type = "newsletter" }: { type: string }) {
  const defaultNews = useMemo(() => ({ 
    fallback: "", 
    title: "", 
    file: null, 
    link: "", 
    image: "" 
  }), []);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const {
    list: newsList,
    setList: setNewsList,
    exists,
    loading,
    setLoading,
    success,
    setSuccess,
    errorMsg,
    setErrorMsg,
    search,
    setSearch,
    sortOrder,
    setSortOrder,
    showValidation,
    filteredItems: filteredNews,
    deleteModal,
    newItemRef,
    canAddNewItem,
    completeCount,
    addItem,
    openDeleteSingleModal,
    openDeleteAllModal,
    closeDeleteModal,
    confirmDelete,
    clearFilters,
  } = useListManagement<NewsItem>({
    type,
    apiPath: `/api/form/${type}`,
    defaultItem: defaultNews,
    validationFields: ["title", "fallback"]
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const filteredList = newsList.filter(
        n => n.title.trim() && n.fallback.trim()
      );

      if (!filteredList.length) {
        setErrorMsg("Adicione ao menos uma newsletter completa (com título e texto alternativo).");
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
          fd.append(`values[${i}][image]`, n.image || "");
          
          if (n.file) {
            fd.append(`file${i}`, n.file);
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

        const created = await res.json();
        setNewsList(created.values.map((v: any, index: number) => ({ 
          ...v, 
          id: v.id || `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          file: null 
        })));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro no submit:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof NewsItem, value: any) => {
    const newList = [...newsList];
    newList[index][field] = value;
    setNewsList(newList);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newList = [...newsList];
    newList[index].file = file;
    setNewsList(newList);
  };

  const getImageUrl = (news: NewsItem): string => {
    if (news.file) {
      return URL.createObjectURL(news.file);
    }
    if (news.image) {
      if (news.image.startsWith('http') || news.image.startsWith('//')) {
        return news.image;
      } else {
        return `https://mavellium.com.br${news.image.startsWith('/') ? '' : '/'}${news.image}`;
      }
    }
    return "";
  };

  const updateNews = async (list: NewsItem[]) => {
    if (!exists) return;

    const filteredList = list.filter(
      n => n.fallback.trim() || n.title.trim() || n.file || n.link.trim() || n.image
    );

    const fd = new FormData();
    
    fd.append("id", exists.id);
    
    filteredList.forEach((n, i) => {
      fd.append(`values[${i}][fallback]`, n.fallback);
      fd.append(`values[${i}][title]`, n.title);
      fd.append(`values[${i}][link]`, n.link);
      fd.append(`values[${i}][image]`, n.image || "");
      
      if (n.file) {
        fd.append(`file${i}`, n.file);
      }
    });

    const res = await fetch(`/api/form/${type}`, {
      method: "PUT",
      body: fd,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Falha ao atualizar dados");
    }

    const updated = await res.json();
    return updated;
  };

  // Função wrapper para o submit sem parâmetros
  const handleSubmitWrapper = () => {
    handleSubmit();
  };

  // Componente de preview de imagem otimizado
  const ImagePreview = ({ imageUrl, alt = "Preview" }: { imageUrl: string, alt?: string }) => {
    // Verificar se é uma blob URL (upload) ou URL externa
    const isBlobUrl = imageUrl.startsWith('blob:');
    
    if (isBlobUrl) {
      // Para blob URLs, use img com tratamento de erro
      return (
        <img
          src={imageUrl}
          alt={alt}
          className="h-32 w-32 object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
          onError={(e) => {
            console.error('Erro ao carregar imagem:', imageUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else {
      // Para URLs externas, use Image do Next.js com domínio configurado
      return (
        <Image
          src={imageUrl}
          alt={alt}
          width={128}
          height={128}
          className="h-32 w-32 object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
          onError={(e) => {
            console.error('Erro ao carregar imagem:', imageUrl);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
  };

  return (
    <ManageLayout
      headerIcon={FileText}
      title="Newsletter"
      description="Crie e gerencie suas newsletters"
      exists={!!exists}
      itemName="Newsletter"
    >
      {/* Controles */}
      <div className="mb-6 space-y-4">
        <SearchSortBar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearFilters={clearFilters}
          searchPlaceholder="Buscar newsletters..."
          total={newsList.length}
          showing={filteredNews.length}
          searchActiveText="ⓘ Busca ativa - não é possível adicionar nova newsletter"
        />
      </div>

      {/* Lista de Newsletters */}
      <div className="space-y-4 pb-32">
        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {filteredNews.map((news: any) => {
              const originalIndex = newsList.findIndex(n => n.id === news.id);
              const hasTitle = news.title.trim() !== "";
              const hasFallback = news.fallback.trim() !== "";
              const hasLink = news.link.trim() !== "";
              const hasImage = news.image?.trim() !== "" || news.file;
              const isLastInOriginalList = originalIndex === newsList.length - 1;
              const isLastAndEmpty = isLastInOriginalList && !hasTitle && !hasFallback;
              const imageUrl = getImageUrl(news);

              return (
                <div
                  key={news.id || originalIndex}
                  ref={isLastAndEmpty ? newItemRef : null}
                >
                  <Card className={`mb-4 overflow-hidden transition-all duration-300 ${
                    isLastInOriginalList && showValidation && !hasTitle ? 'ring-2 ring-red-500' : ''
                  }`}>
                    <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                      <ItemHeader
                        index={originalIndex}
                        fields={[
                          { label: 'Título', hasValue: hasTitle },
                          { label: 'Texto Alternativo', hasValue: hasFallback },
                          { label: 'Link', hasValue: hasLink },
                          { label: 'Imagem', hasValue: hasImage }
                        ]}
                        showValidation={showValidation}
                        isLast={isLastInOriginalList}
                        onDelete={() => openDeleteSingleModal(originalIndex, news.title)}
                        showDelete={newsList.length > 1}
                      />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Imagem
                            </label>

                            <ImageUpload
                              imageUrl={imageUrl}
                              hasImage={hasImage}
                              file={news.file}
                              onFileChange={(file) => handleFileChange(originalIndex, file)}
                              onExpand={setExpandedImage}
                              label="Imagem da Newsletter"
                              altText="Preview da newsletter"
                              imageInfo={hasImage && !news.file
                                ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                                : "Formatos suportados: JPG, PNG, WEBP."}
                              customPreview={imageUrl ? <ImagePreview imageUrl={imageUrl} /> : undefined}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Texto Alternativo para a imagem
                            </label>
                            <Input
                              type="text"
                              placeholder="Texto alternativo para acessibilidade..."
                              value={news.fallback}
                              onChange={(e: any) => handleChange(originalIndex, "fallback", e.target.value)}
                              autoFocus={isLastAndEmpty}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Título
                            </label>
                            <Input
                              type="text"
                              placeholder="Título para a newsletter"
                              value={news.title}
                              onChange={(e: any) => handleChange(originalIndex, "title", e.target.value)}
                              className="font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Link da Newsletter
                            </label>
                            <Input
                              type="text"
                              placeholder="https://exemplo.com/newsletter"
                              value={news.link}
                              onChange={(e: any) => handleChange(originalIndex, "link", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </AnimatePresence>
        </form>
      </div>

      {/* Componentes Fixos */}
      <FixedActionBar
        onDeleteAll={openDeleteAllModal}
        onAddNew={() => addItem()}
        onSubmit={handleSubmitWrapper}
        isAddDisabled={!canAddNewItem}
        isSaving={loading}
        exists={!!exists}
        completeCount={completeCount}
        totalCount={newsList.length}
        itemName="Newsletter"
        icon={FileText}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => confirmDelete(updateNews)}
        type={deleteModal.type}
        itemTitle={deleteModal.title}
        totalItems={newsList.length}
        itemName="Newsletter"
      />

      <FeedbackMessages success={success} errorMsg={errorMsg} />

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
              {expandedImage.startsWith('blob:') ? (
                <img
                  src={expandedImage}
                  alt="Preview expandido"
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                  onError={(e) => {
                    console.error('Erro ao carregar imagem expandida:', expandedImage);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Image
                  src={expandedImage}
                  alt="Preview expandido"
                  width={800}
                  height={600}
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ManageLayout>
  );
}