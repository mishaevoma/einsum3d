import type { CSSProperties } from 'react';

const paths = {
    cube: 'M12 3 3 8v9l9 5 9-5V8l-9-5Zm0 10L3 8m9 5 9-5m-9 5v9M7.5 5.5l9 5',
    chevron: 'm6 9 6 6 6-6',
    arrow: 'M4 12h16m-6-6 6 6-6 6',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    copy: 'M9 9h12v12H9zM15 9V3H3v12h6',
    check: 'm5 12 4 4L19 6',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
    close: 'm6 6 12 12M6 18 18 6',
    code: 'm8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18',
} as const;

export function Icon({
    name,
    size = 18,
    style,
}: {
    name: keyof typeof paths;
    size?: number;
    style?: CSSProperties;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={style}
        >
            <path d={paths[name]} />
        </svg>
    );
}
