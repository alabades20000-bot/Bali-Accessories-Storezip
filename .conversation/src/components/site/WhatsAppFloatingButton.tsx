import { MessageCircle } from "lucide-react";

const STORE_WHATSAPP = "9647760623777";

export function WhatsAppFloatingButton() {
  const openWhatsApp = () => {
    const text = "مرحباً، أود الاستفسار بخصوص المنتجات والطلبات في متجر Bali+";
    window.open(`https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <button
      type="button"
      onClick={openWhatsApp}
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-20 left-4 z-40 flex size-13 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 glow-shadow no-print md:bottom-6 md:left-6"
    >
      <MessageCircle className="size-7" />
      <span className="sr-only">واتساب</span>
    </button>
  );
}