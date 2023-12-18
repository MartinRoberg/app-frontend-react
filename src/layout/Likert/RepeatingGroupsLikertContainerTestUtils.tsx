import React from 'react';

import { screen, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';

import { getInitialStateMock } from 'src/__mocks__/initialStateMock';
import { RepeatingGroupsLikertContainer } from 'src/layout/Likert/RepeatingGroupsLikertContainer';
import { mockMediaQuery } from 'src/test/mockMediaQuery';
import { renderWithInstanceAndLayout } from 'src/test/renderWithProviders';
import { useResolvedNode } from 'src/utils/layout/NodesContext';
import type { ILayoutState } from 'src/features/form/layout/formLayoutSlice';
import type { FDNewValue } from 'src/features/formData/FormDataWriteStateMachine';
import type { IRawTextResource, ITextResourceResult } from 'src/features/language/textResources';
import type { IValidationState } from 'src/features/validation/validationSlice';
import type { IOption } from 'src/layout/common.generated';
import type { CompGroupExternal, CompGroupRepeatingLikertExternal } from 'src/layout/Group/config.generated';
import type { CompOrGroupExternal } from 'src/layout/layout';
import type { CompLikertExternal } from 'src/layout/Likert/config.generated';
import type { ILayoutValidations } from 'src/utils/validation/types';

export const defaultMockQuestions = [
  { Question: 'Hvordan trives du på skolen?', Answer: '' },
  { Question: 'Har du det bra?', Answer: '' },
  { Question: 'Hvor god er du i matte?', Answer: '' },
];

const groupBinding = 'Questions';
const answerBinding = 'Answer';
const questionBinding = 'Question';

export const generateMockFormData = (likertQuestions: IQuestion[]) => ({
  [groupBinding]: Array.from({ length: likertQuestions.length }, (_, index) => ({
    [answerBinding]: likertQuestions[index].Answer,
    [questionBinding]: likertQuestions[index].Question,
  })),
});

export const defaultMockOptions: IOption[] = [
  {
    label: 'Bra',
    value: '1',
  },
  {
    label: 'Ok',
    value: '2',
  },
  {
    label: 'Dårlig',
    value: '3',
  },
];

export const questionsWithAnswers = ({ questions, selectedAnswers }) => {
  const questionsCopy = [...questions];

  selectedAnswers.forEach((answer) => {
    questionsCopy[answer.questionIndex].Answer = answer.answerValue;
  });

  return questionsCopy;
};

const createLikertContainer = (
  props: Partial<CompGroupRepeatingLikertExternal> | undefined,
): CompGroupRepeatingLikertExternal => ({
  id: 'likert-repeating-group-id',
  type: 'Group',
  children: ['field1'],
  maxCount: 99,
  dataModelBindings: {
    group: groupBinding,
  },
  edit: {
    mode: 'likert',
  },
  ...props,
});

const createRadioButton = (props: Partial<CompLikertExternal> | undefined): CompLikertExternal => ({
  id: 'field1',
  type: 'Likert',
  dataModelBindings: {
    simpleBinding: `${groupBinding}.${answerBinding}`,
  },
  textResourceBindings: {
    title: 'likert-questions',
  },
  optionsId: 'option-test',
  readOnly: false,
  required: false,
  ...props,
});

export const createFormDataUpdateProp = (index: number, optionValue: string): FDNewValue => ({
  path: `Questions[${index}].Answer`,
  newValue: optionValue,
});

const createLayout = (container: CompGroupExternal, components: CompOrGroupExternal[]): ILayoutState => ({
  layoutsets: null,
  layouts: {
    FormLayout: [container, ...components],
  },
  layoutSetId: null,
  uiConfig: {
    hiddenFields: [],
    currentView: 'FormLayout',
    focus: null,
    pageOrderConfig: {
      order: null,
      hidden: [],
      hiddenExpr: {},
    },
    pageTriggers: [],
    excludePageFromPdf: [],
    excludeComponentFromPdf: [],
  },
});

export const createFormError = (index: number): ILayoutValidations => ({
  [`field1-${index}`]: {
    simpleBinding: {
      errors: ['Feltet er påkrevd'],
      warnings: [],
    },
  },
});

const createFormValidationsForCurrentView = (validations: ILayoutValidations = {}): IValidationState => ({
  invalidDataTypes: [],
  validations: { FormLayout: validations },
});

const createTextResource = (questions: IQuestion[], extraResources: IRawTextResource[]): ITextResourceResult => ({
  resources: [
    {
      id: 'likert-questions',
      value: '{0}',
      variables: [
        {
          key: `${groupBinding}[{0}].${questionBinding}`,
          dataSource: 'dataModel.default',
        },
      ],
    },
    ...questions.map((question, index) => ({
      id: `likert-questions-${index}`,
      value: question.Question,
    })),
    ...extraResources,
  ],
  language: 'nb',
});

const { setScreenWidth } = mockMediaQuery(992);

interface IQuestion {
  Question: string;
  Answer: string;
}

interface IRenderProps {
  mobileView: boolean;
  mockQuestions: IQuestion[];
  mockOptions: IOption[];
  radioButtonProps: Partial<CompLikertExternal>;
  likertContainerProps: Partial<CompGroupRepeatingLikertExternal>;
  extraTextResources: IRawTextResource[];
  validations: ILayoutValidations;
}

export const render = async ({
  mobileView = false,
  mockQuestions = defaultMockQuestions,
  mockOptions = defaultMockOptions,
  radioButtonProps,
  likertContainerProps,
  extraTextResources = [],
  validations,
}: Partial<IRenderProps> = {}) => {
  const mockRadioButton = createRadioButton(radioButtonProps);
  const mockLikertContainer = createLikertContainer(likertContainerProps);
  const components: CompOrGroupExternal[] = [mockRadioButton];

  setScreenWidth(mobileView ? 600 : 1200);
  return await renderWithInstanceAndLayout({
    renderer: () => <ContainerTester id={mockLikertContainer.id} />,
    reduxState: getInitialStateMock({
      formLayout: createLayout(mockLikertContainer, components),
      formValidations: createFormValidationsForCurrentView(validations),
    }),
    initialPage: 'Task_1/FormLayout',
    queries: {
      fetchOptions: () => Promise.resolve({ data: mockOptions, headers: {} } as AxiosResponse<IOption[], any>),
      fetchTextResources: () => Promise.resolve(createTextResource(mockQuestions, extraTextResources)),
      fetchFormData: async () => generateMockFormData(mockQuestions),
    },
  });
};

export function ContainerTester(props: { id: string }) {
  const node = useResolvedNode(props.id);
  if (!node || !(node.isType('Group') && node.isRepGroupLikert())) {
    throw new Error(`Could not resolve node with id ${props.id}, or unexpected node type`);
  }

  return <RepeatingGroupsLikertContainer node={node} />;
}

export const validateTableLayout = async (questions: IQuestion[], options: IOption[]) => {
  screen.getByRole('table');

  for (const option of defaultMockOptions) {
    const columnHeader = await screen.findByRole('columnheader', {
      name: new RegExp(option.label),
    });
    expect(columnHeader).toBeInTheDocument();
  }

  await validateRadioLayout(questions, options);
};

export const validateRadioLayout = async (questions: IQuestion[], options: IOption[], mobileView = false) => {
  if (mobileView) {
    const radioGroups = await screen.findAllByRole('radiogroup');
    expect(radioGroups).toHaveLength(questions.length);
  } else {
    expect(await screen.findAllByRole('row')).toHaveLength(questions.length + 1);
  }

  for (const question of questions) {
    const row = await screen.findByRole(mobileView ? 'radiogroup' : 'row', {
      name: question.Question,
    });

    for (const option of options) {
      // Ideally we should use `getByRole` selector here, but the tests that use this function
      // generates a DOM of several hundred nodes, and `getByRole` is quite slow since it has to traverse
      // the entire tree. Doing that in a loop (within another loop) on hundreds of nodes is not a good idea.
      // ref: https://github.com/testing-library/dom-testing-library/issues/698
      const radio = within(row).getByDisplayValue(option.value);

      if (question.Answer && option.value === question.Answer) {
        expect(radio).toBeChecked();
      } else {
        expect(radio).not.toBeChecked();
      }
    }
  }
};
