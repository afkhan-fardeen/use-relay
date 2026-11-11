/** An endless, slow strip of words. Decorative; the list is repeated for the loop and hidden from screen readers. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="marquee-row flex shrink-0 items-center gap-10 pr-10">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-10 whitespace-nowrap text-[28px] sm:text-[40px] tracking-[-0.04em]">{t}<span className="size-1.5 rounded-full bg-primary" /></li>
      ))}
    </ul>
  );
  return (
    <div className="marquee group flex overflow-hidden border-y border-line py-6 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      {row(false)}{row(true)}
    </div>
  );
}
