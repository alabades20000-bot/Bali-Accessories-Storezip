import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { Copy, ShoppingCart, Sparkles, Check, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { spinWheel } from "@/lib/wheel.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/wheel")({
  head: () => ({
    meta: [
      { title: "عجلة الحظ | Bali+" },
      { name: "description", content: "أدر عجلة حظ Bali+ واربح خصومات فورية على مشترياتك." },
      { property: "og:title", content: "عجلة الحظ | Bali+" },
      { property: "og:description", content: "خصومات يومية بانتظارك مع عجلة حظ Bali+." },
    ],
  }),
  component: WheelPage,
});

type Prize = {
  id: string;
  label: string;
  discount_percent: number;
  code: string | null;
  weight: number;
  color: string;
};

const FALLBACK_PRIZES: Prize[] = [
  { id: "fallback-5", label: "خصم 5%", discount_percent: 5, code: "BALI5", weight: 35, color: "#0d7286" },
  { id: "fallback-10", label: "خصم 10%", discount_percent: 10, code: "BALI10", weight: 28, color: "#f0a35b" },
  { id: "fallback-15", label: "خصم 15%", discount_percent: 15, code: "BALI15", weight: 20, color: "#126e82" },
  { id: "fallback-20", label: "خصم 20%", discount_percent: 20, code: "BALI20", weight: 12, color: "#d9654f" },
  { id: "fallback-free", label: "حظ أوفر", discount_percent: 0, code: null, weight: 5, color: "#3a506b" },
];

function WheelPage() {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [copied, setCopied] = useState(false);
  const spun = useRef(false);
  const runSpin = useServerFn(spinWheel);

  const { data: prizes = [] } = useQuery({
    queryKey: ["wheel-prizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wheel_prizes_public")
        .select("id,label,discount_percent,weight,color")
        .order("sort_order", { ascending: true });
      if (error || !data || data.length === 0) return FALLBACK_PRIZES;
      return (data ?? []).map((p) => ({ ...p, code: null })) as Prize[];
    },
  });

  const slice = prizes.length > 0 ? 360 / prizes.length : 360;

  const gradient = useMemo(() => {
    if (prizes.length === 0) return "conic-gradient(var(--muted) 0deg 360deg)";
    const colorSegments = prizes.map((p, i) => {
      const fromAngle = i * slice;
      const toAngle = (i + 1) * slice;
      return `${p.color} ${fromAngle}deg ${toAngle}deg`;
    });
    return `conic-gradient(${colorSegments.join(", ")})`;
  }, [prizes, slice]);

  const spin = async () => {
    if (spinning || prizes.length === 0) return;
    if (spun.current) {
      toast.info("لديك محاولة واحدة في هذه الزيارة");
      return;
    }
    setSpinning(true);
    setResult(null);

    let won: Prize | null = null;
    try {
      won = (await runSpin()) as Prize | null;
    } catch {
      won = null;
    }
    if (!won) {
      setSpinning(false);
      toast.error("تعذر تشغيل العجلة، حاول مرة أخرى");
      return;
    }
    const selectedPrize = won;

    const prizeIndex = Math.max(
      0,
      prizes.findIndex((p) => p.id === selectedPrize.id),
    );
    if (!selectedPrize.code) {
      won = {
        ...selectedPrize,
        code: selectedPrize.discount_percent > 0 ? `BALI${selectedPrize.discount_percent}` : null,
      };
    }

    const target = 360 * 6 + (360 - (prizeIndex * slice + slice / 2));
    setAngle((prev) => prev + target);

    window.setTimeout(() => {
      setSpinning(false);
      spun.current = true;
      setResult(won);
      if (won.code) {
        try {
          sessionStorage.setItem("active_discount_code", won.code);
          sessionStorage.setItem("active_discount_percent", String(won.discount_percent));
        } catch {
          /* ignore */
        }
        toast.success(`مبروك! ربحت ${won.label}`);
      }
    }, 4200);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("تم نسخ كود الخصم بنجاح! سيتم تطبيقه في السلة");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary mb-3">
        <Sparkles className="size-4" />
        جوائز وخصومات يومية
      </div>

      <h1 className="font-display text-4xl font-black">عجلة الحظ</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        أدر العجلة واربح كود خصم فوري يطبّق تلقائياً على فاتورتك عند الدفع.
      </p>

      <div className="relative mx-auto mt-10 size-[320px] sm:size-[400px]">
        {/* مؤشر العجلة العلوي */}
        <div className="absolute left-1/2 top-[-14px] z-10 -translate-x-1/2 border-x-[12px] border-t-[24px] border-x-transparent border-t-accent drop-shadow-md" />

        <div
          className="size-full rounded-full deep-shadow ring-8 ring-primary/30"
          style={{
            backgroundImage: gradient,
            transform: `rotate(${angle}deg)`,
            transition: "transform 4s cubic-bezier(0.15, 0.9, 0.15, 1)",
          }}
        />

        <div className="pointer-events-none absolute inset-0">
          {prizes.map((p, i) => {
            const rot = angle + i * slice + slice / 2;
            return (
              <span
                key={p.id}
                className="absolute left-1/2 top-1/2 origin-[0_0] text-xs font-black text-primary-foreground drop-shadow"
                style={{
                  transform: `rotate(${rot}deg) translate(60px, -8px)`,
                  transition: "transform 4s cubic-bezier(0.15, 0.9, 0.15, 1)",
                }}
              >
                {p.label}
              </span>
            );
          })}
        </div>

        <div className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full sea-gradient font-display text-lg font-black text-primary-foreground ring-4 ring-background/60 glow-shadow">
          Bali+
        </div>
      </div>

      <Button
        size="lg"
        className="mt-10 gap-2 font-bold text-base px-8 py-6 rounded-2xl glow-shadow"
        onClick={spin}
        disabled={spinning}
      >
        <Gift className="size-5" />
        {spinning ? "العجلة تدور…" : "أدر العجلة الآن"}
      </Button>

      {result && (
        <div className="mx-auto mt-8 max-w-sm rounded-3xl glass-card p-6 border border-primary/40 animate-in fade-in zoom-in duration-300">
          <div className="size-12 mx-auto rounded-2xl sea-gradient flex items-center justify-center text-primary-foreground mb-3 glow-shadow">
            <Sparkles className="size-6" />
          </div>
          <h2 className="font-display text-2xl font-black text-primary">{result.label}</h2>

          {result.code ? (
            <>
              <p className="mt-2 text-xs text-muted-foreground">كود الخصم الحصري الخاص بك:</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="select-all rounded-xl bg-secondary/80 border border-border/80 px-4 py-2 font-mono text-lg font-black text-foreground">
                  {result.code}
                </span>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => copyCode(result.code!)}
                  title="نسخ الكود"
                >
                  {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                </Button>
              </div>

              <p className="mt-2 text-[11px] text-emerald-400 font-bold">
                ✓ تم حفظ الكود وسيتم تطبيقه تلقائياً عند الدخول للسلة
              </p>

              <Button asChild className="mt-5 w-full gap-2 font-bold" size="lg">
                <Link to="/cart">
                  <ShoppingCart className="size-4" />
                  الذهاب للسلة وتطبيق الخصم
                </Link>
              </Button>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">حظ أوفر في الزيارة القادمة!</p>
          )}
        </div>
      )}
    </div>
  );
}