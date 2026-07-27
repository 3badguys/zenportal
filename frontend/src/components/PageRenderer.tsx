import { BLOCK_REGISTRY } from '../registry';

export default function PageRenderer({ blocks }: { blocks: any[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Nothing here yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-8">
      {blocks.map((block) => {
        const Component = BLOCK_REGISTRY[block.type];
        if (!Component) return null;
        return <Component key={block.id} {...block.props} />;
      })}
    </div>
  );
}
