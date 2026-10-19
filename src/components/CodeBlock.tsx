import { useMemo } from 'react'

type Kind = 'comment' | 'property' | 'value' | 'punct' | 'selector' | 'string' | 'number' | undefined
type Token = { text: string; kind: Kind }

const DECLARATION = /^(\s*)([\w-]+)(\s*:\s*)(.*?)(;?)(\s*\/\*.*\*\/)?\s*$/

/** Splits CSS into lines of tokens. Line-based, which is enough for our own output. */
function tokenizeCss(source: string): Token[][] {
  let inComment = false
  return source.split('\n').map((line) => {
    const tokens: Token[] = []
    let rest = line
    if (inComment || rest.trimStart().startsWith('/*')) {
      const end = rest.indexOf('*/')
      if (end === -1) {
        inComment = true
        return [{ text: rest, kind: 'comment' }]
      }
      inComment = false
      tokens.push({ text: rest.slice(0, end + 2), kind: 'comment' })
      rest = rest.slice(end + 2)
      if (!rest) return tokens
    }
    const decl = DECLARATION.exec(rest)
    if (decl && !rest.includes('{')) {
      const [, indent = '', property = '', colon = '', value = '', semi = '', comment] = decl
      tokens.push({ text: indent, kind: undefined }, { text: property, kind: 'property' }, { text: colon, kind: 'punct' })
      tokens.push({ text: value, kind: 'value' }, { text: semi, kind: 'punct' })
      if (comment) tokens.push({ text: comment, kind: 'comment' })
      return tokens
    }
    const brace = rest.search(/[{}]/)
    if (brace === -1) return [...tokens, { text: rest, kind: 'selector' }]
    return [...tokens, { text: rest.slice(0, brace), kind: 'selector' }, { text: rest.slice(brace), kind: 'punct' }]
  })
}

const JSON_LINE = /^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)?(.*)$/

function tokenizeJson(source: string): Token[][] {
  return source.split('\n').map((line) => {
    const match = JSON_LINE.exec(line)
    if (!match) return [{ text: line, kind: 'punct' }]
    const [, indent = '', first = '', colon, rest = ''] = match
    const valueKind = (text: string): Kind => (/^"/.test(text) ? 'string' : /^-?\d/.test(text) ? 'number' : 'punct')
    if (!colon) return [{ text: indent, kind: undefined }, { text: first, kind: 'string' }, { text: rest, kind: 'punct' }]
    return [
      { text: indent, kind: undefined },
      { text: first, kind: 'property' },
      { text: colon, kind: 'punct' },
      { text: rest, kind: valueKind(rest) },
    ]
  })
}

interface CodeBlockProps {
  code: string
  language: 'css' | 'json'
  label: string
  className?: string
}

/**
 * Read-only code with light syntax colouring. Long lines wrap with a hanging
 * indent inside the panel instead of forcing it wider. Copy actions always
 * use the raw string, never this rendering.
 */
export function CodeBlock({ code, language, label, className }: CodeBlockProps) {
  const lines = useMemo(() => (language === 'css' ? tokenizeCss(code) : tokenizeJson(code)), [code, language])
  return (
    <pre className={`code${className ? ` ${className}` : ''}`} tabIndex={0} aria-label={label}>
      <code>
        {lines.map((tokens, i) => (
          <span key={i} className="code__line">
            {tokens.length === 0 || tokens.every((t) => t.text === '')
              ? ' '
              : tokens.map((t, j) =>
                  t.kind ? (
                    <span key={j} className={`tok-${t.kind}`}>
                      {t.text}
                    </span>
                  ) : (
                    t.text
                  ),
                )}
          </span>
        ))}
      </code>
    </pre>
  )
}
