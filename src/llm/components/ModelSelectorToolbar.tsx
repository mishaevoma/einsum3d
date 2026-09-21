'use client';

import { faExpand } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fitCameraToLayout } from '../program/EinsumProgram';
import { useProgramState } from '../Sidebar';

export function ModelSelectorToolbar() {
  const program = useProgramState();

  return (
    <div className="absolute top-0 left-0 m-2">
      <button
        type="button"
        title="Fit visualization to view"
        aria-label="Fit visualization to view"
        className="flex min-w-8 cursor-pointer justify-center rounded bg-white p-2 shadow hover:bg-blue-300"
        onClick={() => {
          fitCameraToLayout(program);
          program.markDirty();
        }}
      >
        <FontAwesomeIcon icon={faExpand} />
      </button>
    </div>
  );
}
