import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { skillService } from '../../services/skills';
import { useAsync } from '../../hooks/useAsync';
import { useDebounce } from '../../hooks/useDebounce';
import { useUrlState } from '../../hooks/useUrlState';
import { useToast } from '../../context/ToastContext';
import { extractApiError } from '../../api/client';
import type { SkillDto } from '../../types';
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

export default function Skills() {
  const { success, error: toastError } = useToast();
  const [q, setQ] = useUrlState('q');
  const keyword = useDebounce(q, 400);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillDto | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const skills = useAsync(
    () => skillService.search(keyword || undefined),
    [keyword]
  );

  const data = skills.data;
  const loading = skills.loading && !data;
  const error = skills.error;
  const retry = () => skills.reload();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      await skillService.create({ name, description: newDescription.trim() || undefined });
      success('Skill created.');
      setCreateOpen(false);
      setNewName('');
      setNewDescription('');
      skills.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not create the skill.'));
    }
  };

  const handleDelete = async () => {
    if (!skillToDelete) return;
    setDeletingId(skillToDelete.id);
    try {
      await skillService.remove(skillToDelete.id);
      success('Skill deleted.');
      setDeleteOpen(false);
      setSkillToDelete(null);
      skills.reload();
    } catch (err) {
      toastError(extractApiError(err, 'Could not delete the skill.'));
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
        title="Skills"
        description="Manage platform-wide skills used for project requirements and profile matching."
      />

      {error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : loading ? (
        <GridSkeleton count={4} />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total skills" value={data?.length ?? 0} icon={Search} hint="Skills available for projects" />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>All skills</CardTitle>
                  <CardDescription className="mt-1">Create, search and delete skills. Skills in use cannot be deleted.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search skills…"
                    className="w-full lg:w-80"
                    aria-label="Search skills"
                  />
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add skill
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
                <EmptyState title="No skills found" description="Try a different search term." />
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
                  {(data ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{s.name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-300">{s.description ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSkillToDelete(s); setDeleteOpen(true); }}
                          disabled={deletingId === s.id}
                          className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          aria-label={`Delete ${s.name}`}
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
        title="Add skill"
        description="Create a new platform-wide skill."
      >
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <Input label="Skill name" name="name" value={newName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)} placeholder="e.g. TypeScript" />
          <Textarea label="Description (optional)" name="description" rows={3} value={newDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)} placeholder="What does this skill cover?" />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => { setCreateOpen(false); setNewName(''); setNewDescription(''); }}>
              Cancel
            </Button>
            <Button type="submit">
              Create skill
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSkillToDelete(null); }}
        title="Delete skill?"
        message={`"${skillToDelete?.name}" will be removed from the platform. Skills referenced by projects or profiles cannot be deleted.`}
        confirmLabel="Delete skill"
        variant="danger"
        loading={deletingId === skillToDelete?.id}
        onConfirm={handleDelete}
      />
    </div>
  );
}
