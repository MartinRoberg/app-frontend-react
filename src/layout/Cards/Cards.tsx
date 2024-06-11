import React from 'react';
import type { CSSProperties } from 'react';

import { Card } from '@digdir/designsystemet-react';
import { Grid } from '@material-ui/core';

import { Lang } from 'src/features/language/Lang';
import { CardProvider } from 'src/layout/Cards/CardContext';
import { GenericComponentByRef } from 'src/layout/GenericComponent';
import type { PropsFromGenericComponent } from 'src/layout';
import type { CardInternal } from 'src/layout/Cards/CardsPlugin';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type ICardsProps = PropsFromGenericComponent<'Cards'>;

function parseSize(size: string | undefined, defaultValue: string): string {
  return size && /^[0-9]+$/.test(size) ? `${size}px` : size ?? defaultValue;
}

export const Cards = ({ node }: ICardsProps) => {
  const { cardsInternal, minMediaHeight, minWidth, color, mediaPosition: _mediaPosition } = node.item;
  const processedMinWidth = parseSize(minWidth, '250px');
  const processedMinMediaHeight = parseSize(minMediaHeight, '150px');
  const mediaPosition = _mediaPosition ?? 'top';

  const cardContainer: CSSProperties = {
    display: 'grid',
    gap: '28px',
    gridTemplateColumns: `repeat(auto-fit, minmax(${processedMinWidth}, 1fr))`,
  };

  return (
    <div style={cardContainer}>
      {cardsInternal.map((card, idx) => (
        <Card
          key={idx}
          color={color}
          style={{ height: '100%' }}
        >
          {mediaPosition === 'top' && (
            <Media
              card={card}
              node={node}
              minMediaHeight={processedMinMediaHeight}
            />
          )}
          {card.title && (
            <Card.Header>
              <Lang id={card.title} />
            </Card.Header>
          )}
          {card.description && (
            <Card.Content>
              <Lang id={card.description} />
            </Card.Content>
          )}
          {card.children && card.children.length > 0 && (
            <Grid
              container={true}
              item={true}
              direction='row'
              spacing={3}
            >
              <Grid
                container={true}
                alignItems='flex-start'
                item={true}
                spacing={3}
              >
                <CardProvider
                  node={node}
                  renderedInMedia={false}
                >
                  {card.children.map((childRef, idx) => (
                    <GenericComponentByRef
                      key={idx}
                      nodeRef={childRef}
                    />
                  ))}
                </CardProvider>
              </Grid>
            </Grid>
          )}
          {card.footer && (
            <Card.Footer>
              <Lang id={card.footer} />
            </Card.Footer>
          )}
          {mediaPosition === 'bottom' && (
            <Media
              card={card}
              node={node}
              minMediaHeight={processedMinMediaHeight}
            />
          )}
        </Card>
      ))}
    </div>
  );
};

interface MediaProps {
  card: CardInternal;
  node: LayoutNode<'Cards'>;
  minMediaHeight: string | undefined;
}

function Media({ card, node, minMediaHeight }: MediaProps) {
  if (!card.media) {
    return null;
  }

  return (
    <Card.Media>
      <CardProvider
        node={node}
        renderedInMedia={true}
        minMediaHeight={minMediaHeight}
      >
        <GenericComponentByRef
          key={card.media.nodeRef}
          nodeRef={card.media}
          overrideDisplay={{
            directRender: true,
          }}
        />
      </CardProvider>
    </Card.Media>
  );
}