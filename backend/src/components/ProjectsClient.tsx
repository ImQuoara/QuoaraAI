'use client';

import { useEffect, useState } from 'react';

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  updated_at: string;
};

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProjects(): Promise<Project[]> {
    const response = await fetch('/api/quoaraai/projects', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? 'Could not load projects.');
    return payload;
  }

  useEffect(() => {
    let cancelled = false;

    void fetchProjects()
      .then((nextProjects) => {
        if (!cancelled) setProjects(nextProjects);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load projects.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setProjects(await fetchProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/quoaraai/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, description: description.trim() }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Could not create project.');
      setProjects((current) => [payload, ...current]);
      setName('');
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
      <form onSubmit={create} className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">New project</p>
        <h2 className="mt-3 text-2xl font-semibold">Give QuoaraAi a workspace.</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-400">Creating a project is a persistent change. Submitting this form is your explicit approval for this exact project record.</p>
        <label htmlFor="project-name" className="mt-6 block text-sm text-neutral-300">Name</label>
        <input id="project-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className="mt-2 w-full rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" placeholder="Project name" />
        <label htmlFor="project-description" className="mt-4 block text-sm text-neutral-300">Description</label>
        <textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} rows={5} className="mt-2 w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-neutral-400" placeholder="What is this project for?" />
        <button disabled={!name.trim() || saving} className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-medium text-black disabled:opacity-40">{saving ? 'Creating…' : 'Create project'}</button>
      </form>

      <section className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Workspaces</p>
            <h2 className="mt-2 text-2xl font-semibold">Your projects</h2>
          </div>
          <button onClick={() => void refresh()} className="rounded-xl border border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:text-white">Refresh</button>
        </div>

        {error && <div className="mt-4 rounded-2xl border border-amber-900 bg-amber-950/20 p-4 text-sm text-amber-100">{error}</div>}
        {loading ? <p className="mt-6 text-sm text-neutral-500">Loading…</p> : null}
        {!loading && !projects.length && !error ? <p className="mt-6 text-sm text-neutral-500">No projects yet.</p> : null}

        <div className="mt-5 space-y-3">
          {projects.map((project) => (
            <article key={project.id} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium">{project.name}</h3>
                <span className="rounded-full border border-neutral-800 px-2 py-1 text-[10px] uppercase tracking-wide text-neutral-500">{project.status}</span>
              </div>
              {project.description && <p className="mt-2 text-sm leading-6 text-neutral-400">{project.description}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
