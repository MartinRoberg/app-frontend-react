import React, { Component, useEffect } from 'react';
import type { MutableRefObject, PropsWithChildren } from 'react';

import { NodesInternal } from 'src/utils/layout/NodesContext';
import { isNode, isPage } from 'src/utils/layout/typeGuards';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPage } from 'src/utils/layout/LayoutPage';

interface IErrorBoundary {
  lastError?: Error;
  nodeRef: MutableRefObject<LayoutPage | LayoutNode | undefined>;
}

export class GeneratorErrorBoundary extends Component<PropsWithChildren, IErrorBoundary> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      lastError: undefined,
      nodeRef: { current: undefined },
    };
  }

  static getDerivedStateFromError(lastError: Error) {
    return { lastError };
  }

  render() {
    if (this.state.lastError) {
      return (
        <StoreErrorAndBail
          error={this.state.lastError}
          node={this.state.nodeRef.current}
        />
      );
    }

    return <Context.Provider value={{ nodeRef: this.state.nodeRef }}>{this.props.children}</Context.Provider>;
  }
}

interface ContextData {
  nodeRef: MutableRefObject<LayoutPage | LayoutNode | undefined>;
}

const Context = React.createContext<ContextData>({
  nodeRef: { current: undefined },
});

export function useGeneratorErrorBoundaryNodeRef() {
  return React.useContext(Context).nodeRef;
}

function StoreErrorAndBail({ error, node }: { error: Error; node: LayoutPage | LayoutNode | undefined }) {
  const addError = NodesInternal.useAddError();

  useEffect(() => {
    if (isNode(node)) {
      addError(error.message, node);
      window.logError(`Exception thrown when generating node "${node.id}":\n`, error);
    } else if (isPage(node)) {
      addError(error.message, node);
      window.logError(`Exception thrown when generating page "${node.pageKey}":\n`, error);
    } else {
      window.logError('Exception thrown when generating unknown node:\n', error);
    }
  }, [addError, error, node]);

  return null;
}
