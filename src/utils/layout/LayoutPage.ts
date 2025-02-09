import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutObject } from 'src/utils/layout/LayoutObject';
import type { LayoutPages } from 'src/utils/layout/LayoutPages';
import type { TraversalTask } from 'src/utils/layout/useNodeTraversal';

/**
 * The layout page is a class containing an entire page/form layout, with all components/nodes within it. It
 * allows for fast/indexed searching, i.e. looking up an exact node in constant time.
 */
export class LayoutPage implements LayoutObject {
  public parent: this;
  public layoutSet: LayoutPages;
  public pageKey: string;

  private allChildren: LayoutNode[] = [];
  private allChildIds = new Set<string>();
  private directChildren: LayoutNode[] = [];

  /**
   * Adds a child to the collection. For internal use only.
   */
  public _addChild(child: LayoutNode) {
    if (!this.allChildIds.has(child.id)) {
      this.layoutSet.registerNode(child);
      this.allChildIds.add(child.id);
      this.allChildren.push(child);

      // Direct children of a layout page are always static.
      // Only children of components like repeating groups are dynamic
      if (child.parent === this) {
        this.directChildren.push(child);
      }
    }
  }

  public _removeChild(child: LayoutNode) {
    if (this.allChildIds.has(child.id)) {
      this.layoutSet.unregisterNode(child);
      this.allChildIds.delete(child.id);

      const aI = this.allChildren.indexOf(child);
      aI > -1 && this.allChildren.splice(aI, 1);
      const dI = this.directChildren.indexOf(child);
      dI > -1 && this.directChildren.splice(dI, 1);
    }
  }

  /**
   * Looks for a matching component upwards in the hierarchy, returning the first one (or undefined if
   * none can be found). A BaseLayoutNode will look at its siblings and then further up in the hierarchy.
   * When it reaches a page object like this, we'll have to look to see if any nodes in the page matches,
   * and otherwise pass the task upwards to all pages.
   */
  public closest(task: TraversalTask, passedFrom?: LayoutPage | LayoutNode | LayoutPages): LayoutNode | undefined {
    const out = this.firstDeepChild(task); // First deep child that passes
    if (out) {
      return out;
    }

    if (this.layoutSet && this.layoutSet !== passedFrom) {
      return this.layoutSet.closest(task, this);
    }

    return undefined;
  }

  public firstChild(task: TraversalTask): LayoutNode | undefined {
    for (const node of this.directChildren) {
      if (task.passes(node)) {
        return node;
      }
    }

    return undefined;
  }

  private firstDeepChild(task: TraversalTask): LayoutNode | undefined {
    for (const node of this.allChildren) {
      if (task.passes(node)) {
        return node;
      }
    }

    return undefined;
  }

  public children(task: TraversalTask): LayoutNode[] {
    if (task.allPasses()) {
      return this.directChildren;
    }

    const children: LayoutNode[] = [];
    for (const node of this.directChildren) {
      if (task.passes(node)) {
        children.push(node);
      }
    }

    return children;
  }

  public flat(task?: TraversalTask): LayoutNode[] {
    return task ? this.allChildren.filter((n) => task.passes(n)) : this.allChildren;
  }

  public isRegisteredInCollection(layoutSet: LayoutPages): boolean {
    return this.pageKey !== undefined && layoutSet.isPageRegistered(this.pageKey, this);
  }

  public registerCollection(pageKey: string, layoutSet: LayoutPages) {
    this.pageKey = pageKey;
    this.layoutSet = layoutSet;
    layoutSet.replacePage(this);

    for (const node of this.allChildren) {
      layoutSet.registerNode(node);
    }
  }
}
