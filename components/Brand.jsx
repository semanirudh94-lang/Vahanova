export default function Brand({ markClass = "h-7 w-auto", textClass = "text-lg" }) {
  return (
    <>
      <img src="/brand/mark.png" alt="VAHANOVA" width={583} height={344} className={`shrink-0 ${markClass}`} />
      <span className={`${textClass} font-bold uppercase tracking-[0.18em]`}>Vahanova</span>
    </>
  );
}
