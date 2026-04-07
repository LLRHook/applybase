export function CompanyLogo({ employer, url }: { employer: string; url?: string }) {
  let domain: string | undefined;
  try {
    if (url) domain = new URL(url).hostname;
  } catch {}

  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : undefined;

  return (
    <div className="flex items-center gap-2">
      {faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="w-5 h-5 rounded flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span>{employer}</span>
    </div>
  );
}
