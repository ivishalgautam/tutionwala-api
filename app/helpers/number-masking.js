export const numberMasking = (content) =>
  content.replace(
    /(?:\+91|91|0)?[\s-]*([6-9][0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9][\s-]*[0-9])/g,
    (match) => {
      const digits = match.replace(/[^\d]/g, "");
      if (
        digits.length === 10 ||
        (digits.length === 12 && digits.startsWith("91")) ||
        (digits.length === 13 && digits.startsWith("091"))
      ) {
        return "*******" + digits.slice(-2);
      }
      return match;
    }
  );
