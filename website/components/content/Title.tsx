/**
 * Renders a CMS heading: “title” followed by the gold-italic “emphasis”.
 * Each word is wrapped so that, inside a [data-reveal] heading, the words rise
 * into place one after another (CSS in globals.css → "WORD RISE"). The text
 * itself stays plain and readable for search engines and screen readers.
 */
function Words({ text, start }: { text: string; start: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="w" style={{ "--i": start + i } as React.CSSProperties}>
            <span>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function Title({ title, emphasis, lineBreak = false }: { title: string; emphasis?: string; lineBreak?: boolean }) {
  const n = title.split(/\s+/).filter(Boolean).length;
  return (
    <>
      <Words text={title} start={0} />
      {emphasis ? (
        <>
          {lineBreak ? <br /> : " "}
          <em>
            <Words text={emphasis} start={n} />
          </em>
        </>
      ) : null}
    </>
  );
}
