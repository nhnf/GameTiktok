export function ErrorNote({ message, className = "" }: { message: string; className?: string }) {
  return (
    <p role="alert" className={`rounded-nb-sm border-2 border-ink bg-red px-3 py-2 text-sm font-bold text-ink ${className}`}>
      <span aria-hidden>⚠ </span>
      {message}
    </p>
  );
}
