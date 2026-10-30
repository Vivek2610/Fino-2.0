/**
 * Splits a paragraph into words so ScrollExperience can bring them from faint
 * to full ink as the reader scrolls — a quiet "being written" feel.
 * The text stays one normal paragraph for search engines and screen readers.
 */
export default function ScrubText({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="sw">{w}</span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
