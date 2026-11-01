import { whatsappUrl } from "@/lib/site-config";
import styles from "./PhoneActions.module.css";

export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.4 15.1L2 22l5.05-1.6A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3 .95.98-2.9-.2-.3a8.2 8.2 0 1 1 6.72 3.58Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.17.25-.63.8-.77.96-.14.17-.28.19-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.22-1.46-1.37-1.7-.14-.25-.02-.38.1-.5.11-.11.25-.28.37-.42.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.17 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.17-.47-.29Z" />
    </svg>
  );
}

export function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
    </svg>
  );
}

/**
 * Phone number with two clear actions: chat on WhatsApp (mobile app or
 * WhatsApp Web / Desktop) and a normal phone call.
 */
export default function PhoneActions({ phone, whatsapp }: { phone: string; whatsapp?: string | null }) {
  const wa = whatsappUrl(whatsapp || phone, "Hello FINO JEWELLERY, I'd like to enquire about your collection.");
  const tel = `tel:${phone.replace(/[^\d+]/g, "")}`;
  return (
    <span className={styles.wrap}>
      <span className={styles.number}>{phone}</span>
      <span className={styles.actions}>
        {wa && (
          <a
            className={`${styles.btn} ${styles.wa}`}
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp with ${phone} (opens in a new tab)`}
          >
            <WhatsAppIcon size={17} />
            <span>WhatsApp</span>
          </a>
        )}
        <a className={`${styles.btn} ${styles.call}`} href={tel} aria-label={`Call ${phone}`}>
          <PhoneIcon size={16} />
          <span>Call</span>
        </a>
      </span>
      {wa && <span className={styles.hint}>Message us on WhatsApp, or call directly.</span>}
    </span>
  );
}
