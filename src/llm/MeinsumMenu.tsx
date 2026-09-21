interface TableOfContentsProps {
  texts: string[];
  selectedIndex?: number;
  onEntryClick: (index: number) => void;
}

export default function TableOfContents({
  texts,
  selectedIndex,
  onEntryClick,
}: TableOfContentsProps) {
  return (
    <nav aria-label="Einsum examples">
      <ul className="m-0 list-none p-0">
        {texts.map((text, index) => {
          const selected = selectedIndex === index;
          return (
            <li key={text}>
              <button
                type="button"
                aria-current={selected ? 'true' : undefined}
                className={`w-full border border-slate-200 px-4 py-2 text-left ${
                  selected ? 'bg-sky-200 font-bold' : 'hover:bg-slate-100'
                }`}
                onClick={() => onEntryClick(index)}
              >
                {text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

