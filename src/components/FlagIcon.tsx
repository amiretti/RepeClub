/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';

interface FlagIconProps {
  emoji: string;
  label: string;
  className?: string;
}

const REGIONAL_INDICATOR_START = 0x1f1e6;
const REGIONAL_INDICATOR_END = 0x1f1ff;

function isRegionalIndicatorFlag(emoji: string): boolean {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0) || 0);
  return (
    codePoints.length === 2 &&
    codePoints.every((cp) => cp >= REGIONAL_INDICATOR_START && cp <= REGIONAL_INDICATOR_END)
  );
}

function toCodePointSequence(input: string): string {
  return Array.from(input)
    .map((char) => (char.codePointAt(0) || 0).toString(16))
    .join('-');
}

export const FlagIcon: React.FC<FlagIconProps> = ({ emoji, label, className = 'w-4 h-4' }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const canUseSvgFlag = useMemo(() => isRegionalIndicatorFlag(emoji), [emoji]);
  const codePointSequence = useMemo(() => toCodePointSequence(emoji), [emoji]);

  if (canUseSvgFlag && !imageFailed) {
    return (
      <img
        src={`https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codePointSequence}.svg`}
        alt={label}
        title={label}
        className={`${className} inline-block align-middle`}
        loading="lazy"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span role="img" aria-label={label} title={label} className="inline-block align-middle">
      {emoji}
    </span>
  );
};
