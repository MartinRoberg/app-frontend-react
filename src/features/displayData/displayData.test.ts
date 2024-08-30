import { getSharedTests } from 'src/features/expressions/shared';
import { getComponentConfigs } from 'src/layout/components.generated';
import { Def } from 'src/layout/def';

describe('Every component implementing DisplayData should have at least one shared test of displayValue expression', () => {
  const sharedTests = getSharedTests('functions').content.find(({ folderName }) => folderName === 'displayValue');
  for (const [type, config] of Object.entries(getComponentConfigs())) {
    if (Def.implements.displayData(config.def)) {
      it(`Component: ${type}`, () => {
        expect(
          sharedTests?.content.find(
            ({ expression, layouts }) =>
              expression?.[0] === 'displayValue' &&
              Object.values(layouts ?? {}).find((layout) =>
                layout.data.layout.find((component) => component.id === expression?.[1] && component.type === type),
              ),
          ),
        ).toBeTruthy();
      });
    }
  }
});
