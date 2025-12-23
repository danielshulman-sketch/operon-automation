'use client';

import Image from 'next/image';
import { useId, useState } from 'react';

export default function BrandMark({
    size = 48,
    withWordmark = false,
    tagline = 'Control Center',
    className = '',
    wordmarkClassName = '',
    priority = false,
}) {
    const [imageFailed, setImageFailed] = useState(false);
    const gradientId = useId();

    const glyph = (
        <Image
            src="/images/operon-icon.png"
            alt="Operon"
            width={size}
            height={size}
            className="object-contain"
            priority={priority}
        />
    );

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {glyph}
            {withWordmark && (
                <div className={`leading-tight ${wordmarkClassName}`}>
                    <span className="block text-xl font-semibold tracking-tight">Operon</span>
                    {tagline && (
                        <span className="text-[10px] uppercase tracking-[0.35em] text-white/60">
                            {tagline}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
