import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { AgentFolder } from '@/hooks/useAgentFolders';

const FOLDER_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#6b7280', // gray
];

interface FolderManagerProps {
  folders: AgentFolder[];
  onCreateFolder: (name: string, color: string) => Promise<unknown>;
  onUpdateFolder: (id: string, updates: { name?: string; color?: string }) => Promise<unknown>;
  onDeleteFolder: (id: string) => Promise<unknown>;
}

export function FolderManager({
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}: FolderManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<AgentFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState(FOLDER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateFolder(folderName.trim(), folderColor);
      setIsCreateDialogOpen(false);
      setFolderName('');
      setFolderColor(FOLDER_COLORS[0]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingFolder || !folderName.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateFolder(editingFolder.id, { name: folderName.trim(), color: folderColor });
      setIsEditDialogOpen(false);
      setEditingFolder(null);
      setFolderName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (folder: AgentFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCreateDialogOpen(true)}
        className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm shrink-0"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        フォルダ
      </Button>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新しいフォルダを作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">フォルダ名</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="例: 営業担当"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">カラー</label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      folderColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={!folderName.trim() || isSubmitting}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>フォルダを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">フォルダ名</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="例: 営業担当"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">カラー</label>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full transition-all ${
                      folderColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleEdit} disabled={!folderName.trim() || isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FolderItemMenuProps {
  folder: AgentFolder;
  onEdit: (folder: AgentFolder) => void;
  onDelete: (id: string) => void;
}

export function FolderItemMenu({ folder, onEdit, onDelete }: FolderItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(folder)}>
          <Pencil className="h-4 w-4 mr-2" />
          編集
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(folder.id)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
