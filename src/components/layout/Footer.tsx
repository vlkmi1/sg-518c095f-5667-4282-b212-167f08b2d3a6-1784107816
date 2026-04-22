export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-4 mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Ukaž Rybu
          {" • "}
          <span className="font-mono">v3.0.0</span>
        </p>
      </div>
    </footer>
  );
}