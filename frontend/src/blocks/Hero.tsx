
interface HeroProps { title: string; subtitle?: string; avatar?: string; }

export default function Hero({ title, subtitle, avatar }: HeroProps) {
  return (
    <div className="flex flex-col items-center text-center py-12">
      {avatar && <img src={avatar} alt="" className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg" />}
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>}
    </div>
  );
}
export const blockType = 'Hero';
