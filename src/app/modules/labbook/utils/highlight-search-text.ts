export function highlightSearchText(elem: HTMLElement, search_text: string): string {
  const content = elem.textContent ?? '';
  if (!search_text) return content;

  const regex = new RegExp(search_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, {
    acceptNode: node => node.parentElement?.closest('script, style, mjx-container')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes: Text[] = [];
  let node: Node | null;
  // Collect first: replacing the walker's current node can truncate traversal.
  while ((node = walker.nextNode())) nodes.push(node as Text);

  for (const textNode of nodes) {
    const text = textNode.data;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of text.matchAll(regex)) {
      fragment.append(document.createTextNode(text.slice(offset, match.index)));
      const mark = document.createElement('span');
      mark.style.backgroundColor = 'yellow';
      mark.style.fontWeight = 'bold';
      mark.textContent = match[0];
      fragment.append(mark);
      offset = match.index! + match[0].length;
    }
    if (!offset) continue;
    fragment.append(document.createTextNode(text.slice(offset)));
    textNode.replaceWith(fragment);
  }
  return content;
}
