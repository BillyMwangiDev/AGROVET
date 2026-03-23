import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '254740368581';

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_PHONE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
      aria-label="Order via WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
    </a>
  );
}
