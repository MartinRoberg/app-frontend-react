// TODO: Re-create this with zustand/hooks.
// export function* previewPdfSaga(): SagaIterator {
//   yield put(DevToolsActions.setPdfPreview({ preview: true }));
//   const el = yield call(waitForSelector, '#pdfView #readyForPrint', 5000);
//   if (el) {
//     window.print();
//   }
//   yield put(DevToolsActions.setPdfPreview({ preview: false }));
// }

// async function waitForSelector(selector: string, timeOut = 5000) {
//   const start = performance.now();
//   while (document.querySelector(selector) === null) {
//     if (performance.now() - start > timeOut) {
//       return null;
//     }
//     await new Promise((resolve) => requestAnimationFrame(resolve));
//   }
//   return document.querySelector(selector);
// }
