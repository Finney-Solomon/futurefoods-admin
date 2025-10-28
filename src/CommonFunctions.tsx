export const formatINR = (paise?: number) => {
  if (typeof paise !== "number") return "—";
  const rupees = paise / 100;
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 2,
  }).format(rupees);
};