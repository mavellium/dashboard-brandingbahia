/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save,
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
  X,
  Edit2,
  Copy,
  ArrowUpDown,
  SlidersHorizontal,
  XCircle
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

interface FAQFilter {
  search: string;
  hasQuestion: boolean;
  hasAnswer: boolean;
  sortOrder: 'asc' | 'desc';
}

export default function CreateFAQ() {
  const [faqList, setFaqList] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set<number>());
  const [filter, setFilter] = useState<FAQFilter>({
    search: "",
    hasQuestion: false,
    hasAnswer: false,
    sortOrder: 'asc',
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  
  const faqContainerRef = useRef<HTMLDivElement>(null);
  const newFaqRef = useRef<HTMLDivElement>(null);

  // Gerar ID único para cada FAQ
  const generateId = () => `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/form/faq");
        if (!res.ok) return;

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          const initialFaq = { question: "", answer: "" };
          setFaqList([initialFaq]);
          setRecordId(null);
          return;
        }

        const firstRecord = data[0];
        const values: FAQ[] = Array.isArray(firstRecord.values) ? firstRecord.values : [];

        const safeValues = values.map((f, _) => ({
          id: f.id || generateId(),
          question: f.question ?? "",
          answer: f.answer ?? ""
        }));

        setFaqList(safeValues.length ? safeValues : [{ question: "", answer: "" }]);
        setRecordId(firstRecord.id ?? null);
        
        // Expandir todos os itens inicialmente
        const newExpanded = new Set<number>();
        safeValues.forEach((_, index) => newExpanded.add(index));
        setExpandedItems(newExpanded);
        setAllExpanded(true);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  // Scroll para nova FAQ quando adicionada
  useEffect(() => {
    if (newFaqRef.current && faqList.length > 0) {
      setTimeout(() => {
        newFaqRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  }, [faqList.length]);

  // Filtrar e ordenar FAQs
  const filteredFaqs = useMemo(() => {
    let result = faqList.filter(faq => {
      const searchMatch = filter.search === "" || 
        faq.question.toLowerCase().includes(filter.search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(filter.search.toLowerCase());
      
      const questionMatch = !filter.hasQuestion || faq.question.trim() !== "";
      const answerMatch = !filter.hasAnswer || faq.answer.trim() !== "";
      
      return searchMatch && questionMatch && answerMatch;
    });

    // Ordenar por índice (asc ou desc)
    if (filter.sortOrder === 'desc') {
      result = [...result].reverse();
    }

    return result;
  }, [faqList, filter]);

  const addFaq = () => {
    const newFaq = { 
      id: generateId(),
      question: "", 
      answer: "" 
    };
    setFaqList([...faqList, newFaq]);
    setExpandedItems(prev => {
      const newSet = new Set<number>(prev);
      newSet.add(faqList.length);
      return newSet;
    });
    setAllExpanded(true);
    
    // Limpar filtros para garantir que a nova FAQ seja visível
    setFilter({
      ...filter,
      search: "",
      hasQuestion: false,
      hasAnswer: false,
    });
  };

  const removeFaq = (index: number) => {
    if (faqList.length === 1) {
      // Não remover a última FAQ, apenas limpar seus campos
      setFaqList([{ question: "", answer: "" }]);
      return;
    }
    setFaqList(faqList.filter((_, i) => i !== index));
    setExpandedItems(prev => {
      const newSet = new Set<number>(prev);
      newSet.delete(index);
      // Ajustar índices após remoção
      const adjustedSet = new Set<number>();
      newSet.forEach(val => {
        if (val > index) adjustedSet.add(val - 1);
        else adjustedSet.add(val);
      });
      return adjustedSet;
    });
  };

  const handleChange = (index: number, field: keyof FAQ, value: string) => {
    const newList = [...faqList];
    newList[index][field] = value ?? "";
    setFaqList(newList);
  };

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set<number>(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedItems(new Set<number>());
    } else {
      const newSet = new Set<number>();
      faqList.forEach((_, index) => newSet.add(index));
      setExpandedItems(newSet);
    }
    setAllExpanded(!allExpanded);
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(index);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const duplicateFaq = (index: number) => {
    const faqToDuplicate = faqList[index];
    const newFaq = { 
      id: generateId(),
      question: faqToDuplicate.question + " (cópia)",
      answer: faqToDuplicate.answer 
    };
    const newList = [...faqList];
    newList.splice(index + 1, 0, newFaq);
    setFaqList(newList);
  };

  const clearAll = () => {
    if (window.confirm("Tem certeza que deseja limpar todas as FAQs? Esta ação não pode ser desfeita.")) {
      setFaqList([{ question: "", answer: "" }]);
      setExpandedItems(new Set<number>([0]));
      setAllExpanded(true);
      setFilter({
        search: "",
        hasQuestion: false,
        hasAnswer: false,
        sortOrder: 'asc',
      });
    }
  };

  const clearFilters = () => {
    setFilter({
      search: "",
      hasQuestion: false,
      hasAnswer: false,
      sortOrder: 'asc',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    const filtered = faqList.filter(
      f => (f.question ?? "").trim() || (f.answer ?? "").trim()
    );

    if (!filtered.length) {
      setErrorMsg("Adicione ao menos uma pergunta.");
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
      const safeValues = updated.values.map((f: any, _: number) => ({
        id: f.id || generateId(),
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

  // Encontrar a última FAQ adicionada
  const lastFaqIndex = faqList.length - 1;
  const lastFaq = faqList[lastFaqIndex];
  const isLastFaqEmpty = lastFaq?.question === "" && lastFaq?.answer === "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-[#0C8BD2] rounded-xl sm:rounded-2xl">
              <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0C8BD2] bg-clip-text px-2">
            {recordId ? "Gerenciar FAQ" : "Criar Novo FAQ"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 sm:mt-2 max-w-2xl mx-auto text-sm sm:text-base px-3">
            Crie e gerencie perguntas frequentes com facilidade. Adicione, edite, filtre e visualize suas FAQs em tempo real.
          </p>
        </motion.div>

        {/* Barra de Controles Superiores - NÃO MAIS FIXA */}
        <div className="mb-4 sm:mb-6">
          <Card className="p-3 sm:p-4 shadow-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Total: {faqList.length}</span>
                  <span className="mx-1 sm:mx-2">•</span>
                  <span>Filtrados: {filteredFaqs.length}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={toggleExpandAll}
                    className="!px-2 sm:!px-3 text-sm"
                  >
                    {allExpanded ? <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                    <span className="hidden sm:inline ml-1">
                      {allExpanded ? "Recolher Todos" : "Expandir Todos"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={previewMode ? "primary" : "secondary"}
                    onClick={() => setPreviewMode(!previewMode)}
                    className="!px-2 sm:!px-3 text-sm"
                  >
                    {previewMode ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
                    <span className="hidden sm:inline ml-1">
                      {previewMode ? "Editar" : "Visualizar"}
                    </span>
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={clearAll}
                  className="flex-1 sm:flex-none text-sm"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Limpar Tudo
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros COMPACTOS - Agora com botão para expandir - NÃO MAIS FIXO */}
        <div className="mb-4 sm:mb-6">
          <Card className="p-3 sm:p-4 shadow-lg border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-3 sm:space-y-4">
              {/* Header dos Filtros */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
                  <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm sm:text-base">
                    Filtros
                  </h3>
                  {(filter.search || filter.hasQuestion || filter.hasAnswer) && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 sm:py-1 rounded-full">
                      Ativos
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {(filter.search || filter.hasQuestion || filter.hasAnswer) && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={clearFilters}
                      className="!p-1 !rounded-lg"
                      title="Limpar filtros"
                    >
                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1 text-sm"
                  >
                    {showFilters ? (
                      <>
                        <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Recolher</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Expandir</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Busca Básica - Sempre visível */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por palavra-chave..."
                  value={filter.search}
                  onChange={(e: any) => setFilter({...filter, search: e.target.value})}
                  className="pl-9 sm:pl-10 text-sm sm:text-base"
                />
              </div>

              {/* Filtros Avançados - Expandíveis */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 sm:pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        <div className="space-y-2 sm:space-y-3">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="hasQuestion"
                                checked={filter.hasQuestion}
                                onChange={(e) => setFilter({...filter, hasQuestion: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors flex items-center justify-center">
                                {filter.hasQuestion && (
                                  <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                )}
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                              Apenas com pergunta
                            </span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                id="hasAnswer"
                                checked={filter.hasAnswer}
                                onChange={(e) => setFilter({...filter, hasAnswer: e.target.checked})}
                                className="sr-only peer"
                              />
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors flex items-center justify-center">
                                {filter.hasAnswer && (
                                  <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                                )}
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                              Apenas com resposta
                            </span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 sm:mb-2">
                            Ordenar por
                          </label>
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              type="button"
                              variant={filter.sortOrder === 'asc' ? 'primary' : 'secondary'}
                              onClick={() => setFilter({...filter, sortOrder: 'asc'})}
                              className="flex-1 justify-center text-xs sm:text-sm"
                            >
                              <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Antigas
                            </Button>
                            <Button
                              type="button"
                              variant={filter.sortOrder === 'desc' ? 'primary' : 'secondary'}
                              onClick={() => setFilter({...filter, sortOrder: 'desc'})}
                              className="flex-1 justify-center text-xs sm:text-sm"
                            >
                              <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              Recentes
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resumo dos filtros ativos */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 pt-1 sm:pt-2">
                        {filter.search && (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            Busca: {filter.search.length > 10 ? filter.search.substring(0, 10) + '...' : filter.search}
                            <button 
                              onClick={() => setFilter({...filter, search: ""})}
                              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                            >
                              <X className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </span>
                        )}
                        {filter.hasQuestion && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            Com pergunta
                            <button 
                              onClick={() => setFilter({...filter, hasQuestion: false})}
                              className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                            >
                              <X className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </span>
                        )}
                        {filter.hasAnswer && (
                          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            Com resposta
                            <button 
                              onClick={() => setFilter({...filter, hasAnswer: false})}
                              className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                            >
                              <X className="w-2 h-2 sm:w-3 sm:h-3" />
                            </button>
                          </span>
                        )}
                        {filter.sortOrder === 'desc' && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                            Recentes primeiro
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status dos resultados */}
              <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span>
                    Mostrando <span className="font-semibold">{filteredFaqs.length}</span> de {faqList.length} FAQs
                  </span>
                  {filteredFaqs.length === 0 && faqList.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm">
                      Nenhum resultado encontrado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Container das FAQs */}
        <div ref={faqContainerRef} className="space-y-3 sm:space-y-4 pb-24 sm:pb-32">
          <form onSubmit={handleSubmit}>
            <AnimatePresence>
              {filteredFaqs.map((faq) => {
                const originalIndex = faqList.findIndex(f => f.id === faq.id);
                const isExpanded = expandedItems.has(originalIndex);
                const hasQuestion = faq.question.trim() !== "";
                const hasAnswer = faq.answer.trim() !== "";
                const isComplete = hasQuestion && hasAnswer;
                const isNewAndEmpty = originalIndex === lastFaqIndex && isLastFaqEmpty;

                return (
                  <motion.div
                    key={faq.id || originalIndex}
                    ref={isNewAndEmpty ? newFaqRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`p-0 overflow-hidden border border-zinc-200 dark:border-zinc-700 transition-all duration-300 ${
                      isComplete 
                        ? 'border-l-4 border-l-green-500' 
                        : hasQuestion || hasAnswer 
                          ? 'border-l-4 border-l-yellow-500'
                          : ''
                    } ${isNewAndEmpty ? 'ring-1 sm:ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
                      {/* Header do Card */}
                      <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-start sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isComplete 
                                ? 'bg-green-500' 
                                : hasQuestion || hasAnswer 
                                  ? 'bg-yellow-500'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}>
                              <span className="text-white font-semibold text-xs sm:text-sm">
                                {originalIndex + 1}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-white text-sm sm:text-base truncate">
                                {faq.question || "Nova pergunta (clique para editar)"}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                                {hasQuestion && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    ✓ Tem pergunta
                                  </span>
                                )}
                                {hasAnswer && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    ✓ Tem resposta
                                  </span>
                                )}
                                {!hasQuestion && !hasAnswer && (
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Vazio
                                  </span>
                                )}
                                {copySuccess === originalIndex && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    <Check className="w-2 h-2 sm:w-3 sm:h-3 inline mr-0.5" /> Copiado!
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => toggleExpand(originalIndex)}
                              className="!p-1 !rounded-lg"
                            >
                              {isExpanded ? 
                                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                              }
                            </Button>
                            
                            {!previewMode && (
                              <>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => duplicateFaq(originalIndex)}
                                  className="!p-1 !rounded-lg hidden xs:inline-flex"
                                  title="Duplicar"
                                >
                                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => copyToClipboard(faq.question + "\n\n" + faq.answer, originalIndex)}
                                  className="!p-1 !rounded-lg"
                                  title="Copiar"
                                >
                                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                                {faqList.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="danger"
                                    onClick={() => removeFaq(originalIndex)}
                                    className="!p-1 !rounded-lg"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo do Card */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-zinc-50 dark:bg-zinc-800/50">
                              {previewMode ? (
                                <div className="space-y-3 sm:space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-base sm:text-lg text-zinc-900 dark:text-white mb-1 sm:mb-2">
                                      {faq.question || "Pergunta não definida"}
                                    </h4>
                                    <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
                                      <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                                        {faq.answer || "Resposta não definida"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1 sm:mb-2">
                                      Pergunta
                                    </label>
                                    <Input
                                      type="text"
                                      placeholder="Digite a pergunta..."
                                      value={faq.question}
                                      onChange={(e: any) => handleChange(originalIndex, "question", e.target.value)}
                                      className="font-medium text-sm sm:text-base"
                                      autoFocus={isNewAndEmpty}
                                    />
                                  </div>

                                  <div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 sm:mb-2 gap-1">
                                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Resposta
                                      </label>
                                      <span className="text-xs text-zinc-500">
                                        {faq.answer.length} caracteres
                                      </span>
                                    </div>
                                    <TextArea
                                      placeholder="Digite a resposta..."
                                      value={faq.answer}
                                      onChange={(e: any) => handleChange(originalIndex, "answer", e.target.value)}
                                      rows={3}
                                      className="text-sm sm:text-base"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </form>
        </div>

        {/* Barra Fixa de Ações - VISÍVEL APENAS AO ROLAR PARA BAIXO */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-blue-50/80 to-transparent dark:from-zinc-900/80 backdrop-blur-sm pt-4">
          <div className="max-w-6xl mx-auto px-2 sm:px-3 md:px-4 pb-2 sm:pb-3 md:pb-4">
            <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-900/50">
              <div className="p-2 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>
                      {faqList.filter(f => f.question.trim() !== "" && f.answer.trim() !== "").length} de {faqList.length} FAQs completos
                    </span>
                  </div>
                  
                  <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full xs:w-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addFaq}
                      className="w-full xs:w-auto justify-center text-sm"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span>Nova Pergunta</span>
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={loading}
                      variant="primary"
                      className="w-full xs:w-auto justify-center text-sm"
                    >
                      <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span>
                        {recordId ? "Atualizar FAQ" : "Salvar FAQ"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 sm:mt-6"
            >
              <Card className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-green-700 dark:text-green-400 font-semibold text-center text-sm sm:text-base">
                  ✅ FAQ salvo com sucesso!
                </p>
              </Card>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 sm:mt-6"
            >
              <Card className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-400 font-semibold text-center text-sm sm:text-base">
                  {errorMsg}
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}