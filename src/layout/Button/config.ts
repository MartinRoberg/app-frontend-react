import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { CompCategory } from 'src/layout/common';

export const Config = new CG.component({
  category: CompCategory.Action,
  rendersWithLabel: LabelRendering.Off,
  capabilities: {
    renderInTable: true,
    renderInButtonGroup: true,
    renderInAccordion: true,
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
      description: 'The title/text on the button',
    }),
  )
  .addProperty(
    new CG.prop(
      'mode',
      new CG.enum('submit', 'save', 'instantiate')
        .optional({ default: 'submit' })
        .setTitle('Mode')
        .setDescription('The mode of the button')
        .exportAs('ButtonMode'),
    ),
  )
  .addProperty(new CG.prop('mapping', CG.common('IMapping').optional()));
