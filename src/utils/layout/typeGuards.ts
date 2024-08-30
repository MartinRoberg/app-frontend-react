import { AttachmentsPlugin } from 'src/features/attachments/AttachmentsPlugin';
import { OptionsPlugin } from 'src/features/options/OptionsPlugin';
import { LayoutNode } from 'src/utils/layout/LayoutNode';
import { LayoutPage } from 'src/utils/layout/LayoutPage';
import { LayoutPages } from 'src/utils/layout/LayoutPages';
import type { CompWithBehavior } from 'src/layout/layout';

export function isPages(input: unknown): input is LayoutPages {
  return input ? input instanceof LayoutPages : false;
}

export function isPage(input: unknown): input is LayoutPage {
  return input ? input instanceof LayoutPage : false;
}

export function isNode(input: unknown): input is LayoutNode {
  return input ? input instanceof LayoutNode : false;
}

export function nodeCanHaveAttachments(node: LayoutNode): node is LayoutNode<CompWithBehavior<'canHaveAttachments'>> {
  return node.def.hasPlugin(AttachmentsPlugin);
}

export function nodeCanHaveOptions(node: LayoutNode): node is LayoutNode<CompWithBehavior<'canHaveOptions'>> {
  return node.def.hasPlugin(OptionsPlugin);
}
