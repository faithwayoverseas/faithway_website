/**
 * Faithway Overseas – WhatsApp Enquiry Utility
 *
 * Centralised helper so every WhatsApp link across the site always
 * uses the same number and pre-filled message template.
 */

export const WHATSAPP_NUMBER = "971508881754";

const PREFILLED_MESSAGE = `Hello Faithway Overseas, I would like to get a professional assessment for overseas immigration and visa opportunities. Kindly assist me with the best options available.

My Name:
Current Country:
Interested Destination:
Preferred Visa Type:`;

/**
 * Returns a fully-formed WhatsApp URL with the pre-filled enquiry message.
 *
 * @param number - Optional override; defaults to the company number.
 */
export function getWhatsAppUrl(number?: string): string {
  const phone = (number ?? WHATSAPP_NUMBER).replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(PREFILLED_MESSAGE);
  return `https://wa.me/${phone}?text=${encoded}`;
}
