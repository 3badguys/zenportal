export default function MarkdownPreview({ text }: { text: string }) {
  let html = text
    .replace(/### (.+)/g, '<h4 class="font-semibold text-sm mt-2 mb-1">$1</h4>')
    .replace(/## (.+)/g, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
    .replace(/# (.+)/g, '<h2 class="font-semibold text-lg mt-3 mb-1">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-xs text-red-600">$1</code>')
    .replace(/^\- (.+)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n\n+/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
  html = '<p class="mb-2">' + html + '</p>';
  return <div className="text-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}
