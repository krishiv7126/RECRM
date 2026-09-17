/**
 * Minimal renderer for the markdown subset the AI Workspace models actually
 * produce — **bold**, bullet/numbered lists, and pipe tables. Not a general
 * markdown parser (no nested lists, links, code fences); just enough so
 * output doesn't show raw `**`/`|---|` syntax in the UI.
 */

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function isTableBlock(lines: string[]) {
  return lines.length >= 2 && lines.every((l) => l.trim().startsWith('|'))
}

function isBulletBlock(lines: string[]) {
  return lines.every((l) => /^[-*]\s+/.test(l.trim()))
}

function isOrderedBlock(lines: string[]) {
  return lines.every((l) => /^\d+\.\s+/.test(l.trim()))
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines.map((l) =>
    l
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((c) => c.trim()),
  )
  const [header, ...rest] = rows
  // Second row like |---|---| is a separator, not data.
  const isSeparatorRow = (r: string[]) => r.every((c) => /^:?-{2,}:?$/.test(c))
  const body = isSeparatorRow(rest[0] ?? []) ? rest.slice(1) : rest

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {header.map((cell, i) => (
              <th key={i} className="px-3 py-1.5 font-semibold text-foreground">
                <InlineText text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className={i < body.length - 1 ? 'border-b border-border/60' : ''}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 align-top">
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim())

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim())

        if (isTableBlock(lines)) return <Table key={i} lines={lines} />

        if (isBulletBlock(lines)) {
          return (
            <ul key={i} className="list-disc space-y-0.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>
                  <InlineText text={l.trim().replace(/^[-*]\s+/, '')} />
                </li>
              ))}
            </ul>
          )
        }

        if (isOrderedBlock(lines)) {
          return (
            <ol key={i} className="list-decimal space-y-0.5 pl-5">
              {lines.map((l, j) => (
                <li key={j}>
                  <InlineText text={l.trim().replace(/^\d+\.\s+/, '')} />
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={i} className="whitespace-pre-wrap text-pretty">
            <InlineText text={block} />
          </p>
        )
      })}
    </div>
  )
}
