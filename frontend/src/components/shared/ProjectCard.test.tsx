import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectCard } from './ProjectCard';
import { makeProject } from '../../test/fixtures';

function withinRouter(project: ReturnType<typeof makeProject>) {
  return render(<MemoryRouter><ProjectCard project={project} /></MemoryRouter>);
}

describe('ProjectCard', () => {
  it('renders project details and links to the project page', () => {
    withinRouter(makeProject());

    const link = screen.getByRole('link', { name: /neural interface design/i });
    expect(link).toHaveAttribute('href', '/projects/p-1');
    expect(screen.getByText('Neural Interface Design')).toBeInTheDocument();
    expect(screen.getByText('A novel brain-computer interface for accessibility.')).toBeInTheDocument();
    expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('4/4')).toBeInTheDocument();
  });

  it('shows short description', () => {
    withinRouter(makeProject());
    expect(screen.getByText('A novel brain-computer interface for accessibility.')).toBeInTheDocument();
  });

  it('shows the human-readable project status label', () => {
    withinRouter(makeProject({ status: 'LOOKING_FOR_TEAM' }));
    expect(screen.getByText('Looking for Team')).toBeInTheDocument();
  });
});