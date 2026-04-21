import Link from "next/link";

export function Footer() {
  const version = "2.4.4"; // Z package.json

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Ukaž Rybu</span>
            <span className="hidden md:inline">•</span>
            <span className="text-xs">v{version}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}