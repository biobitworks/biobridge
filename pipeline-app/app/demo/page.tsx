export const metadata = { title: 'BioBridge — Demo' };

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col items-center gap-6 overflow-y-auto px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">BioBridge — 90-second demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A GTM AI employee for distributed science: Nimble discovery, regulatory
          qualification, and a Glasswork-style custody store.
        </p>
      </div>
      <video controls playsInline preload="metadata"
        className="w-full rounded-lg border border-border shadow-sm" src="/demo.mp4" />
      <a href="/demo.mp4" className="text-sm text-muted-foreground underline">Permalink: /demo.mp4</a>
    </main>
  );
}
