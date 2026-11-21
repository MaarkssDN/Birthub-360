const ARBITRARY_HEX_OR_PIXEL_CLASS_REGEX =
  /\b(?:bg|text|border|ring|p|px|py|m|mx|my|w|h|gap|rounded)-\[(?:#[0-9a-fA-F]{3,8}|\d+(?:px|rem|em))\]/g;

export function auditTailwindArbitraryClasses(classNameString: string): {
  valid: boolean;
  arbitraryClasses: string[];
} {
  const matches = classNameString.match(ARBITRARY_HEX_OR_PIXEL_CLASS_REGEX) ?? [];
  return {
    valid: matches.length === 0,
    arbitraryClasses: matches,
  };
}
