import '@testing-library/cypress/add-commands';
import 'cypress-axe';
import 'cypress-plugin-tab';
import 'cypress-network-idle';
import 'test/e2e/support/custom';
import 'test/e2e/support/start-app-instance';
import 'test/e2e/support/global';
import 'test/e2e/support/auth';
import 'test/e2e/support/navigation';
import 'test/e2e/support/formFiller';
import '@percy/cypress';

import { AppFrontend } from 'test/e2e/pageobjects/app-frontend';
import { chaiExtensions } from 'test/e2e/support/chai-extensions';

const appFrontend = new AppFrontend();

before(() => {
  chai.use(chaiExtensions);
});

afterEach(function () {
  cy.waitUntilSaved();
  cy.waitUntilNodesReady();

  if (this.currentTest && (this.currentTest as any).__allowFailureOnEnd === undefined) {
    cy.get(appFrontend.instanceErrorCode).should('not.exist');
  }

  const testName = this.currentTest?.fullTitle();
  const title = this.currentTest?.title.replace(/\s+/g, '-').replace(/[^a-zA-Z\-0-9_]/g, '');
  const specBaseName = Cypress.spec.relative.split(/[\\/]/).pop()?.split('.')[0];
  const fileName = `log-${specBaseName}-${title}.txt`;

  cy.window().then((win: any) => {
    if (Array.isArray(win._cyLog) && win._cyLog.length > 0 && win._cyLogSave === true) {
      const log: string[] = [
        '==================================================',
        `Test: ${testName}`,
        `Title: ${this.currentTest?.title}`,
        `Spec: ${Cypress.spec.relative}`,
        '',
        ...win._cyLog,
        '',
      ];
      cy.writeFile(`test/logs/${fileName}`, log.join('\n'), { flag: 'a+' });
    }
  });
});
