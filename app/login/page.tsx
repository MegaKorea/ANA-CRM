'use client';

import { Form, Input, Button, Card, Row, Col } from 'antd';
import { MailOutlined, LockOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import Image from 'next/image';
import styles from './Login.module.scss';
import logoImage from '../assets/logo/logo-ana.png';
import { useLogin } from '@/lib/hooks/use-auth';
import { useTheme } from '@/lib/hooks/use-theme';
import { LoginFormMessage, LoginFormLabel } from '@/constants/auth';
import { ThemeMode } from '@/constants/enums/theme.enum';
import type { LoginInput } from '@/lib/validators/auth.validator';

export default function LoginPage() {
  const [form] = Form.useForm<LoginInput>();
  const loginMutation = useLogin();
  const { themeMode, toggleTheme } = useTheme();

  const handleSubmit = (values: LoginInput): void => {
    loginMutation.mutate(values);
  };

  return (
    <div className={styles.loginContainer}>
      <Row justify="center" align="middle" className={styles.loginRow}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <div className={styles.loginContent}>
            <Row justify="end" className={styles.themeButtonRow}>
              <Col>
                <Button
                  type="text"
                  icon={themeMode === ThemeMode.DARK ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleTheme}
                  className={styles.themeToggleButton}
                />
              </Col>
            </Row>

            <Row justify="center">
              <Col span={24}>
                <div className={styles.logoSection}>
                  <Image
                    src={logoImage}
                    alt="ANA CRM Logo"
                    width={120}
                    height={120}
                    priority
                    className={styles.logo}
                  />
                </div>
              </Col>
            </Row>

            <Row justify="center">
              <Col xs={24} sm={20} md={18}>
                <Card className={styles.loginCard} variant="borderless">
                  <Form
                    form={form}
                    name="login"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    layout="vertical"
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      label={LoginFormLabel.EMAIL}
                      rules={[
                        {
                          required: true,
                          message: LoginFormMessage.EMAIL_REQUIRED,
                        },
                        {
                          type: 'email',
                          message: LoginFormMessage.EMAIL_INVALID,
                        },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder={LoginFormMessage.EMAIL_PLACEHOLDER}
                        type="email"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={LoginFormLabel.PASSWORD}
                      rules={[
                        {
                          required: true,
                          message: LoginFormMessage.PASSWORD_REQUIRED,
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder={LoginFormMessage.PASSWORD_PLACEHOLDER}
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loginMutation.isPending}
                        className={styles.submitButton}
                      >
                        {LoginFormLabel.SUBMIT}
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </div>
  );
}
