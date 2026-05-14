import Head from "next/head";
import { Fragment } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noindex?: boolean;
}

// SEO elements that can be used in _document.tsx (returns JSX without Head wrapper)
export function SEOElements({
  title = "Ukaž Rybu - Sdílej své úlovky s komunitou rybářů",
  description = "Sdílej své úlovky s komunitou rybářů. Soutěž v závodech. Najdi inspiraci. A ano, je to ZDARMA!",
  image = "/og-image.png",
  url = "https://ukaz-rybu.vercel.app",
  noindex = false,
}: SEOProps) {
  return (
    <Fragment>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Fragment>
  );
}

// SEO component for use in pages/_app.tsx or individual pages (uses next/head)
// Note: Flattened structure (no fragment) for better Next.js Head compatibility during hot reload
export function SEO({
  title = "Ukaž Rybu - Sdílej své úlovky s komunitou rybářů",
  description = "Sdílej své úlovky s komunitou rybářů. Soutěž v závodech. Najdi inspiraci. A ano, je to ZDARMA!",
  image = "/og-image.png",
  url = "https://ukaz-rybu.vercel.app",
  noindex = false,
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
