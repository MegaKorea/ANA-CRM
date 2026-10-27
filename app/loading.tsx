import { Skeleton } from 'antd';

// Shown instantly inside the layout while the next route's code and data load.
export default function Loading() {
  return <Skeleton active paragraph={{ rows: 10 }} />;
}
