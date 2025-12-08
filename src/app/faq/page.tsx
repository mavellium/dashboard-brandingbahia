/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { HelpCircle } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";

interface FAQ {
  id?: string;
  question: string;
  answer: string;
}

export default function CreateFAQ() {
  const defaultFAQ = useMemo(() => ({ question: "", answer: "" }), []);

  const {
    list: faqList,
    setList: setFaqList,
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
    filteredItems: filteredFaqs,
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
  } = useListManagement<FAQ>({
    type: "faq",
    apiPath: "/api/form/faq",
    defaultItem: defaultFAQ,
    validationFields: ["question", "answer"]
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    const filtered = faqList.filter(
      f => f.question.trim() && f.answer.trim()
    );

    if (!filtered.length) {
      setErrorMsg("Adicione ao menos uma FAQ completa.");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      filtered.forEach((f, i) => {
        fd.append(`values[${i}][question]`, f.question);
        fd.append(`values[${i}][answer]`, f.answer);
      });

      if (exists) fd.append("id", exists.id);

      const res = await fetch("/api/form/faq", {
        method: exists ? "PUT" : "POST",
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
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof FAQ, value: string) => {
    const newList = [...faqList];
    newList[index][field] = value;
    setFaqList(newList);
  };

  const handleSubmitWrapper = () => {
    handleSubmit();
  };

  const updateFAQs = async (newList: FAQ[]) => {
    const filtered = newList.filter(f => f.question.trim() && f.answer.trim());
    
    if (filtered.length === 0 && exists) {
      try {
        await fetch(`/api/form/faq?id=${exists.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Erro ao deletar:", err);
      }
      return;
    }

    if (!exists) return;

    try {
      const fd = new FormData();
      filtered.forEach((f, i) => {
        fd.append(`values[${i}][question]`, f.question);
        fd.append(`values[${i}][answer]`, f.answer);
      });
      fd.append("id", exists.id);

      const res = await fetch("/api/form/faq", {
        method: "PUT",
        body: fd
      });

      if (!res.ok) throw new Error("Erro ao atualizar FAQ");
    } catch (err) {
      console.error("Erro ao atualizar:", err);
    }
  };

  return (
    <ManageLayout
      headerIcon={HelpCircle}
      title="FAQ"
      description="Crie e gerencie suas perguntas frequentes"
      exists={!!exists}
      itemName="FAQ"
    >
      <div className="mb-6 space-y-4">
        <SearchSortBar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearFilters={clearFilters}
          searchPlaceholder="Buscar FAQs..."
          total={faqList.length}
          showing={filteredFaqs.length}
          searchActiveText="ⓘ Busca ativa - não é possível adicionar nova FAQ"
        />
      </div>

      <div className="space-y-4 pb-32">
        <form onSubmit={handleSubmit}>
          {filteredFaqs.map((faq: any) => {
            const originalIndex = faqList.findIndex(f => f.id === faq.id);
            const isLastInOriginalList = originalIndex === faqList.length - 1;
            const isLastAndEmpty = isLastInOriginalList && !faq.question && !faq.answer;

            return (
              <div 
                key={faq.id || originalIndex} 
                ref={isLastAndEmpty ? newItemRef : null}
              >
                <Card className={`mb-4 overflow-hidden transition-all duration-300 ${
                  isLastInOriginalList && showValidation && !faq.question ? 'ring-2 ring-red-500' : ''
                }`}>
                  <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                    <ItemHeader
                      index={originalIndex}
                      fields={[
                        { label: 'Pergunta', hasValue: faq.question.trim() !== "" },
                        { label: 'Resposta', hasValue: faq.answer.trim() !== "" }
                      ]}
                      showValidation={showValidation}
                      isLast={isLastInOriginalList}
                      onDelete={() => openDeleteSingleModal(originalIndex, faq.question)}
                      showDelete={faqList.length > 1}
                    />
                    
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

      <FixedActionBar
        onDeleteAll={openDeleteAllModal}
        onAddNew={() => addItem()}
        onSubmit={handleSubmitWrapper}
        isAddDisabled={!canAddNewItem}
        isSaving={loading}
        exists={!!exists}
        completeCount={completeCount}
        totalCount={faqList.length}
        itemName="FAQ"
        icon={HelpCircle}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => confirmDelete(updateFAQs)}
        type={deleteModal.type}
        itemTitle={deleteModal.title}
        totalItems={faqList.length}
        itemName="FAQ"
      />

      <FeedbackMessages success={success} errorMsg={errorMsg} />
    </ManageLayout>
  );
}