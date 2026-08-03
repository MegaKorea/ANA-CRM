import React, { useEffect, useState } from 'react';
import {
    App,
    Row,
    Col,
    Card,
    Statistic,
    DatePicker,
    Table,
    Typography,
    Space,
    theme,
    Divider,
    Spin,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import {
    UserOutlined,
    FacebookOutlined,
    DatabaseOutlined,
} from '@ant-design/icons';
import { DateFormat } from '@/constants/enums';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useLeadStatistics, type LeadStatisticsChartRow } from '@/lib/hooks/use-lead-statistics';

const { RangePicker } = DatePicker;
const { Title } = Typography;

type ChartDataRow = LeadStatisticsChartRow;

export function LeadStatistics() {
    const { message } = App.useApp();
    const isMobile = useIsMobile();
    const { token } = theme.useToken();
    const { hasPermission: isAdmin } = useAuthPermission(['ADMIN']);
    const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
        dayjs(),
        dayjs(),
    ]);

    const startDate = dateRange?.[0]?.format(DateFormat.ISO_DATE) || '';
    const endDate = dateRange?.[1]?.format(DateFormat.ISO_DATE) || '';

    const { data, isLoading, isError, error } = useLeadStatistics(startDate, endDate);

    useEffect(() => {
        if (isError) {
            message.error((error as Error).message || 'Lỗi khi lấy dữ liệu thống kê');
        }
    }, [isError, error, message]);

    const { chartData, fbTotalSpend, fbTotalMessages } = (data as {
        chartData: ChartDataRow[];
        fbTotalSpend: number;
        fbTotalMessages: number;
    }) || {
        chartData: [],
        fbTotalSpend: 0,
        fbTotalMessages: 0,
    };

    const totalLeads = chartData.reduce((acc: number, curr: ChartDataRow) => acc + (curr.totalLeads || 0), 0);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'date',
            key: 'date',
            render: (val: string) => dayjs(val).format('DD/MM/YYYY'),
        },
        { title: 'Tương Tác', dataIndex: 'fbMessages', key: 'fbMessages' },
        { title: 'Data', dataIndex: 'totalLeads', key: 'totalLeads' },
        { title: 'Đăng ký', dataIndex: 'registeredLeads', key: 'registeredLeads' },
        { title: 'Lịch hẹn', dataIndex: 'totalAppointments', key: 'totalAppointments' },
        { title: 'Đến tư vấn', dataIndex: 'arrivedAppointments', key: 'arrivedAppointments' },

        ...(isAdmin
            ? [
                {
                    title: 'Chi Tiêu',
                    dataIndex: 'fbSpend',
                    key: 'fbSpend',
                    render: (val: number) => formatCurrency(val),
                },
            ]
            : []),
    ];

    return (
        <div style={{ marginTop: 16 }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Title level={4} style={{ margin: 0 }}>
                        Thống kê tổng quan
                    </Title>
                </Col>
                <Col
                    xs={24}
                    md={12}
                    style={{
                        display: 'flex',
                        justifyContent: isMobile ? 'flex-start' : 'flex-end',
                        width: '100%',
                    }}
                >
                    <Space
                        orientation={isMobile ? 'vertical' : 'horizontal'}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                        <span style={{ fontWeight: 500 }}>Bộ lọc ngày:</span>
                        {!isMobile ? (
                            <RangePicker
                                value={dateRange}
                                onChange={setDateRange as any}
                                format="DD/MM/YYYY"
                                allowClear={false}
                            />
                        ) : (
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <DatePicker
                                    style={{ flex: 1 }}
                                    value={dateRange?.[0]}
                                    onChange={(date) => setDateRange([date, dateRange?.[1] || dayjs()])}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    inputReadOnly={true}
                                />
                                <span style={{ padding: '0 8px' }}>-</span>
                                <DatePicker
                                    style={{ flex: 1 }}
                                    value={dateRange?.[1]}
                                    onChange={(date) => setDateRange([dateRange?.[0] || dayjs(), date])}
                                    format="DD/MM/YYYY"
                                    allowClear={false}
                                    inputReadOnly={true}
                                />
                            </div>
                        )}
                    </Space>
                </Col>
            </Row>



            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {isAdmin && (
                    <Col xs={24} sm={12} md={8}>
                        <Card
                            size="small"
                            style={{
                                borderColor: token.colorPrimaryBorder,
                                backgroundColor: token.colorPrimaryBg,
                                borderRadius: 12,
                            }}
                        >
                            <Statistic
                                title="Chi Tiêu"
                                value={fbTotalSpend}
                                formatter={(v) => formatCurrency(Number(v))}
                                prefix={<FacebookOutlined />}
                                styles={{ content: { color: token.colorPrimaryText, fontWeight: 'bold' } }}
                            />
                        </Card>
                    </Col>
                )}
                <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
                    <Card
                        size="small"
                        style={{
                            borderColor: token.colorWarningBorder,
                            backgroundColor: token.colorWarningBg,
                            borderRadius: 12,
                        }}
                    >
                        <Statistic
                            title="Tương Tác"
                            value={fbTotalMessages}
                            prefix={<UserOutlined />}
                            styles={{ content: { color: token.colorWarningText, fontWeight: 'bold' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
                    <Card
                        size="small"
                        style={{
                            borderColor: token.colorSuccessBorder,
                            backgroundColor: token.colorSuccessBg,
                            borderRadius: 12,
                        }}
                    >
                        <Statistic
                            title="Tổng Data"
                            value={totalLeads}
                            prefix={<DatabaseOutlined />}
                            styles={{ content: { color: token.colorSuccessText, fontWeight: 'bold' } }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginTop: 16, borderRadius: 12 }}>
                <Title level={5} style={{ marginBottom: 16 }}>
                    Bảng thống kê theo ngày
                </Title>
                {!isMobile ? (
                    <Table
                        columns={columns}
                        dataSource={chartData}
                        rowKey="date"
                        loading={isLoading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        bordered
                        summary={(pageData) => {
                            let tLeads = 0;
                            let tRegLeads = 0;
                            let tAppts = 0;
                            let tArrAppts = 0;

                            let tFbSpend = 0;
                            let tFbMsgs = 0;

                            pageData.forEach(
                                ({
                                    totalLeads,
                                    registeredLeads,
                                    totalAppointments,
                                    arrivedAppointments,

                                    fbSpend,
                                    fbMessages,
                                }) => {
                                    tLeads += totalLeads;
                                    tRegLeads += registeredLeads;
                                    tAppts += totalAppointments;
                                    tArrAppts += arrivedAppointments;

                                    tFbSpend += fbSpend || 0;
                                    tFbMsgs += fbMessages || 0;
                                },
                            );

                            return (
                                <Table.Summary.Row
                                    style={{ backgroundColor: token.colorFillAlter, fontWeight: 'bold' }}
                                >
                                    <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                                    <Table.Summary.Cell index={1}>{tFbMsgs}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2}>{tLeads}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={3}>{tRegLeads}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>{tAppts}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={5}>{tArrAppts}</Table.Summary.Cell>
                                    {isAdmin && (
                                        <Table.Summary.Cell index={6}>{formatCurrency(tFbSpend)}</Table.Summary.Cell>
                                    )}
                                </Table.Summary.Row>
                            );
                        }}
                    />
                ) : (
                    isLoading ? (
                        <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>
                    ) : (
                        <div role="list">
                            {chartData.map((item) => (
                            <div role="listitem" key={item.date} style={{ marginBottom: 16 }}>
                                <Card
                                    size="small"
                                    style={{ width: '100%', borderColor: token.colorBorder, borderRadius: 8 }}
                                >
                                    <Title
                                        level={5}
                                        style={{
                                            margin: 0,
                                            paddingBottom: 8,
                                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                                        }}
                                    >
                                        {dayjs(item.date).format('DD/MM/YYYY')}
                                    </Title>

                                    <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
                                        {isAdmin && (
                                            <Col span={12}>
                                                <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                                                    Chi tiêu
                                                </div>
                                                <div style={{ fontWeight: 'bold', color: token.colorPrimaryText }}>
                                                    {formatCurrency(item.fbSpend || 0)}
                                                </div>
                                            </Col>
                                        )}
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Tương tác</div>
                                            <div style={{ fontWeight: 'bold' }}>{item.fbMessages}</div>
                                        </Col>
                                    </Row>

                                    <Divider style={{ margin: '8px 0' }} />

                                    <Row gutter={[8, 8]}>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Data</div>
                                            <div style={{ fontWeight: 500 }}>{item.totalLeads}</div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Đăng ký</div>
                                            <div style={{ fontWeight: 500 }}>{item.registeredLeads}</div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
                                                Lịch hẹn / Khách đến
                                            </div>
                                            <div style={{ fontWeight: 500 }}>
                                                {item.totalAppointments} /{' '}
                                                <span style={{ color: token.colorSuccessText }}>
                                                    {item.arrivedAppointments}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>


                                </Card>
                            </div>
                            ))}
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}
