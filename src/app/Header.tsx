'use client';

import type { ReactNode } from 'react';
import { config } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

config.autoAddCss = false;

interface HeaderProps {
  title: ReactNode;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between bg-blue-950 px-3 py-1 text-white">
      <nav className="flex items-center gap-3" aria-label="Project links">
        <a
          href="https://github.com/mishaevoma/einsum3d"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="einsum3d on GitHub"
        >
          <FontAwesomeIcon icon={faGithub} />
        </a>
        <a
          href="https://twitter.com/manifoldhiker"
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Author on Twitter"
        >
          <FontAwesomeIcon icon={faTwitter} />
        </a>
      </nav>
      <h1 className="whitespace-nowrap text-base sm:text-xl">{title}</h1>
      <a
        className="hidden hover:underline sm:block"
        href="https://github.com/bbycroft/llm-viz"
      >
        Based on llm-viz
      </a>
    </header>
  );
}
