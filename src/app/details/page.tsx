/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { TextArea } from "@/components/TextArea";
import { HelpCircle, X, Image as ImageIcon } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";
import { ImageUpload } from "@/components/Manage/ImageUpload";
import Image from "next/image";

interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  image: string;
  file?: File | null;
}

export default function ServicesPage({ type = "details" }: { type: string }) {
  const defaultService = useMemo(() => ({
    title: "",
    description: "",
    image: "",
    file: null,
  }), []);

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const {
    list: serviceList,
    setList: setServiceList,
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
    filteredItems: filteredServices,
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
  } = useListManagement<ServiceItem>({
    type,
    apiPath: `/api/form/${type}`,
    defaultItem: defaultService,
    validationFields: ["title", "description"]
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const filteredList = serviceList.filter(
        s => s.title.trim() && s.description.trim()
      );

      if (!filteredList.length) {
        setErrorMsg("Adicione ao menos um serviço completo (com título e descrição).");
        setLoading(false);
        return;
      }

      const fd = new FormData();
      
      filteredList.forEach((service, i) => {
        fd.append(`values[${i}][title]`, service.title);
        fd.append(`values[${i}][description]`, service.description);
        fd.append(`values[${i}][image]`, service.image || "");
        
        if (service.file) {
          fd.append(`file${i}`, service.file);
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
      const normalizedServices = savedData.values.map((v: any, index: number) => ({ 
        ...v, 
        id: v.id || `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
        file: null 
      }));
      
      setServiceList(normalizedServices);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Erro no submit:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof ServiceItem, value: any) => {
    const newList = [...serviceList];
    newList[index][field] = value;
    setServiceList(newList);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newList = [...serviceList];
    newList[index].file = file;
    setServiceList(newList);
  };

  const getImageUrl = (service: ServiceItem): string => {
    if (service.file) {
      return URL.createObjectURL(service.file);
    }
    if (service.image) {
      if (service.image.startsWith('http') || service.image.startsWith('//')) {
        return service.image;
      } else {
        return `https://mavellium.com.br${service.image.startsWith('/') ? '' : '/'}${service.image}`;
      }
    }
    return "";
  };

  // Função para atualizar serviços no servidor (usada na exclusão)
  const updateServices = async (list: ServiceItem[]) => {
    if (!exists) return;

    const filteredList = list.filter(
      s => s.title.trim() || s.description.trim() || s.file || s.image
    );

    const fd = new FormData();
    
    fd.append("id", exists.id);
    
    filteredList.forEach((service, i) => {
      fd.append(`values[${i}][title]`, service.title);
      fd.append(`values[${i}][description]`, service.description);
      fd.append(`values[${i}][image]`, service.image || "");
      
      if (service.file) {
        fd.append(`file${i}`, service.file);
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
          className="h-32 w-full object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
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
          className="h-32 w-full object-cover rounded-xl border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-500 transition-all duration-200"
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
      headerIcon={HelpCircle}
      title="Serviços"
      description="Crie e gerencie os serviços oferecidos pela sua empresa"
      exists={!!exists}
      itemName="Serviço"
    >
      {/* Controles */}
      <div className="mb-6 space-y-4">
        <SearchSortBar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearFilters={clearFilters}
          searchPlaceholder="Buscar serviços..."
          total={serviceList.length}
          showing={filteredServices.length}
          searchActiveText="ⓘ Busca ativa - não é possível adicionar novo serviço"
        />
      </div>

      {/* Lista de Serviços */}
      <div className="space-y-4 pb-32">
        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {filteredServices.map((service: any) => {
              const originalIndex = serviceList.findIndex(s => s.id === service.id);
              const hasTitle = service.title.trim() !== "";
              const hasDescription = service.description.trim() !== "";
              const hasImage = service.image?.trim() !== "" || service.file;
              const isLastInOriginalList = originalIndex === serviceList.length - 1;
              const isLastAndEmpty = isLastInOriginalList && !hasTitle && !hasDescription;
              const imageUrl = getImageUrl(service);

              return (
                <div
                  key={service.id || originalIndex}
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
                          { label: 'Descrição', hasValue: hasDescription },
                          { label: 'Imagem', hasValue: hasImage }
                        ]}
                        showValidation={showValidation}
                        isLast={isLastInOriginalList}
                        onDelete={() => openDeleteSingleModal(originalIndex, service.title)}
                        showDelete={serviceList.length > 1}
                      />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Título do Serviço
                            </label>
                            <Input
                              type="text"
                              placeholder="Nome do serviço..."
                              value={service.title}
                              onChange={(e: any) => handleChange(originalIndex, "title", e.target.value)}
                              className="font-medium"
                              autoFocus={isLastAndEmpty}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Descrição
                            </label>
                            <TextArea
                              placeholder="Descreva o serviço..."
                              value={service.description}
                              onChange={(e: any) => handleChange(originalIndex, "description", e.target.value)}
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Imagem
                            </label>

                            <ImageUpload
                              imageUrl={imageUrl}
                              hasImage={hasImage}
                              file={service.file}
                              onFileChange={(file) => handleFileChange(originalIndex, file)}
                              onExpand={setExpandedImage}
                              label="Imagem do Serviço"
                              altText="Preview do serviço"
                              imageInfo={hasImage && !service.file
                                ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                                : "Formatos suportados: JPG, PNG, WEBP."}
                              customPreview={imageUrl ? <ImagePreview imageUrl={imageUrl} /> : undefined}
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
        totalCount={serviceList.length}
        itemName="Serviço"
        icon={HelpCircle}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => confirmDelete(updateServices)}
        type={deleteModal.type}
        itemTitle={deleteModal.title}
        totalItems={serviceList.length}
        itemName="Serviço"
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