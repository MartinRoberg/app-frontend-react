import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { CompCategory } from 'src/layout/common';

export const Config = new CG.component({
  category: CompCategory.Action,
  rendersWithLabel: LabelRendering.Off,
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
})
  .addProperty(
    new CG.prop(
      'compact',
      new CG.bool()
        .optional()
        .setTitle('Compact')
        .setDescription('Change appearance of navbar as compact in desktop view'),
    ),
  )
  .addProperty(new CG.prop('validateOnForward', CG.common('PageValidation').optional()))
  .addProperty(new CG.prop('validateOnBackward', CG.common('PageValidation').optional()));
