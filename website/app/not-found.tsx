import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main">
      <div className="container page-head" style={{ minHeight: "60vh", alignContent: "center" }}>
        <p className="eyebrow">Page not found</p>
        <h1 className="h2">
          This thread <em>leads nowhere.</em>
        </h1>
        <p>
          <Link className="btn btn--forest" href="/">Return home</Link>
        </p>
      </div>
    </main>
  );
}
