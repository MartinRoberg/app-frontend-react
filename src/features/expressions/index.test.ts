import { NodeNotFoundWithoutContext } from 'src/features/expressions/errors';
import { evalExpr } from 'src/features/expressions/index';
import { ExprVal } from 'src/features/expressions/types';
import type { ExprConfig } from 'src/features/expressions/types';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';

describe('Expressions', () => {
  it('should return default value if expression evaluates to null', () => {
    const config: ExprConfig<ExprVal.String> = {
      returnType: ExprVal.String,
      defaultValue: 'hello world',
    };

    expect(
      evalExpr(
        ['frontendSettings', 'whatever'],
        new NodeNotFoundWithoutContext('test'),
        {
          applicationSettings: {},
        } as ExpressionDataSources,
        { config },
      ),
    ).toEqual('hello world');
  });
});
