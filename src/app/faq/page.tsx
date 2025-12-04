/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save,
  Search,
  HelpCircle,
  X,
  ArrowUpDown,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/TextArea";

interface FAQ {
  id?: string;
  question: string;
  answer: string;
}

interface DeleteModalState {
  isOpen: boolean;
  type: 'single' | 'all' | null;
  index: number | null;
  question: string;
}

export default function CreateFAQ() {
  const [faqList, setFaqList] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showValidation, setShowValidation] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: null,
    index: null,
    question: ''
  });
  
  const newFaqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/form/faq");
        if (!res.ok) return;

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          setFaqList([{ question: "", answer: "" }]);
          setRecordId(null);
          return;
        }

        const firstRecord = data[0];
        const values: FAQ[] = Array.isArray(firstRecord.values) ? firstRecord.values : [];

        const safeValues = values.map((f, index) => ({
          id: f.id || `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          question: f.question ?? "",
          answer: f.answer ?? ""
        }));

        setFaqList(safeValues.length ? safeValues : [{ question: "", answer: "" }]);
        setRecordId(firstRecord.id ?? null);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  // Verificar se pode adicionar nova FAQ
  const canAddNewFaq = () => {
    if (search) return false; // Não pode adicionar se há texto na busca
    
    const lastFaq = faqList[faqList.length - 1];
    return lastFaq.question.trim() !== "" && lastFaq.answer.trim() !== "";
  };

  // Filtrar e ordenar FAQs
  const filteredFaqs = useMemo(() => {
    // Primeiro filtramos
    let filtered = faqList
      .map((faq, index) => ({ ...faq, originalIndex: index })) // Adiciona índice original
      .filter(faq => 
        !search || 
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
      );
    
    // Depois ordenamos pelo índice original
    if (sortOrder === 'desc') {
      filtered = filtered.sort((a, b) => b.originalIndex - a.originalIndex);
    } else {
      filtered = filtered.sort((a, b) => a.originalIndex - b.originalIndex);
    }
    
    return filtered;
  }, [faqList, search, sortOrder]);

  const addFaq = () => {
    // Verificação de busca
    if (search) {
      setErrorMsg("Limpe a busca antes de adicionar uma nova FAQ.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    // Verificação de preenchimento do último card
    const lastFaq = faqList[faqList.length - 1];
    if (lastFaq.question.trim() === "" || lastFaq.answer.trim() === "") {
      setShowValidation(true);
      setErrorMsg("Complete a FAQ atual antes de adicionar uma nova.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }

    const newFaq = { 
      id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      question: "", 
      answer: "" 
    };
    setFaqList([...faqList, newFaq]);
    setShowValidation(false);
    
    // Scroll para nova FAQ
    setTimeout(() => {
      newFaqRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  // Funções para abrir modais de confirmação
  const openDeleteSingleModal = (index: number, question: string) => {
    setDeleteModal({
      isOpen: true,
      type: 'single',
      index,
      question: question || "FAQ sem título"
    });
  };

  const openDeleteAllModal = () => {
    setDeleteModal({
      isOpen: true,
      type: 'all',
      index: null,
      question: ''
    });
  };

  // Função para fechar modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      type: null,
      index: null,
      question: ''
    });
  };

  // Função para confirmar exclusão
  const confirmDelete = () => {
    if (deleteModal.type === 'all') {
      // Limpar todas as FAQs
      setFaqList([{ question: "", answer: "" }]);
      setSearch("");
      setSortOrder('asc');
      setShowValidation(false);
    } else if (deleteModal.type === 'single' && deleteModal.index !== null) {
      // Remover FAQ individual
      if (faqList.length === 1) {
        setFaqList([{ question: "", answer: "" }]);
      } else {
        setFaqList(faqList.filter((_, i) => i !== deleteModal.index));
      }
    }
    
    closeDeleteModal();
  };

  const handleChange = (index: number, field: keyof FAQ, value: string) => {
    const newList = [...faqList];
    newList[index][field] = value ?? "";
    setFaqList(newList);
    
    // Remover validação quando o usuário começar a digitar
    if (showValidation && index === faqList.length - 1) {
      if (field === 'question' && value.trim() !== "") {
        setShowValidation(false);
      }
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSortOrder('asc');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");
    setShowValidation(false);

    const filtered = faqList.filter(
      f => f.question.trim() && f.answer.trim()
    );

    if (!filtered.length) {
      setErrorMsg("Adicione ao menos uma FAQ completa (com pergunta e resposta).");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      filtered.forEach((f, i) => {
        fd.append(`values[${i}][question]`, f.question);
        fd.append(`values[${i}][answer]`, f.answer);
      });

      if (recordId) fd.append("id", recordId);

      const res = await fetch("/api/form/faq", {
        method: recordId ? "PUT" : "POST",
        body: fd
      });

      if (!res.ok) throw new Error("Erro ao salvar FAQ");

      const updated = await res.json();
      const safeValues = updated.values.map((f: any, index: number) => ({
        id: f.id || `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        question: f.question ?? "",
        answer: f.answer ?? ""
      }));

      setFaqList(safeValues);
      setRecordId(updated.id ?? null);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto pb-6 md:pb-8">
        {/* Header */}
        <div className="text-center mb-8 flex flex-wrap gap-5">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-[#0C8BD2] rounded-2xl">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex flex-wrap flex-col flex-start justify-start text-start">
            <h1 className="text-3xl font-bold text-[#0C8BD2]">
              {recordId ? "Gerenciar FAQ" : "Criar FAQ"}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Crie e gerencie suas perguntas frequentes
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="mb-6 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar FAQs..."
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={sortOrder === 'asc' ? 'primary' : 'secondary'}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {sortOrder === 'asc' ? 'Antigas ↑' : 'Recentes ↓'}
                </Button>
                {(search || sortOrder === 'desc') && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={clearFilters}
                    className="flex-1 sm:flex-none"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Limpar Filtro
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
              <div>
                <span>Total: {faqList.length}</span>
                <span className="mx-2">•</span>
                <span>Mostrando: {filteredFaqs.length}</span>
              </div>
              {search && (
                <div className="text-amber-600 dark:text-amber-400 text-xs">
                  ⓘ Busca ativa - não é possível adicionar nova FAQ
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Lista de FAQs */}
        <div className="space-y-4 pb-32">
          <form onSubmit={handleSubmit}>
            {filteredFaqs.map((faq) => {
              // Encontrar o índice original na lista completa
              const originalIndex = faqList.findIndex(f => f.id === faq.id);
              const hasQuestion = faq.question.trim() !== "";
              const hasAnswer = faq.answer.trim() !== "";
              const isLastInOriginalList = originalIndex === faqList.length - 1;
              const isLastAndEmpty = isLastInOriginalList && !hasQuestion && !hasAnswer;

              return (
                <div 
                  key={faq.id || originalIndex} 
                  ref={isLastAndEmpty ? newFaqRef : null}
                >
                  <Card className={`mb-4 overflow-hidden transition-all duration-300 ${
                    isLastInOriginalList && showValidation && !hasQuestion ? 'ring-2 ring-red-500' : ''
                  }`}>
                    <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            hasQuestion && hasAnswer 
                              ? 'bg-green-500' 
                              : hasQuestion || hasAnswer 
                                ? 'bg-yellow-500'
                                : 'bg-zinc-300 dark:bg-zinc-700'
                          }`}>
                            <span className="text-white font-semibold text-sm">
                              {originalIndex + 1}
                            </span>
                          </div>
                          <div className="text-sm text-zinc-500">
                            <div className="font-medium">
                              {hasQuestion ? '✓ Pergunta' : 'Sem pergunta'} • 
                              {hasAnswer ? ' ✓ Resposta' : ' Sem resposta'}
                            </div>
                            {isLastInOriginalList && showValidation && !hasQuestion && (
                              <div className="text-red-500 text-xs mt-1">
                                ⚠ Complete esta FAQ antes de adicionar outra
                              </div>
                            )}
                          </div>
                        </div>
                        {faqList.length > 1 && (
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => openDeleteSingleModal(originalIndex, faq.question)}
                            className="!p-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Pergunta
                          </label>
                          <Input
                            type="text"
                            placeholder="Digite a pergunta..."
                            value={faq.question}
                            onChange={(e: any) => handleChange(originalIndex, "question", e.target.value)}
                            className="font-medium"
                            autoFocus={isLastAndEmpty}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Resposta
                          </label>
                          <TextArea
                            placeholder="Digite a resposta..."
                            value={faq.answer}
                            onChange={(e: any) => handleChange(originalIndex, "answer", e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </form>
        </div>

        {/* Barra Fixa de Botões */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-blue-50/90 to-transparent dark:from-zinc-900/90 backdrop-blur-sm pt-4">
          <div className="max-w-4xl mx-auto px-4 md:px-6 pb-4">
            <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-900/50">
              <div className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span>
                        {faqList.filter(f => f.question.trim() !== "" && f.answer.trim() !== "").length} FAQs completos
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={openDeleteAllModal}
                      className="flex-1 sm:flex-none justify-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Tudo
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addFaq}
                      disabled={!!search || !canAddNewFaq()}
                      className="flex-1 sm:flex-none justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova FAQ
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={loading}
                      variant="primary"
                      className="flex-1 sm:flex-none justify-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {recordId ? "Atualizar" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal de Confirmação para Exclusão */}
        {deleteModal.isOpen && (
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
                    {deleteModal.type === 'all' ? 'Limpar todas as FAQs' : 'Excluir FAQ'}
                  </h3>
                </div>
                
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                  {deleteModal.type === 'all' 
                    ? `Tem certeza que deseja limpar todas as ${faqList.length} FAQs? Esta ação não pode ser desfeita.`
                    : `Tem certeza que deseja excluir a FAQ "${deleteModal.question.substring(0, 50)}${deleteModal.question.length > 50 ? '...' : ''}"? Esta ação não pode ser desfeita.`
                  }
                </p>
                
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={closeDeleteModal}
                    className="bg-[#0C8BD2] hover:bg-blue-600 text-white border-blue-500"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={confirmDelete}
                  >
                    {deleteModal.type === 'all' ? 'Limpar Tudo' : 'Excluir'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Mensagens de Feedback */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-400 font-semibold text-center">
                ✅ FAQ salvo com sucesso!
              </p>
            </Card>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-400 font-semibold text-center">
                {errorMsg}
              </p>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}