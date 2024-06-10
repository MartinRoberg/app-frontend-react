import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { CompCategory } from 'src/layout/common';

export const Config = new CG.component({
  category: CompCategory.Presentation,
  rendersWithLabel: LabelRendering.FromGenericComponent,
  capabilities: {
    renderInTable: false,
    renderInButtonGroup: false,
    renderInAccordion: false,
    renderInAccordionGroup: false,
    renderInCards: false,
    renderInCardsMedia: false,
  },
  functionality: {
    customExpressions: false,
  },
}).addProperty(
  new CG.prop(
    'elements',
    new CG.obj(
      new CG.prop('dateSent', new CG.bool().optional()),
      new CG.prop('sender', new CG.bool().optional()),
      new CG.prop('receiver', new CG.bool().optional()),
      new CG.prop('referenceNumber', new CG.bool().optional()),
    )
      .optional()
      .setTitle('Elements')
      .setDescription('Which elements to show in the instance information'),
  ),
);
