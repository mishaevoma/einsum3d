import { Icon } from './Icon';
import styles from './layout.module.scss';

export function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.brand}>
                <span className={styles.brandIcon}>
                    <Icon name="cube" size={25} />
                </span>
                <h1 aria-label="einsum visualization">
                    einsum<span>3D</span>
                </h1>
                <span className={styles.tagline}>
                    A playground for tensor thinking.
                </span>
            </div>
            <nav aria-label="Project links" className={styles.links}>
                <a
                    href="https://github.com/bbycroft/llm-viz"
                    target="_blank"
                    rel="noreferrer"
                >
                    Built on llm-viz
                </a>
                <a
                    href="https://github.com/mishaevoma/einsum3d"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="einsum3d on GitHub"
                >
                    GitHub <span aria-hidden="true">↗</span>
                </a>
            </nav>
        </header>
    );
}
