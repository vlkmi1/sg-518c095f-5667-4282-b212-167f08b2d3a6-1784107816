export function Footer() {
  const version = "2.6.0";

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Ukaž Rybu</span>
            <span className="hidden md:inline">•</span>
            <span className="text-xs">v{version}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}