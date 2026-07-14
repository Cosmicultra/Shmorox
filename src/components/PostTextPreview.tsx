const POST_LINK_MARKDOWN_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

export function PostTextPreview({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return (
    <p className="mt-3 whitespace-pre-wrap text-sm text-primary">
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!match) return <span key={index}>{part}</span>;

        return (
          <a
            key={index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:text-accent/80"
          >
            {match[1]}
          </a>
        );
      })}
    </p>
  );
}
