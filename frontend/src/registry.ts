const blockModules = import.meta.glob('./blocks/*.tsx', { eager: true });
export const BLOCK_REGISTRY: Record<string, React.ComponentType<any>> = {};

Object.entries(blockModules).forEach(([_path, module]) => {
  const type = (module as any).blockType;
  if (type) BLOCK_REGISTRY[type] = (module as any).default;
});
