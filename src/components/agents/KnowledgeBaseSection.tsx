import { useState, useCallback } from "react";
import {
  useKnowledgeBases,
  useKnowledgeItems,
  useCreateKnowledgeBase,
  useDeleteKnowledgeBase,
  useCreateKnowledgeItem,
  useUpdateKnowledgeItem,
  useDeleteKnowledgeItem,
  useUploadKnowledgeFile,
  KnowledgeItem,
} from "@/hooks/useKnowledgeBase";
import { useKnowledgeBaseFolders } from "@/hooks/useKnowledgeBaseFolders";
import { KnowledgeBaseListView, KnowledgeBaseDetailView } from "./knowledge";

export function KnowledgeBaseSection() {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);

  // Data hooks
  const { data: knowledgeBases = [], isLoading: isLoadingKbs, refetch: refetchKbs } = useKnowledgeBases();
  const { data: knowledgeItems = [], isLoading: isLoadingItems } = useKnowledgeItems(selectedKbId);
  const { folders, createFolder, updateFolder, deleteFolder, moveToFolder } = useKnowledgeBaseFolders();

  // Mutation hooks
  const createKb = useCreateKnowledgeBase();
  const deleteKb = useDeleteKnowledgeBase();
  const createItem = useCreateKnowledgeItem();
  const updateItem = useUpdateKnowledgeItem();
  const deleteItem = useDeleteKnowledgeItem();
  const uploadFile = useUploadKnowledgeFile();

  const selectedKb = knowledgeBases.find((kb) => kb.id === selectedKbId);

  // Handlers for list view
  const handleMoveToFolder = useCallback(async (kbId: string, folderId: string | null) => {
    await moveToFolder(kbId, folderId);
    refetchKbs();
  }, [moveToFolder, refetchKbs]);

  const handleCreateKb = useCallback(async (data: { name: string; description: string; files: File[] }) => {
    const newKb = await createKb.mutateAsync({ name: data.name, description: data.description });

    // Upload pending files to the new knowledge base
    if (data.files.length > 0 && newKb) {
      for (const file of data.files) {
        try {
          const result = await uploadFile.mutateAsync(file);
          await createItem.mutateAsync({
            knowledge_base_id: newKb.id,
            title: file.name,
            content: `ファイル: ${file.name}`,
            file_url: result.url,
            file_type: result.type,
            category: "other",
          });
        } catch (err) {
          console.error("Failed to upload file:", file.name, err);
        }
      }
    }

    // Select the new knowledge base to show uploaded files
    if (newKb) {
      setSelectedKbId(newKb.id);
    }
  }, [createKb, uploadFile, createItem]);

  const handleDeleteKb = useCallback(async (id: string) => {
    await deleteKb.mutateAsync(id);
    if (selectedKbId === id) setSelectedKbId(null);
  }, [deleteKb, selectedKbId]);

  // Handlers for detail view
  const handleFileUpload = useCallback(async (file: File) => {
    if (!selectedKbId) return;

    const result = await uploadFile.mutateAsync(file);
    await createItem.mutateAsync({
      knowledge_base_id: selectedKbId,
      title: file.name,
      content: `ファイル: ${file.name}`,
      file_url: result.url,
      file_type: result.type,
      category: "other",
    });
  }, [selectedKbId, uploadFile, createItem]);

  const handleCreateItem = useCallback(async (data: { title: string; content: string; category?: string }) => {
    if (!selectedKbId) return;
    await createItem.mutateAsync({
      knowledge_base_id: selectedKbId,
      title: data.title,
      content: data.content,
      category: data.category,
    });
  }, [selectedKbId, createItem]);

  const handleUpdateItem = useCallback(async (
    item: KnowledgeItem,
    data: { title: string; content: string; category?: string }
  ) => {
    await updateItem.mutateAsync({
      id: item.id,
      knowledge_base_id: item.knowledge_base_id,
      title: data.title,
      content: data.content,
      category: data.category,
      elevenlabs_document_id: item.elevenlabs_document_id,
    });
  }, [updateItem]);

  const handleDeleteItem = useCallback(async (item: KnowledgeItem) => {
    await deleteItem.mutateAsync({
      id: item.id,
      knowledge_base_id: item.knowledge_base_id,
      elevenlabs_document_id: item.elevenlabs_document_id,
    });
  }, [deleteItem]);

  // Render detail view if a knowledge base is selected
  if (selectedKb) {
    return (
      <KnowledgeBaseDetailView
        knowledgeBase={selectedKb}
        items={knowledgeItems}
        onBack={() => setSelectedKbId(null)}
        onFileUpload={handleFileUpload}
        onCreateItem={handleCreateItem}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        isUploading={uploadFile.isPending}
        isCreating={createItem.isPending}
        isUpdating={updateItem.isPending}
      />
    );
  }

  // Render list view
  return (
    <KnowledgeBaseListView
      knowledgeBases={knowledgeBases}
      folders={folders}
      isLoading={isLoadingKbs}
      selectedKbId={selectedKbId}
      onSelectKb={setSelectedKbId}
      onDeleteKb={handleDeleteKb}
      onCreateKb={handleCreateKb}
      onMoveToFolder={handleMoveToFolder}
      onCreateFolder={createFolder}
      onUpdateFolder={updateFolder}
      onDeleteFolder={deleteFolder}
      isCreating={createKb.isPending || uploadFile.isPending}
    />
  );
}
