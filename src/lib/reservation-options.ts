export const OCCASIONS = [
  { value: "none", label: "Aucune" },
  { value: "birthday", label: "Anniversaire" },
  { value: "anniversary", label: "Anniversaire de couple" },
  { value: "business", label: "Repas d'affaires" },
  { value: "date", label: "Dîner en amoureux" },
  { value: "family", label: "Famille" },
  { value: "celebration", label: "Célébration" },
  { value: "other", label: "Autre" },
] as const;

export const RESERVATION_STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "COMPLETED", label: "Terminée / assise" },
  { value: "NO_SHOW", label: "No-show" },
  { value: "CANCELLED", label: "Annulée" },
] as const;

export const RESERVATION_SOURCE_OPTIONS = [
  { value: "ONLINE", label: "En ligne" },
  { value: "PHONE", label: "Téléphone" },
  { value: "WALK_IN", label: "Sur place" },
  { value: "OTHER", label: "Autre" },
] as const;
