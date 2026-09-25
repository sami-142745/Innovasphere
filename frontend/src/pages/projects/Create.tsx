import { ProjectForm } from '../../components/forms/ProjectForm';
import { Card, CardContent } from '../../components/ui';
import { HeroBanner } from '../../components/shared/HeroBanner';

export default function Create() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <HeroBanner
        eyebrow="New research idea"
        title="Create project"
        description="Share your research idea and describe the skills your team needs."
      />
      <Card className="relative mt-6 overflow-hidden rounded-panel">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden="true" />
        <CardContent className="p-6 sm:p-8">
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}