import { whatsappUrl } from "@/lib/site-config";

/**
 * A phone number that opens a WhatsApp chat (mobile app, or WhatsApp Web /
 * Desktop on a computer). If the number can't be turned into a WhatsApp link,
 * it falls back to a normal tel: link.
 */
export default function PhoneLink({
  phone,
  whatsapp,
  className,
  style,
}: {
  phone: string;
  whatsapp?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const wa = whatsappUrl(whatsapp || phone, "Hello FINO JEWELLERY, I'd like to enquire about your collection.");
  if (!wa) {
    return (
      <a className={className} style={style} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
        {phone}
      </a>
    );
  }
  return (
    <a
      className={className}
      style={style}
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with us on WhatsApp: ${phone} (opens in a new tab)`}
    >
      {phone}
    </a>
  );
}
