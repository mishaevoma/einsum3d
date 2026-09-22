import { useRef } from 'react';
import type { EinsumPreset } from '@/src/einsum';
import { Icon } from '@/src/app/Icon';
import s from './Sidebar.module.scss';

export default function TableOfContents({
    presets,
    selectedIndex,
    onEntryClick,
}: {
    presets: EinsumPreset[];
    selectedIndex: number;
    onEntryClick: (index: number) => void;
}) {
    const details = useRef<HTMLDetailsElement>(null);
    return (
        <nav aria-label="Einsum examples" className={s.examples}>
            <div className={s.sectionHeading}>
                <span>Start with an example</span>
                <span>01—08</span>
            </div>
            <details ref={details}>
                <summary aria-label="Choose an example">
                    <span>
                        <Icon name="cube" />
                        {presets[selectedIndex].name}
                    </span>
                    <Icon name="chevron" size={15} />
                </summary>
                <div className={s.exampleList}>
                    {presets.map((preset, index) => (
                        <button
                            key={preset.name}
                            type="button"
                            aria-label={preset.name}
                            aria-current={
                                selectedIndex === index ? 'true' : undefined
                            }
                            onClick={() => {
                                onEntryClick(index);
                                if (details.current)
                                    details.current.open = false;
                            }}
                        >
                            <span>{preset.name}</span>
                            <code>{preset.state.equation}</code>
                            {selectedIndex === index && (
                                <Icon name="check" size={14} />
                            )}
                        </button>
                    ))}
                </div>
            </details>
        </nav>
    );
}
