/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Save, 
  HelpCircle,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { FAQ } from "@/types";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/TextArea";


export default function CreateFAQ() {
  const [faqList, setFaqList] = useState<FAQ[]>([{ question: "", answer: "" }]);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

        const safeValues = values.map(f => ({
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

  const addFaq = () => {
    setFaqList([...faqList, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    if (faqList.length === 1) return;
    setFaqList(faqList.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof FAQ, value: string) => {
    const newList = [...faqList];
    newList[index][field] = value ?? "";
    setFaqList(newList);
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
      const safeValues = updated.values.map((f: any) => ({
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-[#0C8BD2] rounded-2xl">
              <HelpCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#0C8BD2] bg-clip-text">
            {recordId ? "Editar FAQ" : "Criar FAQ"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Gerencie as perguntas frequentes do seu site
          </p>
        </motion.div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {faqList.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {i + 1}
                        </span>
                      </div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        Pergunta #{i + 1}
                      </h3>
                    </div>
                    
                    {faqList.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeFaq(i)}
                        className="!p-2 !rounded-lg"
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
                        onChange={(e: any) => handleChange(i, "question", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Resposta
                      </label>
                      <TextArea
                        placeholder="Digite a resposta..."
                        value={faq.answer}
                        onChange={(e: any) => handleChange(i, "answer", e.target.value)}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={addFaq}
                className="flex-1"
              >
                <Plus className="w-5 h-5" />
                Adicionar Nova Pergunta
              </Button>

              <Button
                type="submit"
                loading={loading}
                className="flex-1"
              >
                <Save className="w-5 h-5" />
                {recordId ? "Atualizar FAQ" : "Criar FAQ"}
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
                  ✅ FAQ salvo com sucesso!
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
    </div>
  );
}