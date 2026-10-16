import GridContainer from '@/components/grid_container';
import Heading from '@/components/heading';
import { cn } from 'drupal-canvas';

const CardContainer = ({
  className,
  headingPosition,
  heading,
  headingElement,
  headingSize = 'large',
  preHeading,
  textColor,
  layout,
  content,
}) => {
  return (
    <div className={cn('flex w-full flex-col items-center gap-12', className)}>
      {heading ? (
        <Heading
          heading={heading}
          headingElement={headingElement}
          headingSize={headingSize}
          layout={headingPosition}
          preHeading={preHeading}
          textColor={textColor}
        />
      ) : null}
      {content ? <GridContainer content={content} layout={layout} /> : null}
    </div>
  );
};

export default CardContainer;
