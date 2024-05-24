import { Skeleton } from 'antd';
import clsx from 'clsx';
import React, { ReactNode, useCallback, useMemo } from 'react';
import { useState } from 'react';
interface ISkeletonImage {
  img?: string;
  className?: string;
  alt?: string;
  imageSizeType?: 'cover' | 'contain';
  width?: number;
  height?: number;
  fallback?: ReactNode;
}

function SkeletonImage(props: ISkeletonImage) {
  const { img: imageUrl, className, alt, width = 108, height = 108, fallback } = props;

  const [skeletonActive, setSkeletonActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(!!imageUrl);
  const [error, setError] = useState(false);

  const onLoad = useCallback(() => {
    setLoading(false);
    setSkeletonActive(false);
  }, []);

  const onError = useCallback(() => {
    setError(true);
    setSkeletonActive(false);
    setLoading(false);
  }, []);

  return (
    <div
      className={clsx(
        'flex justify-center items-center relative',
        `w-[${fallback ? width : 0}px] h-[${fallback ? height : 0}px]`,
        className,
      )}
    >
      {(!imageUrl || error) && fallback}

      {(loading || ((!imageUrl || error) && !fallback)) && (
        <Skeleton.Image
          rootClassName="flex justify-center items-center absolute"
          active={imageUrl ? skeletonActive : false}
          style={{ width, height }}
        />
      )}
      {imageUrl && !error && (
        <img
          src={imageUrl}
          alt={alt || 'img'}
          width={width}
          height={height}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </div>
  );
}

export default React.memo(SkeletonImage);
