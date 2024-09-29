import { Flex } from 'antd';
import { ReactComponent as BackIcon } from 'assets/img/pool-detail/back.svg';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface IBackComProps {
  onClick?: () => void;
}

export default function BackCom(props?: IBackComProps) {
  const router = useRouter();

  const onBack = useCallback(() => {
    if (props?.onClick) {
      props?.onClick();
      return;
    }
    router.back();
  }, [props, router]);

  return (
    <Flex
      className="w-fit cursor-pointer text-brandDefault font-medium text-base leading-[22px]"
      align="center"
      gap={8}
      onClick={onBack}
    >
      <BackIcon width={16} height={16} />
      <span>Back</span>
    </Flex>
  );
}
