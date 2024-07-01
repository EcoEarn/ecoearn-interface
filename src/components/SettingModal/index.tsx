import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { Input } from 'aelf-design';
import { Flex } from 'antd';
import clsx from 'clsx';
import CommonModal from 'components/CommonModal';
import CommonTooltip from 'components/CommonTooltip';
import { useCallback, useState } from 'react';
import styles from './style.module.css';
import useResponsive from 'utils/useResponsive';

const toleranceSelectOption = ['0.5', '1', '3'];

interface ISettingModalProps {
  onToleranceChange?: (value: string) => void;
  onDeadlineChange?: (value: string) => void;
  defaultTolerance: string;
  defaultDeadline: string;
}

function SettingModal(props: ISettingModalProps) {
  const { onToleranceChange, onDeadlineChange, defaultDeadline, defaultTolerance } = props;
  const modal = useModal();
  const [tolerance, setTolerance] = useState<string>(defaultTolerance);
  const [deadlineTime, setDeadlineTime] = useState<string>(defaultDeadline);
  const { isMin } = useResponsive();

  const handleChange = useCallback(
    (value: string) => {
      if (!value) {
        setTolerance('');
        return;
      }
      if (/^(?!0\d)\d{0,2}(?:\.\d{0,2})?$|^0\.\d{1,2}$/.test(value)) {
        setTolerance(value);
        if (/^\d+(\.\d+)?$/.test(value) && Number(value) >= 0.01 && Number(value) <= 99.99)
          onToleranceChange?.(value);
      }
    },
    [onToleranceChange],
  );

  const handleDeadlineChange = useCallback(
    (value: string) => {
      const val = value.trim();
      if (val && !/^(0|[1-9][0-9]*)$/.test(val)) {
        return;
      }
      setDeadlineTime(val);
      if (/^\d+(\.\d+)?$/.test(value)) {
        if (Number(value) < 10) {
          onDeadlineChange?.('10');
        } else {
          onDeadlineChange?.(value);
        }
      }
    },
    [onDeadlineChange],
  );

  return (
    <CommonModal
      closable
      footer={null}
      title="Settings"
      open={modal.visible}
      onCancel={() => {
        modal.hide();
      }}
      destroyOnClose
      afterClose={() => {
        modal.remove();
      }}
    >
      <Flex vertical gap={24}>
        <Flex vertical gap={16}>
          <Flex gap={4} align="center">
            <span>Slippage Tolerance</span>
            <CommonTooltip title="The trade will be cancelled when slippage exceeds this percentage." />
          </Flex>
          <Flex vertical={isMin} gap={12}>
            <Flex gap={12} align="center">
              {toleranceSelectOption.map((item, index) => {
                return (
                  <div
                    className={clsx(
                      'flex cursor-pointer flex-shrink-0 justify-center items-center  flex-1 w-[108px] h-10 rounded-sm bg-neutralDefaultBg text-neutralSecondary text-sm font-medium',
                      item == tolerance &&
                        '!border-brandDefault !text-brandDefault border-[1px] border-solid',
                    )}
                    key={index}
                    onClick={() => {
                      handleChange(item);
                    }}
                  >{`${item}%`}</div>
                );
              })}
            </Flex>
            <Input
              suffix={<span className="text-sm font-medium text-neutralTitle">%</span>}
              className={clsx(
                '!rounded-sm !text-neutralDisable !font-medium !text-sm',
                styles.input,
              )}
              defaultValue={defaultTolerance}
              value={tolerance}
              onChange={(e) => {
                handleChange(e.target.value);
              }}
              size="small"
              allowClear={false}
            />
          </Flex>
        </Flex>
        <Flex vertical gap={16}>
          <Flex gap={4} align="center">
            <span>Transaction deadline</span>
            <CommonTooltip title="The trade will be cancelled when it exceeds the time limit." />
          </Flex>
          <Flex gap={16} align="center">
            <Input
              className={clsx(
                '!w-[194px] !rounded-sm !text-neutralPrimary !font-medium !text-sm !text-right',
              )}
              size="small"
              defaultValue={defaultDeadline}
              allowClear={false}
              value={deadlineTime}
              onChange={(e) => {
                handleDeadlineChange(e.target.value);
              }}
              type="number"
            />
            <span className="text-sm font-medium text-neutralSecondary">Minute</span>
          </Flex>
        </Flex>
      </Flex>
    </CommonModal>
  );
}

export default NiceModal.create(SettingModal);
