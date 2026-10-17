export function AdminPageHeader({ title, description, count }: { title: string; description?: string; count?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="inline-block -rotate-1 rounded-nb border-3 border-ink bg-yellow px-4 py-1.5 font-display text-3xl uppercase leading-none shadow-nb-md">
          {title}
        </h1>
        {description && <p className="mt-4 max-w-2xl text-sm font-medium">{description}</p>}
      </div>
      {count !== undefined && <span className="rounded-full border-2 border-ink bg-white px-3 py-1 font-mono text-xs font-bold">{count} item</span>}
    </div>
  );
}
