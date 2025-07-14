import React from 'react';
import TextImage from './TextImage';
import BenefitList from './BenefitList';
import Hero from './Hero';

const componentMap: Record<string, React.ComponentType<any>> = {
  'page-components.text-image': TextImage,
  'page-components.benefit-list': BenefitList,
  'page-components.hero': Hero,
  // Add more mappings as you create more components
};

export default function PageComponentRenderer({ components }: { components: any[] }) {
  if (!components || !Array.isArray(components)) return null;
  return (
    <>
      {components.map((comp, idx) => {
        const Comp = componentMap[comp.__component];
        if (!Comp) return null;
        return <Comp key={comp.id || idx} {...comp} />;
      })}
    </>
  );
} 