/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save, 
  Video,
  X,
  Play,
  Clock,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

interface HighlightItem {
  id?: string;
  textLists: string[];
  video: string;
  videoDuration: number;
  videoFile?: File | null;
}

interface FormDataType {
  id: string;
  type: string;
  values: HighlightItem[];
}

export default function HighlightsPage({ type = "hightlights" }: { type: string }) {
  const [highlights, setHighlights] = useState<HighlightItem[]>([
    {
      textLists: ["", ""],
      video: "",
      videoDuration: 0,
      videoFile: null,
    },
  ]);
  const [exists, setExists] = useState<FormDataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/form/${type}`);
        if (!res.ok) return;

        const data: FormDataType[] = await res.json();

        if (data.length) {
          const item = data[0];
          const safeHighlights = item.values.map(highlight => ({
            ...highlight,
            textLists: Array.isArray(highlight.textLists) 
              ? highlight.textLists 
              : (highlight.textLists ? [highlight.textLists] : [""]),
            videoFile: null,
          }));

          setExists(item);
          setHighlights(safeHighlights.length > 0 ? safeHighlights : [
            {
              textLists: ["", ""],
              video: "",
              videoDuration: 0,
              videoFile: null,
            },
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadData();
  }, [type]);

  const addHighlight = () => {
    setHighlights([
      ...highlights,
      {
        textLists: ["", ""],
        video: "",
        videoDuration: 0,
        videoFile: null,
      },
    ]);
  };

  const removeHighlight = (index: number) => {
    if (highlights.length === 1) return;
    
    const newHighlights = highlights.filter((_, i) => i !== index);
    setHighlights(newHighlights);
  };

  const addTextItem = (highlightIndex: number) => {
    const newHighlights = [...highlights];
    newHighlights[highlightIndex].textLists.push("");
    setHighlights(newHighlights);
  };

  const removeTextItem = (highlightIndex: number, textIndex: number) => {
    const newHighlights = [...highlights];
    if (newHighlights[highlightIndex].textLists.length > 1) {
      newHighlights[highlightIndex].textLists = newHighlights[highlightIndex].textLists.filter((_, i) => i !== textIndex);
      setHighlights(newHighlights);
    }
  };

  const handleTextChange = (highlightIndex: number, textIndex: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[highlightIndex].textLists[textIndex] = value;
    setHighlights(newHighlights);
  };

  const handleVideoChange = (highlightIndex: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[highlightIndex].video = value;
    setHighlights(newHighlights);
  };

  const handleDurationChange = (highlightIndex: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[highlightIndex].videoDuration = parseInt(value) || 0;
    setHighlights(newHighlights);
  };

  const handleVideoFileChange = (highlightIndex: number, file: File | null) => {
    const newHighlights = [...highlights];
    newHighlights[highlightIndex].videoFile = file;
    setHighlights(newHighlights);
  };

  const getVideoUrl = (highlight: HighlightItem): string => {
    if (highlight.videoFile) return URL.createObjectURL(highlight.videoFile);
    return highlight.video;
  };

  const updateHighlights = async () => {
    if (!exists) return;

    const filteredHighlights = highlights.filter(
      h => h.textLists.some(text => text.trim()) || h.video.trim() || h.videoFile
    );

    const fd = new FormData();
    filteredHighlights.forEach((highlight, hIndex) => {
      const textListsArray = Array.isArray(highlight.textLists) 
        ? highlight.textLists 
        : [highlight.textLists || ""];
      
      textListsArray.forEach((text, tIndex) => {
        fd.append(`values[${hIndex}][textLists][${tIndex}]`, text);
      });
      fd.append(`values[${hIndex}][video]`, highlight.video);
      fd.append(`values[${hIndex}][videoDuration]`, highlight.videoDuration.toString());
      if (highlight.videoFile) fd.append(`video${hIndex}`, highlight.videoFile);
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
    const normalizedHighlights = updated.values.map(v => ({
      ...v,
      textLists: Array.isArray(v.textLists) ? v.textLists : [v.textLists || ""],
      videoFile: null,
    }));
    setHighlights(normalizedHighlights);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const filteredHighlights = highlights.filter(
        h => h.textLists.some(text => text.trim()) || h.video.trim() || h.videoFile
      );

      if (!filteredHighlights.length) {
        setErrorMsg("Nenhum destaque válido para enviar.");
        setLoading(false);
        return;
      }

      if (exists) {
        await updateHighlights();
      } else {
        const fd = new FormData();
        filteredHighlights.forEach((highlight, hIndex) => {
          const textListsArray = Array.isArray(highlight.textLists) 
            ? highlight.textLists 
            : [highlight.textLists || ""];
          
          textListsArray.forEach((text, tIndex) => {
            fd.append(`values[${hIndex}][textLists][${tIndex}]`, text);
          });
          fd.append(`values[${hIndex}][video]`, highlight.video);
          fd.append(`values[${hIndex}][videoDuration]`, highlight.videoDuration.toString());
          if (highlight.videoFile) fd.append(`video${hIndex}`, highlight.videoFile);
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
        const normalizedHighlights = created.values.map(v => ({
          ...v,
          textLists: Array.isArray(v.textLists) ? v.textLists : [v.textLists || ""],
          videoFile: null,
        }));
        setHighlights(normalizedHighlights);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-[#0C8BD2] rounded-2xl">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#0C8BD2] bg-clip-text">
            {exists ? "Editar Destaques" : "Criar Destaques"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Gerencie múltiplos destaques com textos e vídeos promocionais
          </p>
        </motion.div>

        <Card className="p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <AnimatePresence>
              {highlights.map((highlight, highlightIndex) => {
                const videoUrl = getVideoUrl(highlight);
                const textLists = Array.isArray(highlight.textLists) 
                  ? highlight.textLists 
                  : [highlight.textLists || ""];

                return (
                  <motion.div
                    key={highlightIndex}
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
                            {highlightIndex + 1}
                          </span>
                        </div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                          Destaque #{highlightIndex + 1}
                        </h3>
                      </div>
                      
                      {highlights.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => removeHighlight(highlightIndex)}
                          className="!p-2 !rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Lista de Textos
                          </label>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => addTextItem(highlightIndex)}
                            className="!p-1 !rounded-lg text-xs"
                          >
                            <Plus className="w-3 h-3" />
                            Adicionar Texto
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <AnimatePresence>
                            {textLists.map((text, textIndex) => (
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
                                    onChange={(e: any) => handleTextChange(highlightIndex, textIndex, e.target.value)}
                                  />
                                </div>
                                
                                {textLists.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => removeTextItem(highlightIndex, textIndex)}
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

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            URL do Vídeo
                          </label>
                          <Input
                            type="url"
                            placeholder="https://exemplo.com/video.mp4"
                            value={highlight.video}
                            onChange={(e: any) => handleVideoChange(highlightIndex, e.target.value)}
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
                              placeholder="4"
                              value={highlight.videoDuration.toString()}
                              onChange={(e: any) => handleDurationChange(highlightIndex, e.target.value)}
                              className="pl-10"
                              min="0"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Ou faça upload do vídeo
                          </label>
                          <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleVideoFileChange(highlightIndex, e.target.files?.[0] ?? null)}
                                className="hidden"
                              />
                              <div className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-all duration-200 flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
                                <Video className="w-5 h-5" />
                                {highlight.video && !highlight.videoFile ? "Alterar Vídeo" : "Selecionar Vídeo"}
                              </div>
                            </label>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            {highlight.video && !highlight.videoFile
                              ? "Vídeo atual do servidor. Selecione um novo arquivo para substituir."
                              : "Formatos suportados: MP4, WEBM, MOV"}
                          </p>
                        </div>

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
                                className="w-full h-32 object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-[#0C8BD2] transition-all duration-200"
                                controls={false}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-xl flex items-center justify-center">
                                <div className="w-10 h-10 bg-[#0C8BD2] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                  </motion.div>
                );
              })}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={addHighlight}
                className="flex-1"
              >
                <Plus className="w-5 h-5" />
                Adicionar Novo Destaque
              </Button>

              <Button
                type="submit"
                loading={loading}
                className="flex-1 bg-[#0C8BD2] hover:bg-[#0A7AB8]"
              >
                <Save className="w-5 h-5" />
                {exists ? "Atualizar Destaques" : "Criar Destaques"}
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
    </div>
  );
}