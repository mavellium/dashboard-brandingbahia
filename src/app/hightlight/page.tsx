/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Video, Clock, X, Trash2, Play } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";

interface HighlightItem {
  id?: string;
  textLists: string[];
  video: string;
  videoDuration: number;
  videoFile?: File | null;
}

export default function HighlightsPage({ type = "highlights" }: { type: string }) {
  const defaultHighlight = useMemo(() => ({
    textLists: ["", ""],
    video: "",
    videoDuration: 0,
    videoFile: null,
  }), []);

  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const {
    list: highlights,
    setList: setHighlights,
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
    filteredItems: filteredHighlights,
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
  } = useListManagement<HighlightItem>({
    type,
    apiPath: `/api/form/highlights`,
    defaultItem: defaultHighlight,
    validationFields: ["textLists", "video"]
  });

  console.log(highlights)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const filteredList = highlights.filter(
        h => h.textLists.some(text => text.trim()) && (h.video.trim() || h.videoFile)
      );

      if (!filteredList.length) {
        setErrorMsg("Adicione ao menos um destaque completo (com textos e vídeo).");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      
      filteredList.forEach((highlight, hIndex) => {
        highlight.textLists.forEach((text, tIndex) => {
          fd.append(`values[${hIndex}][textLists][${tIndex}]`, text);
        });
        fd.append(`values[${hIndex}][video]`, highlight.video);
        fd.append(`values[${hIndex}][videoDuration]`, highlight.videoDuration.toString());
        
        if (highlight.videoFile) {
          fd.append(`video${hIndex}`, highlight.videoFile);
        }
      });

      const method = exists ? "PUT" : "POST";
      const url = exists ? `/api/form/${type}?id=${exists.id}` : `/api/form/${type}`;

      const res = await fetch(url, {
        method,
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Falha ao salvar dados");
      }

      const savedData = await res.json();
      const normalizedHighlights = savedData.values.map((v: any, index: number) => ({
        ...v,
        id: v.id || `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        textLists: Array.isArray(v.textLists) ? v.textLists : [v.textLists || ""],
        videoFile: null,
      }));
      
      setHighlights(normalizedHighlights);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro no submit:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof HighlightItem, value: any) => {
    const newList = [...highlights];
    if (field === 'textLists') {
      newList[index].textLists = value;
    } else if (field === 'videoDuration') {
      newList[index].videoDuration = parseInt(value) || 0;
    } else {
      newList[index][field] = value;
    }
    setHighlights(newList);
  };

  const handleTextItemChange = (index: number, textIndex: number, value: string) => {
    const newList = [...highlights];
    newList[index].textLists[textIndex] = value;
    setHighlights(newList);
  };

  const addTextItem = (index: number) => {
    const newList = [...highlights];
    newList[index].textLists.push("");
    setHighlights(newList);
  };

  const removeTextItem = (index: number, textIndex: number) => {
    const newList = [...highlights];
    if (newList[index].textLists.length > 1) {
      newList[index].textLists = newList[index].textLists.filter((_, i) => i !== textIndex);
      setHighlights(newList);
    }
  };

  const handleVideoFileChange = (index: number, file: File | null) => {
    const newList = [...highlights];
    newList[index].videoFile = file;
    setHighlights(newList);
  };

  const getVideoUrl = (highlight: HighlightItem): string => {
    if (highlight.videoFile) {
      return URL.createObjectURL(highlight.videoFile);
    }
    if (highlight.video) {
      if (highlight.video.startsWith('http') || highlight.video.startsWith('//')) {
        return highlight.video;
      } else {
        return `https://mavellium.com.br${highlight.video.startsWith('/') ? '' : '/'}${highlight.video}`;
      }
    }
    return "";
  };

  // Função wrapper para o submit sem parâmetros
  const handleSubmitWrapper = () => {
    handleSubmit();
  };

  // Função para atualizar destaques no servidor (usada na exclusão)
  const updateHighlights = async (list: HighlightItem[]) => {
    if (!exists) return;

    const filteredList = list.filter(
      h => h.textLists.some(text => text.trim()) || h.video.trim() || h.videoFile
    );

    const fd = new FormData();
    
    filteredList.forEach((highlight, hIndex) => {
      highlight.textLists.forEach((text, tIndex) => {
        fd.append(`values[${hIndex}][textLists][${tIndex}]`, text);
      });
      fd.append(`values[${hIndex}][video]`, highlight.video);
      fd.append(`values[${hIndex}][videoDuration]`, highlight.videoDuration.toString());
      
      if (highlight.videoFile) {
        fd.append(`video${hIndex}`, highlight.videoFile);
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

    const updated = await res.json();
    return updated;
  };

  return (
    <ManageLayout
      headerIcon={Video}
      title="Destaques"
      description="Crie e gerencie destaques com textos e vídeos promocionais"
      exists={!!exists}
      itemName="Destaque"
    >
      {/* Controles */}
      <div className="mb-6 space-y-4">
        <SearchSortBar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearFilters={clearFilters}
          searchPlaceholder="Buscar destaques..."
          total={highlights.length}
          showing={filteredHighlights.length}
          searchActiveText="ⓘ Busca ativa - não é possível adicionar novo destaque"
        />
      </div>

      {/* Lista de Destaques */}
      <div className="space-y-4 pb-32">
        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {filteredHighlights.map((highlight: any) => {
              const originalIndex = highlights.findIndex(h => h.id === highlight.id);
              const hasText = highlight.textLists.some((text: string) => text.trim() !== "");
              const hasVideo = highlight.video.trim() !== "" || highlight.videoFile;
              const hasDuration = highlight.videoDuration > 0;
              const isLastInOriginalList = originalIndex === highlights.length - 1;
              const isLastAndEmpty = isLastInOriginalList && !hasText && !hasVideo;
              const videoUrl = getVideoUrl(highlight);
              const textLists = Array.isArray(highlight.textLists) 
                ? highlight.textLists 
                : [highlight.textLists || ""];

              return (
                <div
                  key={highlight.id || originalIndex}
                  ref={isLastAndEmpty ? newItemRef : null}
                >
                  <Card className={`mb-4 overflow-hidden transition-all duration-300 ${
                    isLastInOriginalList && showValidation && (!hasText || !hasVideo) ? 'ring-2 ring-red-500' : ''
                  }`}>
                    <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                      <ItemHeader
                        index={originalIndex}
                        fields={[
                          { label: 'Textos', hasValue: hasText },
                          { label: 'Vídeo', hasValue: hasVideo },
                          { label: 'Duração', hasValue: hasDuration }
                        ]}
                        showValidation={showValidation}
                        isLast={isLastInOriginalList}
                        onDelete={() => openDeleteSingleModal(originalIndex, highlight.textLists[0] || "Destaque")}
                        showDelete={highlights.length > 1}
                      />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Lista de Textos
                              </label>
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => addTextItem(originalIndex)}
                                className="!p-1 !rounded-lg text-xs"
                              >
                                Adicionar Texto
                              </Button>
                            </div>

                            <div className="space-y-3">
                              <AnimatePresence>
                                {textLists.map((text: string, textIndex: number) => (
                                  <motion.div
                                    key={textIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-start gap-3"
                                  >
                                    <div className="flex-1">
                                      <Input
                                        type="text"
                                        placeholder={`Texto ${textIndex + 1}...`}
                                        value={text}
                                        onChange={(e: any) => handleTextItemChange(originalIndex, textIndex, e.target.value)}
                                        autoFocus={isLastAndEmpty && textIndex === 0}
                                      />
                                    </div>
                                    
                                    {textLists.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="danger"
                                        onClick={() => removeTextItem(originalIndex, textIndex)}
                                        className="!p-2 !rounded-lg mt-1"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              URL do Vídeo
                            </label>
                            <Input
                              type="url"
                              placeholder="https://exemplo.com/video.mp4"
                              value={highlight.video}
                              onChange={(e: any) => handleChange(originalIndex, "video", e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Duração do Vídeo (segundos)
                            </label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                              <Input
                                type="number"
                                placeholder="120"
                                value={highlight.videoDuration.toString()}
                                onChange={(e: any) => handleChange(originalIndex, "videoDuration", e.target.value)}
                                className="pl-10"
                                min="0"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Vídeo
                            </label>

                            {/* Upload de Vídeo - similar ao ImageUpload do exemplo */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleVideoFileChange(originalIndex, e.target.files?.[0] ?? null)
                                    }
                                    className="hidden"
                                  />
                                  <div className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all duration-200 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
                                    <Video className="w-5 h-5" />
                                    {highlight.video && !highlight.videoFile ? "Alterar Vídeo" : "Selecionar Vídeo"}
                                  </div>
                                </label>
                              </div>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {hasVideo && !highlight.videoFile
                                  ? "Vídeo atual do servidor. Selecione um novo arquivo para substituir."
                                  : "Formatos suportados: MP4, WEBM, MOV."}
                              </p>

                              {videoUrl && (
                                <div>
                                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Preview do Vídeo
                                  </label>
                                  <div
                                    className="relative cursor-pointer group"
                                    onClick={() => setExpandedVideo(videoUrl)}
                                  >
                                    <video
                                      src={videoUrl}
                                      className="w-full h-32 object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
                                      controls={false}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-xl flex items-center justify-center">
                                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <Play className="w-5 h-5 text-white fill-current" />
                                      </div>
                                      <span className="absolute bottom-2 left-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                        Expandir
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center">
                                    Duração: {highlight.videoDuration} segundos
                                  </p>
                                </div>
                              )}
                            </div>
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
        totalCount={highlights.length}
        itemName="Destaque"
        icon={Video}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => confirmDelete(updateHighlights)}
        type={deleteModal.type}
        itemTitle={deleteModal.title}
        totalItems={highlights.length}
        itemName="Destaque"
      />

      <FeedbackMessages success={success} errorMsg={errorMsg} />

      {/* Modal de Vídeo Expandido */}
      <AnimatePresence>
        {expandedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                onClick={() => setExpandedVideo(null)}
                className="absolute -top-4 -right-4 !p-3 !rounded-full bg-red-500 hover:bg-red-600 z-10"
              >
                <X className="w-5 h-5" />
              </Button>
              <video
                src={expandedVideo}
                controls
                autoPlay
                className="w-full h-auto max-h-[80vh] rounded-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ManageLayout>
  );
}