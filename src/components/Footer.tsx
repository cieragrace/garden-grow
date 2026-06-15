export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-soil-soft sm:px-6">
        <p>
          Recreated by{" "}
          <a
            href="https://cieragraceconsulting.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-leaf underline-offset-2 hover:underline"
          >
            Ciera Grace Consulting
          </a>
        </p>
        <p className="mt-1 text-xs text-soil-soft/80">
          Zone data is approximate — always check your local last-frost date.
        </p>
      </div>
    </footer>
  );
}
