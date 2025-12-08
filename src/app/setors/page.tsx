/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useListManagement } from "@/hooks/useListManagement";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
import { Building, Link as LinkIcon } from "lucide-react";
import { ManageLayout } from "@/components/Manage/ManageLayout";
import { SearchSortBar } from "@/components/Manage/SearchSortBar";
import { ItemHeader } from "@/components/Manage/ItemHeader";
import { FixedActionBar } from "@/components/Manage/FixedActionBar";
import { DeleteConfirmationModal } from "@/components/Manage/DeleteConfirmationModal";
import { FeedbackMessages } from "@/components/Manage/FeedbackMessages";
import { ImageUpload } from "@/components/Manage/ImageUpload";

interface SectorItem {
  id?: string;
  image: string;
  link: string;
  title: string;
  description: string;
  file?: File | null;
}

export default function SectorsPage({ type = "setors" }: { type: string }) {
  const defaultSector = useMemo(() => ({ 
    image: "", 
    link: "", 
    title: "", 
    description: "", 
    file: null 
  }), []);

  const {
    list: sectorList,
    setList: setSectorList,
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
    filteredItems: filteredSectors,
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
  } = useListManagement<SectorItem>({
    type,
    apiPath: `/api/form/${type}`,
    defaultItem: defaultSector,
    validationFields: ["title", "description"]
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setErrorMsg("");

    try {
      const filteredList = sectorList.filter(
        s => s.title.trim() && s.description.trim()
      );

      if (!filteredList.length) {
        setErrorMsg("Adicione ao menos um setor completo (com título e descrição).");
        setLoading(false);
        return;
      }

      if (exists) {
        await updateSectors(filteredList);
      } else {
        const fd = new FormData();
        filteredList.forEach((s, i) => {
          fd.append(`values[${i}][image]`, s.image);
          fd.append(`values[${i}][link]`, s.link);
          fd.append(`values[${i}][title]`, s.title);
          fd.append(`values[${i}][description]`, s.description);
          if (s.file) fd.append(`file${i}`, s.file);
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
        setSectorList(created.values.map((v: any, index: number) => ({ 
          ...v, 
          id: v.id || `sector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          file: null 
        })));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, field: keyof SectorItem, value: any) => {
    const newList = [...sectorList];
    newList[index][field] = value;
    setSectorList(newList);
  };

  const handleFileChange = (index: number, file: File | null) => {
    const newList = [...sectorList];
    newList[index].file = file;
    setSectorList(newList);
  };

  const getImageUrl = (sector: SectorItem): string => {
    if (sector.file) return URL.createObjectURL(sector.file);
    return sector.image;
  };

  const updateSectors = async (list: SectorItem[]) => {
    if (!exists) return;

    const filteredList = list.filter(
      s => s.title.trim() && s.description.trim()
    );

    const fd = new FormData();
    filteredList.forEach((s, i) => {
      fd.append(`values[${i}][image]`, s.image);
      fd.append(`values[${i}][link]`, s.link);
      fd.append(`values[${i}][title]`, s.title);
      fd.append(`values[${i}][description]`, s.description);
      if (s.file) fd.append(`file${i}`, s.file);
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

  // Função wrapper para o submit sem parâmetros
  const handleSubmitWrapper = () => {
    handleSubmit();
  };

  return (
    <ManageLayout
      headerIcon={Building}
      title="Setores"
      description="Crie e gerencie os setores e departamentos da sua empresa"
      exists={!!exists}
      itemName="Setor"
    >
      {/* Controles */}
      <div className="mb-6 space-y-4">
        <SearchSortBar
          search={search}
          setSearch={setSearch}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onClearFilters={clearFilters}
          searchPlaceholder="Buscar setores..."
          total={sectorList.length}
          showing={filteredSectors.length}
          searchActiveText="ⓘ Busca ativa - não é possível adicionar novo setor"
        />
      </div>

      {/* Lista de Setores */}
      <div className="space-y-4 pb-32">
        <form onSubmit={handleSubmit}>
          <AnimatePresence>
            {filteredSectors.map((sector: any) => {
              const originalIndex = sectorList.findIndex(s => s.id === sector.id);
              const hasTitle = sector.title.trim() !== "";
              const hasDescription = sector.description.trim() !== "";
              const hasLink = sector.link.trim() !== "";
              const hasImage = sector.image.trim() !== "" || sector.file;
              const isLastInOriginalList = originalIndex === sectorList.length - 1;
              const isLastAndEmpty = isLastInOriginalList && !hasTitle && !hasDescription;
              const imageUrl = getImageUrl(sector);

              return (
                <div
                  key={sector.id || originalIndex}
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
                          { label: 'Link', hasValue: hasLink },
                          { label: 'Imagem', hasValue: hasImage }
                        ]}
                        showValidation={showValidation}
                        isLast={isLastInOriginalList}
                        onDelete={() => openDeleteSingleModal(originalIndex, sector.title)}
                        showDelete={sectorList.length > 1}
                      />
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Título do Setor
                            </label>
                            <Input
                              type="text"
                              placeholder="Nome do setor..."
                              value={sector.title}
                              onChange={(e: any) => handleChange(originalIndex, "title", e.target.value)}
                              className="font-medium"
                              autoFocus={isLastAndEmpty}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Link
                            </label>
                            <div className="relative">
                              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                              <Input
                                type="url"
                                placeholder="https://exemplo.com/setor"
                                value={sector.link}
                                onChange={(e: any) => handleChange(originalIndex, "link", e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                              Descrição
                            </label>
                            <TextArea
                              placeholder="Descreva as atividades deste setor..."
                              value={sector.description}
                              onChange={(e: any) => handleChange(originalIndex, "description", e.target.value)}
                              rows={4}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <ImageUpload
                            imageUrl={imageUrl}
                            hasImage={hasImage}
                            file={sector.file}
                            onFileChange={(file) => handleFileChange(originalIndex, file)}
                            label="Imagem do Setor"
                            altText="Preview do setor"
                            imageInfo={sector.image && !sector.file
                              ? "Imagem atual do servidor. Selecione um novo arquivo para substituir."
                              : "Formatos suportados: JPG, PNG, WEBP. Tamanho recomendado: 4:3"}
                          />
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

      <FixedActionBar
        onDeleteAll={openDeleteAllModal}
        onAddNew={() => addItem()}
        onSubmit={handleSubmitWrapper}
        isAddDisabled={!canAddNewItem}
        isSaving={loading}
        exists={!!exists}
        completeCount={completeCount}
        totalCount={sectorList.length}
        itemName="Setor"
        itemNamePlural="Setores"
        icon={Building}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={() => confirmDelete(updateSectors)}
        type={deleteModal.type}
        itemTitle={deleteModal.title}
        totalItems={sectorList.length}
        itemName="Setor"
      />

      <FeedbackMessages success={success} errorMsg={errorMsg} />
    </ManageLayout>
  );
}