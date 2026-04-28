/**
 * The canonical span shape used by all text-bearing building blocks
 * (Text, SectionHeading, BulletList items, NumberedList items, table
 * cells, etc. as they ship in later phases). The only formatting bit
 * is `bold` — italic, underline, color, and font-size are explicitly
 * out of scope for v1 (per F9 spec).
 */
export interface TextSpan {
  text: string;
  bold: boolean;
}

/** Type guard — narrows unknown to TextSpan. */
export function isTextSpan(value: unknown): value is TextSpan {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TextSpan).text === 'string' &&
    typeof (value as TextSpan).bold === 'boolean'
  );
}

