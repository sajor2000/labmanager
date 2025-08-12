'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  Trash2, 
  RotateCcw, 
  Archive, 
  AlertCircle,
  CheckSquare,
  Lightbulb,
  MessageSquare,
  Calendar,
  Users,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ArchivedItem {
  id: string;
  type: 'task' | 'idea' | 'comment' | 'deadline' | 'team_member';
  name: string;
  description?: string;
  deletedAt?: Date;
  deletedBy?: string;
  labId?: string;
  projectId?: string;
  metadata?: any;
}

export default function ArchivePage() {
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);

  useEffect(() => {
    fetchArchivedItems();
  }, [selectedType]);

  const fetchArchivedItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      
      const response = await fetch(`/api/archive?${params}`);
      if (!response.ok) throw new Error('Failed to fetch archived items');
      
      const data = await response.json();
      setArchivedItems(data.items || []);
    } catch (error) {
      console.error('Error fetching archived items:', error);
      toast.error('Failed to load archived items');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: ArchivedItem) => {
    try {
      const response = await fetch(`/api/archive/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: item.type, 
          id: item.id 
        }),
      });

      if (!response.ok) throw new Error('Failed to restore item');
      
      toast.success(`${item.name} has been restored`);
      fetchArchivedItems(); // Refresh the list
      setRestoreDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = async (item: ArchivedItem) => {
    try {
      const response = await fetch(`/api/archive/${item.type}/${item.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to permanently delete item');
      
      toast.success(`${item.name} has been permanently deleted`);
      fetchArchivedItems(); // Refresh the list
      setPermanentDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item permanently');
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="h-4 w-4" />;
      case 'idea': return <Lightbulb className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'deadline': return <Calendar className="h-4 w-4" />;
      case 'team_member': return <Users className="h-4 w-4" />;
      default: return <Folder className="h-4 w-4" />;
    }
  };

  const getItemTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800';
      case 'idea': return 'bg-yellow-100 text-yellow-800';
      case 'comment': return 'bg-gray-100 text-gray-800';
      case 'deadline': return 'bg-red-100 text-red-800';
      case 'team_member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = selectedType === 'all' 
    ? archivedItems 
    : archivedItems.filter(item => item.type === selectedType);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Archive className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Archive</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and restore soft-deleted items. Items here can be recovered or permanently deleted.
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Items in the archive are soft-deleted and can be restored. Permanent deletion cannot be undone.
        </AlertDescription>
      </Alert>

      <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="task">Tasks</TabsTrigger>
          <TabsTrigger value="idea">Ideas</TabsTrigger>
          <TabsTrigger value="comment">Comments</TabsTrigger>
          <TabsTrigger value="deadline">Deadlines</TabsTrigger>
          <TabsTrigger value="team_member">Team Members</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No archived items</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {selectedType === 'all' 
                ? 'There are no archived items to display.'
                : `There are no archived ${selectedType}s to display.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={`${item.type}-${item.id}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getItemIcon(item.type)}
                    <CardTitle className="text-base">{item.name}</CardTitle>
                  </div>
                  <Badge className={getItemTypeBadgeColor(item.type)}>
                    {item.type.replace('_', ' ')}
                  </Badge>
                </div>
                {item.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {item.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {item.deletedAt && (
                    <p>Deleted: {format(new Date(item.deletedAt), 'MMM d, yyyy')}</p>
                  )}
                  {item.deletedBy && (
                    <p>By: {item.deletedBy}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setRestoreDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedItem(item);
                      setPermanentDeleteDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={restoreDialogOpen}
        onClose={() => {
          setRestoreDialogOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={() => selectedItem && handleRestore(selectedItem)}
        title="Restore Item"
        description={`Are you sure you want to restore "${selectedItem?.name}"? It will be returned to its original location.`}
        confirmText="Restore"
        variant="info"
        showWarning={false}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={permanentDeleteDialogOpen}
        onClose={() => {
          setPermanentDeleteDialogOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={() => selectedItem && handlePermanentDelete(selectedItem)}
        title="Permanently Delete Item"
        description={`Are you sure you want to permanently delete "${selectedItem?.name}"? This action cannot be undone and the item will be lost forever.`}
        confirmText="Delete Forever"
        variant="destructive"
        showWarning={true}
      />
    </div>
  );
}