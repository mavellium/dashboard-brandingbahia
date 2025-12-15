/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { FileText, X, GripVertical, ArrowUpDown } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";
import { ImageUpload } from "@/components/Manage/ImageUpload";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NewsItem {
  id?: string;
  fallback: string;
  title: string;
  file?: File | null;
  image?: string;
  link: string;
}

// Componente de preview de imagem otimizado (definido fora para evitar erro de render)
const ImagePreviewComponent = ({ imageUrl, alt = "Preview" }: { imageUrl: string, alt?: string }) => {
  const isBlobUrl = imageUrl.startsWith('blob:');
  
  if (isBlobUrl) {
    // Para blob URLs, use img com tratamento de erro
    // eslint-disable-next-line @next/next/no-img-element
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

interface SortableNewsItemProps {
  news: NewsItem;
  index: number;
  originalIndex: number;
  isLastInOriginalList: boolean;
  isLastAndEmpty: boolean;
  showValidation: boolean;
  newsList: NewsItem[];
  handleChange: (index: number, field: keyof NewsItem, value: any) => void;
  handleFileChange: (index: number, file: File | null) => void;
  openDeleteSingleModal: (index: number, title: string) => void;
  setExpandedImage: (image: string | null) => void;
  getImageUrl: (news: NewsItem) => string;
  setNewItemRef?: (node: HTMLDivElement | null) => void;
}

function SortableNewsItem({
  news,
  index,
  originalIndex,
  isLastInOriginalList,
  isLastAndEmpty,
  showValidation,
  newsList,
  handleChange,
  handleFileChange,
  openDeleteSingleModal,
  setExpandedImage,
  getImageUrl,
  setNewItemRef,
}: SortableNewsItemProps) {
  // Usar useId para gerar um ID estável que seja o mesmo no servidor e no cliente
  const stableId = useId();
  const sortableId = news.id || `news-${index}-${stableId}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasTitle = news.title.trim() !== "";
  const hasFallback = news.fallback.trim() !== "";
  const hasLink = news.link.trim() !== "";
  const hasImage = Boolean(news.image?.trim() !== "" || news.file);
  const imageUrl = getImageUrl(news);

  // Combina as refs do sortable e do newItem se necessário
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // Primeiro, configura a ref do sortable
      setNodeRef(node);
      
      // Depois, se for o último item vazio e tivermos a função setNewItemRef
      if (isLastAndEmpty && setNewItemRef) {
        setNewItemRef(node);
      }
    },
    [setNodeRef, isLastAndEmpty, setNewItemRef]
  );

  return (
    <div
      ref={setRefs}
      style={style}
      className={`relative ${isDragging ? 'z-50' : ''}`}
    >
      <Card className={`mb-4 overflow-hidden transition-all duration-300 ${
        isLastInOriginalList && showValidation && !hasTitle ? 'ring-2 ring-red-500' : ''
      } ${isDragging ? 'shadow-lg scale-105' : ''}`}>
        <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-move text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <ArrowUpDown className="w-4 h-4" />
                <span>Posição: {index + 1}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Imagem
                </label>

                <ImageUpload
                  imageUrl={imageUrl}
                  hasImage={hasImage}
                  file={news.file || null}
                  onFileChange={(file) => handleFileChange(originalIndex, file)}
                  onExpand={setExpandedImage}
                  label="Imagem da Newsletter"
                  altText="Preview da newsletter"
                  imageInfo={hasImage && !news.file
                    ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                    : "Formatos suportados: JPG, PNG, WEBP."}
                  customPreview={imageUrl ? <ImagePreviewComponent imageUrl={imageUrl} /> : undefined}
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

  // Função para setar a ref do novo item
  const setNewItemRef = useCallback((node: HTMLDivElement | null) => {
    if (newItemRef && node) {
      (newItemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [newItemRef]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = newsList.findIndex((item) => 
        item.id === active.id || item.id?.includes(active.id as string)
      );
      const newIndex = newsList.findIndex((item) => 
        item.id === over.id || item.id?.includes(over.id as string)
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newList = arrayMove(newsList, oldIndex, newIndex);
        setNewsList(newList);
      }
    }
  };

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

      const fd = new FormData();
      
      if (exists) fd.append("id", exists.id);
      
      filteredList.forEach((n, i) => {
        fd.append(`values[${i}][fallback]`, n.fallback);
        fd.append(`values[${i}][title]`, n.title);
        fd.append(`values[${i}][link]`, n.link);
        fd.append(`values[${i}][image]`, n.image || "");
        
        if (n.file) {
          fd.append(`file${i}`, n.file);
        }
        
        if (n.id) {
          fd.append(`values[${i}][id]`, n.id);
        }
      });

      const method = exists ? "PUT" : "POST";
      const res = await fetch(`/api/form/${type}`, {
        method,
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao salvar dados");
      }

      const savedData = await res.json();
      const normalizedNews = savedData.values.map((v: any, index: number) => ({ 
        ...v, 
        id: v.id || `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        file: null 
      }));
      
      setNewsList(normalizedNews);
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
    // Garantir que estamos criando um novo objeto
    newList[index] = { ...newList[index], [field]: value };
    setNewsList(newList);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newList = [...newsList];
    // Garantir que estamos criando um novo objeto
    newList[index] = { ...newList[index], file };
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
      
      if (n.id) {
        fd.append(`values[${i}][id]`, n.id);
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

  // Gerar IDs estáveis para os itens sortable
  const stableIds = useMemo(() => 
    newsList.map((item, index) => item.id || `news-${index}-${Math.random().toString(36).substr(2, 9)}`),
    [newsList]
  );

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
            {search ? (
              // Modo busca - sem drag and drop
              filteredNews.map((news: any) => {
                const originalIndex = newsList.findIndex(n => n.id === news.id);
                const hasTitle = news.title.trim() !== "";
                const hasFallback = news.fallback.trim() !== "";
                const hasLink = news.link.trim() !== "";
                const hasImage = Boolean(news.image?.trim() !== "" || news.file);
                const isLastInOriginalList = originalIndex === newsList.length - 1;
                const isLastAndEmpty = isLastInOriginalList && !hasTitle && !hasFallback;
                const imageUrl = getImageUrl(news);

                return (
                  <div
                    key={news.id || `news-${originalIndex}`}
                    ref={isLastAndEmpty ? setNewItemRef : null}
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
                                file={news.file || null}
                                onFileChange={(file) => handleFileChange(originalIndex, file)}
                                onExpand={setExpandedImage}
                                label="Imagem da Newsletter"
                                altText="Preview da newsletter"
                                imageInfo={hasImage && !news.file
                                  ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                                  : "Formatos suportados: JPG, PNG, WEBP."}
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
              })
            ) : (
              // Modo normal - com drag and drop
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stableIds}
                  strategy={verticalListSortingStrategy}
                >
                  {newsList.map((news, index) => {
                    const originalIndex = index;
                    const hasTitle = news.title.trim() !== "";
                    const hasFallback = news.fallback.trim() !== "";
                    const isLastInOriginalList = index === newsList.length - 1;
                    const isLastAndEmpty = isLastInOriginalList && !hasTitle && !hasFallback;

                    return (
                      <SortableNewsItem
                        key={stableIds[index]}
                        news={news}
                        index={index}
                        originalIndex={originalIndex}
                        isLastInOriginalList={isLastInOriginalList}
                        isLastAndEmpty={isLastAndEmpty}
                        showValidation={showValidation}
                        newsList={newsList}
                        handleChange={handleChange}
                        handleFileChange={handleFileChange}
                        openDeleteSingleModal={openDeleteSingleModal}
                        setExpandedImage={setExpandedImage}
                        getImageUrl={getImageUrl}
                        setNewItemRef={isLastAndEmpty ? setNewItemRef : undefined}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
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
                // eslint-disable-next-line @next/next/no-img-element
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