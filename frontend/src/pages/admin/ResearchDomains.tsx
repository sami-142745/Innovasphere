import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { researchDomainService } from '../../services/research-domains';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import type { ResearchDomainDto } from '../../types';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  GridSkeleton,
  Input,
  Modal,
  Skeleton,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Textarea,
  ConfirmationDialog
} from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';
import { StatCard } from '../../components/shared/StatCard';

export default function ResearchDomains() {
  const { success, error: toastError } = useToast();
  const [q, setQ] = useUrlState('q');
  const keyword = useDebounce(q, 400);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<ResearchDomainDto | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const domains = useAsync(
    () => researchDomainService.search(keyword || undefined),
    [keyword]
  );

  const data = domains.data;
  const loading = domains.loading && !data;
  const error = domains.error;
  const retry = () => domains.reload();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await researchDomainService.create({ name, description: newDescription.trim() || undefined });
      success('Research domain created.');
      setCreateOpen(false);
      setNewName('');
      setNewDescription('');
      domains.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not create the research domain.'));
    }
  };

  const handleDelete = async () => {
    if (!domainToDelete) return;
    setDeletingId(domainToDelete.id);
    try {
      await researchDomainService.remove(domainToDelete.id);
      success('Research domain deleted.');
      setDeleteOpen(false);
      setDomainToDelete(null);
      domains.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not delete the research domain.'));
      setDeletingId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <HeroBanner
        accent="admin"
        eyebrow="Administration"
        title="Research domains"
        description="Manage platform-wide research domains used for project tagging and mentor matching."
      />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading ? (
        <GridSkeleton count={4} />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total domains" value={data?.length ?? 0} icon={Search} hint="Research domains available for projects" />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>All research domains</CardTitle>
                  <CardDescription className="mt-1">Create, search and delete research domains. Domains in use cannot be deleted.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search research domains…"
                    className="w-full lg:w-80"
                    aria-label="Search research domains"
                  />
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add domain
                  </Button>
                </div>
              </div>
            </CardHeader>

            {error ? (
              <ErrorState message={error} onRetry={retry} />
            ) : loading ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell className="text-right">Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : data && data.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No research domains found" description="Try a different search term." />
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell className="text-right">Actions</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{d.name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{d.description ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setDomainToDelete(d); setDeleteOpen(true); }}
                          disabled={deletingId === d.id}
                          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setNewName(''); setNewDescription(''); }}
        title="Add research domain"
        description="Create a new platform-wide research domain."
      >
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <Input label="Domain name" name="name" value={newName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} placeholder="e.g. Artificial Intelligence" />
          <Textarea label="Description (optional)" name="description" rows={3} value={newDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)} placeholder="What does this research domain cover?" />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); setNewName(''); setNewDescription(''); }}>
              Cancel
            </Button>
            <Button type="submit">
              Create domain
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDomainToDelete(null); }}
        title="Delete research domain?"
        message={`"${domainToDelete?.name}" will be removed from the platform. Domains referenced by projects or profiles cannot be deleted.`}
        confirmLabel="Delete domain"
        variant="danger"
        loading={deletingId === domainToDelete?.id}
        onConfirm={handleDelete}
      />
    </div>
  );
}
