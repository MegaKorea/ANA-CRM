import { Modal, message, Typography, Space } from 'antd';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ScanOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function StudentScannerModal({ open, onClose }: Props) {
    const router = useRouter();

    const handleScan = (result: string) => {
        if (!result) return;
        try {
            const url = new URL(result);
            if (url.pathname.includes('/attendance/qr')) {
                message.success('Đã nhận diện mã QR!');
                router.push(url.pathname + url.search);
                onClose();
            } else {
                message.error('Mã QR không hợp lệ. Vui lòng thử lại.');
            }
        } catch {
            message.error('Mã QR không hợp lệ.');
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <ScanOutlined />
                    <span>Quét mã điểm danh</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            centered
            styles={{ body: { padding: '24px 0' } }}
        >
            <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
                <Typography.Paragraph type="secondary" style={{ padding: '0 24px' }}>
                    Đưa mã QR mà giáo viên cung cấp vào giữa khung hình để thực hiện điểm danh.
                </Typography.Paragraph>

                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#000' }}>
                    <Scanner
                        onScan={(result) => {
                            if (result && result.length > 0) {
                                handleScan(result[0].rawValue);
                            }
                        }}
                        onError={(error) => {
                            console.error(error);
                        }}
                        components={{
                            zoom: false,
                        }}
                        sound={false}
                    />
                </div>
            </div>
        </Modal>
    );
}
