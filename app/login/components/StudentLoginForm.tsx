'use client';

import { Form, Input, Button, message } from 'antd';
import { PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../Login.module.scss';

interface StudentLoginInput {
    phone_number: string;
    password?: string;
}

export default function StudentLoginForm() {
    const [form] = Form.useForm<StudentLoginInput>();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (values: StudentLoginInput) => {
        try {
            setLoading(true);
            const response = await fetch('/api/student/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: values.phone_number,
                    password: values.password || values.phone_number, // Default to phone number if empty
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại');
            }

            message.success('Đăng nhập thành công');
            router.push('/student');
            router.refresh();

        } catch (error: any) {
            message.error(error.message || 'Có lỗi xảy ra khi đăng nhập');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            name="student_login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            size="large"
        >
            <Form.Item
                name="phone_number"
                label="Số điện thoại"
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập số điện thoại',
                    },
                    {
                        pattern: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại không hợp lệ',
                    }
                ]}
            >
                <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại của bạn"
                />
            </Form.Item>

            <Form.Item
                name="password"
                label="Mật khẩu (Mặc định là SĐT)"
                tooltip="Nếu bạn chưa đổi mật khẩu, vui lòng nhập lại Số điện thoại của bạn vào đây."
                rules={[
                    {
                        required: true,
                        message: 'Vui lòng nhập mật khẩu',
                    },
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Nhập mật khẩu"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    className={styles.submitButton}
                >
                    Đăng nhập
                </Button>
            </Form.Item>
        </Form>
    );
}
