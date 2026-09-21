import type { Metadata } from 'next';
import { Header } from './Header';
import { LayerView } from '@/src/llm/LayerView';

export const metadata: Metadata = {
  title: 'einsum 3D visualization',
  description:
    'Explore Einstein summation equations as interactive 3D tensor layouts.',
};

export default function Page() {
  return (
    <>
      <Header title="einsum visualization" />
      <LayerView />
      <div id="portal-container" />
    </>
  );
}
