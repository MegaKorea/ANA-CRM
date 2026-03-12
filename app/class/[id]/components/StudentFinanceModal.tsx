import { useState, useEffect } from 'react';
import { Modal, List, Image, Button, message, Popconfirm, InputNumber, Form, Space, Typography, Row, Col } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import UploadImage from '@/components/common/UploadImage';
import { useUpdateClassStudent } from '@/lib/hooks/use-classes';

const { Text } = Typography;

interface StudentFinanceModalProps {
    open: boolean;
    student: any | null;
    classId: string;
    courseFee: number;
    onClose: () => void;
}

export function StudentFinanceModal({ open, student, classId, courseFee, onClose }: StudentFinanceModalProps) {
    const updateStudentMutation = useUpdateClassStudent(classId);
    const [localImages, setLocalImages] = useState<string[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        if (open && student) {
            setLocalImages(student.images || []);
            form.setFieldsValue({
                paid_amount: student.paid_amount || 0,
                debt_amount: student.debt_amount !== undefined && student.debt_amount !== null ? student.debt_amount : (courseFee - (student.paid_amount || 0)),
            });
        }
    }, [open, student, courseFee, form]);

    const handleUpload = (url: string) => {
        if (!student) return;
        const newImages = [...localImages, url];
        setLocalImages(newImages);

        updateStudentMutation.mutate(
            {
                studentId: student.id,
                data: { images: newImages },
            },
            {
                onSuccess: () => {
                    message.success('Thêm ảnh hóa đơn thành công!');
                },
                onError: (error: any) => {
                    message.error(error instanceof Error ? error.message : 'Lỗi khi thêm ảnh');
                },
            }
        );
    };

    const handleRemove = (urlToRemove: string) => {
        if (!student) return;
        const newImages = localImages.filter((url) => url !== urlToRemove);
        setLocalImages(newImages);

        updateStudentMutation.mutate(
            {
                studentId: student.id,
                data: { images: newImages },
            },
            {
                onSuccess: () => {
                    message.success('Xóa ảnh hóa đơn thành công!');
                },
                onError: (error: any) => {
                    message.error(error instanceof Error ? error.message : 'Lỗi khi xóa ảnh');
                },
            }
        );
    };

    const handleUpdateFinance = async () => {
        if (!student) return;
        try {
            const values = await form.validateFields();
            updateStudentMutation.mutate(
                {
                    studentId: student.id,
                    data: {
                        paid_amount: values.paid_amount,
                        debt_amount: values.debt_amount,
                    },
                },
                {
                    onSuccess: () => {
                        message.success('Cập nhật tài chính thành công!');
                        onClose();
                    },
                    onError: (error: any) => {
                        message.error(error?.message || 'Lỗi cập nhật');
                    }
                }
            );
        } catch (error) {
            console.error('Validation Failed:', error);
        }
    };

    return (
        <Modal
            title="Quản lý Tài chính & Hóa đơn Học viên"
            open={open}
            onCancel={onClose}
            onOk={handleUpdateFinance}
            confirmLoading={updateStudentMutation.isPending}
            okText="Lưu thông tin"
            cancelText="Hủy"
            destroyOnClose
            centered
            width={700}
        >
            <div style={{ padding: '16px 0' }}>
                <Form layout="vertical" form={form}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Đã nộp (VND)" name="paid_amount"
                                rules={[{ required: true, message: 'Vui lòng nhập số tiền đã nộp!' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value?.replace(/\$\s?|(\.*)/g, '') as any}
                                    min={0}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Công nợ (VND)" name="debt_amount"
                                rules={[{ required: true, message: 'Vui lòng nhập công nợ!' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(value) => value?.replace(/\$\s?|(\.*)/g, '') as any}
                                    min={0}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <div style={{ marginTop: 24, marginBottom: 16 }}>
                    <Text strong>Hóa đơn / Giao dịch chuyển khoản</Text>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <UploadImage
                        onUpload={handleUpload}
                        label="Tải ảnh biên lai lên"
                        server="server_1"
                        showPreview={false}
                        showSuccessMessage={false}
                    />
                </div>

                <Image.PreviewGroup>
                    <List
                        grid={{ gutter: 16, column: 3 }}
                        dataSource={localImages}
                        renderItem={(url) => (
                            <List.Item>
                                <div style={{ position: 'relative' }}>
                                    <Image
                                        src={url}
                                        alt="Bill Image"
                                        style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                                    />
                                    <Popconfirm
                                        title="Xóa hóa đơn"
                                        description="Bạn có chắc chắn muốn xóa ảnh này?"
                                        onConfirm={() => handleRemove(url)}
                                        okText="Xóa"
                                        cancelText="Hủy"
                                    >
                                        <Button
                                            danger
                                            type="primary"
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                        />
                                    </Popconfirm>
                                </div>
                            </List.Item>
                        )}
                        locale={{ emptyText: 'Chưa có hóa đơn nào' }}
                    />
                </Image.PreviewGroup>
            </div>
        </Modal>
    );
}
