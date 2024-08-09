import React, { useCallback } from 'react';

import { Paragraph } from '@digdir/designsystemet-react';
import cn from 'classnames';

import { useDataModelBindings } from 'src/features/formData/useDataModelBindings';
import { Lang } from 'src/features/language/Lang';
import { ComponentStructureWrapper } from 'src/layout/ComponentStructureWrapper';
import { Map } from 'src/layout/Map/Map';
import classes from 'src/layout/Map/MapComponent.module.css';
import { isLocationValid, parseLocation } from 'src/layout/Map/utils';
import type { PropsFromGenericComponent } from 'src/layout';
import type { Location } from 'src/layout/Map/config.generated';

export type IMapComponentProps = PropsFromGenericComponent<'Map'>;

export function MapComponent({ node, isValid }: IMapComponentProps) {
  const { formData, setValue } = useDataModelBindings(node.item.dataModelBindings);

  const markerBinding = formData.simpleBinding;
  const markerLocation = markerBinding ? parseLocation(markerBinding) : undefined;
  const markerLocationIsValid = isLocationValid(markerLocation);

  const setMarkerLocation = useCallback(
    ({ latitude, longitude }: Location) => {
      const d = 6;
      setValue('simpleBinding', `${latitude.toFixed(d)},${longitude.toFixed(d)}`);
    },
    [setValue],
  );

  return (
    <ComponentStructureWrapper
      node={node}
      label={{
        ...node.item,
        renderLabelAs: 'span',
      }}
    >
      <div
        data-testid={`map-container-${node.item.id}`}
        className={cn({ [classes.mapError]: !isValid })}
      >
        <Map
          mapNode={node}
          markerLocation={markerLocation}
          setMarkerLocation={markerBinding ? setMarkerLocation : undefined}
        />
      </div>
      <Paragraph
        size='sm'
        className={classes.footer}
      >
        {markerBinding && (
          <>
            {markerLocationIsValid ? (
              <Lang
                id={'map_component.selectedLocation'}
                params={[markerLocation.latitude, markerLocation.longitude]}
              />
            ) : (
              <Lang id={'map_component.noSelectedLocation'} />
            )}
          </>
        )}
      </Paragraph>
    </ComponentStructureWrapper>
  );
}
