import { NodesInternal } from 'src/utils/layout/NodesContext';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export const useAttachmentsUploader = () => NodesInternal.useAttachmentsUpload();
export const useAttachmentsUpdater = () => NodesInternal.useAttachmentsUpdate();
export const useAttachmentsRemover = () => NodesInternal.useAttachmentsRemove();
export const useAttachmentsAwaiter = () => NodesInternal.useWaitUntilUploaded();

export const useAttachmentsFor = (node: LayoutNode) => NodesInternal.useAttachments(node);

export const useAttachmentsSelector = () => NodesInternal.useAttachmentsSelector();

export const useHasPendingAttachments = () => NodesInternal.useHasPendingAttachments();
export const useAllAttachments = () => NodesInternal.useAllAttachments();
