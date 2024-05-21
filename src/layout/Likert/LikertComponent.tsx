import React from 'react';

import { Table } from '@digdir/designsystemet-react';
import { Grid, Typography } from '@material-ui/core';
import cn from 'classnames';

import { AltinnSpinner } from 'src/components/AltinnSpinner';
import { Lang } from 'src/features/language/Lang';
import { useLanguage } from 'src/features/language/useLanguage';
import { useGetOptions } from 'src/features/options/useGetOptions';
import { useIsMobileOrTablet } from 'src/hooks/useIsMobile';
import { LayoutStyle } from 'src/layout/common.generated';
import { GenericComponent } from 'src/layout/GenericComponent';
import classes from 'src/layout/LikertItem/LikertItemComponent.module.css';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import { useNodeTraversal } from 'src/utils/layout/useNodeTraversal';
import type { IGenericComponentProps } from 'src/layout/GenericComponent';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

interface LikertComponentProps {
  node: LayoutNode<'Likert'>;
}

export const LikertComponent = ({ node }: LikertComponentProps) => {
  const children = useNodeTraversal(
    (t) => t.children((i) => i.type === 'node' && i.item?.type === 'LikertItem'),
    node,
  ) as LayoutNode<'LikertItem'>[];
  const firstLikertChildItem = useNodeItem(children[0]);
  const { textResourceBindings } = useNodeItem(node);
  const mobileView = useIsMobileOrTablet();
  const { options: calculatedOptions, isFetching } = useGetOptions({
    ...(firstLikertChildItem || {}),
    node,
    valueType: 'single',
    dataModelBindings: undefined,
  });
  const { lang } = useLanguage();

  const id = node.getId();
  const hasDescription = !!textResourceBindings?.description;
  const hasTitle = !!textResourceBindings?.title;
  const titleId = `likert-title-${id}`;
  const descriptionId = `likert-description-${id}`;

  const Header = () => (
    <Grid
      item={true}
      xs={12}
      data-componentid={node?.getId()}
    >
      {hasTitle && (
        <Typography
          component='div'
          variant='h3'
          style={{ width: '100%' }}
          id={titleId}
        >
          <Lang id={textResourceBindings?.title} />
        </Typography>
      )}
      {hasDescription && (
        <Typography
          variant='body1'
          gutterBottom
          id={descriptionId}
        >
          <Lang id={textResourceBindings?.description} />
        </Typography>
      )}
    </Grid>
  );

  if (mobileView) {
    return (
      <Grid
        item
        container
      >
        <Header />
        <div
          role='group'
          aria-labelledby={(hasTitle && titleId) || undefined}
          aria-describedby={(hasDescription && descriptionId) || undefined}
        >
          {children.map((comp) => (
            <GenericComponent
              key={comp.getId()}
              node={comp}
            />
          ))}
        </div>
      </Grid>
    );
  }

  return (
    <>
      <Header />
      {isFetching ? (
        <AltinnSpinner />
      ) : (
        <div className={classes.likertTableContainer}>
          <Table
            id={id}
            aria-labelledby={(hasTitle && titleId) || undefined}
            aria-describedby={(hasDescription && descriptionId) || undefined}
            className={classes.likertTable}
            role='group'
          >
            <Table.Head
              id={`likert-table-header-${id}`}
              aria-hidden={true}
            >
              <Table.Row>
                <Table.HeaderCell id={`${id}-likert-columnheader-left`}>
                  <span
                    className={cn(classes.likertTableHeaderCell, {
                      'sr-only': textResourceBindings?.leftColumnHeader == null,
                    })}
                  >
                    <Lang id={textResourceBindings?.leftColumnHeader ?? 'likert.left_column_default_header_text'} />
                  </span>
                </Table.HeaderCell>
                {calculatedOptions.map((option, index) => {
                  const colLabelId = `${id}-likert-columnheader-${index}`;
                  return (
                    <Table.HeaderCell
                      key={option.value}
                      className={classes.likertTableHeaderCell}
                      id={colLabelId}
                    >
                      {lang(option.label)}
                    </Table.HeaderCell>
                  );
                })}
              </Table.Row>
            </Table.Head>
            <Table.Body id={`likert-table-body-${id}`}>
              {children.map((comp) => {
                const override: IGenericComponentProps<'LikertItem'>['overrideItemProps'] = {
                  layout: LayoutStyle.Table,
                };

                return (
                  <GenericComponent
                    key={comp.getId()}
                    node={comp}
                    overrideItemProps={override}
                  />
                );
              })}
            </Table.Body>
          </Table>
        </div>
      )}
    </>
  );
};
