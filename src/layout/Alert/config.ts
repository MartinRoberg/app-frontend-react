import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { CompCategory } from 'src/layout/common';

export const Config = new CG.component({
  category: CompCategory.Presentation,
  rendersWithLabel: LabelRendering.Off,
  capabilities: {
    renderInTable: false,
    renderInButtonGroup: false,
    renderInAccordion: false,
    renderInAccordionGroup: false,
    renderInCards: true,
    renderInCardsMedia: false,
  },
  functionality: {
    customExpressions: false,
  },
})
  .addTextResource(
    new CG.trb({
      name: 'title',
      title: 'Title',
      description: 'The title of the alert',
    }),
  )
  .addTextResource(
    new CG.trb({
      name: 'body',
      title: 'Body',
      description: 'The body text of the alert',
    }),
  )
  .addProperty(
    new CG.prop(
      'severity',
      new CG.enum('success', 'warning', 'danger', 'info')
        .setTitle('Alert severity')
        .setDescription('The severity of the alert')
        .exportAs('AlertSeverity'),
    ),
  );
