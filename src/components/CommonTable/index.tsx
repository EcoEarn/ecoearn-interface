import { Table } from 'aelf-design';
import { TableProps } from 'antd';
import clsx from 'clsx';
import styles from './style.module.css';

export default function CommonTable(props: TableProps) {
  return <Table {...props} className={clsx(props.className, styles.table)} />;
}
