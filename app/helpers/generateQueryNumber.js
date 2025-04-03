export function generateQueryNumber() {
  const now = new Date();
  const formattedDate = now
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
  return formattedDate;
}
