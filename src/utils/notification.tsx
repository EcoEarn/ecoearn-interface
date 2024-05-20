import { notification, NotificationArgsProps } from 'antd';
import { Button } from 'aelf-design';
import { ExportOutlined } from '@ant-design/icons';

const showTradeResTip = ({
  status,
  message,
  transactionId,
}: {
  status: 'success' | 'error';
  message: string;
  transactionId?: string | number;
}) => {
  const params: NotificationArgsProps = {
    duration: 3,
    message,
    description: (
      <Button
        className="!text-[var(--neutral-secondary)] font-medium hover:!text-[var(--neutral-secondary)] active:!text-[var(--neutral-secondary)] !p-0 !h-fit"
        type="link"
        size="small"
        onClick={() => {
          console.log('transactionId', transactionId);
        }}
      >
        <ExportOutlined />
        <span>View on Explorer</span>
      </Button>
    ),
  };
  if (status === 'success') {
    notification.success(params);
  } else {
    notification.error(params);
  }
};

export { showTradeResTip };
